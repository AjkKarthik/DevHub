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
  selector: 'app-gql-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class GqlFundamentals {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'query',        desc: 'Read operation — fetch data from the server. Analogous to GET in REST.' },
    { type: 'keyword', name: 'mutation',     desc: 'Write operation — create, update, or delete data. Analogous to POST/PUT/DELETE.' },
    { type: 'keyword', name: 'subscription', desc: 'Real-time operation — server pushes updates over WebSocket when data changes.' },
    { type: 'keyword', name: 'schema',       desc: 'The contract between client and server — defines all types, queries, mutations, and subscriptions.' },
    { type: 'keyword', name: 'resolver',     desc: 'Server-side function that fulfils a field in the schema by fetching data from a source.' },
    { type: 'keyword', name: 'SDL',          desc: 'Schema Definition Language — the human-readable syntax used to write a GraphQL schema.' },
    { type: 'keyword', name: 'introspection', desc: 'GraphQL\'s built-in ability to query the schema itself — powers GraphiQL and code generation.' },
    { type: 'keyword', name: '__typename',   desc: 'Built-in meta-field on every object — returns the name of the concrete type.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is GraphQL and the Problem it Solves',
      points: [
        'GraphQL is a query language for APIs invented by Facebook (2012) and open-sourced in 2015. It is NOT a database query language — it sits between the client and data sources.',
        'Over-fetching: REST endpoints return a fixed shape — you receive fields you don\'t need, wasting bandwidth. With GraphQL the client specifies exactly which fields to return.',
        'Under-fetching: A single REST endpoint rarely has all the data a screen needs — you make N follow-up requests (N+1 problem at the HTTP level). GraphQL resolves all data in a single round-trip.',
        'GraphQL has a single endpoint (typically POST /graphql). The shape of the request body determines what is returned, not the URL.',
        'It is transport-agnostic (HTTP, WebSocket, any protocol) but HTTP is standard for queries/mutations; WebSocket is standard for subscriptions.',
      ],
    },
    {
      heading: 'The Type System',
      points: [
        'Every GraphQL API has a schema — a strongly typed contract. The schema is the source of truth for what data exists and how it can be queried.',
        'Built-in scalar types: String, Int, Float, Boolean, ID. Custom scalars (Date, JSON, URL) extend the system.',
        'Object types have named fields, each with a type. Fields can be non-null (!) or nullable (default). A field returning null when declared non-null crashes the response at that node.',
        'The three root types are Query (reads), Mutation (writes), and Subscription (real-time). Every operation must be rooted in one of these.',
        'The type system enables introspection — clients can query __schema and __type to discover the entire API contract at runtime, powering tools like GraphiQL and Apollo Studio.',
      ],
    },
    {
      heading: 'Operations and Selection Sets',
      points: [
        'A GraphQL document contains one or more operations. An operation is query, mutation, or subscription, optionally named.',
        'Each operation has a selection set: curly-brace delimited list of fields to request. Fields can be nested — request an object\'s sub-fields in the same operation.',
        'Aliases allow requesting the same field twice with different arguments: `active: users(status: ACTIVE) { id }` and `inactive: users(status: INACTIVE) { id }`.',
        'Fragments are reusable selection sets: `fragment UserFields on User { id name email }`. Use them to avoid duplicating field lists across operations.',
        'Inline fragments handle union and interface types: `... on Dog { breed }` inside a `Pet` field that returns a `Dog | Cat` union.',
      ],
    },
    {
      heading: 'GraphQL vs REST Comparison',
      points: [
        'REST uses multiple endpoints, each returning a fixed shape. GraphQL uses one endpoint where the client declares the shape it needs.',
        'REST is stateless and HTTP-native — caching with ETags and CDNs is trivial. GraphQL over POST bypasses HTTP caching by default; solutions include persisted queries.',
        'REST versioning is URL-based (/v1, /v2). GraphQL evolves by adding fields (never breaking) and deprecating old ones with @deprecated — no versioning needed.',
        'REST is simpler for simple CRUD. GraphQL shines when multiple clients (web, mobile) need different shapes from the same data — the server exposes one schema; clients query what they need.',
        'Subscriptions in REST require polling or SSE workarounds. GraphQL has a first-class subscription type over WebSocket (graphql-ws protocol).',
      ],
    },
    {
      heading: 'How a GraphQL Request Works',
      points: [
        'Client sends POST /graphql with JSON body: `{ "query": "{ user(id: 1) { name email } }", "variables": {} }`.',
        'Server parses the document, validates it against the schema (unknown fields = validation error), then executes by calling resolvers for each field.',
        'Resolvers run in a top-down tree: the root Query resolver fires first, then each selected sub-field resolver, passing the parent\'s return value down as the first argument.',
        'The response is always JSON: `{ "data": { ... }, "errors": [...] }`. Errors are per-field — a null field with an error in `errors[]` is valid (partial success).',
        'Introspection queries (`{ __schema { types { name } } }`) are handled automatically by the server — disable in production to prevent schema leakage.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'First Query',
      language: 'typescript',
      code: `// Schema (SDL)
type Query {
  user(id: ID!): User
  users: [User!]!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  published: Boolean!
}

// Client query — fetch exactly what you need
const GET_USER = \`
  query GetUser(\$id: ID!) {
    user(id: \$id) {
      name
      email
      posts {
        title
        published
      }
    }
  }
\`;

// Response shape mirrors the query exactly
// {
//   "data": {
//     "user": {
//       "name": "Alice",
//       "email": "alice@example.com",
//       "posts": [
//         { "title": "Hello World", "published": true }
//       ]
//     }
//   }
// }`,
    },
    {
      label: 'Mutation & Subscription',
      language: 'typescript',
      code: `// Mutation — create a post
const CREATE_POST = \`
  mutation CreatePost(\$input: CreatePostInput!) {
    createPost(input: \$input) {
      id
      title
      published
    }
  }
\`;

// Variables passed separately (never string-interpolated)
const variables = {
  input: { title: 'GraphQL Rocks', authorId: '1' }
};

// Subscription — real-time notifications
const POST_PUBLISHED = \`
  subscription OnPostPublished {
    postPublished {
      id
      title
      author {
        name
      }
    }
  }
\`;
// Delivered over WebSocket — server pushes each time a post is published`,
    },
    {
      label: 'Introspection',
      language: 'typescript',
      code: `// Query the schema itself
const INTROSPECT = \`
  {
    __schema {
      queryType { name }
      types {
        name
        kind
        fields {
          name
          type { name kind ofType { name kind } }
        }
      }
    }
  }
\`;

// Get a specific type
const TYPE_INFO = \`
  {
    __type(name: "User") {
      name
      fields {
        name
        type {
          name
          kind
          ofType { name }
        }
        isDeprecated
        deprecationReason
      }
    }
  }
\`;

// Disable introspection in production!
// Apollo Server 4:
// ApolloServer({ schema, introspection: process.env.NODE_ENV !== 'production' })`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sending query as a GET request without persisted queries',
      wrong: `fetch('/graphql?query={ user(id: 1) { name } }')`,
      right: `fetch('/graphql', { method: 'POST', body: JSON.stringify({ query, variables }) })`,
      explanation: 'GraphQL over GET works but exposes the full query in URLs (logs, caches). Use POST for standard requests or implement persisted queries for CDN-cacheable GET requests.',
    },
    {
      title: 'String-interpolating variables into query documents',
      wrong: `const query = \`{ user(id: \${userId}) { name } }\``,
      right: `const query = \`query(\$id: ID!) { user(id: \$id) { name } }\`;\nfetch('/graphql', { body: JSON.stringify({ query, variables: { id: userId } }) })`,
      explanation: 'String interpolation is a GraphQL injection vector — identical to SQL injection. Always pass variables separately in the variables object; the server handles safe substitution.',
    },
    {
      title: 'Leaving introspection enabled in production',
      wrong: `new ApolloServer({ schema })  // introspection on by default`,
      right: `new ApolloServer({ schema, introspection: process.env.NODE_ENV !== 'production' })`,
      explanation: 'Introspection exposes your entire schema to any caller — field names, types, relationships. Attackers use it to discover attack surfaces. Disable in production.',
    },
    {
      title: 'Treating GraphQL errors like HTTP errors',
      wrong: `if (!response.ok) throw new Error('Request failed');`,
      right: `const { data, errors } = await response.json();\nif (errors?.length) handleGraphQLErrors(errors);`,
      explanation: 'GraphQL always returns HTTP 200 (even on errors). The `errors` array in the JSON body contains field-level errors. HTTP non-200 indicates a network/server failure, not a GraphQL error.',
    },
    {
      title: 'Not using fragments for shared selection sets',
      wrong: `query A { user { id name email avatar } }\nquery B { viewer { id name email avatar } }`,
      right: `fragment UserCore on User { id name email avatar }\nquery A { user { ...UserCore } }\nquery B { viewer { ...UserCore } }`,
      explanation: 'Duplicated field lists drift apart as the schema evolves — a field added to one query is missed in the other. Fragments are the DRY principle for GraphQL selection sets.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a GraphQL Schema for a Blog',
    language: 'typescript',
    description: `Define a GraphQL schema (SDL) for a simple blog. It must include:
- A Post type with id, title, body, published (Boolean), and author
- A User type with id, name, and posts
- A Query type with: post(id: ID!), posts(published: Boolean), user(id: ID!)
- A Mutation type with: createPost(input: CreatePostInput!): Post, publishPost(id: ID!): Post
- A CreatePostInput input type with title, body, authorId fields
Use non-null (!) appropriately — IDs and required fields should never be null.`,
    hints: [
      'Root types are Query, Mutation — declare them with `type Query {` syntax',
      'Use `!` for non-null: `id: ID!` means the field never returns null',
      'Input types use `input` keyword, not `type`',
      'An array of non-null items: `[Post!]!` means neither the list nor items can be null',
      'The @deprecated directive marks fields: `oldField: String @deprecated(reason: "Use newField")`',
    ],
    starterCode: `# Define your GraphQL schema in SDL

type Query {
  # TODO: add query fields
}

type Mutation {
  # TODO: add mutation fields
}

# TODO: define Post, User, and input types`,
    solution: `type Query {
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
  user(id: ID!): User
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post!
}

type Post {
  id: ID!
  title: String!
  body: String!
  published: Boolean!
  author: User!
}

type User {
  id: ID!
  name: String!
  posts: [Post!]!
}

input CreatePostInput {
  title: String!
  body: String!
  authorId: ID!
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What HTTP method does a standard GraphQL request use?',
      options: ['GET', 'POST', 'PUT', 'Any method — GraphQL is transport-agnostic but typically POST'],
      answer: 3,
      explanation: 'GraphQL is transport-agnostic but the convention is HTTP POST with a JSON body containing `query` and `variables`. GET is used for persisted/cached queries.',
    },
    {
      q: 'What does a GraphQL response look like when a field errors?',
      options: [
        'HTTP 500 status code',
        '{"error": "field failed"}',
        '{"data": {..., "fieldName": null}, "errors": [{...}]}',
        'The entire response body is null',
      ],
      answer: 2,
      explanation: 'GraphQL returns HTTP 200 with partial data. The errored field is null in `data` and the error detail appears in the `errors` array — this is "partial success".',
    },
    {
      q: 'Which root type handles real-time updates?',
      options: ['Query', 'Mutation', 'Subscription', 'Live'],
      answer: 2,
      explanation: 'The Subscription root type delivers real-time events. Subscriptions run over WebSocket (graphql-ws protocol) — the server pushes data to subscribers when events occur.',
    },
    {
      q: 'What is introspection in GraphQL?',
      options: [
        'Logging all GraphQL requests for debugging',
        'The ability to query the schema itself to discover types and fields',
        'A caching mechanism for repeated queries',
        'Automatic type validation on the client',
      ],
      answer: 1,
      explanation: 'Introspection lets any client query `__schema` and `__type` to discover the full API contract at runtime. It powers GraphiQL, Apollo Studio, and code generators — but should be disabled in production.',
    },
    {
      q: 'How does GraphQL handle API versioning?',
      options: [
        'URL versioning (/v1, /v2) like REST',
        'HTTP header versioning',
        'Schema versioning with explicit version fields',
        'It doesn\'t — fields are added (never removed) and deprecated with @deprecated',
      ],
      answer: 3,
      explanation: 'GraphQL schemas evolve by adding new fields (backward-compatible) and marking old ones @deprecated. Clients that don\'t request deprecated fields are unaffected — no version URLs needed.',
    },
    {
      q: 'What is the difference between over-fetching and under-fetching in REST?',
      options: [
        'Over-fetching means too many API calls; under-fetching means too few',
        'Over-fetching returns unused fields; under-fetching requires multiple requests to get all needed data',
        'Over-fetching is a server-side problem; under-fetching is a client problem',
        'These are GraphQL-specific terms, not REST problems',
      ],
      answer: 1,
      explanation: 'REST endpoints return fixed shapes — you may receive many unused fields (over-fetching) or need multiple requests to gather all data for a view (under-fetching). GraphQL solves both by letting clients declare exactly what they need.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can GraphQL replace REST entirely?',
      a: 'For complex, multi-client APIs (web + mobile + third-party) GraphQL is often superior. But REST remains simpler for simple CRUD, has better HTTP caching semantics, and every developer knows it. Many production systems use both: GraphQL for the BFF (Backend for Frontend) layer and REST for internal microservice communication. The right choice depends on client diversity and data complexity.',
    },
    {
      q: 'How does GraphQL handle file uploads?',
      a: 'The GraphQL spec does not define file upload. The <strong>graphql-multipart-request</strong> spec (used by apollo-upload-client and graphql-upload) extends the protocol to support multipart form data. Alternatively, use a separate REST endpoint or presigned URLs (S3) for file upload and pass the resulting URL as a GraphQL mutation argument — this keeps GraphQL for data and avoids binary-in-JSON overhead.',
    },
    {
      q: 'What is the N+1 problem in GraphQL?',
      a: 'When resolving a list of items where each item triggers a sub-query, you get N+1 database calls — 1 for the list, then N for each item\'s relations. Example: fetching 100 posts and each post resolver fetches its author separately = 101 queries. DataLoader solves this by batching all author IDs into a single lookup. This is one of the most important GraphQL performance patterns.',
    },
    {
      q: 'Is GraphQL always faster than REST?',
      a: 'Not necessarily. GraphQL reduces HTTP round-trips (one request vs N REST calls), but the server must still do the work of fetching all the data. Without DataLoader, GraphQL can generate more database queries than a hand-crafted REST endpoint. The network savings are most valuable on mobile (high latency). Always profile both approaches for your specific workload.',
    },
    {
      q: 'How do you handle authentication in GraphQL?',
      a: 'Authentication happens at the HTTP layer (JWT in Authorization header, cookie session) — exactly like REST. The GraphQL context function extracts and verifies the token, then attaches the user to the context object passed to every resolver. Authorization (what the user can do) is checked inside resolvers, using the context.user object. Libraries like graphql-shield provide declarative rule-based authorization.',
    },
    {
      q: 'What is schema-first vs code-first GraphQL?',
      a: '<strong>Schema-first</strong>: write the SDL file, then implement resolvers. The schema is the single source of truth — great for API design discussions and contract-first teams. <strong>Code-first</strong>: write resolver code in TypeScript/Python, and a library (Pothos, NestJS GraphQL, Hot Chocolate) generates the SDL. Better for type safety and co-location of resolver logic. Both approaches are valid; the choice is team preference.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'GraphQL is a query language where clients declare exactly what data they need — the server returns precisely that shape from a single endpoint.',
    mustKnow: [
      'Three operation types: query (read), mutation (write), subscription (real-time WebSocket)',
      'Single endpoint, client-specified shape — solves REST over/under-fetching',
      'Schema is the typed contract; SDL defines types, fields, and root operations',
      'Response is always HTTP 200 JSON with `data` and optional `errors` array',
      'Introspection lets clients query the schema — disable in production',
      '@deprecated marks fields for removal without breaking existing clients',
    ],
    interviewFocus: [
      'What problems does GraphQL solve that REST doesn\'t? (over-fetching, under-fetching, multiple round-trips)',
      'How does GraphQL versioning work? (no versions — additive schema evolution + @deprecated)',
      'What is the N+1 problem and how do you solve it? (DataLoader batching)',
      'How does error handling differ from REST? (HTTP 200 always, errors[] in body, partial success)',
    ],
  };
}
