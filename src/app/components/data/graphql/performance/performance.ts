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
  selector: 'app-gql-performance',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance.html',
  styleUrl: './performance.scss'
})
export class GqlPerformance {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'depth limiting', desc: 'Reject queries that nest deeper than a configured threshold' },
    { type: 'keyword', name: 'query complexity', desc: 'Assign a cost score to each field; reject queries exceeding max complexity' },
    { type: 'keyword', name: 'persisted queries', desc: 'Replace query strings with a short hash — prevents arbitrary query injection' },
    { type: 'keyword', name: 'rate limiting', desc: 'Limit how many operations a client can send per time window' },
    { type: 'keyword', name: 'field-level caching', desc: '@cacheControl directive sets max-age per field — Apollo Server adds Cache-Control headers' },
    { type: 'keyword', name: 'query allowlist', desc: 'Only permit pre-approved registered queries — strongest security posture' },
    { type: 'keyword', name: 'DataLoader', desc: 'Batch per-request DB calls — the primary tool for N+1 prevention' },
    { type: 'keyword', name: 'APM tracing', desc: 'Apollo Studio / OpenTelemetry traces individual field resolver durations' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Attack Vectors Unique to GraphQL',
      points: [
        'GraphQL\'s flexibility is also its attack surface: clients can request deeply nested queries, expensive field combinations, or abuse subscriptions.',
        'Batched query attacks: sending the same mutation many times in one request to bypass per-request rate limits.',
        'Introspection abuse: mapping the full schema to find sensitive fields or admin mutations.',
        'Field suggestion attacks: GraphQL\'s "Did you mean?" suggestions reveal field names — disable in production.'
      ]
    },
    {
      heading: 'Depth Limiting',
      points: [
        'Deeply nested queries cause exponential resolver chains: `posts { author { posts { author { posts ... } } } }`.',
        'Depth limiting rejects queries with nesting deeper than a threshold (usually 5–10 levels).',
        'The `graphql-depth-limit` library provides a validation rule: `depthLimit(5)`.',
        'Set the limit generously enough to support legitimate queries — too low breaks real clients.'
      ]
    },
    {
      heading: 'Query Complexity',
      points: [
        'Complexity analysis assigns a cost to each field. The sum is compared to a max allowed complexity.',
        'List fields multiplied by their children have multiplicative cost: `posts (cost=1) * 100 items * author (cost=1) = 100`.',
        'Libraries: graphql-query-complexity with field/type complexity estimators, or the complexity plugin for Apollo.',
        'Start with simple estimates; refine based on production query profiles.'
      ]
    },
    {
      heading: 'Persisted Queries',
      points: [
        'Persisted queries register query strings by hash. Clients send only the hash — servers look up the full query.',
        'Benefits: reduces bandwidth, prevents arbitrary query injection (only pre-registered queries run), enables CDN GET caching.',
        'Apollo Server + Apollo Client support Automatic Persisted Queries (APQ): client sends hash first, server returns 404, client resends full query which is then stored.',
        'Full allowlist mode: only allow registered hashes — reject any unknown query string.'
      ]
    },
    {
      heading: 'Response Caching',
      points: [
        'GraphQL responses can be cached at field level with @cacheControl directives.',
        '@cacheControl(maxAge: 60, scope: PUBLIC) on a field tells Apollo Server to set Cache-Control headers.',
        'The minimum maxAge across all selected fields determines the overall response Cache-Control header.',
        'For private data (authenticated), use scope: PRIVATE — CDNs won\'t cache it, but browsers will.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Depth + Complexity',
      language: 'typescript',
      code: `import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-query-complexity';
import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    // Reject queries deeper than 7 levels
    depthLimit(7),

    // Reject queries with complexity > 1000
    createComplexityLimitRule(1000, {
      onCost: (cost) => console.log('[GQL] Query complexity:', cost),
      formatErrorMessage: (cost) =>
        \`Query complexity \${cost} exceeds maximum of 1000\`
    })
  ]
});`
    },
    {
      label: 'Persisted Queries (APQ)',
      language: 'typescript',
      code: `// Server — Apollo Server supports APQ out of the box
import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({
  typeDefs,
  resolvers
  // APQ is enabled by default in Apollo Server
});

// Client — Apollo Client APQ link
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedQueriesLink = createPersistedQueryLink({ sha256 });

const client = new ApolloClient({
  link: from([persistedQueriesLink, httpLink]),
  cache: new InMemoryCache()
});
// First request: client sends SHA-256 hash
// Server: cache miss → returns PersistedQueryNotFound
// Client: resends full query + hash
// Server: stores hash→query, executes, responds
// Subsequent requests: hash only, no full query string`
    },
    {
      label: '@cacheControl',
      language: 'typescript',
      code: `# Apollo Server built-in cache control directive
directive @cacheControl(maxAge: Int, scope: CacheScope) on FIELD_DEFINITION | OBJECT

enum CacheScope { PUBLIC PRIVATE }

type Query {
  # Public data — CDN can cache for 60 seconds
  publicPosts: [Post!]! @cacheControl(maxAge: 60, scope: PUBLIC)

  # Private — per-user, browser cache only
  myProfile: User @cacheControl(maxAge: 30, scope: PRIVATE)

  # Real-time — no cache
  liveScore: Int! @cacheControl(maxAge: 0)
}

type Post {
  id: ID!
  title: String! @cacheControl(maxAge: 300)
  # author is personal data — limits the whole query to maxAge:0
  author: User @cacheControl(maxAge: 0, scope: PRIVATE)
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'No depth or complexity limits in production',
      wrong: `// No validation rules — malicious deeply nested query can DoS the server
const server = new ApolloServer({ typeDefs, resolvers })`,
      right: `const server = new ApolloServer({
  typeDefs, resolvers,
  validationRules: [depthLimit(7), createComplexityLimitRule(1000)]
})`,
      explanation: 'Without depth/complexity limits, a single crafted query can cause exponential work — effectively a DoS attack. Always add validation rules in production.'
    },
    {
      title: 'Leaving introspection enabled in production',
      wrong: `// Default: introspection enabled — attackers can map your entire schema`,
      right: `const server = new ApolloServer({
  typeDefs, resolvers,
  introspection: process.env.NODE_ENV !== 'production'
})`,
      explanation: 'Introspection reveals your full schema including sensitive fields and admin mutations. Disable it in production or protect it behind authentication.'
    },
    {
      title: 'Using scope: PUBLIC for user-specific data',
      wrong: `myProfile: User @cacheControl(maxAge: 60, scope: PUBLIC)  # CDN caches one user's profile, returns it to everyone`,
      right: `myProfile: User @cacheControl(maxAge: 60, scope: PRIVATE)  # browser-only, not CDN`,
      explanation: 'PUBLIC scope allows CDNs to cache and share the response. NEVER use PUBLIC for authenticated or user-specific data — other users would receive someone else\'s profile.'
    },
    {
      title: 'Rate limiting by IP only',
      wrong: `// IP-based rate limiting — bypassed behind NAT or VPN
rateLimiter.check(req.ip, 100, '1m')`,
      right: `// Rate limit by authenticated user ID when available
const key = context.user?.id ?? req.ip;
rateLimiter.check(key, 100, '1m')`,
      explanation: 'IP-based rate limiting is easily bypassed by users behind NAT (many users share one IP) or via VPN. Rate limit by user ID when the user is authenticated.'
    },
    {
      title: 'Not accounting for list multipliers in complexity',
      wrong: `// Treating posts and posts.author as flat cost=1 each
// 100 posts × 10 comments each = 1000+ resolvers, cost reported as 2`,
      right: `// Use multiplicative complexity estimators for list fields
fieldExtensionsEstimator(),
simpleEstimator({ defaultComplexity: 1 })  // + multiplier for arrays`,
      explanation: 'List fields multiply their child costs. A posts field returning 100 items where each has 10 comments is 1000+ resolvers, not a flat cost. Estimators must account for list cardinality.'
    }
  ];

  challenge: Challenge = {
    title: 'Add Depth Limit and Complexity Protection',
    language: 'typescript',
    description: 'Configure an Apollo Server with: (1) depth limit of 6, (2) query complexity limit of 500 using createComplexityLimitRule with a custom error message, (3) a logging callback that logs the computed cost. Also disable introspection in production using process.env.NODE_ENV.',
    hints: [
      'import depthLimit from "graphql-depth-limit"',
      'import { createComplexityLimitRule } from "graphql-query-complexity"',
      'validationRules array in ApolloServer constructor',
      'introspection: process.env.NODE_ENV !== "production"'
    ],
    starterCode: `import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-query-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // TODO: add validationRules and introspection config
});`,
    solution: `import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-query-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  validationRules: [
    depthLimit(6),
    createComplexityLimitRule(500, {
      onCost: (cost) => {
        console.log(\`[GQL] Query complexity: \${cost}\`);
      },
      formatErrorMessage: (cost) =>
        \`Query is too complex (\${cost}). Maximum allowed complexity is 500.\`
    })
  ]
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the purpose of depth limiting in GraphQL?', options: ['To limit response size', 'To reject queries that are nested deeper than a threshold', 'To limit the number of fields per type', 'To enforce authentication'], answer: 1, explanation: 'Depth limiting rejects queries whose nesting depth exceeds a threshold. Deeply nested queries cause exponential resolver chains that can DoS the server.' },
    { q: 'What do persisted queries prevent?', options: ['Over-fetching', 'Arbitrary query string injection and reduce bandwidth', 'Schema drift', 'Subscription leaks'], answer: 1, explanation: 'Persisted queries register queries by hash. In allowlist mode, only registered queries run — preventing attackers from sending arbitrary queries. They also reduce bandwidth by sending only the hash.' },
    { q: 'What HTTP cache scope should be used for authenticated user data?', options: ['PUBLIC', 'SHARED', 'PRIVATE', 'NONE'], answer: 2, explanation: 'PRIVATE scope means the response is only cached by the user\'s own browser — not by CDNs. Use PRIVATE for any user-specific or authenticated data.' },
    { q: 'Why is IP-only rate limiting insufficient for GraphQL APIs?', options: ['IPs change too frequently', 'Multiple users can share one IP (NAT, VPN), and authenticated users can bypass it', 'IP is too long to store', 'GraphQL doesn\'t have IP access'], answer: 1, explanation: 'IP-based rate limiting breaks behind NAT (many users share one IP) and is easily bypassed via VPN. Rate limit by authenticated user ID when possible.' },
    { q: 'What makes GraphQL complexity analysis important?', options: ['It validates schema syntax', 'It catches expensive query combinations that depth limits alone miss', 'It monitors memory usage', 'It prevents circular fragments'], answer: 1, explanation: 'A shallow but wide query (many fields on many list items) can be expensive without being deep. Complexity analysis assigns costs and rejects queries exceeding a budget.' },
    { q: 'What does APQ (Automatic Persisted Queries) do on cache miss?', options: ['Rejects the request', 'Returns 404 and prompts the client to resend the full query', 'Runs an introspection query', 'Logs a security alert'], answer: 1, explanation: 'On hash-only request with no stored query, the server returns PersistedQueryNotFound. The client then resends the full query + hash. The server stores it for future hash-only requests.' }
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between depth limiting and query complexity?', a: 'Depth limiting rejects based on nesting depth alone. Complexity analysis assigns cost scores to every field (including list multipliers) and rejects based on total cost. Use both: depth for obvious abuse, complexity for sophisticated attacks.' },
    { q: 'Should I use a query allowlist in production?', a: 'For high-security APIs where the client is known (e.g., your own mobile app), yes. A full allowlist (only registered hashes allowed) is the strongest security posture. For public APIs where third parties query your schema, allowlists are impractical.' },
    { q: 'How do I detect slow resolvers?', a: 'Use Apollo Studio for field-level tracing (opentelemetry-plugin, Apollo Router traces). Add custom timing in resolvers or plugins. The requestDidStart/willSendResponse lifecycle can log total duration; plugins can trace per-field timing.' },
    { q: 'What is the "batched query" attack in GraphQL?', a: 'Sending multiple mutations in one HTTP request: `mutation { m1: login(...) m2: login(...) }` — bypasses per-request rate limits. Mitigate with per-mutation rate limiting, operation complexity, or disabling query batching.' },
    { q: 'How do field suggestions pose a security risk?', a: 'When a client queries a non-existent field, GraphQL suggests "Did you mean \'secretAdminField\'?". This reveals field names even without introspection. Disable suggestions in production using a custom validation rule or server option.' },
    { q: 'What is query cost analysis vs complexity?', a: 'They are largely synonymous. "Query cost" typically refers to assigning numeric costs per field and checking against a budget. "Complexity" is often used interchangeably, though some libraries use the terms to distinguish between field-count (complexity) and server-load estimates (cost).' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Protect GraphQL APIs with depth limits, complexity budgets, persisted queries, and rate limiting — disable introspection and field suggestions in production.',
    mustKnow: [
      'Depth limit (graphql-depth-limit): reject deeply nested queries',
      'Complexity analysis: assign field costs; reject queries exceeding budget',
      'Persisted queries: hash replaces query string — prevents injection, saves bandwidth',
      '@cacheControl: PUBLIC for CDN caching, PRIVATE for user-specific data',
      'Rate limit by user ID not IP — IP alone is bypassed behind NAT/VPN',
      'Disable introspection in production to prevent schema discovery'
    ],
    interviewFocus: [
      'What attack vectors are unique to GraphQL APIs?',
      'How do persisted queries improve both security and performance?',
      'Explain depth limiting vs query complexity analysis'
    ]
  };
}
