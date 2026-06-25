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
  selector: 'app-gql-auth',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class GqlAuth {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'context', desc: 'Request-scoped object — place verified user here for all resolvers' },
    { type: 'keyword', name: 'JWT', desc: 'JSON Web Token — signed, self-contained auth credential sent in Authorization header' },
    { type: 'keyword', name: '@auth directive', desc: 'Schema directive for declarative field-level auth without per-resolver checks' },
    { type: 'keyword', name: 'graphql-shield', desc: 'Permission layer — define rules that wrap resolvers (similar to Express middleware)' },
    { type: 'keyword', name: 'rule()', desc: 'graphql-shield: define a reusable auth check function' },
    { type: 'keyword', name: 'shield()', desc: 'graphql-shield: compose rules into a permission map matching the resolver map' },
    { type: 'keyword', name: 'UNAUTHENTICATED', desc: 'Standard extensions.code for missing/invalid credentials' },
    { type: 'keyword', name: 'FORBIDDEN', desc: 'Standard extensions.code for authenticated but unauthorized access' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Auth via Context',
      points: [
        'The recommended pattern: verify the JWT/token in the context function and attach the user to context.',
        'Resolvers check `context.user` — if null, throw UNAUTHENTICATED. If present but lacking role, throw FORBIDDEN.',
        'Context runs once per request, so auth verification happens once regardless of how many resolvers run.',
        'Never block all requests in context — let unauthenticated requests through so public fields still resolve.'
      ]
    },
    {
      heading: 'Directive-Based Auth',
      points: [
        'A custom @auth schema directive moves auth checks from resolvers to the schema, reducing boilerplate.',
        'Declare: `directive @auth(requires: Role = USER) on FIELD_DEFINITION | OBJECT`.',
        'The transformer wraps each decorated resolver with a role check before calling the original.',
        'Directive auth is declarative and visible in the schema — anyone reading the schema can see which fields are protected.'
      ]
    },
    {
      heading: 'graphql-shield',
      points: [
        'graphql-shield provides a composable permission layer with `rule()`, `and()`, `or()`, `not()`, and `shield()`.',
        'Rules are memoized per request by default — the same rule called multiple times in one request only executes once.',
        'Permissions are defined as a map mirroring the resolver map — clear separation of auth from business logic.',
        'Shield integrates as an applyMiddleware call on the schema — no changes to individual resolvers needed.'
      ]
    },
    {
      heading: 'Field-Level vs Type-Level Auth',
      points: [
        'Field-level: `email @auth` — only this field is protected. Good for sensitive fields on otherwise public types.',
        'Type-level: `type AdminDashboard @auth(requires: ADMIN)` — all fields on this type require the role.',
        'Combining both: type-level sets a baseline; individual fields can override with stricter or looser requirements.',
        'Always default to deny — protect fields by default and explicitly open public ones, not the reverse.'
      ]
    },
    {
      heading: 'Mutation Auth',
      points: [
        'Mutations almost always require auth. Check context.user at the start of every write resolver.',
        'Ownership checks are common: verify `post.authorId === context.user.id` before allowing updates/deletes.',
        'Never expose admin mutations in the schema without protection — even a declared-but-unprotected field is discoverable via introspection.',
        'For complex permission logic, extract to a dedicated authz service or use graphql-shield rules that call your policy engine.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Context Auth',
      language: 'typescript',
      code: `import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

// Context: verify token, attach user
async function createContext({ req }: { req: Request }) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  let user = null;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET!) as User;
    } catch {
      // Invalid token — treat as unauthenticated (don't throw here)
      // Throwing here blocks ALL requests including public fields
    }
  }

  return { user, db: prisma };
}

// Resolver: check user
const resolvers = {
  Query: {
    myProfile: (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      return user;
    },
    adminStats: (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      if (user.role !== 'ADMIN') throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' }
      });
      return computeStats();
    }
  }
};`
    },
    {
      label: '@auth Directive',
      language: 'typescript',
      code: `import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';

const typeDefs = \`
  enum Role { ADMIN EDITOR USER }
  directive @auth(requires: Role = USER) on FIELD_DEFINITION | OBJECT

  type Query {
    publicPosts: [Post!]!
    myProfile: User @auth
    adminDashboard: AdminData @auth(requires: ADMIN)
  }
\`;

function authDirectiveTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const auth = getDirective(schema, fieldConfig, 'auth')?.[0];
      if (!auth) return fieldConfig;

      const requiredRole: string = auth.requires ?? 'USER';
      const { resolve = defaultFieldResolver } = fieldConfig;

      const ROLE_LEVELS: Record<string, number> = { USER: 1, EDITOR: 2, ADMIN: 3 };

      return {
        ...fieldConfig,
        async resolve(source, args, context, info) {
          const user = context.user;
          if (!user) throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
          if ((ROLE_LEVELS[user.role] ?? 0) < (ROLE_LEVELS[requiredRole] ?? 0)) {
            throw new GraphQLError('Insufficient permissions', {
              extensions: { code: 'FORBIDDEN', requires: requiredRole }
            });
          }
          return resolve(source, args, context, info);
        }
      };
    }
  });
}

let schema = makeExecutableSchema({ typeDefs, resolvers });
schema = authDirectiveTransformer(schema);`
    },
    {
      label: 'graphql-shield',
      language: 'typescript',
      code: `import { rule, shield, and, or, not } from 'graphql-shield';
import { applyMiddleware } from 'graphql-middleware';

// Rules
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx) => ctx.user !== null || 'Not authenticated'
);

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx) => ctx.user?.role === 'ADMIN' || 'Admin only'
);

const isOwner = rule({ cache: 'strict' })(
  async (parent, args, ctx) => {
    const post = await ctx.db.posts.findById(args.id);
    return post?.authorId === ctx.user?.id || 'Not your post';
  }
);

// Permission map
const permissions = shield({
  Query: {
    publicPosts: not(isAdmin),   // example: not rule
    myProfile: isAuthenticated,
    adminDashboard: and(isAuthenticated, isAdmin)
  },
  Mutation: {
    createPost: isAuthenticated,
    updatePost: and(isAuthenticated, or(isAdmin, isOwner)),
    deletePost: and(isAuthenticated, or(isAdmin, isOwner))
  }
}, {
  fallbackRule: not(isAuthenticated),  // deny unauthenticated by default
  allowExternalErrors: true
});

const schema = applyMiddleware(executableSchema, permissions);`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Throwing in context when token is invalid',
      wrong: `context: async ({ req }) => {
  const token = getToken(req);
  const user = jwt.verify(token, SECRET);  // throws if invalid — blocks ALL requests
  return { user };
}`,
      right: `context: async ({ req }) => {
  const token = getToken(req);
  let user = null;
  try { user = jwt.verify(token, SECRET) as User; } catch {}
  return { user };
}`,
      explanation: 'Throwing in context blocks every request including public fields. Catch JWT errors silently and let resolvers decide whether auth is required.'
    },
    {
      title: 'Not checking ownership on mutations',
      wrong: `updatePost: async (_, { id, input }, { user }) => {
  if (!user) throw new Error('Not authenticated');
  return db.posts.update(id, input);  // any authenticated user can update any post!
}`,
      right: `updatePost: async (_, { id, input }, { user }) => {
  if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const post = await db.posts.findById(id);
  if (post.authorId !== user.id && user.role !== 'ADMIN') {
    throw new GraphQLError('Not your post', { extensions: { code: 'FORBIDDEN' } });
  }
  return db.posts.update(id, input);
}`,
      explanation: 'Authentication (who are you?) is not authorization (can you do this?). Always check resource ownership for mutations.'
    },
    {
      title: 'Putting sensitive fields on public types without protection',
      wrong: `type User { id: ID!; name: String!; email: String!; passwordHash: String! }
# passwordHash is exposed to anyone who queries User`,
      right: `type User { id: ID!; name: String!; email: String! @auth }
# Remove passwordHash entirely — never expose it`,
      explanation: 'Never include sensitive fields in the schema without protection. Better yet, never include fields like passwordHash at all — they should not be in the API layer.'
    },
    {
      title: 'Using HTTP 401/403 responses instead of GraphQL error codes',
      wrong: `res.status(401).json({ error: 'Unauthorized' })`,
      right: `throw new GraphQLError('Not authenticated', {
  extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } }
})`,
      explanation: 'GraphQL errors should be in the errors array with extensions.code. Apollo Server v4 also supports setting HTTP status via extensions.http for cases where clients need it.'
    },
    {
      title: 'Default allow in graphql-shield',
      wrong: `const permissions = shield({ Mutation: { deletePost: isAdmin } })
// All other fields are public by default — dangerous`,
      right: `const permissions = shield({ ... }, {
  fallbackRule: deny,  // deny everything not explicitly allowed
  // OR: fallbackRule: isAuthenticated
})`,
      explanation: 'graphql-shield defaults to allow when no rule matches. Set fallbackRule to deny or isAuthenticated to enforce least-privilege by default.'
    }
  ];

  challenge: Challenge = {
    title: 'Implement Role-Based @auth Directive',
    language: 'typescript',
    description: 'Build a complete `@auth(requires: Role!)` directive transformer. Define roles VIEWER < EDITOR < ADMIN with numeric levels. The transformer should: check user exists (UNAUTHENTICATED), check role level (FORBIDDEN), and include the required role in FORBIDDEN error extensions.',
    hints: [
      'ROLE_LEVELS map: VIEWER: 1, EDITOR: 2, ADMIN: 3',
      'if (!user) throw UNAUTHENTICATED',
      'if (ROLE_LEVELS[user.role] < ROLE_LEVELS[requires]) throw FORBIDDEN',
      'Include { code: "FORBIDDEN", requires: requiredRole } in extensions'
    ],
    starterCode: `import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError } from 'graphql';

const ROLE_LEVELS = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };

function authDirectiveTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // TODO: get directive, check role, wrap resolver
    }
  });
}`,
    solution: `import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError } from 'graphql';

const ROLE_LEVELS: Record<string, number> = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };

function authDirectiveTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const auth = getDirective(schema, fieldConfig, 'auth')?.[0];
      if (!auth) return fieldConfig;

      const requiredRole = auth.requires ?? 'VIEWER';
      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        async resolve(source, args, context, info) {
          const { user } = context;
          if (!user) {
            throw new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' }
            });
          }
          const userLevel = ROLE_LEVELS[user.role] ?? 0;
          const requiredLevel = ROLE_LEVELS[requiredRole] ?? 0;
          if (userLevel < requiredLevel) {
            throw new GraphQLError('Insufficient permissions', {
              extensions: { code: 'FORBIDDEN', requires: requiredRole }
            });
          }
          return resolve(source, args, context, info);
        }
      };
    }
  });
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'Where should JWT verification happen in a GraphQL server?', options: ['In every resolver', 'In the context function, once per request', 'In the schema transformer', 'In the HTTP middleware only'], answer: 1, explanation: 'Verify the token in the context function — it runs once per request. Attach the user to context so all resolvers can check it without re-verifying.' },
    { q: 'What should you do when JWT verification fails in context?', options: ['Throw and block all requests', 'Return a 401 HTTP response', 'Catch silently and set user to null', 'Restart the server'], answer: 2, explanation: 'Catch JWT errors silently and set user to null. Throwing in context blocks every request, including public fields. Let individual resolvers enforce auth requirements.' },
    { q: 'What error code should an unauthenticated access produce?', options: ['NOT_FOUND', 'FORBIDDEN', 'UNAUTHENTICATED', 'BAD_USER_INPUT'], answer: 2, explanation: 'UNAUTHENTICATED (extensions.code) maps to a 401-equivalent — the user is not logged in. FORBIDDEN (403-equivalent) means logged in but lacks permission.' },
    { q: 'What is graphql-shield\'s default behavior when no rule matches a field?', options: ['Deny access', 'Allow access', 'Throw an internal error', 'Log a warning'], answer: 1, explanation: 'graphql-shield defaults to allow when no permission rule matches. Always set fallbackRule to deny or isAuthenticated to enforce least-privilege.' },
    { q: 'What is the difference between authentication and authorization in GraphQL?', options: ['No difference', 'Authentication: who are you; Authorization: what can you do', 'Authentication is done at HTTP level only', 'Authorization only applies to mutations'], answer: 1, explanation: 'Authentication establishes identity (JWT verification). Authorization determines what the identified user can do (role checks, ownership checks).' },
    { q: 'What advantage does directive-based auth have over per-resolver checks?', options: ['It is faster', 'It is declarative and visible in the schema', 'It does not require context', 'It works without a schema'], answer: 1, explanation: 'Schema directives (@auth) make permissions declarative and self-documenting — anyone reading the SDL can see which fields require which roles without reading resolver code.' }
  ];

  qna: QnaItem[] = [
    { q: 'Should I disable introspection for security?', a: 'In production, yes — it prevents attackers from discovering your full schema. Keep it enabled in development. Some teams use authentication on introspection (require a token) as a middle ground.' },
    { q: 'Can I use OAuth with GraphQL?', a: 'Yes. The OAuth flow (redirects, token exchange) happens outside GraphQL (via REST endpoints or a separate auth service). Once you have an OAuth access token, include it as a Bearer token in GraphQL requests and verify it in context.' },
    { q: 'What is the difference between @auth directive and graphql-shield?', a: '@auth is a custom directive you implement via schema transformer — declarative, visible in SDL. graphql-shield is a middleware library with composable rules (and/or/not), caching, and a permission map. Use @auth for simple role checks; graphql-shield for complex permission logic.' },
    { q: 'How do I handle auth for WebSocket subscriptions?', a: 'HTTP Authorization headers are unavailable after the WebSocket upgrade. Pass the auth token in connectionParams when establishing the WebSocket connection. The server reads it in the onConnect callback and attaches the user to the subscription context.' },
    { q: 'Should I authenticate in the HTTP middleware or in GraphQL context?', a: 'Both can work, but GraphQL context is preferred — it keeps auth logic co-located with resolvers, makes it easier to test, and handles the case where multiple transport layers (HTTP, WebSocket) use the same auth logic.' },
    { q: 'How do I protect subscriptions?', a: 'In the graphql-ws useServer config, the context function receives connectionParams. Verify the token there and attach the user. Then subscription resolvers check context.user just like query/mutation resolvers.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Auth in GraphQL: verify once in context, check in resolvers or directive transformer, use graphql-shield for composable rules.',
    mustKnow: [
      'Verify JWT in context function — don\'t throw on invalid token, set user = null',
      'UNAUTHENTICATED (missing/invalid credentials) vs FORBIDDEN (lacks permission)',
      '@auth directive makes auth declarative and visible in the schema',
      'graphql-shield: rule() + shield() + applyMiddleware for composable permission layer',
      'Always check ownership for mutations — auth ≠ authorization',
      'Default deny (fallbackRule) is safer than default allow in graphql-shield'
    ],
    interviewFocus: [
      'How do you implement JWT auth in a GraphQL server?',
      'Explain the difference between UNAUTHENTICATED and FORBIDDEN',
      'What are the trade-offs between directive-based auth and graphql-shield?'
    ]
  };
}
