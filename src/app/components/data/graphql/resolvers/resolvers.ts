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
  selector: 'app-gql-resolvers',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './resolvers.html',
  styleUrl: './resolvers.scss'
})
export class GqlResolvers {
  quickRef: QuickRefItem[] = [
    { type: 'syntax', name: 'resolver(root, args, context, info)', desc: 'Four parameters every resolver receives' },
    { type: 'syntax', name: 'root / parent', desc: 'The resolved value of the parent field' },
    { type: 'syntax', name: 'args', desc: 'Arguments passed to this field in the query' },
    { type: 'syntax', name: 'context', desc: 'Shared request-scoped object — db, user, dataloaders' },
    { type: 'syntax', name: 'info', desc: 'Query AST, field name, return type, path — advanced usage' },
    { type: 'method', name: 'mergeResolvers()', desc: 'graphql-tools utility to combine resolver maps from multiple files' },
    { type: 'keyword', name: 'default resolver', desc: 'GraphQL\'s built-in: returns parent[fieldName] — no code needed for simple fields' },
    { type: 'keyword', name: 'resolver chain', desc: 'Root resolver returns a partial object; child resolvers fill in the rest' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Resolver Basics',
      points: [
        'A resolver is a function that returns the value for a field. It receives (parent, args, context, info).',
        'Root resolvers (on Query, Mutation, Subscription) run first. Their return value becomes `parent` for child resolvers.',
        'GraphQL has a default resolver: `return parent[fieldName]`. You only need to write a resolver when the default is insufficient.',
        'Resolvers can return a value, a Promise, or an array. GraphQL handles awaiting promises and iterating arrays.'
      ]
    },
    {
      heading: 'The Four Arguments',
      points: [
        'parent (root): the return value of the parent resolver. For root fields, it is the rootValue (usually empty object).',
        'args: an object of all arguments passed to the field in the query: `post(id: $id)` → `args.id`.',
        'context: a shared object created once per request. Put the authenticated user, DB connections, and DataLoaders here.',
        'info: the GraphQL ResolveInfo object — contains the field name, return type, AST of the query. Rarely needed directly.'
      ]
    },
    {
      heading: 'Context Object',
      points: [
        'Context is created fresh for every request (not shared across requests). It\'s the right place for request-scoped data.',
        'In Apollo Server, define context with the `context` function: `async ({ req }) => ({ user: getUser(req), db: prisma })`.',
        'Never put mutable state in module-level variables — always pass through context for request isolation.',
        'DataLoaders must be created per-request in context — creating them outside causes cross-request cache contamination.'
      ]
    },
    {
      heading: 'Resolver Composition',
      points: [
        'Resolvers are organized as a nested map mirroring the schema: `{ Query: { post }, Post: { author } }`.',
        'You can split resolvers across multiple files and merge them with `mergeResolvers` from @graphql-tools/merge.',
        'Resolver middleware (graphql-middleware, graphql-shield) wraps resolvers with cross-cutting logic like auth and logging.',
        'Abstract type resolvers (__resolveType for Interface/Union) live at the top level of the type key.'
      ]
    },
    {
      heading: 'Async Resolvers & Error Handling',
      points: [
        'Resolvers can be async functions. GraphQL awaits promises automatically before processing sub-selections.',
        'Throw a GraphQLError (or subclass) from a resolver to add the error to the response errors array.',
        'For nullable fields, return null instead of throwing when data is legitimately absent.',
        'If a resolver returns undefined, GraphQL treats it as null for nullable fields (and propagates an error for non-null).'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Resolver Map',
      language: 'typescript',
      code: `import { GraphQLError } from 'graphql';

const resolvers = {
  // Root resolvers
  Query: {
    // args and context are available
    post: async (_, { id }, { db, user }) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      return db.posts.findById(id);
    },

    posts: async (_, { limit = 10, offset = 0 }, { db }) => {
      return db.posts.findAll({ limit, offset });
    },

    me: (_, __, { user }) => user  // context shortcut
  },

  // Type resolvers — called with parent = the Post object
  Post: {
    // Default resolver would also work: post.author is already on parent
    author: (post, _, { db }) => db.users.findById(post.authorId),

    // Computed field
    wordCount: (post) => post.body.split(' ').length,

    // Field with args
    comments: (post, { limit = 10 }, { db }) =>
      db.comments.findByPostId(post.id, { limit })
  },

  // Interface resolver
  Node: {
    __resolveType: (obj) => {
      if (obj.title !== undefined) return 'Post';
      if (obj.body !== undefined) return 'Comment';
      return 'User';
    }
  }
};`
    },
    {
      label: 'Context Setup',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import DataLoader from 'dataloader';

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => {
    // Authenticate from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = token ? await verifyToken(token) : null;

    // Create per-request DataLoaders to avoid cross-request contamination
    const userLoader = new DataLoader(async (ids: readonly string[]) =>
      db.users.findByIds([...ids])
    );

    return {
      user,
      db: prisma,
      loaders: { user: userLoader }
    };
  }
}));`
    },
    {
      label: 'Resolver Middleware',
      language: 'typescript',
      code: `import { applyMiddleware } from 'graphql-middleware';
import { shield, rule, and } from 'graphql-shield';

// Define reusable auth rules
const isAuthenticated = rule()((parent, args, ctx) => ctx.user !== null);
const isAdmin = rule()((parent, args, ctx) => ctx.user?.role === 'ADMIN');

// Declare permissions per field
const permissions = shield({
  Query: {
    adminStats: and(isAuthenticated, isAdmin),
    myProfile: isAuthenticated,
    publicPosts: true  // no auth needed
  },
  Mutation: {
    createPost: isAuthenticated,
    deletePost: and(isAuthenticated, isAdmin)
  }
});

// Apply middleware to schema
const schemaWithPermissions = applyMiddleware(schema, permissions);`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Putting request-scoped data in module-level variables',
      wrong: `let currentUser: User | null = null;  // shared across ALL requests
const resolvers = { Query: { me: () => currentUser } }`,
      right: `// Pass user through context — isolated per request
const resolvers = { Query: { me: (_, __, { user }) => user } }`,
      explanation: 'Module-level variables are shared across concurrent requests — a critical data leak bug. Always pass request data through context.'
    },
    {
      title: 'Creating DataLoaders outside context',
      wrong: `// Global DataLoader — caches persist across requests
const userLoader = new DataLoader(batchFn);`,
      right: `// Create per-request in context function
context: async () => ({ loaders: { user: new DataLoader(batchFn) } })`,
      explanation: 'DataLoaders cache within a batch tick. Created globally, the cache leaks data across different users\' requests.'
    },
    {
      title: 'Not using parent data — redundant DB calls',
      wrong: `Post: {
  // Re-fetches post just to get authorId — parent already has it
  author: async (_, args, { db }) => {
    const post = await db.posts.findById(args.id);  // wrong
    return db.users.findById(post.authorId);
  }
}`,
      right: `Post: {
  // parent is the resolved Post object — use it directly
  author: (post, _, { db }) => db.users.findById(post.authorId)
}`,
      explanation: 'The first argument to a type resolver is the parent (resolved parent object). Use it instead of re-fetching from the database.'
    },
    {
      title: 'Returning undefined from a resolver',
      wrong: `post: async (_, { id }, { db }) => {
  const result = await db.posts.find(id);
  // Forgot to return — returns undefined implicitly
}`,
      right: `post: async (_, { id }, { db }) => {
  return db.posts.find(id);  // explicitly return
}`,
      explanation: 'Returning undefined from a resolver causes GraphQL to treat it as null (for nullable) or throw a non-null error. Always use explicit return statements.'
    },
    {
      title: 'Accessing info deeply without memoization',
      wrong: `// info.fieldNodes parsing on every request is expensive
const requestedFields = getRequestedFields(info);  // in every resolver`,
      right: `// Use graphql-parse-resolve-info or cache per-request
// Or restructure to avoid needing the info object in hot paths`,
      explanation: 'info.fieldNodes is a full query AST. Parsing it on every request in high-traffic resolvers is expensive. Use a library or cache the result.'
    }
  ];

  challenge: Challenge = {
    title: 'Resolver Chain with Context',
    language: 'typescript',
    description: 'Write resolver functions for: (1) `Query.post(id)` — verifies auth from context.user, fetches post from context.db, throws NOT_FOUND if missing; (2) `Post.author` — uses context.loaders.user DataLoader instead of direct DB call; (3) `Post.commentCount` — a computed field that returns context.db.comments.countByPostId(post.id).',
    hints: [
      'Query.post receives (_, { id }, { user, db })',
      'Post.author receives (post, _, { loaders })',
      'Post.commentCount receives (post, _, { db })',
      'Throw GraphQLError for NOT_FOUND with extensions.code'
    ],
    starterCode: `import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    post: async (_, { id }, context) => {
      // auth check, fetch, not found
    }
  },
  Post: {
    author: async (post, _, context) => {
      // use DataLoader
    },
    commentCount: async (post, _, context) => {
      // computed field
    }
  }
};`,
    solution: `import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    post: async (_, { id }, { user, db }) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      const post = await db.posts.findById(id);
      if (!post) throw new GraphQLError(\`Post \${id} not found\`, {
        extensions: { code: 'NOT_FOUND' }
      });
      return post;
    }
  },
  Post: {
    author: (post, _, { loaders }) => loaders.user.load(post.authorId),
    commentCount: (post, _, { db }) => db.comments.countByPostId(post.id)
  }
};`
  };

  quiz: QuizQuestion[] = [
    { q: 'What are the four parameters a resolver receives?', options: ['query, variables, auth, schema', 'parent, args, context, info', 'root, fields, headers, request', 'type, name, value, path'], answer: 1, explanation: 'Every resolver receives: parent (resolved parent value), args (field arguments), context (request-scoped shared object), info (query AST metadata).' },
    { q: 'What is the default resolver behavior?', options: ['Returns null', 'Calls the database', 'Returns parent[fieldName]', 'Throws an error'], answer: 2, explanation: 'GraphQL\'s default resolver returns `parent[fieldName]`. You only need a custom resolver when this simple property access is insufficient.' },
    { q: 'Where should DataLoaders be created?', options: ['At module level (once per server)', 'Inside each resolver function', 'In the context function (once per request)', 'In the schema definition'], answer: 2, explanation: 'DataLoaders must be created per-request in the context function. Creating them at module level causes their cache to leak data across different users\' requests.' },
    { q: 'What is `parent` in a type resolver like `Post.author`?', options: ['The Query type', 'The null value', 'The resolved Post object returned by the parent resolver', 'The args object'], answer: 2, explanation: '`parent` in `Post.author` is the Post object resolved by the Query.post (or posts) resolver. Use it to access post.authorId without an extra DB query.' },
    { q: 'What happens when a resolver returns undefined?', options: ['GraphQL retries automatically', 'The field is omitted from the response', 'GraphQL treats it as null (or propagates error if non-null)', 'The request is rejected'], answer: 2, explanation: 'undefined is treated the same as null — it\'s a valid absent value for nullable fields. For non-null fields, returning undefined/null causes error propagation.' },
    { q: 'What does mergeResolvers do?', options: ['Merges type definitions and resolvers', 'Combines multiple resolver maps into one', 'Merges duplicate fields', 'Validates resolver signatures'], answer: 1, explanation: 'mergeResolvers from @graphql-tools/merge combines multiple resolver map objects into a single map. Useful for splitting a large resolver file into domain-specific files.' }
  ];

  qna: QnaItem[] = [
    { q: 'What is the info argument used for?', a: 'info contains the field name, return type, path to the field, and the AST of the query. It\'s used for query-aware optimizations: checking which sub-fields are requested (to avoid fetching unused data), getting the field path for error reporting, or schema stitching.' },
    { q: 'Can resolvers call each other?', a: 'Not directly — resolvers are functions that GraphQL calls independently. You can share business logic by extracting it into service functions and calling those from multiple resolvers.' },
    { q: 'What is graphql-middleware?', a: 'graphql-middleware lets you wrap resolvers with middleware functions (similar to Express middleware). Each middleware receives (resolve, parent, args, context, info) and can modify args, check permissions, log, or short-circuit.' },
    { q: 'How do I split resolvers across multiple files?', a: 'Export a resolver map from each domain file, then merge with mergeResolvers from @graphql-tools/merge. Example: `const resolvers = mergeResolvers([userResolvers, postResolvers, commentResolvers])`.' },
    { q: 'Can a resolver return a plain object for a type?', a: 'Yes — resolvers return plain JavaScript objects, not GraphQL type instances. GraphQL maps the object\'s properties to the type\'s fields using the resolver chain.' },
    { q: 'What is a rootValue in GraphQL?', a: 'rootValue is an optional value passed as the `parent` for all root resolvers (Query, Mutation). It\'s rarely used in schema-first GraphQL — context is the preferred way to share request-scoped data.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Resolvers are the engine of GraphQL — (parent, args, context, info) maps each field to data, with context carrying all request-scoped dependencies.',
    mustKnow: [
      'Four params: parent, args, context, info',
      'Default resolver: returns parent[fieldName] — no code needed for simple fields',
      'Context is created fresh per request — never use module-level mutable state',
      'DataLoaders must be per-request (created in context function)',
      'parent in type resolvers is the resolved parent object — use it to avoid redundant DB calls',
      'mergeResolvers combines resolver maps from multiple files'
    ],
    interviewFocus: [
      'Explain the four resolver parameters and what each is used for',
      'Why must DataLoaders be created in the context function, not at module level?',
      'What is the default resolver and when do you need to override it?'
    ]
  };
}
