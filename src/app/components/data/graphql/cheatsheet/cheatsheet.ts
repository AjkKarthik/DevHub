import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CheatItem {
  title: string;
  desc: string;
  code: string;
  category: string;
}

@Component({
  selector: 'app-gql-cheatsheet',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class GqlCheatsheet {
  activeTab = signal<'schema' | 'queries' | 'directives' | 'resolvers' | 'client'>('schema');
  search = signal('');

  schemaItems = signal<CheatItem[]>([
    { title: 'type', desc: 'Define an object type', category: 'Type', code: 'type User { id: ID!; name: String!; email: String }' },
    { title: 'scalar', desc: 'Primitive or custom leaf value', category: 'Type', code: 'scalar DateTime\nscalar Email' },
    { title: 'enum', desc: 'Fixed set of allowed values', category: 'Type', code: 'enum Status { DRAFT PUBLISHED ARCHIVED }' },
    { title: 'input', desc: 'Write-only argument type', category: 'Type', code: 'input CreatePostInput { title: String!; body: String }' },
    { title: 'interface', desc: 'Abstract type with required fields', category: 'Type', code: 'interface Node { id: ID! }\ntype Post implements Node { id: ID!; title: String! }' },
    { title: 'union', desc: 'One of several concrete types', category: 'Type', code: 'union SearchResult = Post | User | Tag' },
    { title: '! (non-null)', desc: 'Field cannot return null', category: 'Modifier', code: 'name: String!   # required\nposts: [Post!]! # non-null list of non-null items' },
    { title: '[Type]', desc: 'List modifier', category: 'Modifier', code: 'tags: [String]   # nullable list of nullable strings\ntags: [String!]! # non-null list of non-null strings' },
    { title: 'implements', desc: 'Object type satisfies interface', category: 'Keyword', code: 'type Article implements Node & Timestamped { id: ID!; ... }' },
    { title: 'extend type', desc: 'Add fields to existing type', category: 'Keyword', code: 'extend type User { profilePicture: String }' },
    { title: 'Query root', desc: 'Entry point for reads', category: 'Root', code: 'type Query { post(id: ID!): Post; posts(limit: Int): [Post!]! }' },
    { title: 'Mutation root', desc: 'Entry point for writes', category: 'Root', code: 'type Mutation { createPost(input: CreatePostInput!): Post! }' },
    { title: 'Subscription root', desc: 'Entry point for real-time', category: 'Root', code: 'type Subscription { postCreated: Post! }' },
  ]);

  queryItems = signal<CheatItem[]>([
    { title: 'query', desc: 'Read operation', category: 'Operation', code: 'query GetPost($id: ID!) { post(id: $id) { id title } }' },
    { title: 'mutation', desc: 'Write operation', category: 'Operation', code: 'mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }' },
    { title: 'subscription', desc: 'Real-time stream', category: 'Operation', code: 'subscription { postCreated { id title } }' },
    { title: 'fragment', desc: 'Reusable selection set', category: 'Feature', code: 'fragment UserFields on User { id name email }' },
    { title: '...FragName', desc: 'Spread a named fragment', category: 'Feature', code: 'query { user(id: "1") { ...UserFields } }' },
    { title: '... on Type', desc: 'Inline fragment (type condition)', category: 'Feature', code: 'search { ... on Post { title } ... on User { name } }' },
    { title: '__typename', desc: 'Runtime type name meta-field', category: 'Meta', code: 'search { __typename ... on Post { title } ... on User { name } }' },
    { title: 'alias:', desc: 'Rename field in response', category: 'Feature', code: 'recent: posts(sort: "date") { id }\nfeatured: posts(category: "featured") { id }' },
    { title: '@skip(if:)', desc: 'Omit field when true', category: 'Directive', code: 'email @skip(if: $hidePrivate)' },
    { title: '@include(if:)', desc: 'Include field when true', category: 'Directive', code: 'avatar @include(if: $showAvatar)' },
    { title: 'variables', desc: 'Declare input params', category: 'Variables', code: 'query GetPosts($limit: Int = 10, $status: Status) { posts(limit: $limit) { id } }' },
  ]);

  directiveItems = signal<CheatItem[]>([
    { title: '@skip', desc: 'Built-in: omit field when true', category: 'Built-in', code: 'name @skip(if: $skip)   # Boolean required' },
    { title: '@include', desc: 'Built-in: include field when true', category: 'Built-in', code: 'email @include(if: $show)' },
    { title: '@deprecated', desc: 'Built-in: marks field as deprecated', category: 'Built-in', code: 'username: String @deprecated(reason: "Use handle instead")' },
    { title: '@specifiedBy', desc: 'Built-in: links scalar to spec URL', category: 'Built-in', code: 'scalar URL @specifiedBy(url: "https://url.spec.whatwg.org/"' },
    { title: 'Custom directive', desc: 'Declare your own behavior', category: 'Custom', code: 'directive @auth(requires: Role = USER) on FIELD_DEFINITION | OBJECT' },
    { title: '@auth', desc: 'Common: field-level auth', category: 'Custom', code: 'adminData: [AdminRecord!]! @auth(requires: ADMIN)' },
    { title: '@cacheControl', desc: 'Apollo: cache-control hints', category: 'Apollo', code: 'posts: [Post!]! @cacheControl(maxAge: 60, scope: PUBLIC)' },
    { title: 'Directive locations', desc: 'Where a directive can appear', category: 'Concept', code: '# Query locations: FIELD, FRAGMENT_SPREAD, INLINE_FRAGMENT\n# Schema locations: FIELD_DEFINITION, OBJECT, ARGUMENT_DEFINITION' },
  ]);

  resolverItems = signal<CheatItem[]>([
    { title: 'Resolver signature', desc: 'Four params every resolver gets', category: 'Basics', code: '(parent, args, context, info) => value | Promise<value>' },
    { title: 'Default resolver', desc: 'Built-in: returns parent[fieldName]', category: 'Basics', code: '// No code needed for: type Post { title: String! }\n// if resolver returns { title: "Hello" }' },
    { title: 'Root resolver', desc: 'Query/Mutation entry point', category: 'Basics', code: 'Query: { post: (_, { id }, { db }) => db.posts.findById(id) }' },
    { title: 'Type resolver', desc: 'Field resolver on concrete type', category: 'Basics', code: 'Post: { author: (post, _, { db }) => db.users.findById(post.authorId) }' },
    { title: '__resolveType', desc: 'Required for Interface/Union', category: 'Abstract', code: 'Node: { __resolveType: (obj) => obj.title ? "Post" : "User" }' },
    { title: 'context usage', desc: 'Access db, user, loaders', category: 'Pattern', code: 'me: (_, __, { user }) => user\nposts: (_, __, { db }) => db.posts.findAll()' },
    { title: 'Throw error', desc: 'Add to errors array', category: 'Errors', code: 'if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: "UNAUTHENTICATED" } })' },
    { title: 'mergeResolvers', desc: 'Combine resolver maps', category: 'Pattern', code: 'import { mergeResolvers } from "@graphql-tools/merge";\nconst resolvers = mergeResolvers([userResolvers, postResolvers])' },
  ]);

  clientItems = signal<CheatItem[]>([
    { title: 'ApolloClient setup', desc: 'Core client instantiation', category: 'Setup', code: 'new ApolloClient({ link: from([authLink, httpLink]), cache: new InMemoryCache() })' },
    { title: 'ApolloProvider', desc: 'Provides client to React tree', category: 'Setup', code: '<ApolloProvider client={client}><App /></ApolloProvider>' },
    { title: 'useQuery', desc: 'Run a query in a component', category: 'Hooks', code: 'const { data, loading, error } = useQuery(GET_POSTS, { variables: { limit: 10 } })' },
    { title: 'useMutation', desc: 'Define and run a mutation', category: 'Hooks', code: 'const [createPost, { loading }] = useMutation(CREATE_POST, { refetchQueries: ["GetPosts"] })' },
    { title: 'useLazyQuery', desc: 'Query on demand', category: 'Hooks', code: 'const [search, { data }] = useLazyQuery(SEARCH);\nbutton.onClick = () => search({ variables: { q } })' },
    { title: 'fetchPolicy options', desc: 'Cache vs network strategy', category: 'Cache', code: '// cache-first (default) | network-only | cache-and-network | no-cache' },
    { title: 'cache.modify', desc: 'Surgical cache update', category: 'Cache', code: 'cache.modify({ fields: { posts(existing, { toReference }) { return [toReference(newPost), ...existing] } } })' },
    { title: 'optimisticResponse', desc: 'Instant UI before server confirms', category: 'UX', code: 'optimisticResponse: { createPost: { __typename: "Post", id: "temp-id", title: input.title } }' },
    { title: 'onError link', desc: 'Global error handling', category: 'Links', code: 'onError(({ graphQLErrors }) => { if (code === "UNAUTHENTICATED") redirect("/login") })' },
    { title: 'makeVar', desc: 'Client-side reactive state', category: 'State', code: 'const cartVar = makeVar<string[]>([])\nconst items = useReactiveVar(cartVar)' },
  ]);

  filtered(items: CheatItem[]) {
    const q = this.search().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.desc.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }
}
