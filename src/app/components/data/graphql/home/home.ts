import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Schema': 'schema', 'Queries': 'queries',
  'Mutations': 'mutations', 'Subscriptions': 'subscriptions', 'Server': 'server',
  'Client': 'client', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Schema', 'Queries', 'Mutations', 'Subscriptions', 'Server', 'Client', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'GraphQL Fundamentals', route: '/graphql/fundamentals', badge: 'Foundations', description: 'What GraphQL is — a query language for APIs, type system, and how it solves REST over/under-fetching.', keyPoints: ['Query language for APIs', 'Single endpoint vs REST', 'Over/under-fetching problem', 'Type-safe schema', 'Introspection support'], available: true },
  { title: 'Schema Definition Language', route: '/graphql/schema-definition-language', badge: 'Schema', description: 'Define your API contract with SDL — types, fields, scalars, enums, interfaces, and unions.', keyPoints: ['Object types and fields', 'Built-in scalars (String, Int, Boolean)', 'Enum types', 'Interface and union types', 'Custom scalars (Date, JSON)'], available: true },
  { title: 'Type System Deep Dive', route: '/graphql/type-system', badge: 'Schema', description: 'Non-null types, input types, list types, and the schema root types (Query, Mutation, Subscription).', keyPoints: ['Non-null ! modifier', 'List [Type] syntax', 'Input types for mutations', 'Root types (Query/Mutation)', 'Deprecated directive'], available: true },
  { title: 'Queries', route: '/graphql/queries', badge: 'Queries', description: 'Write GraphQL queries — fields, nested objects, aliases, fragments, and inline fragments.', keyPoints: ['Field selection sets', 'Nested object queries', 'Aliases for same field twice', 'Named fragments', 'Inline fragments on unions'], available: true },
  { title: 'Variables & Arguments', route: '/graphql/variables-arguments', badge: 'Queries', description: 'Pass dynamic values into queries with variables — type declarations, defaults, and required values.', keyPoints: ['$variable syntax', 'Variable type declarations', 'Default variable values', 'Arguments on fields', 'Passing variables from clients'], available: true },
  { title: 'Directives', route: '/graphql/directives', badge: 'Queries', description: 'Conditional field inclusion with @include and @skip, plus custom directives for cross-cutting concerns.', keyPoints: ['@include(if: Boolean)', '@skip(if: Boolean)', '@deprecated in schema', 'Custom server directives', 'Repeatable directives'], available: true },
  { title: 'Mutations', route: '/graphql/mutations', badge: 'Mutations', description: 'Modify server-side data with mutation operations — naming, input types, and returning updated objects.', keyPoints: ['mutation keyword', 'Input type best practice', 'Returning modified objects', 'Sequential execution', 'Optimistic UI updates'], available: true },
  { title: 'Mutation Error Handling', route: '/graphql/error-handling', badge: 'Mutations', description: 'Handle errors in mutations — top-level errors, inline errors with union return types, and result patterns.', keyPoints: ['errors[] in response envelope', 'Union result types (Success | Error)', 'Partial success handling', 'Network vs application errors', 'userErrors pattern'], available: true },
  { title: 'Subscriptions', route: '/graphql/subscriptions', badge: 'Subscriptions', description: 'Real-time data with GraphQL subscriptions over WebSockets — subscription operations and resolvers.', keyPoints: ['subscription keyword', 'WebSocket transport', 'Server-side event publishing', 'Filtering subscription events', 'graphql-ws protocol'], available: true },
  { title: 'Resolvers', route: '/graphql/resolvers', badge: 'Server', description: 'Write resolver functions that fetch data for each field — the function signature and context pattern.', keyPoints: ['(parent, args, context, info)', 'Root resolvers', 'Chained parent resolution', 'Context for auth/loaders', 'Returning scalars vs objects'], available: true },
  { title: 'DataLoader & N+1 Problem', route: '/graphql/dataloader', badge: 'Server', description: 'Batch and cache resolver calls with DataLoader to eliminate the N+1 database query problem.', keyPoints: ['N+1 query problem explained', 'DataLoader batch function', 'Per-request DataLoader instances', 'Caching within a request', 'Batch vs individual loads'], available: true },
  { title: 'Apollo Server', route: '/graphql/apollo-server', badge: 'Server', description: 'Build a GraphQL API with Apollo Server — setup, middleware, context, plugins, and federation.', keyPoints: ['Apollo Server 4 setup', 'expressMiddleware integration', 'Context function', 'Plugins (logging, caching)', 'Apollo Federation intro'], available: true },
  { title: 'Authentication & Authorization', route: '/graphql/auth', badge: 'Server', description: 'Protect GraphQL APIs — JWT in context, directive-based auth, and field-level permissions.', keyPoints: ['JWT decoding in context', '@auth directive pattern', 'Checking user in resolvers', 'Shield for rule-based auth', 'Persisted queries for safety'], available: true },
  { title: 'Pagination Patterns', route: '/graphql/pagination', badge: 'Server', description: 'Offset, cursor, and Relay-style connection pagination — pros, cons, and implementation.', keyPoints: ['Offset vs cursor pagination', 'Relay connection spec', 'edges + node + cursor', 'PageInfo (hasNextPage)', 'Stable cursor design'], available: true },
  { title: 'Apollo Client', route: '/graphql/apollo-client', badge: 'Client', description: 'Query and mutate from Angular or React with Apollo Client — useQuery, useMutation, and cache.', keyPoints: ['ApolloClient setup', 'useQuery hook', 'useMutation hook', 'Normalized InMemoryCache', 'Cache policies'], available: true },
  { title: 'Client Caching', route: '/graphql/client-caching', badge: 'Client', description: 'Apollo InMemoryCache — cache normalization, field policies, read/write policies, and cache updates.', keyPoints: ['Automatic normalization by __typename + id', 'keyFields customisation', 'Field policy read/write', 'Manual cache updates', 'Reactive variables'], available: true },
  { title: 'Code Generation', route: '/graphql/code-generation', badge: 'Client', description: 'Generate TypeScript types and typed hooks from your GraphQL schema with @graphql-codegen.', keyPoints: ['graphql-codegen CLI', 'typescript + typescript-operations plugins', 'Typed useQuery hooks', 'Fragment co-location', 'Watch mode'], available: true },
  { title: 'Performance & Best Practices', route: '/graphql/performance', badge: 'Reference', description: 'Query depth limiting, query complexity analysis, persisted queries, and CDN caching strategies.', keyPoints: ['Depth limiting (graphql-depth-limit)', 'Complexity analysis', 'Persisted/automatic persisted queries', 'Response caching with CDN', 'Disable introspection in prod'], available: true },
  { title: 'Schema Stitching & Federation', route: '/graphql/federation', badge: 'Reference', description: 'Combine multiple GraphQL services — schema stitching, Apollo Federation, and gateway patterns.', keyPoints: ['Schema stitching approach', 'Apollo Federation @key directive', 'Subgraph and gateway', 'Entity references', 'Federation 2 composition'], available: true },
  { title: 'Testing GraphQL APIs', route: '/graphql/testing', badge: 'Reference', description: 'Test resolvers, mutations, and subscriptions with Jest and tools like graphql-tester.', keyPoints: ['Unit test resolvers', 'Integration test with test server', 'Mocking context in tests', 'Snapshot testing responses', 'MSW for client tests'], available: true },
  { title: 'GraphQL Cheat Sheet', route: '/graphql/cheatsheet', badge: 'Reference', description: 'Quick reference for SDL syntax, directives, scalars, built-in types, and common operation patterns.', keyPoints: ['SDL type syntax', 'Scalar types', 'Directives cheatsheet', 'Operation patterns', 'Error envelope structure'], available: true },
  { title: 'GraphQL Interview Prep', route: '/graphql/interview-prep', badge: 'Reference', description: '20 interview questions covering schema design, resolvers, DataLoader, caching, auth, and federation.', keyPoints: ['Schema design questions', 'N+1 and DataLoader', 'Auth patterns', 'Subscriptions vs polling', 'Federation concepts'], available: true },
];

@Component({ selector: 'app-graphql-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class GraphqlHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
