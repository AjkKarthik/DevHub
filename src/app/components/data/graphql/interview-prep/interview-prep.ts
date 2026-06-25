import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface IpItem {
  q: string;
  a: string;
  difficulty: 'junior' | 'mid' | 'senior';
  code?: string;
}

@Component({
  selector: 'app-gql-interview-prep',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss'
})
export class GqlInterviewPrep {
  activeDiff = signal<'all' | 'junior' | 'mid' | 'senior'>('all');
  search = signal('');
  expandedSet = signal<Set<string>>(new Set());

  expanded() { return this.expandedSet(); }

  toggle(q: string) {
    const s = new Set(this.expandedSet());
    s.has(q) ? s.delete(q) : s.add(q);
    this.expandedSet.set(s);
  }

  private allItems: IpItem[] = [
    { difficulty: 'junior', q: 'What is GraphQL and how does it differ from REST?', a: 'GraphQL is a query language and runtime for APIs that lets clients request exactly the data they need. Unlike REST, which has fixed endpoints returning fixed shapes, a GraphQL API has one endpoint and clients specify the exact fields and nested relations they want. This eliminates over-fetching (too much data) and under-fetching (too many round-trips).' },
    { difficulty: 'junior', q: 'What are the three root operation types in GraphQL?', a: 'Query (read — fetches data without side effects), Mutation (write — creates, updates, or deletes data with side effects), and Subscription (real-time — maintains a long-lived connection for server-push updates, typically over WebSocket).' },
    { difficulty: 'junior', q: 'What is the difference between ! and [] in a GraphQL type?', a: '! (non-null) means the field will never return null — if the resolver throws, the error propagates up to the nearest nullable parent. [] (list) wraps the type in an array. [Post!]! means the list itself is non-null and every item in the list is non-null.' },
    { difficulty: 'junior', q: 'What is an input type and why can\'t you use a regular type as an argument?', a: 'Input types (declared with `input` keyword) are write-only shapes used exclusively as field arguments. Regular `type` declarations are output-only and cannot appear as arguments. This separation enforces a clear boundary between what clients send (input) and what servers return (output). Input types can only contain scalars, enums, and other input types.' },
    { difficulty: 'junior', q: 'What is a GraphQL fragment and when would you use it?', a: 'A fragment defines a reusable selection set: `fragment UserFields on User { id name email }`. You spread it into queries with `...UserFields`. Use fragments to avoid repeating the same field selections across multiple queries, keeping code DRY. Inline fragments (`... on Post { title }`) are used for type-specific fields on interfaces or unions.' },
    { difficulty: 'junior', q: 'What does __typename return?', a: '__typename is a built-in meta-field available on every object type. It returns the string name of the runtime type (e.g., "Post", "User"). It is required in union/interface queries so clients can discriminate between types at runtime without additional lookups.' },
    { difficulty: 'junior', q: 'What is the purpose of GraphQL variables?', a: 'Variables decouple dynamic values from the query string. Instead of interpolating user input into the query (injection risk, caching broken), you declare typed variables in the operation signature and pass values as a separate JSON object. This enables safe parameterization, query caching (query string stays constant), and prevents injection attacks.' },
    { difficulty: 'mid', q: 'Explain the N+1 problem in GraphQL and how DataLoader solves it.', a: 'The N+1 problem occurs when a list query triggers N additional queries for each item\'s relations. For example: 1 query for 100 posts, then 100 queries for each post\'s author = 101 queries. DataLoader batches all `load(authorId)` calls made within one event loop tick into a single `WHERE id IN (...)` query, then matches results back by position. It also caches within a request, so repeated loads of the same key are instant.', code: '// N+1: Post.author called 100 times, 100 DB queries\nPost: { author: (post, _, { db }) => db.users.findById(post.authorId) }\n// Fixed:\nPost: { author: (post, _, { loaders }) => loaders.user.load(post.authorId) }' },
    { difficulty: 'mid', q: 'How do you implement authentication in a GraphQL server?', a: 'Verify the JWT/token once in the context function and attach the user to context. Resolvers check `context.user` — throw UNAUTHENTICATED (no user) or FORBIDDEN (wrong role). Catch JWT errors silently in context (don\'t throw) so public fields still resolve. Alternatives: @auth schema directive (declarative) or graphql-shield (composable rule-based permissions).', code: 'context: async ({ req }) => {\n  const token = req.headers.authorization?.slice(7);\n  let user = null;\n  try { user = jwt.verify(token, SECRET); } catch {}\n  return { user, db: prisma };\n}' },
    { difficulty: 'mid', q: 'What is the difference between a GraphQL error and a user error in a mutation?', a: 'GraphQL errors (throw GraphQLError) are unexpected system failures — auth failures, server errors, invalid queries. They appear in the top-level `errors` array and abort field execution. User errors are domain-level validation failures returned inside the mutation payload data: `{ post: null, errors: [{ field: "title", message: "Too short" }] }`. The mutation "succeeds" (HTTP 200, data present) but signals a domain problem the client should display.' },
    { difficulty: 'mid', q: 'What is the Relay Connection specification?', a: 'A community standard for cursor-based pagination. A Connection type has `edges: [Edge!]!` and `pageInfo: PageInfo!`. Each Edge has `node: T!` and `cursor: String!`. PageInfo has `hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`. Clients paginate with `first: Int, after: String` (forward) or `last: Int, before: String` (backward). Apollo Client\'s relayStylePagination() field policy supports this spec natively.' },
    { difficulty: 'mid', q: 'How does Apollo Client InMemoryCache normalization work?', a: 'Apollo extracts every object from every query response and stores them in a flat lookup table keyed by `__typename + id` (e.g., `User:1`). When multiple queries return the same object, they share one cache entry. Updating the entry from one mutation automatically updates all components reading that object — without any manual wiring.' },
    { difficulty: 'mid', q: 'What are the different fetchPolicy options in Apollo Client?', a: '`cache-first` (default): return cached data; only network on miss. `network-only`: always fetch, write to cache. `cache-and-network`: return cached immediately + background fetch to update. `no-cache`: always fetch, never read/write cache. Use cache-and-network for fast first paint + fresh data; no-cache for sensitive data like OTPs.' },
    { difficulty: 'mid', q: 'How do GraphQL subscriptions work?', a: 'Subscriptions maintain a persistent WebSocket connection. A mutation publishes an event via `pubsub.publish("TOPIC", payload)`. The subscription resolver\'s `subscribe` function returns an async iterator (`pubsub.asyncIterator("TOPIC")`). The graphql-ws library handles the WebSocket protocol. Use `withFilter` to route events only to subscribers matching the operation\'s variables. Use Redis Pub/Sub (not in-memory PubSub) in multi-instance production deployments.' },
    { difficulty: 'mid', q: 'What is the @key directive in Apollo Federation?', a: '@key marks the field(s) that uniquely identify an entity across subgraphs: `type User @key(fields: "id") { id: ID! }`. It enables cross-subgraph entity references. A subgraph that extends an entity declares it with @key and implements `__resolveReference(ref, context)` — called by the Router when it needs to fetch that entity by its key from this subgraph.' },
    { difficulty: 'senior', q: 'How would you design a GraphQL API for a multi-tenant SaaS with complex authorization?', a: 'Layer auth at three levels: (1) Context: verify JWT, attach user + tenantId. (2) Schema directives or graphql-shield: field-level RBAC. (3) Resolver-level: row-level security checks (post.tenantId === context.tenantId). Use graphql-shield rules composing isAuthenticated, isSameTenant, and isAdmin with caching: "contextual" so per-request rules run once. Disable introspection in production. Add DataLoaders per-tenant to prevent cross-tenant data contamination.' },
    { difficulty: 'senior', q: 'How do you protect a GraphQL API against abuse and DoS attacks?', a: 'Multiple layers: depth limiting (`depthLimit(7)`) prevents exponential nesting. Query complexity analysis assigns field costs and rejects expensive queries. Persisted queries (APQ or full allowlist) prevent arbitrary query injection. Rate limiting by user ID (not IP — bypassed by NAT). Disable introspection in production. Disable field suggestions. Limit subscription connections per user. Consider @cacheControl directives for CDN response caching.' },
    { difficulty: 'senior', q: 'Explain the Apollo Federation query planning process.', a: 'The Apollo Router receives a client query and uses the composed supergraph schema to build a query plan. The plan is a directed acyclic graph of fetch operations across subgraphs. @requires creates a sequential dependency — the Router fetches prerequisite fields from one subgraph before fetching dependent fields from another. Independent subgraph fetches run in parallel. The Router merges all results into the final response using the supergraph schema as the template.' },
    { difficulty: 'senior', q: 'How do you implement end-to-end type safety in a GraphQL project?', a: 'Server: declare types in SDL (schema-first) → run GraphQL Code Generator with typescript-resolvers + mappers to get typed resolver maps where parent args match your DB models. Client: use codegen client-preset with the typed graphql() tag instead of gql from @apollo/client — useQuery then knows the exact result shape. Run codegen before tsc in CI. Add codegen --watch in development. Result: schema changes that break resolvers or client queries are compile-time errors.' },
    { difficulty: 'senior', q: 'How would you migrate from a monolithic GraphQL API to a federated graph?', a: 'Incremental migration with zero downtime: (1) Start: the monolith becomes the first subgraph. (2) Extract domains: create a new subgraph (e.g., Users). Use @override to migrate ownership of User type fields from the monolith to the Users subgraph gradually. The Router serves both versions during the transition. (3) Once the monolith no longer owns User fields, remove the @override. (4) Repeat for each domain. rover validates composition at each step.' },
    { difficulty: 'senior', q: 'What are the trade-offs between schema-first and code-first GraphQL?', a: 'Schema-first: write SDL manually, implement resolvers to match. Pros: SDL is the source of truth, explicit, easy to review and share, language-agnostic, integrates well with codegen. Cons: SDL and resolvers can drift. Code-first (TypeGraphQL, Nexus): TypeScript defines types and the SDL is generated. Pros: single source of truth in code, less boilerplate for large schemas, type-safe by construction. Cons: generated SDL can be harder to review, framework lock-in, harder to optimize SDL structure.' },
  ];

  filtered() {
    return this.allItems.filter(item => {
      const diffOk = this.activeDiff() === 'all' || item.difficulty === this.activeDiff();
      const q = this.search().toLowerCase();
      const searchOk = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return diffOk && searchOk;
    });
  }
}
