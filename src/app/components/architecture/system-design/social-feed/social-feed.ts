import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

const quickRef: QuickRefItem[] = [
  { name: 'Fan-out on write', type: 'keyword', desc: 'On post creation, push post ID to all followers\' feed lists. Fast reads, expensive writes.' },
  { name: 'Fan-out on read',  type: 'keyword', desc: 'Merge followed users\' posts at read time. Cheap writes, expensive reads.' },
  { name: 'Hybrid fan-out',   type: 'keyword', desc: 'Fan-out on write for regular users; fan-out on read for celebrities (many followers).' },
  { name: 'Feed list',        type: 'keyword', desc: 'Redis sorted set per user: score=timestamp, member=post_id. O(log N) insert, O(K) read.' },
  { name: 'Celeb threshold',  type: 'keyword', desc: 'Follower count above which fan-out on write is skipped (e.g. > 1M followers).' },
  { name: 'Pagination',       type: 'keyword', desc: 'Cursor-based: return last_seen_post_id; avoids offset drift as feed updates.' },
  { name: 'Ranking',          type: 'keyword', desc: 'Chronological (simple) vs algorithmic (engagement score, ML model).' },
  { name: 'Denormalisation',  type: 'keyword', desc: 'Store author name/avatar in post row — avoids JOIN on every feed read.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Fan-out on write (push model)',
    points: [
      'When user A posts: iterate A\'s followers → push post_id to each follower\'s feed list in Redis.',
      'Feed read: fetch sorted set for logged-in user → return post IDs → batch fetch post data.',
      'Pros: O(1) feed read — no computation at read time.',
      'Cons: if user A has 10M followers, one post = 10M Redis writes. Celebrity posts are catastrophically expensive.',
    ],
  },
  {
    heading: 'Fan-out on read (pull model)',
    points: [
      'No precomputation on write. Feed read: fetch all users you follow → merge their recent posts → sort by time.',
      'Pros: zero write amplification — one post = one DB write.',
      'Cons: feed read requires N queries (one per followed user) + merge sort. At 500 follows, this is 500 DB reads per page view.',
    ],
  },
  {
    heading: 'Hybrid model (Twitter/Instagram approach)',
    points: [
      'Regular users (< 1M followers): fan-out on write → posts pushed to all followers\' Redis lists.',
      'Celebrities (> 1M followers): fan-out on read → skipped in write path; merged in at read time.',
      'Feed read: Redis list (pre-populated from regular users) + live query of celebrities you follow → merge.',
      'This caps max write amplification at ~1M per post regardless of actual follower count.',
    ],
  },
  {
    heading: 'Feed storage and ranking',
    points: [
      'Redis Sorted Set per user: ZADD feed:<user_id> <timestamp> <post_id>. ZREVRANGE to read page.',
      'Trim feed list to last 1,000 posts — historical feeds queried from DB, not Redis.',
      'Algorithmic ranking: score = base_time_score × engagement_multiplier × affinity_score. ML model refreshes scores hourly.',
      'Cursor pagination: return the timestamp of the last returned post as cursor — stable even as new posts arrive.',
    ],
  },
  {
    heading: 'Fan-out on Write vs Fan-out on Read',
    points: [
      'Fan-out on write (push model): when a user posts, the post is immediately written to the feed storage of every follower — feed reads are then extremely fast (just read a pre-computed list), but a user with millions of followers triggers millions of writes per post.',
      'Fan-out on read (pull model): a feed is computed at read time by querying and merging recent posts from everyone the user follows — writes are cheap (a single post write), but reads become expensive, especially for users following many accounts.',
      'Most production systems use a hybrid: fan-out on write for typical users (bounded follower counts make the write cost manageable), but fan-out on read for celebrity/high-follower accounts (avoiding a single post triggering millions of writes), merging both at feed-read time.',
      'Feed ranking (not just chronological ordering) adds further complexity — a relevance-ranked feed requires scoring candidate posts (engagement prediction, recency, relationship strength) at read time, which is a meaningfully different and more expensive problem than simply merging chronologically sorted lists.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Hybrid Fan-out',
    language: 'typescript',
    code: `// Hybrid fan-out: write model for regular users, read model for celebrities

const CELEB_THRESHOLD = 1_000_000;

async function onPostCreated(post: Post): Promise<void> {
  // Always store post in posts table
  await db.run(
    'INSERT INTO posts (id, author_id, content, created_at) VALUES (?, ?, ?, NOW())',
    [post.id, post.authorId, post.content]
  );

  const followerCount = await db.scalar(
    'SELECT COUNT(*) FROM follows WHERE followee_id = ?', [post.authorId]
  );

  if (followerCount <= CELEB_THRESHOLD) {
    // Fan-out on write: push to all followers' feeds
    await fanOutToFollowers(post);
  }
  // else: celebrity — skip fan-out, handled at read time
}

async function fanOutToFollowers(post: Post): Promise<void> {
  // Process in batches via job queue to avoid blocking
  const BATCH_SIZE = 1000;
  let offset = 0;

  while (true) {
    const followers = await db.query(
      'SELECT follower_id FROM follows WHERE followee_id = ? LIMIT ? OFFSET ?',
      [post.authorId, BATCH_SIZE, offset]
    );
    if (followers.length === 0) break;

    // Batch Redis ZADD to all followers' feed sorted sets
    const pipeline = redis.pipeline();
    for (const { follower_id } of followers) {
      pipeline.zadd(\`feed:\${follower_id}\`, post.createdAt, post.id);
      pipeline.zremrangebyrank(\`feed:\${follower_id}\`, 0, -1001); // keep last 1000
    }
    await pipeline.exec();
    offset += BATCH_SIZE;
  }
}`,
  },
  {
    label: 'Feed Read',
    language: 'typescript',
    code: `// Feed read — merge pre-populated Redis list with live celebrity posts

async function getFeed(userId: string, cursor?: number, limit = 20): Promise<FeedPage> {
  const maxScore = cursor ?? Date.now();

  // 1. Get post IDs from Redis feed list (fan-out-on-write posts)
  const feedPostIds = await redis.zrevrangebyscore(
    \`feed:\${userId}\`, maxScore, '-inf', 'LIMIT', 0, limit
  );

  // 2. Get celebrity followees (skip fan-out)
  const celebs = await db.query(\`
    SELECT followee_id FROM follows f
    JOIN users u ON f.followee_id = u.id
    WHERE f.follower_id = ? AND u.follower_count > ?
  \`, [userId, CELEB_THRESHOLD]);

  // 3. Fetch recent celeb posts (fan-out on read)
  const celebPostIds = celebs.length > 0
    ? await db.query(\`
        SELECT id, created_at FROM posts
        WHERE author_id IN (?) AND created_at < ? AND created_at > ? - INTERVAL 7 DAY
        ORDER BY created_at DESC LIMIT ?
      \`, [celebs.map(c => c.followee_id), maxScore, maxScore, limit])
    : [];

  // 4. Merge + sort by timestamp (like merge sort)
  const allIds = [...feedPostIds, ...celebPostIds.map(p => p.id)];
  const uniqueIds = [...new Set(allIds)].slice(0, limit);

  // 5. Batch fetch post data — author name/avatar are DENORMALISED onto
  // the posts row at write time (see quickRef + the N+1 mistake fix below),
  // so this is a single-table lookup, no JOIN needed on the hot read path
  const posts = await db.query(
    'SELECT id, author_id, content, created_at, author_username, author_avatar FROM posts WHERE id IN (?)',
    [uniqueIds]
  );

  // 6. Sort by created_at DESC
  posts.sort((a, b) => b.created_at - a.created_at);

  return {
    posts,
    nextCursor: posts[posts.length - 1]?.created_at,
  };
}`,
  },
  {
    label: 'Scale & Storage',
    language: 'bash',
    code: `# Social feed scale estimates (Twitter-like)

# Users: 500M registered, 100M daily active; avg 200 follows; post rate: 500M tweets/day

# Write path:
# 500M posts/day = ~5,800 posts/sec
# Each post fan-out: avg 200 followers = 1,160,000 Redis ops/sec
# → Redis cluster required (6+ nodes, cluster mode)

# Celebrity posts (skip fan-out):
# Top 10k celebrities have 1M+ followers each
# Without hybrid: top celeb post = 1M Redis writes = system spike
# With hybrid: celeb posts queried at read time (10k users follow 100 celebs = 100 reads at merge)

# Read path (100M DAILY ACTIVE users generate reads, not all 500M registered):
# 100M users × 5 feed loads/day = 500M reads/day = ~5,800 reads/sec
# Each read: Redis ZREVRANGEBYSCORE = O(log N + K) = sub-ms
# Feed Redis memory: a ZSET entry costs ~130 bytes at this size (skiplist +
# hashtable overhead, not just the ~8-byte post_id -- Redis ZSETs above the
# listpack threshold, ~128 entries, use full skiplist encoding)
# 500M users × 1000 posts × ~130 bytes ≈ 65 TB (not 4 TB) -- meaningfully
# more Redis Cluster capacity needed than the naive per-ID estimate implies
# → Use Redis Cluster + evict feeds of inactive users (TTL 30 days)

# PostgreSQL for posts table:
# 500M posts/day × 365 × 2 years = 365B rows → sharded by author_id
# Cassandra alternative: partition by (author_id, year_month), cluster by created_at DESC`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Pure fan-out on write for all users',
    wrong: `// Kylie Jenner has 400M followers
// She posts → fan-out triggers 400M Redis writes
// Redis pipeline: 400M × 1μs = 400 seconds to complete
// System appears hung for 7 minutes`,
    right: `// Hybrid: skip fan-out for users above follower threshold
if (followerCount > CELEB_THRESHOLD) {
  // Skip Redis fan-out — will be merged at read time
  return;
}
await fanOutToFollowers(post);`,
    explanation: 'Fan-out on write is O(followers) per post. For celebrities with millions of followers, a single post triggers millions of Redis writes — a catastrophic write spike. The hybrid model caps this.',
  },
  {
    title: 'Offset-based feed pagination',
    wrong: `// Offset pagination: page 2 = OFFSET 20
// User posts while you are reading page 1
// → page 2 OFFSET 20 skips the new post → duplicate/missing items`,
    right: `// Cursor-based pagination: use timestamp of last item as cursor
// ZREVRANGEBYSCORE feed:userId maxScore '-inf' LIMIT 0 20
// Stable even as new posts are added above your cursor position`,
    explanation: 'Offset pagination is unstable when new posts arrive — items shift and you see duplicates or gaps. Cursor-based pagination uses the timestamp of the last seen post as an anchor, remaining stable regardless of new content.',
  },
  {
    title: 'Fetching author data per post with N+1 queries',
    wrong: `// Fetch 20 posts, then 20 separate author queries
const posts = await db.query('SELECT * FROM posts WHERE id IN (?) ', [ids]);
for (const post of posts) {
  post.author = await db.query('SELECT * FROM users WHERE id = ?', [post.author_id]);
}
// 1 + 20 = 21 queries per page`,
    right: `// Option A: JOIN (if posts fit in one DB)
SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id IN (?)

// Option B: denormalise author data into posts table
// Store username + avatar in posts row at write time — single query, no JOIN`,
    explanation: 'N+1 query: fetching each post\'s author separately kills performance at scale. Either JOIN in a single query or denormalise author name/avatar into the posts table at write time.',
  },
  {
    title: 'Storing full post content in Redis feed list',
    wrong: `// Storing full post JSON in Redis sorted set
await redis.zadd(\`feed:\${userId}\`, timestamp, JSON.stringify(fullPost));
// 500M users × 1000 posts × 2KB each = 1 PB Redis memory`,
    right: `// Store only post_id in Redis; fetch data separately
await redis.zadd(\`feed:\${userId}\`, timestamp, postId);
// 500M × 1000 × 8 bytes = 4 TB (manageable with Redis Cluster)
// Fetch post data from posts cache or DB in batch`,
    explanation: 'Storing full post objects in Redis is extremely memory-expensive. Store only post IDs — the data is already in your posts cache/DB. Batch-fetch post data by IDs after reading the feed list.',
  },
];

const challenge: Challenge = {
  title: 'Design Twitter\'s feed system',
  language: 'typescript',
  description: `Design the feed system for a Twitter-like social network.

Scale:
- 500M registered users, 100M daily active
- 500M posts/day = ~5,800 posts/sec
- Average 200 followers per user
- Top 1% of users have > 100k followers; top 0.001% have > 1M

Requirements:
1. Serve home feed in < 200ms
2. New posts appear in followers' feeds within 5 seconds
3. Feed is chronological (no algorithmic ranking initially)
4. Support cursor-based infinite scroll

Design:
- Data model for posts, follows, feed
- Fan-out strategy
- Feed read path
- How to handle new user (no feed yet)?`,
  hints: [
    'Hybrid fan-out: write for < 1M followers, read for celebrities',
    'Redis sorted set per user: score=timestamp, member=post_id',
    'New user: bootstrap feed by querying their followees\' recent posts',
    'Background worker for fan-out: async Kafka consumer, not synchronous',
  ],
  starterCode: `// Data models:
interface Post { id: string; authorId: string; content: string; createdAt: number; }
interface Follow { followerId: string; followeeId: string; }
interface FeedItem { postId: string; score: number; }  // Redis ZSET member

// Implement:
// 1. onPostCreated(post): fan-out strategy
// 2. getFeed(userId, cursor?): read path
// 3. bootstrapNewUser(userId): initial feed`,
  solution: `// 1. Post creation — hybrid fan-out
async function onPostCreated(post: Post): Promise<void> {
  await postsDb.insert(post);

  const followerCount = await followsDb.count(post.authorId);
  if (followerCount <= 1_000_000) {
    // Queue fan-out job (async, not blocking write response)
    await jobQueue.enqueue('fan-out', { postId: post.id, authorId: post.authorId });
  }
  // Celeb posts fetched at read time
}

// 2. Feed read — hybrid merge
async function getFeed(userId: string, cursor?: number) {
  const maxScore = cursor ?? Date.now();

  // Pre-computed feed from Redis (regular followees)
  const regularIds = await redis.zrevrangebyscore(\`feed:\${userId}\`, maxScore, '-inf', 'LIMIT', 0, 20);

  // Live fetch from celebrities (fan-out on read)
  const celebIds = await getCelebFollowees(userId);
  const celebPosts = await postsDb.recentByAuthors(celebIds, maxScore, 20);

  // Merge sort by timestamp, take top 20
  const merged = [...regularIds, ...celebPosts.map(p => p.id)]
    .map(id => ({ id, score: getScore(id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const posts = await postsDb.batchFetch(merged.map(m => m.id));
  return { posts, nextCursor: posts.at(-1)?.createdAt };
}

// 3. New user bootstrap — pull recent posts from all followees
async function bootstrapNewUser(userId: string): Promise<void> {
  const followees = await followsDb.getFollowees(userId);
  const recentPosts = await postsDb.recentByAuthors(followees, Date.now(), 500);
  const pipeline = redis.pipeline();
  for (const post of recentPosts) {
    pipeline.zadd(\`feed:\${userId}\`, post.createdAt, post.id);
  }
  pipeline.expire(\`feed:\${userId}\`, 30 * 24 * 3600); // 30 days TTL
  await pipeline.exec();
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why is pure fan-out on write problematic for celebrity accounts?',
    options: [
      'It is too slow to read the feed',
      'A single post triggers write amplification proportional to follower count — millions of writes per post',
      'It requires too much DB storage',
      'Celebrity posts cannot be indexed',
    ],
    answer: 1,
    explanation: 'Fan-out on write pushes the post ID to every follower\'s feed list. With 10M followers, one post = 10M writes. A spike of celebrity activity can overwhelm Redis. The hybrid model skips fan-out for accounts above a threshold.',
  },
  {
    q: 'Cursor-based pagination is preferred over offset because?',
    options: [
      'It is faster to implement',
      'It remains stable when new posts are added — no duplicate or missing items',
      'It uses less database storage',
      'It supports sorting by multiple fields',
    ],
    answer: 1,
    explanation: 'Offset pagination shifts when new items are inserted above the current page — causing skipped or repeated items. Cursor-based uses the last seen item\'s timestamp/ID as an anchor, remaining stable as the feed grows.',
  },
  {
    q: 'Which data structure is most efficient for storing a user\'s feed in Redis?',
    options: [
      'Redis List (LPUSH/LRANGE)',
      'Redis Hash',
      'Redis Sorted Set (ZADD/ZREVRANGEBYSCORE)',
      'Redis String with JSON',
    ],
    answer: 2,
    explanation: 'Redis Sorted Set: score=timestamp, member=post_id. ZADD is O(log N). ZREVRANGEBYSCORE enables efficient time-range cursor queries. Lists support only head/tail access — not efficient for timestamp-range queries.',
  },
  { q: 'What is the difference between a push model (fanout on write) and pull model (fanout on read) for social feeds?', options: ['Push model is for small social networks; pull model is for large social networks', 'Push model pre-generates feeds by writing to follower timelines on post; pull model generates feeds at read time by fetching and merging followed-user posts', 'Pull model provides lower write latency; push model provides lower read latency', 'Push and pull refer to the network protocol used to deliver notifications'], answer: 1, explanation: 'Push (fanout on write): when a user posts, the system immediately writes to every follower timeline. Read is fast because the timeline is pre-assembled. Write cost is O(followers) per post. A celebrity with 10 million followers generates 10 million writes per post. Pull (fanout on read): when a user views their feed, the system fetches recent posts from all followed users and merges them. Write is cheap (one write per post). Read is expensive: must fetch and sort N users recent posts. Hybrid: use push for most users and pull for celebrities to balance both.' },
  { q: 'How do you paginate a social feed efficiently?', options: ['Use OFFSET-based pagination incrementing the offset by page size on each request', 'Use cursor-based pagination with a cursor pointing to the last seen item, avoiding the performance issues of large OFFSET queries', 'Load the entire feed into memory and slice it by page in the application', 'Sort the feed by relevance score and re-score on every page request'], answer: 1, explanation: 'OFFSET pagination: SELECT * FROM feed ORDER BY created_at DESC LIMIT 20 OFFSET 100 forces the database to scan and discard 100 rows before returning 20. Performance degrades linearly with offset. Also breaks when new posts are inserted: the feed shifts and users see duplicates or skip items. Cursor pagination: encode the last-seen item ID or timestamp as a cursor. The next page query filters WHERE created_at < cursor ORDER BY created_at DESC LIMIT 20. Stable under concurrent inserts and constant performance regardless of page depth.' },
  { q: 'How do you handle feed updates for a user with 50 million followers in a push model?', options: ['Fanout all 50 million writes synchronously before the post is considered published', 'Use asynchronous fanout with a message queue, but apply special handling for celebrities to avoid queue overload', 'Switch to pull model only for celebrity accounts with more than 1 million followers, mixing push for regular users', 'Cap all users at 1 million followers to make fanout manageable'], answer: 2, explanation: 'The hybrid model is the industry standard: regular users (fewer than a threshold like 1 million followers) use push fanout; celebrity accounts use pull. At read time, the pre-assembled feed for push users is merged with recent posts from any celebrity accounts the user follows. This limits the write amplification of celebrity posts to a manageable level while keeping feed reads fast for most users. The celebrity post is fetched separately and inserted into the correct chronological position in the merged feed.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you handle feed for a new user who just followed 100 people?',
    a: 'Bootstrap the feed: query the 100 followees\' recent posts (last 7 days or last 500 posts), merge-sort by timestamp, and populate the new user\'s Redis sorted set. This is a one-time background job triggered on the first feed load. For subsequent follows: fan-out the followee\'s recent posts to the new follower\'s feed list (backfill the last N posts from that account).',
  },
  {
    q: 'How does Instagram/TikTok add algorithmic ranking on top of this?',
    a: 'Instead of returning posts sorted by raw timestamp, an ML model scores each candidate post: score = base_time_decay × engagement_rate × affinity_score (how much you interact with this author). Candidate posts come from the same Redis feed list; the ranking model re-orders them. The model runs offline (hourly retraining) and inference runs inline at feed read time. Candidates not in the top-K for that user are filtered before display.',
  },
  { q: 'How do you design the database schema for a social feed system?', a: 'Core tables: Users (user_id, username, follower_count). Posts (post_id, user_id, content, created_at). Follows (follower_id, followee_id, created_at). For a push-based feed: a Feed or Timeline table (user_id, post_id, created_at) stores the pre-assembled feed per user. Index on (user_id, created_at) for fast feed queries. A user reading their feed queries this table with cursor pagination. For a pull-based feed: at read time, fetch post_ids from Posts where user_id IN (SELECT followee_id FROM Follows WHERE follower_id = current_user) ORDER BY created_at DESC LIMIT 20. This is slow without caching for users with many followees.' },
  { q: 'How do you implement notifications for social events like likes, comments, and follows?', a: 'Notification pipeline: when a social event occurs (like, comment, follow), the event is published to a message queue. A notification service consumes these events and determines which users should be notified. For push notifications: deliver via APNs (iOS) and FCM (Android). For in-app notifications: write to a notifications table and return counts via WebSocket or on next app open. Notification aggregation: if 100 users like a post, do not send 100 separate notifications. Batch them into one notification like Alice and 99 others liked your post. Implement notification preferences: respect users who disable email notifications or mute specific notification types. Notification delivery is inherently at-least-once; deduplication at the delivery layer prevents duplicate push notifications from retries.' },
  { q: 'How do you implement activity counts (likes, views, follower counts) at scale?', a: 'Naive approach: COUNT(*) query for each post on every render is too slow at scale. Solutions: maintain a counter column on the entity (post.like_count) and use database atomic increment (UPDATE posts SET like_count = like_count + 1 WHERE post_id = x) on each like. This is fast but creates hot spots on popular posts with thousands of concurrent likes. Alternative: use Redis INCR to buffer counts in memory and periodically flush to the database. For approximate counts: use a streaming counter like Redis HyperLogLog for unique view counts (memory-efficient approximate cardinality). Decouple the counter from the like event using a queue for high-throughput scenarios to smooth out write spikes.' },
  { q: 'How do you rank a social feed using machine learning?', a: 'Chronological feeds are simple but engagement-optimized ranked feeds require ML. Feature engineering: collect signals for each post-user pair: time since post, relationship strength (interaction history), post engagement rate, content type affinity, and recency of the user interaction. Train a ranking model (logistic regression, gradient boosted trees, or a neural network) to predict whether the user will engage with the post. At feed generation time, score candidate posts and sort by predicted engagement score. Challenges: ranking must be fast (under 100ms) so use pre-computed user and content feature vectors. A/B test ranking models before full rollout. Avoid feedback loops where the model amplifies its own biases by continuously showing only the highest-scoring content.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Hybrid fan-out: write for regular users, read for celebrities. Redis ZSET per user. Cursor pagination. Denormalise post author data.',
  mustKnow: [
    'Fan-out on write: O(1) read, O(followers) write — fails at celebrity scale',
    'Fan-out on read: O(1) write, O(follows) read — fails at high follow count',
    'Hybrid: fan-out on write below threshold; merge celeb posts at read time',
    'Redis Sorted Set: score=timestamp, member=post_id for feed storage',
    'Cursor-based pagination: use last-seen timestamp, stable under live updates',
    'Denormalise author name/avatar into posts table to avoid N+1 JOIN',
  ],
  interviewFocus: [
    'Explain fan-out on write vs read with concrete write amplification numbers',
    'Describe hybrid fan-out and celeb threshold decision',
    'Feed read path: Redis list merge with live celebrity posts',
    'How to bootstrap feed for a new user or new follow',
  ],
};

@Component({
  selector: 'app-sysdesign-social-feed',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './social-feed.html',
  styleUrl: './social-feed.scss',
})
export class SysdesignSocialFeed {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
