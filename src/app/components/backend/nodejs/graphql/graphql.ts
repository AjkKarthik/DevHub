import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-graphql',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './graphql.html',
  styleUrl: './graphql.scss'
})
export class NodeGraphql {
  quickRef: QuickRefItem[] = [
    { name: 'typeDefs', type: 'keyword', desc: 'SDL schema string: types, queries, mutations, subscriptions defined with gql tag.' },
    { name: 'resolvers', type: 'keyword', desc: 'Object matching schema shape: Query.field, Mutation.field, Type.field functions.' },
    { name: 'context', type: 'keyword', desc: 'Shared per-request object: user, db, dataloaders. Passed to every resolver.' },
    { name: 'DataLoader', type: 'class', desc: 'Batches and caches N resolver calls into a single DB query. Solves N+1 problem.' },
    { name: 'ApolloServer', type: 'class', desc: 'GraphQL server with built-in introspection, Apollo Studio, and plugin system.' },
    { name: 'GraphQL Yoga', type: 'keyword', desc: 'Lightweight GraphQL server alternative. First-class subscriptions, Envelop plugins.' },
    { name: 'Subscription', type: 'keyword', desc: 'Real-time data via WebSocket. AsyncIterator + PubSub for event delivery.' },
    { name: 'Persisted queries', type: 'keyword', desc: 'Store query hashes server-side. Clients send hash instead of query string — reduces payload + enables CDN caching.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Schema, Types, and Resolvers',
      points: [
        'GraphQL is a query language and runtime for APIs. The schema (SDL) defines all available types, queries, mutations, and subscriptions. Every field has a type and optionally arguments. The schema is the contract between client and server.',
        'Resolvers are functions that return data for each field. A resolver receives (parent, args, context, info). parent is the result of the parent type\'s resolver. args contains field arguments. context is the shared request-scoped object (user, dataloaders, db). info contains AST and schema metadata.',
        'Non-nullable types: String! means the field can never be null — if the resolver returns null, GraphQL throws an error. String (without !) allows null. Use non-nullable for fields that are always present; nullable for optional data. Misuse causes runtime errors that surface only in production.',
        'Mutations return modified data (the updated object, not just a success boolean). GraphQL mutations are explicitly namespaced — unlike REST, all mutations share one endpoint and are selected by name. Return objects, not scalars, to enable partial field selection by clients.',
      ]
    },
    {
      heading: 'N+1 Problem and DataLoader',
      points: [
        'The N+1 problem: a query for 10 posts where each post\'s author is resolved individually = 1 query for posts + 10 queries for authors = 11 total. Every field resolver runs independently per parent — there is no automatic batching.',
        'DataLoader solves this: instead of querying the DB immediately, each resolver calls dataloader.load(authorId). DataLoader batches all load() calls from within one event loop tick into a single DB query: SELECT * FROM users WHERE id IN (1,2,3...). Results are cached for the request lifecycle.',
        'DataLoader must be created per request (in context) — not as a singleton. A shared DataLoader across requests leaks data between users and caches stale results. Create fresh instances in the context factory: context: ({ req }) => ({ userLoader: new DataLoader(batchFn) }).',
        'Custom DataLoader batch functions: receive an array of keys, must return an array of values in the same order as keys (or Error for missing). Sorting and mapping the DB results to match key order is required.',
      ]
    },
    {
      heading: 'Security, Subscriptions, and Performance',
      points: [
        'Introspection (querying the schema itself) exposes your entire API surface. Disable in production: introspection: false in Apollo Server options. Use schema-based authorization (reject queries for fields users don\'t have access to) or a dedicated API gateway.',
        'Query depth and complexity: a malicious client can send deeply nested queries that cause exponential DB load. Use graphql-depth-limit (max depth 7) and graphql-query-complexity (assign costs per field, reject above threshold). Both are implemented as Apollo plugins.',
        'Subscriptions use WebSockets. Apollo Server v4 uses the graphql-ws library. Resolvers return an AsyncIterator via a PubSub mechanism. Redis-based PubSub (graphql-redis-subscriptions) enables subscriptions across multiple server instances.',
        'Persisted Queries: clients register queries by SHA-256 hash in advance. At runtime, clients send the hash instead of the query string. This eliminates parsing overhead, enables GET requests (CDN-cacheable), and prevents arbitrary query injection. Supported natively in Apollo Client + Server.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Apollo Server + Resolvers',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = \`#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    publishedAt: String
  }
  type Query {
    users: [User!]!
    user(id: ID!): User
    post(id: ID!): Post
  }
  type Mutation {
    createPost(title: String!, content: String!, authorId: ID!): Post!
    publishPost(id: ID!): Post!
  }
\`;

const resolvers = {
  Query: {
    users: (_, __, ctx) => ctx.db.users.findMany(),
    user:  (_, { id }, ctx) => ctx.db.users.findById(id),
    post:  (_, { id }, ctx) => ctx.db.posts.findById(id),
  },
  Mutation: {
    createPost: (_, args, ctx) => ctx.db.posts.create(args),
    publishPost: (_, { id }, ctx) => ctx.db.posts.update(id, { publishedAt: new Date().toISOString() }),
  },
  User: {
    posts: (user, _, ctx) => ctx.userPostsLoader.load(user.id), // DataLoader
  },
  Post: {
    author: (post, _, ctx) => ctx.userLoader.load(post.authorId), // DataLoader
  },
};

const server = new ApolloServer({ typeDefs, resolvers, introspection: false });
const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => ({
    db,
    user: req.headers.authorization ? verifyToken(req.headers.authorization) : null,
    userLoader: new DataLoader(ids => db.users.findByIds(ids)),
    userPostsLoader: new DataLoader(userIds => db.posts.findByAuthorIds(userIds)),
  }),
});`
    },
    {
      label: 'DataLoader batching',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

// Batch function: receives array of keys, must return same-length array of values/errors
async function batchUsers(userIds) {
  const users = await db.users.findMany({ where: { id: { in: userIds } } });

  // CRITICAL: return values in the SAME ORDER as the keys
  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id) ?? new Error(\`User \${id} not found\`));
}

// Created fresh per request (in Apollo context)
const userLoader = new DataLoader(batchUsers, {
  cacheKeyFn: key => String(key), // normalize keys
  maxBatchSize: 100,              // cap batch size
});

// Usage in resolvers
const Post = {
  author: (post, _, ctx) => ctx.userLoader.load(post.authorId),
  // All 10 post.author resolvers collect their authorIds
  // DataLoader fires batchUsers([id1, id2, ...id10]) once
  // 10 individual DB calls → 1 batched query
};

// Manual batching — if DataLoader is too heavy
const Post2 = {
  author: async (post, _, ctx) => {
    // Load all authors in one query outside resolver using context caching
    if (!ctx._userCache.has(post.authorId)) {
      ctx._userCache.set(post.authorId, db.users.findById(post.authorId));
    }
    return ctx._userCache.get(post.authorId);
  },
};`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Leaving introspection enabled in production',
      wrong: `new ApolloServer({ typeDefs, resolvers }); // introspection enabled by default`,
      right: `new ApolloServer({ typeDefs, resolvers, introspection: process.env.NODE_ENV !== 'production' });`,
      explanation: 'Introspection lets anyone query your entire API schema — field names, types, relationships, and mutation signatures. This reconnaissance data is valuable for attackers. Disable in production and use Apollo Studio (authenticated) for schema exploration.'
    },
    {
      title: 'Creating DataLoader as a singleton',
      wrong: `const userLoader = new DataLoader(batchUsers); // shared across all requests!
context: () => ({ userLoader })`,
      right: `context: ({ req }) => ({
  userLoader: new DataLoader(batchUsers) // new instance per request
})`,
      explanation: 'DataLoader caches results by key for its entire lifetime. A singleton DataLoader caches User A\'s data and returns it to User B\'s request. Create a fresh DataLoader per request in the context factory — the cache is request-scoped.'
    },
    {
      title: 'Returning scalars from mutations instead of objects',
      wrong: `Mutation: {
  deletePost: (_, { id }, ctx) => { ctx.db.posts.delete(id); return true; }
}`,
      right: `Mutation: {
  deletePost: async (_, { id }, ctx) => {
    const post = await ctx.db.posts.delete(id);
    return post; // return the deleted object — client can select specific fields
  }
}`,
      explanation: 'Returning a boolean from mutations prevents clients from selecting fields. Returning the affected object lets clients specify which fields they need — consistent with GraphQL\'s over-fetching prevention. Pattern: return the created/updated/deleted object.'
    },
    {
      title: 'Not handling N+1 in type resolvers',
      wrong: `Post: {
  author: (post, _, ctx) => ctx.db.users.findById(post.authorId) // N DB calls for N posts
}`,
      right: `Post: {
  author: (post, _, ctx) => ctx.userLoader.load(post.authorId) // batched into 1 DB call
}`,
      explanation: 'Type field resolvers run once per parent object. A query for 10 posts triggers 10 independent author queries. DataLoader.load() collects all authorIds across the event loop tick and batches them into one query — 10 calls become 1.'
    },
  ];

  challenge: Challenge = {
    title: 'Blog GraphQL API with DataLoader',
    language: 'typescript',
    description: 'Build a minimal GraphQL API for a blog. Schema: User(id, name), Post(id, title, authorId), Query.posts returns all posts, Query.user(id) returns a user. Post.author field resolver uses DataLoader to avoid N+1. Add a Mutation.createPost(title, authorId). The DataLoader batch function should simulate a DB call returning users by IDs.',
    hints: [
      'DataLoader batch function receives string[] of IDs, returns User[]|Error[] in same order',
      'Post.author resolver: (post, _, ctx) => ctx.userLoader.load(post.authorId)',
      'Context factory creates new DataLoader per request',
    ],
    starterCode: `import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';

const users = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
const posts = [
  { id: '1', title: 'Hello', authorId: '1' },
  { id: '2', title: 'World', authorId: '2' },
];

const typeDefs = \`#graphql
  # TODO: define User, Post, Query, Mutation types
\`;

const resolvers = {
  // TODO: Query, Mutation, Post resolvers
};

// TODO: start server with context that creates userLoader`,
    solution: `import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';

const users = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
let posts = [
  { id: '1', title: 'Hello', authorId: '1' },
  { id: '2', title: 'World', authorId: '2' },
];

const typeDefs = \`#graphql
  type User { id: ID! name: String! }
  type Post { id: ID! title: String! author: User! }
  type Query { posts: [Post!]! user(id: ID!): User }
  type Mutation { createPost(title: String!, authorId: ID!): Post! }
\`;

const resolvers = {
  Query: {
    posts: () => posts,
    user: (_, { id }) => users.find(u => u.id === id) ?? null,
  },
  Mutation: {
    createPost: (_, { title, authorId }) => {
      const post = { id: String(posts.length + 1), title, authorId };
      posts.push(post);
      return post;
    },
  },
  Post: {
    author: (post, _, ctx) => ctx.userLoader.load(post.authorId),
  },
};

async function batchUsers(ids) {
  const map = new Map(users.map(u => [u.id, u]));
  return ids.map(id => map.get(id) ?? new Error(\`Not found: \${id}\`));
}

const server = new ApolloServer({ typeDefs, resolvers });
await startStandaloneServer(server, {
  context: async () => ({ userLoader: new DataLoader(batchUsers) }),
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the N+1 problem in GraphQL?', options: ['GraphQL running N+1 queries to build the schema', 'Each parent object triggers one resolver call per child, causing N individual DB queries for N parents', 'DataLoader batching N+1 requests', 'Pagination loading N+1 pages'], answer: 1, explanation: 'If you have 10 posts and each has an author field resolver that calls db.users.findById(), GraphQL runs 10 separate author queries — one per post. DataLoader batches these into one SELECT WHERE id IN (...) query.' },
    { q: 'Why should DataLoader instances be created per request, not as singletons?', options: ['DataLoader is not thread-safe', 'Singleton DataLoader caches data across requests — user A could receive user B\'s cached data', 'DataLoader performance degrades without recreation', 'Per-request creation reduces memory usage'], answer: 1, explanation: 'DataLoader caches keys for its entire lifetime. A singleton DataLoader caches User data indefinitely, returning stale or wrong data to subsequent requests. Create a new DataLoader in the request context factory — cache is then scoped to one request.' },
    { q: 'What is the role of context in a GraphQL resolver?', options: ['Context validates the query syntax', 'Context is a per-request shared object providing db connections, user, and DataLoaders to all resolvers', 'Context stores the query result', 'Context is the GraphQL schema object'], answer: 1, explanation: 'Context is created once per request and passed as the third argument to every resolver. It carries authentication info (user), database connections, DataLoader instances, and any other request-scoped dependencies — avoiding global state.' },
    { q: 'Why should GraphQL introspection be disabled in production?', options: ['Introspection slows down queries', 'Introspection exposes your entire schema — field names, types, and mutation signatures — useful reconnaissance for attackers', 'Introspection breaks Apollo Studio', 'Introspection increases bundle size'], answer: 1, explanation: 'Introspection lets any client enumerate your entire API: all types, fields, arguments, and mutations. This is valuable information for an attacker planning injection attacks or looking for undocumented admin endpoints. Disable in production.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use GraphQL instead of REST?', a: 'GraphQL excels when: clients need to control exactly which fields they receive (avoids over-fetching), multiple clients (mobile, web, third parties) need different data shapes from the same endpoint, or the data is highly relational with complex join requirements. REST is better when: the API is public and cacheability matters (GET responses are CDN-cacheable by URL), the data model is simple, or you need HTTP-level caching without persisted queries. Both can coexist — REST for public/cacheable resources, GraphQL for complex internal client needs.' },
    { q: 'How do you handle authorization in GraphQL resolvers?', a: 'Two approaches: (1) Resolver-level: check ctx.user in each resolver: if (!ctx.user) throw new GraphQLError("Unauthorized", { extensions: { code: "UNAUTHENTICATED" } }). Repetitive but explicit. (2) Schema directive: define @auth directive, apply to protected fields in SDL, intercept in the directive implementation. Libraries like graphql-shield provide rule-based authorization as a middleware layer. Always check authorization at the data layer too — a client could still call unrestricted resolvers that fetch restricted data.' },
    { q: 'What are subscriptions in GraphQL and how are they implemented?', a: 'GraphQL subscriptions enable real-time updates via WebSocket. The client sends a subscription operation; the server streams events as they occur. Implementation: resolvers return an AsyncIterator (a PubSub topic). On mutation, publish to the topic: pubsub.publish("POST_CREATED", { postCreated: newPost }). Apollo Server v4 uses the graphql-ws library. For multi-server deployments, use Redis-based PubSub (graphql-redis-subscriptions) so events published on Server A reach subscribers on Server B.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'GraphQL is a typed query language — clients request exactly what they need. Use DataLoader for N+1 prevention, disable introspection in production, add depth/complexity limits.',
    mustKnow: [
      'Schema SDL defines types; resolvers implement them. Field resolvers get (parent, args, ctx, info).',
      'N+1: type field resolvers run per parent — DataLoader batches them into one query.',
      'DataLoader created per request in context — singleton causes data leaks.',
      'Context carries db, user, DataLoaders — shared across all resolvers per request.',
      'Introspection disabled in production — exposes full API surface.',
      'Depth limit + complexity limit prevent malicious nested queries.',
      'Subscriptions: AsyncIterator + PubSub over WebSocket.',
    ],
    interviewFocus: [
      'What is the N+1 problem in GraphQL and how does DataLoader solve it?',
      'What goes in GraphQL context and why?',
      'How do you secure a GraphQL API?',
    ]
  };
}
