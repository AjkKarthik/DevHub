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
  { name: 'Query',        type: 'keyword', desc: 'Read-only data fetch — specifies exactly which fields to return.' },
  { name: 'Mutation',     type: 'keyword', desc: 'Write operation — create, update, or delete data and return results.' },
  { name: 'Subscription', type: 'keyword', desc: 'Real-time event stream — server pushes updates when data changes (WebSocket).' },
  { name: 'Resolver',     type: 'keyword', desc: 'Function that fetches the data for a specific field in the schema.' },
  { name: 'N+1 Problem',  type: 'keyword', desc: 'Naive resolvers issue one DB query per object in a list — DataLoader batches them.' },
  { name: 'DataLoader',   type: 'keyword', desc: 'Batch and cache resolver calls within a single request to eliminate N+1 queries.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'GraphQL Core Concepts',
    points: [
      'GraphQL is a query language for APIs and a runtime for executing queries. Defined by a strongly typed schema (SDL — Schema Definition Language).',
      'Single endpoint (POST /graphql) — the client specifies exactly what data it needs in the query body. No over-fetching (server sending more than needed) or under-fetching (needing multiple requests).',
      'Three operation types: Query (read), Mutation (write), Subscription (real-time stream via WebSocket).',
      'The schema is the contract — it defines types, queries, mutations, and subscriptions. Both client and server teams work from the schema.',
    ],
  },
  {
    heading: 'Schema Definition Language (SDL)',
    points: [
      'SDL defines the type system: `type User { id: ID! email: String! orders: [Order!]! }`.',
      'Scalar types: ID, String, Int, Float, Boolean. Custom scalars: DateTime, URL, JSON.',
      '`!` means non-null. `[Order!]!` means a non-null list of non-null Orders.',
      'Input types (for mutations): `input CreateUserInput { email: String! displayName: String }` — separate from output types.',
      'Interfaces and unions enable polymorphism: `union SearchResult = User | Order | Product`.',
    ],
  },
  {
    heading: 'Resolvers and Execution',
    points: [
      'Each field in the schema has a resolver function that fetches its data. If no resolver is defined, the default resolver reads the same-named property from the parent object.',
      'Execution: GraphQL parses the query, validates against the schema, then calls each field\'s resolver. Child resolvers receive the parent object as the first argument.',
      'N+1 problem: fetching a list of 100 posts and each post\'s author triggers 100 separate DB queries for authors. One per post — 100 total.',
      'DataLoader solves N+1: it batches all author lookups within one request tick into a single `SELECT WHERE id IN (...)` and caches results.',
    ],
  },
  {
    heading: 'Subscriptions',
    points: [
      'Subscriptions deliver real-time updates via WebSocket (or SSE). Clients subscribe to events; the server publishes when data changes.',
      'Pattern: mutation triggers a publish to a PubSub channel; all subscribed clients receive the update.',
      'Apollo Server: uses `PubSub` from `graphql-subscriptions`. Production: Redis PubSub for multi-instance deployments.',
      'Subscription schema: `type Subscription { orderStatusChanged(orderId: ID!): Order! }`.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Schema + Resolvers',
    language: 'typescript',
    code: `import { ApolloServer } from '@apollo/server';
import DataLoader from 'dataloader';

// Schema Definition Language
const typeDefs = \`#graphql
  type User {
    id: ID!
    email: String!
    displayName: String
    orders: [Order!]!
  }

  type Order {
    id: ID!
    total: Float!
    status: String!
    customer: User!      # resolved by resolver — not a DB join
    items: [OrderItem!]!
  }

  type OrderItem {
    id: ID!
    quantity: Int!
    product: Product!
  }

  type Product { id: ID!; name: String!; price: Float! }

  type Query {
    user(id: ID!): User
    users(limit: Int = 20): [User!]!
    order(id: ID!): Order
  }

  input CreateOrderInput {
    customerId: ID!
    items: [OrderItemInput!]!
  }
  input OrderItemInput { productId: ID!; quantity: Int! }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    cancelOrder(id: ID!): Order!
  }
\`;

// DataLoader — batch + cache user lookups within a request
const createUserLoader = () => new DataLoader<string, User>(
  async (ids) => {
    const users = await db.users.findMany({ where: { id: { in: [...ids] } } });
    return ids.map(id => users.find(u => u.id === id) ?? new Error(\`User \${id} not found\`));
  }
);

// Resolvers
const resolvers = {
  Query: {
    user: (_: unknown, { id }: { id: string }) => db.users.findById(id),
    users: (_: unknown, { limit }: { limit: number }) => db.users.findMany({ take: limit }),
    order: (_: unknown, { id }: { id: string }) => db.orders.findById(id),
  },

  Order: {
    // customer resolver — called for each order in a list
    // WITHOUT DataLoader: 100 orders = 100 SELECT FROM users
    // WITH DataLoader: 100 orders = 1 SELECT FROM users WHERE id IN (...)
    customer: (order: Order, _: unknown, ctx: { userLoader: ReturnType<typeof createUserLoader> }) =>
      ctx.userLoader.load(order.customerId),
    items: (order: Order) => db.orderItems.findMany({ where: { orderId: order.id } }),
  },

  Mutation: {
    createOrder: (_: unknown, { input }: { input: CreateOrderInput }) =>
      db.orders.create(input),
    cancelOrder: (_: unknown, { id }: { id: string }) =>
      db.orders.update(id, { status: 'cancelled' }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });`,
  },
  {
    label: 'Client Queries',
    language: 'typescript',
    code: `// GraphQL client queries — client specifies exactly what it needs

// Query — only request what you need (no over-fetching)
const GET_USER = \`
  query GetUser(\$id: ID!) {
    user(id: \$id) {
      id
      email
      displayName
      orders {
        id
        status
        total
        # Note: NOT requesting items here — saves a DB query
      }
    }
  }
\`;

// Mutation with input variable
const CREATE_ORDER = \`
  mutation CreateOrder(\$input: CreateOrderInput!) {
    createOrder(input: \$input) {
      id
      status
      total
      customer { email }
    }
  }
\`;

// Subscription (WebSocket)
const ORDER_STATUS = \`
  subscription OnOrderStatusChanged(\$orderId: ID!) {
    orderStatusChanged(orderId: \$orderId) {
      id
      status
      updatedAt
    }
  }
\`;

// Fetch API call
async function fetchUser(id: string) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
    body: JSON.stringify({
      query: GET_USER,
      variables: { id },
    }),
  });
  const { data, errors } = await response.json();
  if (errors) throw new Error(errors[0].message);
  return data.user;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not using DataLoader — causing N+1 queries',
    wrong: `// Order resolver fetches customer per order — 100 orders = 100 DB calls
Order: {
  customer: (order) => db.users.findById(order.customerId) // N+1!
}`,
    right: `// DataLoader batches all lookups in one request tick
Order: {
  customer: (order, _, ctx) => ctx.userLoader.load(order.customerId)
}
// userLoader batches: SELECT * FROM users WHERE id IN (id1, id2, ..., id100)`,
    explanation: 'Without DataLoader, fetching N orders triggers N separate user queries. DataLoader defers all .load() calls until the end of the current tick, then issues one batched query for all IDs. Always create DataLoader instances per-request (in context) — never singleton, as that caches across requests.',
  },
  {
    title: 'Allowing unbounded query depth — DoS via deeply nested queries',
    wrong: `// No depth limit — attacker sends query 100 levels deep
{ user { orders { customer { orders { customer { orders { ... } } } } } } }`,
    right: `import depthLimit from 'graphql-depth-limit';
const server = new ApolloServer({
  validationRules: [depthLimit(5)], // reject queries deeper than 5
});`,
    explanation: 'GraphQL\'s flexible querying is a DoS surface — a deeply nested query can cause exponential resolver execution. Apply depth limiting (graphql-depth-limit), complexity scoring (graphql-query-complexity), or persisted queries to prevent abuse.',
  },
  {
    title: 'Returning null instead of an error for failed fields',
    wrong: `Query: {
  user: (_, { id }) => db.users.findById(id) // returns null if not found
  // Client gets { data: { user: null } } — looks like success`,
    right: `Query: {
  user: async (_, { id }) => {
    const user = await db.users.findById(id);
    if (!user) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    return user; // field is User! (non-null) so null would error anyway
  }
}`,
    explanation: 'Returning null for a non-null field (User!) causes a GraphQL execution error that bubbles up. For nullable fields, explicit errors with error codes are more useful to clients than null — clients can distinguish "not found" from "permission denied" from "server error".',
  },
  {
    title: 'Creating DataLoader as a singleton across requests',
    wrong: `// Singleton userLoader — shares cache across ALL requests!
const userLoader = new DataLoader(batchFn); // WRONG: leaks data between users`,
    right: `// Create a new DataLoader per request in context
const server = new ApolloServer({
  context: () => ({
    userLoader: new DataLoader(batchFn), // fresh per request
  }),
});`,
    explanation: 'DataLoader caches results for the lifetime of the instance. A singleton DataLoader shares the cache across all requests — user A\'s data could be served to user B. Always create DataLoader instances inside the request context function so each request gets its own isolated cache.',
  },
];

const challenge: Challenge = {
  title: 'N+1 Query Detector',
  language: 'typescript',
  description: `Simulate the N+1 problem. Given orders: {id: string, customerId: string}[], implement:
1. naiveFetch(orders): number — returns the total DB calls made (1 per order for customer + 1 for the list = N+1)
2. dataLoaderFetch(orders): number — returns the total DB calls made using batching (1 for list + 1 batch for all customers = 2)`,
  hints: [
    'naiveFetch: 1 call for the order list + 1 per order for customer = orders.length + 1',
    'dataLoaderFetch: 1 call for the list + 1 batched call for all unique customerIds = 2',
  ],
  starterCode: `function naiveFetch(orders: {id: string, customerId: string}[]): number {
  // TODO: return total DB calls with naive approach
  return 0;
}

function dataLoaderFetch(orders: {id: string, customerId: string}[]): number {
  // TODO: return total DB calls with DataLoader batching
  return 0;
}`,
  solution: `function naiveFetch(orders: {id: string, customerId: string}[]): number {
  // 1 call for the orders list + 1 call per order to fetch its customer
  return 1 + orders.length;
}

function dataLoaderFetch(orders: {id: string, customerId: string}[]): number {
  // 1 call for the orders list + 1 batched call for all unique customer IDs
  return 2; // regardless of N — DataLoader batches into one query
}

const orders = [
  { id: '1', customerId: 'c1' },
  { id: '2', customerId: 'c2' },
  { id: '3', customerId: 'c1' }, // same customer — DataLoader also caches
];
console.log('Naive:', naiveFetch(orders));       // 4 (1 + 3)
console.log('DataLoader:', dataLoaderFetch(orders)); // 2`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the N+1 problem in GraphQL and what is the standard solution?',
    options: [
      'Returning N+1 fields per query — solved by schema depth limiting',
      'Fetching a list of N items then making N separate DB calls for each item\'s related data — solved by DataLoader batching',
      'GraphQL version N+1 introduced a breaking schema change — solved by versioning',
      'N+1 concurrent subscription connections — solved by connection pooling',
    ],
    answer: 1,
    explanation: 'The N+1 problem: fetching 100 orders and each order\'s customer triggers 100 separate DB queries (one per order). DataLoader batches all customer lookups that occur within a single request tick into one query: SELECT * FROM users WHERE id IN (...100 IDs). DataLoader also caches results — if two orders have the same customer, only one DB call is made.',
  },
  {
    q: 'Why should DataLoader instances be created per-request, not as singletons?',
    options: [
      'DataLoader is not thread-safe and crashes under concurrent requests',
      'The singleton DataLoader cache persists between requests — user A\'s data could be served to user B',
      'DataLoader batching only works within a single event loop tick of one request',
      'Creating DataLoader per-request improves batching efficiency',
    ],
    answer: 1,
    explanation: 'DataLoader\'s in-memory cache persists for the lifetime of the instance. A singleton DataLoader shares that cache across ALL requests — cached data from request A can be returned to request B, potentially leaking sensitive user data across sessions. Always create DataLoader instances inside the request context so each request gets its own isolated, short-lived cache.',
  },
  { q: 'What is the N+1 query problem in GraphQL and how do DataLoaders solve it?', options: ['When N clients send N+1 requests to the GraphQL server simultaneously', 'When fetching a list of N items causes N additional database queries (one per item) to load related data; DataLoaders batch and deduplicate these into a single query', 'When a GraphQL query nests N+1 levels deep causing stack overflow', 'When GraphQL resolvers run N+1 times due to redundant field selections'], answer: 1, explanation: 'N+1 problem: a query returns 10 orders. For each order, the resolver fetches the customer separately: 10 customer queries = N+1 total (1 for orders + 10 for customers). DataLoader solution: instead of fetching immediately, the customer resolver registers a request. At the end of the tick, DataLoader batches all pending customer IDs into one query: SELECT * FROM customers WHERE id IN (1, 2, ... 10). DataLoader also deduplicates: if two orders have the same customer, only one query is made. This reduces N+1 to 2 queries total. DataLoader is a per-request cache+batcher — create a new instance per request to prevent data leaking between users.' },
  { q: 'What is schema stitching vs schema federation in GraphQL?', options: ['Schema stitching is client-side; schema federation is server-side', 'Schema stitching manually merges multiple GraphQL schemas into one gateway schema; Apollo Federation uses declarative ownership annotations to compose schemas without manual merging', 'Both approaches produce identical architectures; the choice is purely aesthetic', 'Schema federation requires separate GraphQL servers; schema stitching works with a single server'], answer: 1, explanation: 'Schema stitching (older approach): the gateway fetches schemas from multiple GraphQL services and manually merges them. Requires manual type merger configuration. Breaks easily when remote schemas change. Difficult to scale. Apollo Federation: each subgraph service owns specific types and annotates them with @key, @extends, @external. The Apollo Router/Gateway automatically composes the subgraph schemas. A query that spans multiple subgraphs is split and dispatched automatically. Subgraphs can extend each other types. Federation is the recommended approach for distributed GraphQL in production. Apollo Federation v2 adds shareable types and improved entity federation.' },
  { q: 'What is a GraphQL subscription and what transport protocols does it use?', options: ['A subscription is a long-running REST endpoint that streams updates', 'A subscription is a real-time GraphQL operation where the server pushes updates to the client when data changes; typically transported via WebSockets or Server-Sent Events', 'A subscription is a batch query that runs on a schedule', 'A subscription is a persistent HTTP connection using long polling'], answer: 1, explanation: 'GraphQL Subscriptions: a third operation type alongside query (read) and mutation (write). The client sends a subscription operation. The server maintains a persistent connection. When the subscribed event occurs (data changes, event fires), the server pushes the updated data to all subscribed clients. Transport protocols: WebSocket (most common, bidirectional, graphql-ws protocol). Server-Sent Events (SSE, HTTP-based, one-directional, simpler for some setups). GraphQL over SSE spec. Use cases: live chat messages, stock price updates, order status changes, collaborative editing. Subscriptions require stateful connections — the server must maintain connection state, which complicates horizontal scaling (use Redis pub/sub or sticky sessions).' },
  { q: 'What is persisted queries in GraphQL and what are the security and performance benefits?', options: ['Storing GraphQL queries in a database for audit logging', 'Registering queries with a hash on the server in advance; clients send only the hash, reducing payload size and preventing arbitrary query execution', 'Caching GraphQL query results using a CDN for performance', 'Persisting GraphQL queries as REST endpoints for backward compatibility'], answer: 1, explanation: 'Persisted queries (automatic persisted queries, APQ): the client sends only a hash of the query (SHA-256). The server looks up the full query body from its store. If not found, the client sends the full query for caching. Security benefits: clients cannot send arbitrary GraphQL queries in production. Only pre-registered queries are allowed. Prevents introspection, overfetching, and abusive queries from anonymous users. Performance benefits: smaller network payload (hash vs full query text). CDN caching: GET requests with hashes are cacheable. The full query is only sent once and cached forever. Implementation: Apollo APQ works with any transport. Relay uses stored query IDs. Enterprise: for internal APIs, use allowlisted queries only and disable all ad-hoc querying.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use GraphQL subscriptions vs WebSockets directly?',
    a: 'Use <strong>GraphQL subscriptions</strong> when you\'re already using GraphQL and want real-time updates to follow the same schema contract, type safety, and tooling (Apollo Client auto-updates cache). The subscription event type, payload, and filtering (variables) are all defined in the schema. Use <strong>WebSockets directly</strong> when you need very high-frequency messages (multiplayer games, live telemetry), fine-grained protocol control, or you\'re not using GraphQL for your API. For a mixed REST+real-time app, Server-Sent Events (SSE) is often simpler than setting up WebSocket infrastructure for read-only push.',
  },
  {
    q: 'How do you protect a GraphQL API from abuse?',
    a: 'Four layers of protection: <ol><li><strong>Depth limiting</strong> (<code>graphql-depth-limit</code>): reject queries nested more than N levels deep</li><li><strong>Complexity scoring</strong> (<code>graphql-query-complexity</code>): assign cost to each field; reject queries above a threshold</li><li><strong>Rate limiting</strong>: per-IP or per-API-key request limits (same as REST)</li><li><strong>Persisted queries</strong>: clients pre-register queries; only registered query hashes are accepted in production — attackers cannot send arbitrary queries</li></ol>Persisted queries are the strongest protection: the server only executes a fixed set of known queries, eliminating the entire arbitrary query attack surface.',
  },
  { q: 'How do you implement authentication and authorization in GraphQL?', a: 'GraphQL authentication: typically handled outside GraphQL, at the HTTP transport layer. The Authorization header is parsed before the GraphQL request is processed. The user identity is attached to the GraphQL context and available to all resolvers. Authorization in GraphQL: two common approaches: resolver-level authorization: each resolver checks if the current user has permission to access the field. Flexible but verbose. Schema-level authorization directives: @auth(requires: ADMIN) on field or type definitions. Centralized but requires a custom directive implementation. Libraries: graphql-shield (permission rule middleware). What to avoid: do not rely on hiding fields from the schema for authorization (clients can still guess field names). Always perform authorization checks in resolvers even if fields are not in the schema for some roles. Field-level errors: a resolver that returns null for unauthorized access should throw a GraphQL error with code FORBIDDEN, not silently return null.' },
  { q: 'What is GraphQL introspection and when should you disable it?', a: 'Introspection: GraphQL allows clients to query the schema itself using __schema and __type queries. This provides a complete map of all types, fields, and operations available. Useful in development: powers IDE autocompletion (GraphiQL, Apollo Sandbox). Enables automatic client SDK generation. Allows schema documentation. When to disable in production: if your API is public-facing and the schema is not already public, introspection reveals the full attack surface to potential attackers. They can discover all available types, fields, and mutations. Alternatives to full disable: disable introspection for unauthenticated requests. Use persisted queries (only registered queries allowed, introspection becomes irrelevant). Rate limit introspection queries. For internal or documented public APIs: introspection can remain enabled since the schema is already intended to be public. The security model depends on whether the schema is considered sensitive information.' },
  { q: 'What is query depth limiting and query complexity analysis in GraphQL?', a: 'Query depth limiting: prevents deeply nested queries that could cause excessive database joins. A query nesting 10 levels of relationships could trigger exponential data fetching. Limit: max depth of 5-7 levels for most APIs. Return a GraphQL error if the query exceeds the limit. Query complexity analysis: assigns a complexity score to each field and operation. Simple fields (id, name): complexity 1. Relationship fields (user.orders): complexity 5. Paginated collections: complexity multiplied by the max count. The total query complexity is calculated before execution. If it exceeds the threshold (e.g., 1000), reject the query. Libraries: graphql-depth-limit (depth). graphql-query-complexity (complexity scoring). apollo-server has built-in validation rules for depth limiting. Importance: without these guards, a single abusive query can DOS the GraphQL API by triggering a massive amount of data fetching.' },
  { q: 'How does GraphQL error handling differ from REST error handling?', a: 'GraphQL always returns HTTP 200: unlike REST where 400/404/500 codes indicate errors, GraphQL responses always use HTTP 200 (unless there is an HTTP-level error before the GraphQL layer). Errors are in the response body alongside data: { data: { user: null }, errors: [{ message: User not found, locations: [...], path: [user], extensions: { code: NOT_FOUND } }] }. Partial success: a GraphQL response can have both data and errors. Some fields resolved successfully while others failed. This is normal and expected behavior. Error extensions: the extensions field provides machine-readable error metadata (code, timestamp, correlationId). REST equivalent: the code in extensions maps to the error code in a REST error body. Error vs exception: GraphQL errors in the errors array are expected (not found, validation failed). Unhandled exceptions produce a generic Internal Server Error by default (stack traces are hidden from production responses using maskErrors).' },
];

const revision: RevisionSummary = {
  oneLiner: 'GraphQL uses a typed SDL schema with Query/Mutation/Subscription; resolvers fetch each field; DataLoader batches N+1 queries; depth limiting prevents DoS.',
  mustKnow: [
    'Single endpoint POST /graphql — client specifies exact fields (no over/under-fetching)',
    'SDL schema: type, Query, Mutation, Subscription; ! = non-null, [] = list',
    'Resolvers: functions that return data for each field; child gets parent as arg',
    'N+1 problem: naive resolvers trigger N DB calls; DataLoader batches into one',
    'DataLoader must be created per-request (in context) — never singleton (cache leak risk)',
    'Depth limiting + complexity scoring prevent DoS from deeply nested queries',
  ],
  interviewFocus: [
    'What is the N+1 problem and how does DataLoader solve it?',
    'What is the difference between GraphQL Query, Mutation, and Subscription?',
    'How do you protect a GraphQL API from abuse (complex/deep queries)?',
  ],
};

@Component({
  selector: 'app-api-graphql-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './graphql-fundamentals.html',
  styleUrl: './graphql-fundamentals.scss',
})
export class ApiGraphqlFundamentals {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
