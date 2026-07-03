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
  {
    heading: 'Making the Choice Based on Actual Client Diversity',
    points: [
      'The strongest signal favoring GraphQL is genuine client diversity — when web, mobile, and third-party integrations have meaningfully different data needs from the same underlying resources, GraphQL\'s per-client field selection eliminates the need for multiple REST endpoint variants or client-specific BFF layers.',
      'A single-client API (one web app, no mobile app, no public API) gains much less from GraphQL\'s flexibility, since REST endpoints can simply be shaped exactly around that one client\'s needs without the overfetching/underfetching problem GraphQL specifically solves.',
      'Team GraphQL experience is a genuinely significant practical factor — a team with no GraphQL experience building their first API under a deadline will likely deliver a more reliable REST API faster, even if GraphQL would theoretically be the better architectural fit for the problem.',
      'Some organizations successfully run both — a public REST API for external/partner integrations (broad familiarity, simple caching) alongside an internal GraphQL API serving their own web/mobile clients (flexible, avoids BFF proliferation) — rather than treating the choice as strictly all-or-nothing.',
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
  { q: 'In what scenario does GraphQL provide the most significant advantage over REST?', options: ['When the API serves a single, simple resource type', 'When multiple clients (mobile, web, embedded) with different data needs query a complex, interconnected data model — GraphQL lets each client request only its specific fields', 'When simplicity of implementation is the top priority', 'When the API needs to handle high-throughput batch processing'], answer: 1, explanation: 'GraphQL shines when: multiple client types have different data requirements. A mobile app needs minimal data for bandwidth efficiency. A desktop web app needs full details. An admin dashboard needs aggregated data. With REST: the server must either return everything (overfetching) or maintain multiple endpoints per client type. With GraphQL: one endpoint, each client specifies its own field selection. Complex data graphs: REST is awkward for deeply related data (orders with customers with addresses with orders). GraphQL can traverse these relationships in a single query. Where REST is better: simple CRUD, file uploads, existing HTTP infrastructure, caching requirements, teams unfamiliar with GraphQL operational complexity.' },
  { q: 'How do Automatic Persisted Queries (APQ) recover CDN cacheability for GraphQL without giving up flexible client-side field selection?', options: ['APQ forces every client to use exactly the same fixed query, eliminating flexibility entirely', 'APQ replaces a query\'s full text with a short hash; the client first sends just the hash via GET (cacheable, short URL), and only sends the full query text (registering it server-side) the one time that hash is not yet recognized — subsequent requests for that same query, from any client, reuse the cached hash-keyed GET response', 'APQ works by converting all GraphQL queries into REST endpoints automatically', 'APQ requires disabling all client-specified field selection to enable caching'], answer: 1, explanation: 'The reason plain GraphQL resists CDN caching is that full query bodies are long, POST-based, and vary per client need — APQ solves this by having the client compute a hash of its query and send just that hash as a GET request (short, cacheable URL). If the server has seen that hash before (query already registered), it returns the cached/computed response; if not, the client sends the full query once to register it, and every subsequent request for that same hash — from any client — can now be served as a normal cacheable GET, restoring CDN-level caching while clients still author arbitrarily flexible queries.' },
  { q: 'If GraphQL already lets each client request exactly the fields it needs, why would a team still build a separate BFF per client type instead of exposing one shared GraphQL endpoint to all clients?', options: ['A single shared GraphQL schema can never technically serve multiple client types', 'Field selection solves DATA-SHAPE flexibility, but a shared schema still couples every client to the same authentication requirements, rate limits, and business-logic constraints baked into one schema — a per-client BFF (even a GraphQL one) lets teams apply client-specific auth flows, aggregation logic, or security policies that a single shared schema cannot cleanly express for all clients at once', 'GraphQL performance degrades below a certain client count, forcing a per-client split', 'BFF and GraphQL are mutually exclusive architectural choices that cannot be combined', 'None of the above'], answer: 1, explanation: 'Flexible field selection solves "which fields does this client need" — it does not solve "this client type needs a different auth flow" (a public partner API vs an internal mobile app), or "this client needs aggregation logic unique to its use case that shouldn\'t leak into the schema every other client sees." Some teams DO successfully serve all clients from one shared GraphQL schema (this works when clients have similar-enough auth and data needs), but others deliberately run a separate GraphQL BFF per client type specifically to isolate client-specific policies and aggregation logic that a single shared schema would otherwise have to awkwardly accommodate for everyone.' },
  { q: 'How does gRPC compare to both REST and GraphQL for service-to-service communication?', options: ['gRPC is only suitable for mobile applications; REST and GraphQL are for web services', 'gRPC uses Protocol Buffers for binary serialization and HTTP/2 multiplexing, making it significantly more efficient than REST or GraphQL for internal service-to-service high-throughput communication', 'gRPC and REST are identical in terms of protocol; the only difference is the tooling', 'GraphQL is always preferred over gRPC because it offers more flexibility'], answer: 1, explanation: 'gRPC vs REST vs GraphQL: serialization: gRPC uses Protocol Buffers (binary, compact, fast to parse). REST and GraphQL use JSON (human-readable but slower). Transport: gRPC uses HTTP/2 (multiplexing, header compression, streaming). REST typically HTTP/1.1. Code generation: gRPC generates type-safe client and server stubs from .proto definitions. No runtime type checking needed. Schema definition: gRPC uses .proto files (strongly typed). GraphQL uses SDL. REST uses OpenAPI (optional). Streaming: gRPC supports bidirectional streaming natively. GraphQL subscriptions do this. REST requires WebSockets for streaming. Use cases: gRPC is ideal for internal microservice communication (20-30% lower latency, smaller payloads, type safety). REST and GraphQL for external-facing APIs where browser support and developer experience matter more.' },
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
  { q: 'When should a team choose REST over GraphQL?', a: 'Choose REST over GraphQL when: simple CRUD operations: the API performs standard create/read/update/delete on individual resources with no complex relationships. A todo list API does not benefit from GraphQL. Caching is critical: REST GET endpoints are cacheable by browsers, CDNs, and proxies. Public-facing high-traffic read APIs benefit enormously from CDN caching. Team familiarity: the team has no GraphQL experience and the project timeline is tight. REST has broader documentation, tutorials, and framework support. Third-party integration: external consumers expect REST. Many integration tools (Zapier, webhooks) assume REST. File uploads: GraphQL file uploads are non-standard (multipart form data workarounds). REST POST with multipart is native HTTP. Simple versioning: REST URL versioning (/v1/, /v2/) is simpler to route and document for teams that need explicit version separation. Small monolithic APIs: the overhead of a GraphQL schema and resolver layer is not justified for a single-team monolith serving one client.' },
  { q: 'What are the operational complexity differences between GraphQL and REST in production?', a: 'GraphQL operational complexity: monitoring: REST monitoring logs HTTP status codes per endpoint. GraphQL always returns 200; you must parse the response body to detect errors. Use Apollo Studio or custom logging to capture operation names and errors. Performance monitoring: REST has clear endpoint-level metrics. GraphQL operations vary in complexity; you need operation-level tracking (which operations are slow, which have high complexity). Security: GraphQL introspection, arbitrary query depth, and complexity must all be managed. REST endpoints are individually secured. Debugging: GraphQL errors include path information (which field failed in which nested resolver). Better than REST for locating the failing component. Tooling investment: GraphQL requires schema management, persisted query infrastructure, DataLoaders for N+1 prevention, and schema registry. REST has simpler tooling. REST is easier to operate for teams without dedicated platform/infrastructure support.' },
  { q: 'How does pagination differ between GraphQL and REST?', a: 'REST pagination: offset-based: GET /users?page=2&limit=20. Simple but has issues with data insertion between pages. Cursor-based: GET /users?cursor=abc123&limit=20. Stable with data changes. Link headers: RFC 5988 Link header with next, prev, first, last relations. GraphQL Connection pattern (Relay specification): standardized cursor-based pagination using nodes, edges, and pageInfo. query { users(first: 20, after: cursor) { edges { node { id name } cursor } pageInfo { hasNextPage endCursor } } }. The Connection pattern is the de facto standard for GraphQL. Benefits: consistent pagination across all GraphQL APIs using the Relay spec. Cursor encodes sort state so pagination is stable even with concurrent data changes. Alternative: simple offset (first/skip or limit/offset) for simpler needs without the full Connection complexity.' },
  { q: 'What are the tradeoffs of using GraphQL federation vs REST microservices?', a: 'GraphQL federation advantages: single graph for consumers. Frontend queries traverse service boundaries transparently. Schema composition is declarative (subgraph annotations). Type sharing and extension across services. One endpoint for all data, which simplifies frontend development. GraphQL federation challenges: the Apollo Router or gateway is a critical dependency. Schema changes must be backward compatible or coordinated. Debugging spans multiple subgraph services. The composition step can fail if subgraph schemas are incompatible. Subgraph owners must understand the federation spec. REST microservices advantages: each service is independently versioned. Standard HTTP tools work everywhere. No schema registry or gateway required for service-to-service calls. Simpler for teams without GraphQL expertise. REST microservices challenges: API aggregation on the frontend (multiple requests). BFF layer needed to avoid frontend making 5 REST calls per page. No built-in type composition across services. Recommendation: federation for complex data graphs serving multiple clients. REST for simpler domain boundaries and when operational simplicity is the priority.' },
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
