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
  selector: 'app-gql-apollo-server',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './apollo-server.html',
  styleUrl: './apollo-server.scss'
})
export class GqlApolloServer {
  quickRef: QuickRefItem[] = [
    { type: 'class', name: 'ApolloServer', desc: 'Core server class — accepts schema/typeDefs+resolvers, plugins, formatError' },
    { type: 'method', name: 'server.start()', desc: 'Initialize the server — must be called before middleware is applied' },
    { type: 'method', name: 'expressMiddleware(server, opts)', desc: 'Attach Apollo to Express app — handles /graphql endpoint' },
    { type: 'method', name: 'startStandaloneServer(server)', desc: 'Quick-start helper — creates an HTTP server without Express' },
    { type: 'keyword', name: 'plugins', desc: 'Lifecycle hooks for request, response, error, operation — used for logging, caching, auth' },
    { type: 'keyword', name: 'ApolloServerPlugin', desc: 'Interface for writing custom plugins with request/field lifecycle hooks' },
    { type: 'method', name: 'formatError(formattedError, error)', desc: 'Transforms errors before sending to clients — sanitize stack traces' },
    { type: 'method', name: 'executeOperation()', desc: 'Test helper — run a query without HTTP, returns { body }' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Apollo Server v4 Architecture',
      points: [
        'Apollo Server 4 is framework-agnostic. The core handles GraphQL execution; adapters (expressMiddleware, fastifyMiddleware) wire it to HTTP frameworks.',
        'The setup flow: instantiate ApolloServer → call server.start() → apply expressMiddleware to a route.',
        'startStandaloneServer() is a quick-start that bundles an HTTP server — great for demos but limits flexibility.',
        'For production, use expressMiddleware with a custom Express/Fastify setup for full control over middleware, CORS, and subscriptions.'
      ]
    },
    {
      heading: 'Schema Options',
      points: [
        'Two ways to provide the schema: typeDefs + resolvers (schema-first), or a pre-built GraphQLSchema object (code-first).',
        'typeDefs can be a string, DocumentNode (from gql tag), or an array to compose from multiple files.',
        'makeExecutableSchema from @graphql-tools/schema combines typeDefs and resolvers into a GraphQLSchema.',
        'For large schemas, use mergeTypeDefs + mergeResolvers to modularize across many files.'
      ]
    },
    {
      heading: 'Plugins',
      points: [
        'Plugins extend Apollo Server lifecycle: onRequestStart, willSendResponse, didEncounterErrors, requestDidStart, etc.',
        'Built-in plugins: ApolloServerPluginDrainHttpServer (graceful shutdown), ApolloServerPluginLandingPageLocalDefault (GraphiQL).',
        'Custom plugins log queries, trace performance, block denied operations, or integrate with APM tools.',
        'Plugin methods receive a requestContext with the operation, schema, context, errors, and response.'
      ]
    },
    {
      heading: 'Context Function',
      points: [
        'Context is a function (not a value) that runs per request. In expressMiddleware: `context: async ({ req }) => ({ user, db })`.',
        'Context receives the raw request — use it to extract auth headers, IP, locale, etc.',
        'Type the context with TypeScript generics: `ApolloServer<MyContext>` and `expressMiddleware<MyContext>`.',
        'Context must be a function returning a plain object. Class instances with methods are fine but can cause issues with some tools.'
      ]
    },
    {
      heading: 'Testing with executeOperation',
      points: [
        'Apollo Server 4 includes a test utility: `server.executeOperation({ query, variables })` runs the full stack without HTTP.',
        'Returns `{ body: { kind: "single", singleResult: { data, errors } } }` — check singleResult for assertions.',
        'Create context manually for testing: `executeOperation({ query }, { contextValue: { user: mockUser, db: mockDb } })`.',
        'Prefer executeOperation over mocking individual resolvers — it tests the full request path including plugins and formatError.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Express Setup',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [
    // Graceful shutdown — waits for in-flight requests
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ],
  formatError: (formattedError) => {
    // Strip stacktrace in production
    if (process.env.NODE_ENV === 'production') {
      const { extensions, message, path } = formattedError;
      return { message, path, extensions: { code: extensions?.code } };
    }
    return formattedError;
  }
});

await server.start();

app.use('/graphql',
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization?.slice(7) ?? '';
      const user = await verifyToken(token).catch(() => null);
      return { user, db: prisma };
    }
  })
);

await new Promise<void>(resolve => httpServer.listen({ port: 4000 }, resolve));
console.log('Server ready at http://localhost:4000/graphql');`
    },
    {
      label: 'Custom Plugin',
      language: 'typescript',
      code: `import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';

// Plugin that logs all operations and their duration
const LoggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    const start = Date.now();
    const operationName = requestContext.request.operationName ?? 'anonymous';
    console.log(\`[GQL] Operation: \${operationName}\`);

    return {
      async didEncounterErrors({ errors }) {
        console.error(\`[GQL] Errors in \${operationName}:\`, errors);
      },
      async willSendResponse() {
        const ms = Date.now() - start;
        console.log(\`[GQL] \${operationName} completed in \${ms}ms\`);
      }
    };
  }
};

// Deny introspection in production
const NoIntrospectionPlugin: ApolloServerPlugin = {
  async requestDidStart({ request }) {
    return {
      async didResolveOperation({ operation }) {
        if (
          process.env.NODE_ENV === 'production' &&
          operation?.selectionSet.selections.some(
            (sel) => sel.kind === 'Field' && sel.name.value.startsWith('__')
          )
        ) {
          throw new GraphQLError('Introspection disabled');
        }
      }
    };
  }
};

const server = new ApolloServer({ typeDefs, resolvers, plugins: [LoggingPlugin, NoIntrospectionPlugin] });`
    },
    {
      label: 'Testing',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';

// Test setup — no HTTP, no network
const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

// Execute a query directly
const GET_POST = \`
  query GetPost($id: ID!) {
    post(id: $id) { id title author { name } }
  }
\`;

const response = await server.executeOperation(
  { query: GET_POST, variables: { id: 'post-1' } },
  {
    contextValue: {
      user: { id: 'user-1', role: 'ADMIN' },
      db: mockDb
    }
  }
);

// Type-narrow the response
if (response.body.kind === 'single') {
  const { data, errors } = response.body.singleResult;
  expect(errors).toBeUndefined();
  expect(data?.post.title).toBe('Expected Title');
}

await server.stop();`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not calling server.start() before middleware',
      wrong: `const server = new ApolloServer({ typeDefs, resolvers });
app.use('/graphql', expressMiddleware(server));  // server not started!`,
      right: `const server = new ApolloServer({ typeDefs, resolvers });
await server.start();  // must await
app.use('/graphql', expressMiddleware(server));`,
      explanation: 'expressMiddleware requires the server to be started first. Omitting await server.start() causes a runtime error on the first request.'
    },
    {
      title: 'Using Apollo Server v3 APIs in v4',
      wrong: `// v3 pattern — doesn't exist in v4
new ApolloServer({ typeDefs, resolvers, context: () => ({ user }) })`,
      right: `// v4: context goes in expressMiddleware, not ApolloServer
new ApolloServer({ typeDefs, resolvers });
expressMiddleware(server, { context: async ({ req }) => ({ user }) })`,
      explanation: 'Apollo Server 4 moved context, cors, and bodyParser out of ApolloServer and into the framework adapter (expressMiddleware).'
    },
    {
      title: 'Not draining the HTTP server on shutdown',
      wrong: `// Process exits abruptly, in-flight requests are killed
process.on('SIGTERM', () => process.exit());`,
      right: `plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
// Apollo handles SIGTERM gracefully — waits for in-flight requests`,
      explanation: 'Without ApolloServerPluginDrainHttpServer, the process exits while requests are in flight. The plugin waits for all pending requests before shutting down.'
    },
    {
      title: 'Setting context as an object instead of a function',
      wrong: `// Context evaluated once at startup — not per request!
expressMiddleware(server, { context: { user: getUser() } })`,
      right: `expressMiddleware(server, { context: async ({ req }) => ({ user: getUser(req) }) })`,
      explanation: 'Context must be a function (async or sync) that returns a new object per request. A static object would share state across all requests.'
    },
    {
      title: 'Not handling subscription cleanup in plugins',
      wrong: `// No drain plugin — subscriptions hold open connections during restart`,
      right: `import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { useServer } from 'graphql-ws/lib/use/ws';

// Drain both HTTP and WebSocket servers
const serverCleanup = useServer({ schema }, wsServer);
plugins: [
  ApolloServerPluginDrainHttpServer({ httpServer }),
  { async serverWillStart() { return { async drainServer() { await serverCleanup.dispose(); } }; } }
]`,
      explanation: 'For servers with subscriptions, you must also drain the WebSocket server on shutdown. Use a custom plugin that calls the graphql-ws cleanup function.'
    }
  ];

  challenge: Challenge = {
    title: 'Add a Performance Logging Plugin',
    language: 'typescript',
    description: 'Write an Apollo Server plugin `PerformancePlugin` that: (1) logs the operation name and start time on requestDidStart, (2) logs the duration in milliseconds on willSendResponse, (3) on didEncounterErrors, logs the error count and operation name. Use ApolloServerPlugin type from @apollo/server.',
    hints: [
      'requestDidStart receives requestContext with request.operationName',
      'Store start = Date.now() in requestDidStart closure',
      'willSendResponse is a lifecycle hook returned from requestDidStart',
      'didEncounterErrors receives { errors } array'
    ],
    starterCode: `import { ApolloServerPlugin } from '@apollo/server';

const PerformancePlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    // capture start time and operation name
    // return object with willSendResponse and didEncounterErrors
  }
};`,
    solution: `import { ApolloServerPlugin } from '@apollo/server';

const PerformancePlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    const start = Date.now();
    const op = requestContext.request.operationName ?? 'anonymous';
    console.log(\`[GQL] Start: \${op}\`);

    return {
      async willSendResponse() {
        const ms = Date.now() - start;
        console.log(\`[GQL] End: \${op} (\${ms}ms)\`);
      },
      async didEncounterErrors({ errors }) {
        console.error(\`[GQL] \${errors.length} error(s) in \${op}:\`, errors.map(e => e.message));
      }
    };
  }
};`
  };

  quiz: QuizQuestion[] = [
    { q: 'What must you do before calling expressMiddleware?', options: ['Call server.stop()', 'Call await server.start()', 'Apply CORS manually', 'Import the schema'], answer: 1, explanation: 'expressMiddleware requires the server to be initialized first. You must await server.start() before attaching the middleware.' },
    { q: 'Where does the context function go in Apollo Server v4?', options: ['In ApolloServer constructor', 'In expressMiddleware options', 'In the plugin', 'In the schema'], answer: 1, explanation: 'Apollo Server v4 moved context from the ApolloServer constructor to the framework adapter: `expressMiddleware(server, { context: async ({ req }) => ... })`.' },
    { q: 'What does ApolloServerPluginDrainHttpServer do?', options: ['Enables subscriptions', 'Gracefully waits for in-flight requests before shutdown', 'Applies CORS headers', 'Caches responses'], answer: 1, explanation: 'ApolloServerPluginDrainHttpServer ensures the server waits for all in-flight HTTP requests to complete before shutting down on SIGTERM/SIGINT.' },
    { q: 'How do you test Apollo Server without HTTP?', options: ['Use supertest', 'Use executeOperation()', 'Use nock to mock HTTP', 'Use curl'], answer: 1, explanation: 'server.executeOperation({ query, variables }, { contextValue }) runs the full GraphQL stack without an HTTP server — ideal for unit and integration tests.' },
    { q: 'What is a plugin in Apollo Server?', options: ['An npm package extending typeDefs', 'An object with lifecycle hooks for requests, errors, and responses', 'A schema directive', 'A resolver wrapper'], answer: 1, explanation: 'Plugins are objects implementing lifecycle hooks (requestDidStart, willSendResponse, didEncounterErrors, etc.) that let you add cross-cutting behavior without modifying resolvers.' },
    { q: 'What does startStandaloneServer do?', options: ['Starts a WebSocket-only server', 'Creates a bundled HTTP server without Express', 'Starts Apollo in cluster mode', 'Disables subscriptions'], answer: 1, explanation: 'startStandaloneServer is a convenience function that creates and starts an HTTP server with Apollo Server in one call — good for prototyping, but less flexible than expressMiddleware.' }
  ];

  qna: QnaItem[] = [
    { q: 'What changed from Apollo Server 3 to 4?', a: 'Key changes: context moved from ApolloServer to expressMiddleware; cors/bodyParser removed from ApolloServer (pass your own); introspection on by default in all environments; plugin API updated; the server is now framework-agnostic by design.' },
    { q: 'Can I use Apollo Server with Fastify instead of Express?', a: 'Yes. Use @as-integrations/fastify or @apollo/server/fastify4 adapters. The setup is similar: instantiate ApolloServer, call start(), then register the Fastify plugin.' },
    { q: 'How do I enable GraphiQL in Apollo Server v4?', a: 'ApolloServerPluginLandingPageLocalDefault is the built-in plugin for the Apollo Sandbox. In production, use ApolloServerPluginLandingPageProductionDefault or disable the landing page entirely.' },
    { q: 'How do I add request ID to every response for correlation?', a: 'Use a plugin: in requestDidStart, generate or read a request ID. In willSendResponse, add it to response.http.headers. Also include it in formatError\'s extensions for error correlation.' },
    { q: 'Can Apollo Server serve both REST and GraphQL on the same port?', a: 'Yes. Mount expressMiddleware at `/graphql` and add normal Express routes for `/health`, `/metrics`, etc. They share the same HTTP server.' },
    { q: 'What is the Apollo Gateway and how does it relate to Apollo Server?', a: 'Apollo Gateway is a specialized Apollo Server that acts as a query planner for a federated graph (composed of subgraphs). Subgraphs are regular Apollo Server instances; the gateway sits in front and routes queries across them.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Apollo Server v4 is framework-agnostic — start the server, attach expressMiddleware, configure context there, and use plugins for cross-cutting behavior.',
    mustKnow: [
      'await server.start() must come before expressMiddleware',
      'Context is a function in expressMiddleware options, not ApolloServer constructor (v4 change)',
      'ApolloServerPluginDrainHttpServer for graceful shutdown',
      'Plugins provide request lifecycle hooks (requestDidStart, willSendResponse, didEncounterErrors)',
      'executeOperation() for testing without HTTP',
      'formatError sanitizes errors — strip stacktraces in production'
    ],
    interviewFocus: [
      'What changed in Apollo Server v4 vs v3 for context and middleware?',
      'How do you write a custom Apollo Server plugin?',
      'How do you test a GraphQL server without making HTTP requests?'
    ]
  };
}
