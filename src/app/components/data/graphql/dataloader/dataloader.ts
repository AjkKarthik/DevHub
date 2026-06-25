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
  selector: 'app-gql-dataloader',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dataloader.html',
  styleUrl: './dataloader.scss'
})
export class GqlDataloader {
  quickRef: QuickRefItem[] = [
    { type: 'class', name: 'DataLoader(batchFn)', desc: 'Create a loader that batches and caches requests within a tick' },
    { type: 'method', name: 'loader.load(key)', desc: 'Schedule a single key for loading — returns a Promise' },
    { type: 'method', name: 'loader.loadMany(keys)', desc: 'Load multiple keys at once — returns Promise<(T | Error)[]>' },
    { type: 'method', name: 'loader.clear(key)', desc: 'Remove a specific key from the in-memory cache' },
    { type: 'method', name: 'loader.clearAll()', desc: 'Clear the entire per-loader cache' },
    { type: 'method', name: 'loader.prime(key, value)', desc: 'Pre-populate the cache with a known value (avoid a future load)' },
    { type: 'keyword', name: 'batch function', desc: 'Receives an array of keys, must return an array of values in the same order' },
    { type: 'keyword', name: 'N+1 problem', desc: 'Fetching the parent + 1 query per child — the core problem DataLoader solves' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The N+1 Problem',
      points: [
        'When you fetch a list of N posts and each post has an author field, naively that is 1 query for posts + N queries for authors = N+1 total queries.',
        'This is the most common performance problem in GraphQL APIs and does not exist in REST (which fetches denormalized data).',
        'The N+1 problem gets worse as query depth increases — nested relations multiply the effect.',
        'DataLoader is the standard solution: it batches all individual loads within a single tick into one database query.'
      ]
    },
    {
      heading: 'How DataLoader Works',
      points: [
        'DataLoader collects all `load(key)` calls made within a single event loop tick, then calls the batch function once with all keys.',
        'The batch function receives `[key1, key2, key3]` and must return `[value1, value2, value3]` in the same order.',
        'Results are matched to their original `load()` promises by position — ordering is critical.',
        'DataLoader also caches: repeated `load(key)` calls within the same request return the cached value immediately.'
      ]
    },
    {
      heading: 'Per-Request DataLoaders',
      points: [
        'DataLoaders MUST be created per-request (in the context function). Their in-memory cache is scoped to one request.',
        'A global DataLoader leaks stale data and private records across different users\' requests.',
        'Create a `loaders` object in context with all your DataLoaders: `{ user: new DataLoader(batchUsers), post: new DataLoader(batchPosts) }`.',
        'Resolvers access loaders via context: `(post, _, { loaders }) => loaders.user.load(post.authorId)`.'
      ]
    },
    {
      heading: 'Batch Function Requirements',
      points: [
        'The batch function must return a Promise resolving to an array of the same length as the input keys array.',
        'The values must be in the same order as the keys — position i of the return array corresponds to keys[i].',
        'For missing items, return a new Error() at that position (not null) — DataLoader propagates it to the individual load() promise.',
        'Use `Map` for efficient key-to-value lookup when building the ordered result array.'
      ]
    },
    {
      heading: 'Advanced Options',
      points: [
        '`cacheKeyFn`: customize how cache keys are compared — useful for complex/object keys.',
        '`maxBatchSize`: limits how many keys are sent to the batch function at once (prevents oversized queries).',
        '`batchScheduleFn`: controls when batching fires — by default uses process.nextTick.',
        '`cache: false`: disable caching for loaders where freshness matters more than deduplication.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'N+1 Problem',
      language: 'typescript',
      code: `// WITHOUT DataLoader — N+1 queries
const resolvers = {
  Query: {
    posts: (_, __, { db }) => db.posts.findAll()  // 1 query
  },
  Post: {
    // This runs ONCE PER POST — 100 posts = 100 user queries!
    author: (post, _, { db }) => db.users.findById(post.authorId)
  }
};

// Query { posts { title author { name } } }
// Results in: SELECT * FROM posts
//             SELECT * FROM users WHERE id = '1'
//             SELECT * FROM users WHERE id = '2'
//             SELECT * FROM users WHERE id = '3'
//             ... (N more times)

// WITH DataLoader — 2 total queries
const resolvers2 = {
  Post: {
    // All author loads are batched into ONE query
    author: (post, _, { loaders }) => loaders.user.load(post.authorId)
  }
};
// Results in: SELECT * FROM posts
//             SELECT * FROM users WHERE id IN ('1', '2', '3', ...)`
    },
    {
      label: 'DataLoader Setup',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';
import { prisma } from './db';

// Batch function — must return results in KEY ORDER
async function batchUsers(ids: readonly string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } }
  });

  // Map users by id for O(1) lookup
  const userMap = new Map(users.map(u => [u.id, u]));

  // Return in the same order as input ids
  // Return Error for missing users
  return ids.map(id => userMap.get(id) ?? new Error(\`User \${id} not found\`));
}

// Context function — create loaders per request
export function createContext({ req }: { req: Request }) {
  const user = getUser(req.headers.authorization);
  return {
    user,
    db: prisma,
    loaders: {
      user: new DataLoader(batchUsers),
      post: new DataLoader(batchPosts),
      comment: new DataLoader(batchComments)
    }
  };
}`
    },
    {
      label: 'Advanced Options',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

// With options
const postLoader = new DataLoader(batchPosts, {
  // Max 100 items per batch
  maxBatchSize: 100,

  // Custom cache key (e.g., for object keys)
  cacheKeyFn: (key) => JSON.stringify(key),

  // Disable cache (for mutation-heavy paths)
  cache: false
});

// Prime the cache — avoid a future load
// Useful when you've already fetched the user in the root resolver
const user = await db.users.findById(userId);
context.loaders.user.prime(userId, user);
// Now when Post.author calls loaders.user.load(userId), it hits cache

// Clear a stale cache entry after mutation
await db.users.update({ id: userId, name: 'New Name' });
context.loaders.user.clear(userId);  // force re-fetch next time`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Returning results in wrong order from batch function',
      wrong: `async function batchUsers(ids) {
  const users = await db.users.findByIds(ids);
  return users;  // DB may return in different order than ids!
}`,
      right: `async function batchUsers(ids) {
  const users = await db.users.findByIds(ids);
  const map = new Map(users.map(u => [u.id, u]));
  return ids.map(id => map.get(id) ?? new Error(\`Not found: \${id}\`));
}`,
      explanation: 'The batch function MUST return values in the same order as the input keys. Databases do not guarantee order — always sort the result using a Map.'
    },
    {
      title: 'Creating DataLoader at module level (global)',
      wrong: `// Global DataLoader — caches data across ALL requests
const userLoader = new DataLoader(batchUsers);
const resolvers = { Post: { author: (p) => userLoader.load(p.authorId) } }`,
      right: `// Per-request in context function
context: () => ({ loaders: { user: new DataLoader(batchUsers) } })`,
      explanation: 'A global DataLoader\'s cache persists across requests, leaking private user data to other requests. Always create loaders in the context function.'
    },
    {
      title: 'Returning null instead of Error for missing items',
      wrong: `return ids.map(id => userMap.get(id) ?? null);  // DataLoader treats null as a valid value`,
      right: `return ids.map(id => userMap.get(id) ?? new Error(\`User \${id} not found\`));`,
      explanation: 'DataLoader cannot distinguish "not found" from "found null" unless you return an Error instance. Returning null silently resolves the load() promise with null.'
    },
    {
      title: 'Not using DataLoader for relation resolvers',
      wrong: `User: { posts: (user, _, { db }) => db.posts.findByAuthorId(user.id) }
// 100 users = 100 queries`,
      right: `// Batch by authorId
const postsByAuthorLoader = new DataLoader(async (authorIds) => {
  const posts = await db.posts.findByAuthorIds([...authorIds]);
  const map = groupBy(posts, 'authorId');
  return authorIds.map(id => map[id] ?? []);
});
User: { posts: (user, _, { loaders }) => loaders.postsByAuthor.load(user.id) }`,
      explanation: 'Use DataLoader for any resolver that could be called N times for a list parent — not just direct ID lookups, but also list-by-foreign-key relations.'
    },
    {
      title: 'Not clearing cache after mutations',
      wrong: `// updateUser mutation completes but post.author still returns stale cached data
await db.users.update({ id, name: 'New Name' });`,
      right: `await db.users.update({ id, name: 'New Name' });
context.loaders.user.clear(id);  // evict stale cache entry`,
      explanation: 'Within the same request, DataLoader caches results. If a mutation changes an entity, clear its loader cache so subsequent loads see the updated data.'
    }
  ];

  challenge: Challenge = {
    title: 'Fix an N+1 Query with DataLoader',
    language: 'typescript',
    description: 'Given a resolver `Post.tags` that calls `db.tags.findByPostId(post.id)` for each post (N+1), refactor it to use a DataLoader. Write: (1) the batch function `batchTagsByPostId` that receives postIds and returns tags grouped by postId, (2) add the loader to context, (3) update the resolver to use the loader.',
    hints: [
      'db.tags.findByPostIds(ids) returns Tag[] with a postId property',
      'Group tags by postId using reduce or a Map',
      'Return an empty array [] for postIds with no tags',
      'Resolver: loaders.tagsByPost.load(post.id)'
    ],
    starterCode: `// BEFORE — N+1
const resolvers = {
  Post: {
    tags: (post, _, { db }) => db.tags.findByPostId(post.id)
  }
};

// AFTER — fix with DataLoader
import DataLoader from 'dataloader';

async function batchTagsByPostId(postIds: readonly string[]) {
  // TODO
}

// Context
context: () => ({
  loaders: {
    // TODO: add tagsByPost loader
  }
});

// Resolver
Post: {
  tags: (post, _, { loaders }) => { /* TODO */ }
}`,
    solution: `import DataLoader from 'dataloader';

async function batchTagsByPostId(postIds: readonly string[]) {
  const tags = await db.tags.findByPostIds([...postIds]);

  // Group by postId
  const tagMap = new Map<string, Tag[]>();
  for (const tag of tags) {
    const list = tagMap.get(tag.postId) ?? [];
    list.push(tag);
    tagMap.set(tag.postId, list);
  }

  // Return in key order — empty array for posts with no tags
  return postIds.map(id => tagMap.get(id) ?? []);
}

// Context
context: () => ({
  db,
  loaders: {
    tagsByPost: new DataLoader(batchTagsByPostId)
  }
});

// Resolver
const resolvers = {
  Post: {
    tags: (post, _, { loaders }) => loaders.tagsByPost.load(post.id)
  }
};`
  };

  quiz: QuizQuestion[] = [
    { q: 'What problem does DataLoader solve?', options: ['Type validation', 'Query parsing', 'The N+1 query problem', 'Schema stitching'], answer: 2, explanation: 'DataLoader batches multiple individual loads within a tick into a single database query, solving the N+1 problem where each item in a list triggers its own query.' },
    { q: 'What must the DataLoader batch function return?', options: ['A single value', 'An array of values in any order', 'An array of values in the SAME order as input keys', 'A Map of key-value pairs'], answer: 2, explanation: 'The batch function must return an array where position i corresponds to keys[i]. DataLoader uses position to match results to their pending load() promises.' },
    { q: 'Why must DataLoaders be created per-request?', options: ['They are too slow to reuse', 'Their in-memory cache would leak data across requests', 'They don\'t support async functions', 'The batch function changes per request'], answer: 1, explanation: 'A global DataLoader\'s cache persists across requests. This means request A\'s data could be returned to request B — a serious data leak.' },
    { q: 'What should you return for a missing item in the batch function?', options: ['null', 'undefined', 'new Error("Not found")', '[]'], answer: 2, explanation: 'Returning `new Error()` at position i causes loader.load(key) to reject with that error. Returning null resolves the promise with null, masking the "not found" case.' },
    { q: 'How does DataLoader cache within a request?', options: ['It caches to Redis', 'It stores results in memory after the first load', 'It writes to localStorage', 'It uses HTTP cache headers'], answer: 1, explanation: 'DataLoader maintains an in-memory Map cache. After the first load, repeated loads of the same key return the cached Promise immediately without hitting the DB again.' },
    { q: 'What does loader.prime(key, value) do?', options: ['Clears the cache', 'Pre-populates the cache so future loads skip the batch function', 'Runs the batch function immediately', 'Logs the key for debugging'], answer: 1, explanation: 'prime() seeds the cache with a value you already have. If you fetched the user in the root resolver, prime the user loader so field resolvers get it from cache.' }
  ];

  qna: QnaItem[] = [
    { q: 'Can DataLoader batch non-ID keys?', a: 'Yes — keys can be any value. Use cacheKeyFn to customize how complex keys are compared. Example: batch by (tenantId, userId) pairs using JSON.stringify as the cacheKeyFn.' },
    { q: 'Does DataLoader work with SQL databases?', a: 'Yes. The batch function uses SQL `WHERE id IN (...)` to fetch all records in one query. For list relations (posts by authorId), use `WHERE author_id IN (...)` and group results by authorId.' },
    { q: 'How do I handle batches larger than a DB query limit?', a: 'Use the maxBatchSize option: `new DataLoader(fn, { maxBatchSize: 100 })`. DataLoader splits large batches automatically into chunks of the specified size.' },
    { q: 'Can I use DataLoader for write operations?', a: 'Technically yes, but it\'s unusual. DataLoader is primarily for reads. If you need batched writes, use a similar batching mechanism but without caching (cache: false) since write results are not safely reusable.' },
    { q: 'What are alternatives to DataLoader?', a: 'Prisma\'s fluent API with include/select joins, GraphQL field-level join hints (join-monster), or query complexity analysis to rewrite N+1 queries into JOINs at the resolver level. DataLoader is the simplest and most widely applicable solution.' },
    { q: 'Does DataLoader work with subscriptions?', a: 'Yes — each subscription event processing run can use its own DataLoader. However, subscriptions are typically simpler (single entity updates) and the N+1 problem is less common. Create loaders in the subscription event context if needed.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'DataLoader batches and caches per-request DB calls — solving N+1 by collecting individual loads into one batch query per event loop tick.',
    mustKnow: [
      'N+1: 1 query for list + N queries for each item\'s relation',
      'DataLoader batches all load() calls within one tick into one batch function call',
      'Batch function must return results in the SAME ORDER as input keys',
      'Return new Error() for missing items — not null',
      'Create DataLoaders per-request in context — never globally',
      'loader.prime() seeds cache; loader.clear() evicts after mutations'
    ],
    interviewFocus: [
      'Explain the N+1 problem and how DataLoader solves it',
      'What happens if the batch function returns results in the wrong order?',
      'Why must DataLoaders be per-request, not global?'
    ]
  };
}
