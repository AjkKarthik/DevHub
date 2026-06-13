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
  { title: 'GraphQL Fundamentals', route: '/graphql', badge: 'Foundations', description: 'What GraphQL is — a query language for APIs, type system, and how it solves REST over/under-fetching.', keyPoints: ['Query language for APIs', 'Single endpoint vs REST', 'Over/under-fetching problem', 'Type-safe schema', 'Introspection support'], available: false },
  { title: 'Schema Definition Language', route: '/graphql', badge: 'Schema', description: 'Define your API contract with SDL — types, fields, scalars, enums, interfaces, and unions.', keyPoints: ['Object types and fields', 'Built-in scalars (String, Int, Boolean)', 'Enum types', 'Interface and union types', 'Custom scalars (Date, JSON)'], available: false },
  { title: 'Type System Deep Dive', route: '/graphql', badge: 'Schema', description: 'Non-null types, input types, list types, and the schema root types (Query, Mutation, Subscription).', keyPoints: ['Non-null ! modifier', 'List [Type] syntax', 'Input types for mutations', 'Root types (Query/Mutation)', 'Deprecated directive'], available: false },
  { title: 'Queries', route: '/graphql', badge: 'Queries', description: 'Write GraphQL queries — fields, nested objects, aliases, fragments, and inline fragments.', keyPoints: ['Field selection sets', 'Nested object queries', 'Aliases for same field twice', 'Named fragments', 'Inline fragments on unions'], available: false },
  { title: 'Variables & Arguments', route: '/graphql', badge: 'Queries', description: 'Pass dynamic values into queries with variables — type declarations, defaults, and required values.', keyPoints: ['$variable syntax', 'Variable type declarations', 'Default variable values', 'Arguments on fields', 'Passing variables from clients'], available: false },
  { title: 'Directives', route: '/graphql', badge: 'Queries', description: 'Conditional field inclusion with @include and @skip, plus custom directives for cross-cutting concerns.', keyPoints: ['@include(if: Boolean)', '@skip(if: Boolean)', '@deprecated in schema', 'Custom server directives', 'Repeatable directives'], available: false },
  { title: 'Mutations', route: '/graphql', badge: 'Mutations', description: 'Modify server-side data with mutation operations — naming, input types, and returning updated objects.', keyPoints: ['mutation keyword', 'Input type best practice', 'Returning modified objects', 'Sequential execution', 'Optimistic UI updates'], available: false },
  { title: 'Mutation Error Handling', route: '/graphql', badge: 'Mutations', description: 'Handle errors in mutations — top-level errors, inline errors with union return types, and result patterns.', keyPoints: ['errors[] in response envelope', 'Union result types (Success | Error)', 'Partial success handling', 'Network vs application errors', 'userErrors pattern'], available: false },
  { title: 'Subscriptions', route: '/graphql', badge: 'Subscriptions', description: 'Real-time data with GraphQL subscriptions over WebSockets — subscription operations and resolvers.', keyPoints: ['subscription keyword', 'WebSocket transport', 'Server-side event publishing', 'Filtering subscription events', 'graphql-ws protocol'], available: false },
  { title: 'Resolvers', route: '/graphql', badge: 'Server', description: 'Write resolver functions that fetch data for each field — the function signature and context pattern.', keyPoints: ['(parent, args, context, info)', 'Root resolvers', 'Chained parent resolution', 'Context for auth/loaders', 'Returning scalars vs objects'], available: false },
  { title: 'DataLoader & N+1 Problem', route: '/graphql', badge: 'Server', description: 'Batch and cache resolver calls with DataLoader to eliminate the N+1 database query problem.', keyPoints: ['N+1 query problem explained', 'DataLoader batch function', 'Per-request DataLoader instances', 'Caching within a request', 'Batch vs individual loads'], available: false },
  { title: 'Apollo Server', route: '/graphql', badge: 'Server', description: 'Build a GraphQL API with Apollo Server — setup, middleware, context, plugins, and federation.', keyPoints: ['Apollo Server 4 setup', 'expressMiddleware integration', 'Context function', 'Plugins (logging, caching)', 'Apollo Federation intro'], available: false },
  { title: 'Authentication & Authorization', route: '/graphql', badge: 'Server', description: 'Protect GraphQL APIs — JWT in context, directive-based auth, and field-level permissions.', keyPoints: ['JWT decoding in context', '@auth directive pattern', 'Checking user in resolvers', 'Shield for rule-based auth', 'Persisted queries for safety'], available: false },
  { title: 'Pagination Patterns', route: '/graphql', badge: 'Server', description: 'Offset, cursor, and Relay-style connection pagination — pros, cons, and implementation.', keyPoints: ['Offset vs cursor pagination', 'Relay connection spec', 'edges + node + cursor', 'PageInfo (hasNextPage)', 'Stable cursor design'], available: false },
  { title: 'Apollo Client', route: '/graphql', badge: 'Client', description: 'Query and mutate from Angular or React with Apollo Client — useQuery, useMutation, and cache.', keyPoints: ['ApolloClient setup', 'useQuery hook', 'useMutation hook', 'Normalized InMemoryCache', 'Cache policies'], available: false },
  { title: 'Client Caching', route: '/graphql', badge: 'Client', description: 'Apollo InMemoryCache — cache normalization, field policies, read/write policies, and cache updates.', keyPoints: ['Automatic normalization by __typename + id', 'keyFields customisation', 'Field policy read/write', 'Manual cache updates', 'Reactive variables'], available: false },
  { title: 'Code Generation', route: '/graphql', badge: 'Client', description: 'Generate TypeScript types and typed hooks from your GraphQL schema with @graphql-codegen.', keyPoints: ['graphql-codegen CLI', 'typescript + typescript-operations plugins', 'Typed useQuery hooks', 'Fragment co-location', 'Watch mode'], available: false },
  { title: 'Performance & Best Practices', route: '/graphql', badge: 'Reference', description: 'Query depth limiting, query complexity analysis, persisted queries, and CDN caching strategies.', keyPoints: ['Depth limiting (graphql-depth-limit)', 'Complexity analysis', 'Persisted/automatic persisted queries', 'Response caching with CDN', 'Disable introspection in prod'], available: false },
  { title: 'Schema Stitching & Federation', route: '/graphql', badge: 'Reference', description: 'Combine multiple GraphQL services — schema stitching, Apollo Federation, and gateway patterns.', keyPoints: ['Schema stitching approach', 'Apollo Federation @key directive', 'Subgraph and gateway', 'Entity references', 'Federation 2 composition'], available: false },
  { title: 'Testing GraphQL APIs', route: '/graphql', badge: 'Reference', description: 'Test resolvers, mutations, and subscriptions with Jest and tools like graphql-tester.', keyPoints: ['Unit test resolvers', 'Integration test with test server', 'Mocking context in tests', 'Snapshot testing responses', 'MSW for client tests'], available: false },
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
