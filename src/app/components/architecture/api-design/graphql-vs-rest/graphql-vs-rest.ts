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
  { name: 'Over-fetching',   type: 'keyword', desc: 'REST returns fixed response shapes — client may receive more data than needed.' },
  { name: 'Under-fetching',  type: 'keyword', desc: 'REST may require multiple requests to gather data a client needs in one view.' },
  { name: 'BFF Pattern',     type: 'keyword', desc: 'Backend For Frontend — GraphQL as an aggregation layer over multiple REST/gRPC services.' },
  { name: 'Schema Stitching', type: 'keyword', desc: 'Combining multiple GraphQL schemas into one unified API.' },
  { name: 'Federation',      type: 'keyword', desc: 'Apollo Federation — each service owns part of the schema, composed at the gateway.' },
  { name: 'Introspection',   type: 'keyword', desc: 'GraphQL self-documenting — clients can query the schema itself (__schema, __type).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Where GraphQL Wins Over REST',
    points: [
      'Flexible queries: clients request exactly the fields they need. Mobile app fetches minimal fields; dashboard fetches everything — same endpoint, different queries.',
      'No over-fetching: REST returns fixed shapes. GET /users/42 returns ALL user fields even if you only need the email. GraphQL returns only what you ask for.',
      'No under-fetching: REST often requires multiple requests to gather a view (GET /user, GET /orders, GET /preferences). One GraphQL query can aggregate all of it.',
      'Strong schema as a contract: the SDL schema is the single source of truth, documents itself via introspection, and enables auto-generated client types.',
      'Best for: mobile apps with limited bandwidth, flexible frontends, aggregating data from multiple services (BFF pattern), rapidly evolving products with diverse clients.',
    ],
  },
  {
    heading: 'Where REST Wins Over GraphQL',
    points: [
      'HTTP caching: REST responses are cacheable by URL (CDN, browser, proxy). GraphQL uses POST to /graphql — caching is harder (need persisted queries or GET-with-query-string tricks).',
      'Simpler tooling: curl, Postman, browser address bar, standard load balancers. No special client libraries or build steps required.',
      'File uploads: REST handles multipart/form-data naturally. GraphQL uploads are a non-standard workaround (graphql-upload).',
      'Firewall and security rules: REST endpoints are specific URLs — easy to whitelist or block. A single /graphql endpoint makes URL-based security harder.',
      'Best for: public APIs, simple CRUD services, file handling, when HTTP caching is critical, third-party developer ecosystems where simplicity matters.',
    ],
  },
  {
    heading: 'GraphQL as a BFF (Backend For Frontend)',
    points: [
      'A common pattern: internal services use REST or gRPC; a GraphQL BFF aggregates them for specific frontend clients.',
      'The BFF resolves data from multiple upstream services in a single query — product from catalog service, price from pricing service, inventory from warehouse service.',
      'Eliminates over/under-fetching at the aggregate level. Each client (web, mobile, TV app) can have its own BFF tailored to its needs.',
      'GraphQL federation (Apollo) extends this: each backend service owns its part of the schema and is composed at the gateway without a monolithic BFF.',
    ],
  },
  {
    heading: 'Making the Choice',
    points: [
      'Both REST and GraphQL can work well. The choice depends on your clients, team size, caching needs, and API consumer type.',
      'Start with REST for most cases — it\'s simpler, widely understood, and well-tooled. Add GraphQL when clients have genuinely diverse data needs or you\'re building a BFF layer.',
      'Don\'t rewrite a working REST API to GraphQL without a concrete problem to solve. Over-fetching by 50% on a mobile app is a GraphQL problem; over-fetching by 5% on a server-to-server call is not.',
      'Hybrid: REST for public APIs, GraphQL for internal flexible client needs. Run both from the same server — they\'re not mutually exclusive.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'REST vs GraphQL Comparison',
    language: 'typescript',
    code: `// ── REST: fixed response shape, multiple requests ──────────────────────
// Request 1: GET /users/42
// Response: { id, email, name, phone, address, createdAt, preferences, ... }
// (returns ALL fields even if you only need id + email)

// Request 2: GET /users/42/orders (needed for the profile page)
// 2 round trips total

// ── GraphQL: flexible, single request ───────────────────────────────────
const PROFILE_QUERY = \`
  query ProfilePage(\$userId: ID!) {
    user(id: \$userId) {
      id
      email           # only what the profile page needs
      displayName
      recentOrders: orders(limit: 5) {
        id
        status
        total
        createdAt
      }
    }
  }
\`;
// POST /graphql — single request, returns exactly these fields

// ── Same query, different shape for mobile ──────────────────────────────
const MOBILE_QUERY = \`
  query MobileProfile(\$userId: ID!) {
    user(id: \$userId) {
      displayName    # mobile shows less
      avatar
      orderCount: orders { id }  # just the count
    }
  }
\`;

// ── BFF Pattern: GraphQL aggregates multiple upstream services ────────────
const resolvers = {
  Query: {
    productPage: async (_: unknown, { productId }: { productId: string }) => ({
      product:   await catalogService.getProduct(productId),     // REST call
      price:     await pricingService.getPrice(productId),       // gRPC call
      inventory: await warehouseService.getStock(productId),     // REST call
      reviews:   await reviewsService.getReviews(productId),     // REST call
      // All 4 upstream calls resolved in parallel, aggregated into one GraphQL response
    }),
  },
};`,
  },
  {
    label: 'Caching with GraphQL',
    language: 'typescript',
    code: `// HTTP caching is harder with GraphQL (all POST /graphql)
// Three approaches:

// 1. Persisted queries — cache by query hash (GET request)
// Client pre-registers queries; sends GET /graphql?queryId=abc&variables={...}
// This makes responses cacheable by CDN

// 2. Apollo Client cache — client-side normalized cache
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        keyFields: ['id'], // normalize by id — same user in different queries shares cache
      },
    },
  }),
});

// Reading from cache first, then network
const { data } = await client.query({
  query: GET_USER,
  variables: { id: '42' },
  fetchPolicy: 'cache-first', // return cached if available
});

// 3. Field-level caching with @cacheControl directive (Apollo Server)
const typeDefs = \`#graphql
  type User @cacheControl(maxAge: 300) {   # cache for 5 minutes
    id: ID!
    email: String!
    profile: UserProfile @cacheControl(maxAge: 60)  # fresher data
  }
\`;

// GraphQL CDN caching: use GET with query in URL for public data
// POST /graphql for authenticated, personalised queries`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Migrating a simple REST API to GraphQL without a clear benefit',
    wrong: `// Simple CRUD API with 3 endpoints — migrated to GraphQL
// Result: added build complexity, Apollo Server, DataLoader, no tangible gain`,
    right: `// Keep REST for simple CRUD; add GraphQL only when clients have diverse data needs
// Rule: if all clients use the same data shape, REST is simpler`,
    explanation: 'GraphQL adds real value when clients have genuinely different data requirements or when you\'re aggregating multiple data sources. A simple CRUD API with consistent data shapes is easier as REST. Migrate when you have a concrete over/under-fetching problem, not because GraphQL is modern.',
  },
  {
    title: 'Disabling introspection in production unnecessarily',
    wrong: `// Some teams disable introspection in production for "security"
const server = new ApolloServer({ introspection: false });
// Now your own developers can't use GraphQL Playground or generate types`,
    right: `// Introspection is safe for authenticated APIs; disable for truly public unauthenticated APIs
// For public APIs, use schema allowlisting + persisted queries instead`,
    explanation: 'Introspection lets attackers discover your schema. For unauthenticated public APIs, disabling it limits information disclosure. But for authenticated APIs (all real-world apps), it only hurts developer tooling. Better protection: persisted queries (only registered operations are accepted).',
  },
  {
    title: 'Returning all resolver errors as GraphQL errors (pollutes errors array)',
    wrong: `// Throws for NOT_FOUND — makes every "missing optional thing" an error
user: async (_, { id }) => {
  const user = await db.findUser(id);
  if (!user) throw new Error('Not found'); // lands in errors[]
}`,
    right: `// For optional/nullable fields: return null, not an error
// For required fields or genuinely wrong requests: throw with code
user: async (_, { id }) => {
  return db.findUser(id) ?? null; // null is valid for nullable User field
  // Only throw if the caller should have known the resource exists
}`,
    explanation: 'The GraphQL errors array mixes different severity levels. Partial data responses (some fields null) are normal — not every null needs to be an error. Reserve errors for situations where the client did something wrong (invalid input, auth failure) or the server failed unexpectedly.',
  },
  {
    title: 'Using GraphQL for file uploads instead of REST',
    wrong: `// graphql-upload is a non-standard workaround with multipart complexity
mutation UploadAvatar(\$file: Upload!) { uploadAvatar(file: \$file) { url } }`,
    right: `// Use REST for file uploads — multipart/form-data is native HTTP
// POST /users/42/avatar (multipart/form-data)
// Then reference the URL from GraphQL
mutation UpdateAvatar(\$userId: ID!, \$avatarUrl: String!) { ... }`,
    explanation: 'GraphQL was designed for JSON data, not binary file uploads. The graphql-upload spec adds multipart complexity to both server and client. A cleaner pattern: use a REST endpoint for the file upload (gets a URL), then pass the URL to GraphQL. Or upload directly to S3/GCS and pass the URL.',
  },
];

const challenge: Challenge = {
  title: 'API Strategy Advisor',
  language: 'typescript',
  description: `Implement recommendApi(scenario: {clients: number, caching: boolean, fileUploads: boolean, multipleDataSources: boolean}): 'GraphQL' | 'REST' | 'Both' using these rules:
- If fileUploads is true: REST (GraphQL handles files poorly)
- If caching is true AND multipleDataSources is false: REST (HTTP caching is easier)
- If multipleDataSources is true AND clients > 2: GraphQL (BFF aggregation)
- If clients > 3: GraphQL (diverse client data needs)
- Otherwise: REST`,
  hints: [
    'Check fileUploads first (highest priority)',
    'Return "Both" when multipleDataSources is true and caching is true',
  ],
  starterCode: `function recommendApi(scenario: {clients: number, caching: boolean, fileUploads: boolean, multipleDataSources: boolean}): 'GraphQL' | 'REST' | 'Both' {
  // TODO: recommend based on scenario
  return 'REST';
}`,
  solution: `function recommendApi(s: {clients: number, caching: boolean, fileUploads: boolean, multipleDataSources: boolean}): 'GraphQL' | 'REST' | 'Both' {
  if (s.fileUploads) return 'REST';
  if (s.caching && s.multipleDataSources) return 'Both';
  if (s.multipleDataSources && s.clients > 2) return 'GraphQL';
  if (s.clients > 3) return 'GraphQL';
  return 'REST';
}

console.log(recommendApi({ clients: 1, caching: true, fileUploads: false, multipleDataSources: false })); // REST
console.log(recommendApi({ clients: 4, caching: false, fileUploads: false, multipleDataSources: true })); // GraphQL
console.log(recommendApi({ clients: 2, caching: false, fileUploads: true, multipleDataSources: false })); // REST`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main HTTP caching disadvantage of GraphQL compared to REST?',
    options: [
      'GraphQL responses are too large to cache efficiently',
      'GraphQL uses POST /graphql for most requests — POST responses are not cached by CDNs or browsers by default',
      'GraphQL schemas change too frequently for caching to be reliable',
      'GraphQL requires authentication on every request which prevents caching',
    ],
    answer: 1,
    explanation: 'REST endpoints are unique URLs (GET /users/42) — browsers and CDNs cache them by URL. GraphQL sends all queries to POST /graphql — the same URL regardless of the query. POST responses are not cached by HTTP intermediaries. Workarounds: persisted queries with GET requests, Apollo Client cache, or field-level caching with @cacheControl.',
  },
  {
    q: 'What is the BFF (Backend For Frontend) pattern and how does GraphQL fit?',
    options: [
      'A frontend that replaces the backend completely',
      'A GraphQL layer that aggregates multiple upstream services into one query for a specific frontend client',
      'A backend testing pattern where you mock the frontend',
      'A pattern where the same REST API serves both web and mobile clients',
    ],
    answer: 1,
    explanation: 'The BFF pattern creates a dedicated backend layer tailored to a specific frontend\'s data needs. GraphQL is ideal for this: one query to the BFF can aggregate product data (catalog service), price (pricing service), and inventory (warehouse service) — three upstream REST/gRPC calls resolved in parallel, returned as a single GraphQL response.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can I run REST and GraphQL on the same server?',
    a: 'Yes — they\'re not mutually exclusive. A common production setup: Express/Fastify with REST routes (<code>app.get(\'/users/:id\')</code>) AND an Apollo Server middleware mounted at <code>/graphql</code>. REST for public external APIs (documentation, third-party SDKs, file uploads, cache-able reads); GraphQL for internal flexible client queries (BFF, mobile app, dashboard). The same data layer (Prisma/TypeORM) serves both. This hybrid approach lets you use the right tool per use case.',
  },
  {
    q: 'Should I use GraphQL federation or schema stitching?',
    a: '<strong>Apollo Federation</strong>: each microservice defines its own GraphQL schema and owns its entities. A gateway composes them into a unified supergraph. Services can extend each other\'s types (e.g., Order service adds <code>orders</code> field to User). Production-proven at large scale (Netflix, Expedia). <strong>Schema stitching</strong>: the gateway merges schemas from multiple services; gateway is responsible for all type resolution. More manual, harder to scale. <strong>Recommendation</strong>: for new projects with multiple teams, use Apollo Federation. It gives each team schema ownership while composing into one graph.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'GraphQL wins on flexible queries and BFF aggregation; REST wins on HTTP caching, simplicity, and file uploads — choose based on client diversity and caching needs.',
  mustKnow: [
    'GraphQL: no over/under-fetching; client specifies exact fields; one endpoint',
    'REST: HTTP caching by URL (CDN/browser); simpler tooling; better for file uploads',
    'GraphQL shines for: diverse mobile/web clients, BFF aggregation, rapidly changing data needs',
    'REST shines for: public APIs, simple CRUD, HTTP caching-critical scenarios',
    'BFF pattern: GraphQL aggregates multiple upstream REST/gRPC services into one query',
    'Both can coexist: REST for public external API, GraphQL for internal flexible clients',
  ],
  interviewFocus: [
    'When would you choose GraphQL over REST?',
    'What is the N+1 problem in GraphQL and why doesn\'t REST have it?',
    'How does the BFF pattern benefit from GraphQL?',
  ],
};

@Component({
  selector: 'app-api-graphql-vs-rest',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './graphql-vs-rest.html',
  styleUrl: './graphql-vs-rest.scss',
})
export class ApiGraphqlVsRest {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
