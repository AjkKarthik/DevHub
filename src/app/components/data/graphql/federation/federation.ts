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
  selector: 'app-gql-federation',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './federation.html',
  styleUrl: './federation.scss'
})
export class GqlFederation {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: '@key', desc: 'Federation directive — marks the field(s) that uniquely identify an entity across subgraphs' },
    { type: 'keyword', name: '@external', desc: 'Marks a field defined in another subgraph — used for reference resolvers' },
    { type: 'keyword', name: '@requires', desc: 'Declares that a field needs fields from another subgraph to resolve' },
    { type: 'keyword', name: '@provides', desc: 'Declares that a subgraph can provide additional fields on an external entity' },
    { type: 'keyword', name: '@shareable', desc: 'Federation v2 — allows a type or field to be defined in multiple subgraphs' },
    { type: 'keyword', name: '@override', desc: 'Federation v2 — migrates ownership of a field from one subgraph to another' },
    { type: 'keyword', name: 'Router', desc: 'Apollo Router — the gateway that composes and routes federated queries' },
    { type: 'method', name: '__resolveReference', desc: 'Resolver function that fetches an entity object given its @key fields' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Schema Federation?',
      points: [
        'Federation composes multiple independent GraphQL APIs (subgraphs) into one unified API (supergraph).',
        'Each subgraph owns its domain: Users subgraph owns User, Products subgraph owns Product, Orders subgraph owns Order.',
        'The Apollo Router sits in front, receives client queries, plans which subgraphs to call, and merges the responses.',
        'Federation v2 removes the gateway in favor of the Apollo Router and introduces new directives (@shareable, @override, @inaccessible).'
      ]
    },
    {
      heading: 'Entities and @key',
      points: [
        'An entity is a type that can be referenced across subgraphs. Mark it with @key: `type User @key(fields: "id") { id: ID! name: String! }`.',
        'The @key directive specifies the field(s) that uniquely identify the entity — typically the primary key.',
        'A subgraph that needs to extend an entity declares it with @key and implements __resolveReference.',
        '__resolveReference receives the key fields and returns the full entity object for that subgraph\'s fields.'
      ]
    },
    {
      heading: '__resolveReference',
      points: [
        'When the Router needs to fetch an entity from a subgraph, it calls the entity\'s __resolveReference.',
        'It receives an object with the @key fields: `{ __typename: "User", id: "1" }`.',
        'Return the full entity data for that subgraph — only the fields owned by that subgraph need to be populated.',
        'Batch __resolveReference using DataLoader — the Router calls it with multiple references at once for efficiency.'
      ]
    },
    {
      heading: '@external and @requires',
      points: [
        '@external marks a field that belongs to another subgraph. Used in a stub for reference resolution.',
        '@requires tells the Router that to resolve a field in this subgraph, it first needs specific fields from another subgraph.',
        'Example: ShippingCost @requires(fields: "weight") — the weight comes from the Products subgraph and must be fetched first.',
        'The Router\'s query planner handles @requires automatically — it plans the fetch order across subgraphs.'
      ]
    },
    {
      heading: 'Federation v2 Improvements',
      points: [
        '@shareable: types and fields can now be defined in multiple subgraphs (v1 required a single owner).',
        '@override: migrate a field from one subgraph to another with zero downtime.',
        '@inaccessible: hide a field from the public API (still accessible internally for cross-subgraph resolution).',
        'Incremental adoption: Federation v2 can be enabled without rewriting existing subgraphs — use `@link` directive to opt in.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Subgraph Definition',
      language: 'typescript',
      code: `import { buildSubgraphSchema } from '@apollo/subgraph';
import { ApolloServer } from '@apollo/server';
import gql from 'graphql-tag';

// Users subgraph — owns User entity
const typeDefs = gql\`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    user(id: ID!): User
    me: User
  }
\`;

const resolvers = {
  User: {
    // __resolveReference: called when another subgraph needs a User
    __resolveReference: async ({ id }: { id: string }, { db }: Context) => {
      return db.users.findById(id);
    }
  },
  Query: {
    user: (_, { id }, { db }) => db.users.findById(id),
    me: (_, __, { user }) => user
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});`
    },
    {
      label: 'Cross-Subgraph Extension',
      language: 'typescript',
      code: `import gql from 'graphql-tag';

// Reviews subgraph — extends User from Users subgraph
const typeDefs = gql\`
  extend schema @link(
    url: "https://specs.apollo.dev/federation/v2.0"
    import: ["@key", "@external", "@requires"]
  )

  # Stub for the User entity — only @key and @external fields needed
  type User @key(fields: "id") {
    id: ID! @external
    # @requires(fields: "id") needed here would mean we need id first
  }

  type Review {
    id: ID!
    body: String!
    rating: Int!
    author: User!
    product: Product!
  }

  extend type Query {
    reviews(userId: ID!): [Review!]!
  }
\`;

const resolvers = {
  User: {
    // Resolve reviews FOR a user — called when another subgraph requests User.reviews
    __resolveReference: async ({ id }: { id: string }, { db }: Context) => {
      // This subgraph only knows about reviews, not full user data
      return { id };  // router merges with Users subgraph data
    },
    reviews: (user, _, { db }) => db.reviews.findByUserId(user.id)
  }
};`
    },
    {
      label: 'Router Config (router.yaml)',
      language: 'typescript',
      code: `# Apollo Router configuration (router.yaml)
# supergraph:
#   path: ./supergraph.graphql  # composed schema

# Subgraph URLs
# Compose the supergraph with rover:
# rover supergraph compose --config ./supergraph.yaml

# supergraph.yaml (for rover compose):
# federation_version: =2.0
# subgraphs:
#   users:
#     routing_url: http://users-service:4001/graphql
#     schema:
#       subgraph_url: http://users-service:4001/graphql
#   reviews:
#     routing_url: http://reviews-service:4002/graphql
#     schema:
#       subgraph_url: http://reviews-service:4002/graphql

// TypeScript: run Apollo Router as a binary or Docker container
// The router composes the schema using rover and routes queries

// Test federation composition locally:
// rover dev --supergraph-config supergraph.yaml`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not implementing __resolveReference for entities',
      wrong: `// User has @key(fields: "id") but no __resolveReference
// Other subgraphs cannot fetch User by reference`,
      right: `User: {
  __resolveReference: ({ id }, { db }) => db.users.findById(id)
}`,
      explanation: 'Every entity with @key must implement __resolveReference. Without it, the Router cannot fetch the entity when another subgraph references it.'
    },
    {
      title: 'Circular @requires dependencies',
      wrong: `# SubA: ProductDetails @requires(fields: "shippingWeight")
# SubB: shippingWeight @requires(fields: "productCategory")
# SubC: productCategory @requires(fields: "details")  → circular`,
      right: `# Design requires chains to be acyclic (DAG)
# Restructure to break the cycle or merge subgraphs`,
      explanation: 'Circular @requires create a dependency cycle that the Router\'s query planner cannot resolve. Always model @requires as a directed acyclic graph.'
    },
    {
      title: 'Putting too much in one subgraph to avoid federation',
      wrong: `// Monolithic "UserPostReviewOrder" subgraph — defeats the purpose of federation`,
      right: `// Each subgraph owns one domain
// users: User type; posts: Post type; reviews: Review type`,
      explanation: 'Federation is designed for team autonomy. If you merge domains to avoid @requires complexity, you lose the independence and scalability that federation provides.'
    },
    {
      title: 'Not batching __resolveReference with DataLoader',
      wrong: `User: {
  __resolveReference: ({ id }, { db }) => db.users.findById(id)
  // Called N times for N User references — N+1 problem!
}`,
      right: `User: {
  __resolveReference: ({ id }, { loaders }) => loaders.user.load(id)
  // All references batched into one DB query via DataLoader
}`,
      explanation: 'The Router may call __resolveReference multiple times in one query plan. Without DataLoader, each call is a separate DB query — the classic N+1 problem.'
    },
    {
      title: 'Confusing Federation v1 and v2 directives',
      wrong: `# Federation v1: using 'extend type' for stubs
extend type User @key(fields: "id") { id: ID! @external }`,
      right: `# Federation v2: use @link import, type without extend
extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])
type User @key(fields: "id") { id: ID! @external }`,
      explanation: 'Federation v2 uses @link for directive imports and changes some syntax. Mixing v1 and v2 conventions causes composition errors. Declare the federation version explicitly with @link.'
    }
  ];

  challenge: Challenge = {
    title: 'Design a Federated Products + Inventory Subgraph',
    language: 'typescript',
    description: 'Write the Federation v2 type definitions for: (1) a Products subgraph with `type Product @key(fields: "id")` having id, name, price; (2) an Inventory subgraph that stubs Product and adds `stockCount: Int!` — using @external on id and @requires if needed; (3) the __resolveReference for Product in the Inventory subgraph that returns { id } (just the key).',
    hints: [
      'Products: full Product type with @key, Query.product resolver',
      'Inventory: type Product @key(fields: "id") { id: ID! @external; stockCount: Int! }',
      '__resolveReference in Inventory receives { id } and returns inventory data',
      'Use @link directive to import @key, @external from federation spec'
    ],
    starterCode: `// Products subgraph
const productTypeDefs = gql\`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])
  # TODO: Product type and Query
\`;

// Inventory subgraph
const inventoryTypeDefs = gql\`
  extend schema @link(
    url: "https://specs.apollo.dev/federation/v2.0"
    import: ["@key", "@external"]
  )
  # TODO: Product stub with stockCount
\`;

const inventoryResolvers = {
  Product: {
    __resolveReference: ({ id }, { inventoryDb }) => {
      // TODO
    }
  }
};`,
    solution: `// Products subgraph
const productTypeDefs = gql\`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type Product @key(fields: "id") {
    id: ID!
    name: String!
    price: Float!
  }

  type Query {
    product(id: ID!): Product
    products: [Product!]!
  }
\`;

// Inventory subgraph
const inventoryTypeDefs = gql\`
  extend schema @link(
    url: "https://specs.apollo.dev/federation/v2.0"
    import: ["@key", "@external"]
  )

  type Product @key(fields: "id") {
    id: ID! @external
    stockCount: Int!
  }
\`;

const inventoryResolvers = {
  Product: {
    __resolveReference: async ({ id }, { inventoryDb }) => {
      const stock = await inventoryDb.getStock(id);
      return { id, stockCount: stock };
    }
  }
};`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the purpose of @key in GraphQL Federation?', options: ['To mark required arguments', 'To mark the unique identifier fields of an entity so it can be referenced across subgraphs', 'To set the cache key for a field', 'To mark deprecated fields'], answer: 1, explanation: '@key declares the fields that uniquely identify an entity, allowing other subgraphs to reference and extend it. The Router uses @key fields to fetch the entity from the owning subgraph.' },
    { q: 'What does __resolveReference do?', options: ['Resolves schema conflicts between subgraphs', 'Fetches an entity from a subgraph given its @key fields', 'Validates entity types', 'Generates the supergraph schema'], answer: 1, explanation: '__resolveReference is called by the Router when it needs to fetch an entity. It receives the @key fields and returns the full entity object from that subgraph\'s data source.' },
    { q: 'What does @external mark?', options: ['Fields that are deprecated', 'Fields defined in another subgraph used in stubs for cross-subgraph references', 'Public API fields', 'Non-null fields'], answer: 1, explanation: '@external marks fields that are defined in another subgraph. They appear in a subgraph\'s type stub only to satisfy @requires or @key declarations.' },
    { q: 'What is the Apollo Router\'s role in a federated graph?', options: ['It stores the database', 'It composes subgraph schemas and routes queries to the correct subgraphs', 'It validates schemas', 'It handles authentication'], answer: 1, explanation: 'The Apollo Router receives client queries, uses the composed supergraph schema to plan which subgraphs to call (and in what order), and merges the results.' },
    { q: 'What new capability does @shareable add in Federation v2?', options: ['Shared database connections', 'Allows a type or field to be defined in multiple subgraphs', 'Shared authentication', 'Shared query cache'], answer: 1, explanation: 'Federation v1 required a single owner for each type. @shareable in v2 allows a type or field to be defined in multiple subgraphs, increasing flexibility for shared domain types.' },
    { q: 'Why should __resolveReference use DataLoader?', options: ['For type safety', 'To batch multiple entity lookups into one DB query', 'To enable WebSocket support', 'To avoid schema validation'], answer: 1, explanation: 'The Router calls __resolveReference once per entity reference. With multiple references in one query, this creates N+1. DataLoader batches all calls within a tick into one query.' }
  ];

  qna: QnaItem[] = [
    { q: 'When should I use Federation vs schema stitching?', a: 'Federation is the modern, supported approach for combining GraphQL APIs built independently by different teams. Schema stitching is older and more flexible but harder to maintain. For new projects, prefer Federation v2.' },
    { q: 'How does the Router\'s query plan work?', a: 'The Router analyzes the client query and the composed supergraph schema to build a query plan — a tree of fetch operations across subgraphs with parallel and sequential dependencies. @requires creates sequential dependencies; independent subgraph fetches run in parallel.' },
    { q: 'What is rover and why is it used?', a: 'rover is Apollo\'s CLI for managing federated graphs. It validates subgraph schemas, checks @key consistency, composes the supergraph schema from subgraph definitions, and publishes schemas to Apollo Studio.' },
    { q: 'Can subscriptions work in a federated graph?', a: 'Yes in Federation v2 with Apollo Router. The router supports subscription forwarding to the appropriate subgraph. It\'s more complex than query/mutation federation and requires the subgraph to support the graphql-ws protocol.' },
    { q: 'What is @inaccessible in Federation v2?', a: '@inaccessible hides a field from the public supergraph API while keeping it available for internal cross-subgraph resolution. Use it for internal keys or implementation details that shouldn\'t be exposed to clients.' },
    { q: 'Can I start with a monolith schema and migrate to federation later?', a: 'Yes — this is a common migration path. The monolith GraphQL API starts as one subgraph. As teams split, they extract domains into new subgraphs using @override to migrate fields with zero downtime.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Federation composes independent subgraph APIs into one supergraph — @key marks entities, __resolveReference fetches them, and the Router plans cross-subgraph queries.',
    mustKnow: [
      '@key: unique identifier for an entity across subgraphs',
      '__resolveReference: fetches an entity by @key — batch with DataLoader',
      '@external: marks fields defined in another subgraph (stubs)',
      '@requires: declares cross-subgraph field dependencies for the query planner',
      '@shareable (v2): allows type/field in multiple subgraphs',
      'Apollo Router: composes, plans, and routes federated queries'
    ],
    interviewFocus: [
      'Explain how entities work in GraphQL Federation (@key + __resolveReference)',
      'What does the Apollo Router do in a federated architecture?',
      'How does @requires affect the query planner\'s execution order?'
    ]
  };
}
