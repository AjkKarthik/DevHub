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
  selector: 'app-gql-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing.html',
  styleUrl: './testing.scss'
})
export class GqlTesting {
  quickRef: QuickRefItem[] = [
    { type: 'method', name: 'server.executeOperation()', desc: 'Apollo Server 4 test utility — runs a query without HTTP' },
    { type: 'method', name: 'MockedProvider', desc: 'Apollo Client test component — intercepts queries and returns mock data' },
    { type: 'keyword', name: 'addMocksToSchema', desc: 'graphql-tools: adds automatic mock resolvers to a schema for testing' },
    { type: 'keyword', name: 'mockServer()', desc: 'graphql-tools: creates a mock server from a schema for unit tests' },
    { type: 'keyword', name: 'supertest', desc: 'HTTP integration testing library — sends real HTTP requests to the server' },
    { type: 'method', name: 'makeExecutableSchema', desc: 'Build a GraphQLSchema from typeDefs + resolvers for unit testing resolvers directly' },
    { type: 'keyword', name: 'nock', desc: 'HTTP mocking library — intercepts fetch/axios calls for testing GraphQL clients' },
    { type: 'keyword', name: 'jest.fn()', desc: 'Mock a resolver function to assert it was called with the right args' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Testing Pyramid for GraphQL',
      points: [
        'Unit tests: test individual resolver functions in isolation with mocked context and DB.',
        'Integration tests: test the full request path through the schema — no mocked resolvers.',
        'E2E tests: send real HTTP requests to a running server with a test database.',
        'Apollo Server\'s executeOperation bridges unit and integration: runs full schema resolution without HTTP.'
      ]
    },
    {
      heading: 'Unit Testing Resolvers',
      points: [
        'Resolver functions are plain JavaScript — test them directly by calling them with mock arguments.',
        'Mock the context object (db, user, loaders) using jest.fn() or a test factory.',
        'Test success path, not-found path, auth failure path, and error paths separately.',
        'Keep resolver functions small and testable — business logic in service functions is easier to test than in resolvers.'
      ]
    },
    {
      heading: 'Integration Testing with executeOperation',
      points: [
        'server.executeOperation({ query, variables }, { contextValue }) runs the full GraphQL stack without HTTP.',
        'Catches issues that unit tests miss: schema validation, resolver chain ordering, directive effects.',
        'Use a real (or in-memory) database in integration tests — mocking the DB at this level defeats the purpose.',
        'Call server.start() in beforeAll and server.stop() in afterAll to manage lifecycle in Jest.'
      ]
    },
    {
      heading: 'Testing Apollo Client Components',
      points: [
        'MockedProvider from @apollo/client/testing intercepts queries and returns mock responses without a network.',
        'Provide mocks as `[{ request: { query, variables }, result: { data } }]`.',
        'Test loading state, success state, and error state separately — mock can return an error result.',
        'Use waitFor from @testing-library/react to wait for async query resolution before asserting.'
      ]
    },
    {
      heading: 'Mocking Schemas',
      points: [
        'addMocksToSchema adds default scalar resolvers (random strings, numbers, booleans) to any schema.',
        'Override specific mocks: `mocks: { User: () => ({ name: "Alice" }) }` for predictable test data.',
        'Useful for contract testing: generate random data to test every type is resolvable.',
        'buildClientSchema + addMocksToSchema can create a mock server from an introspection JSON — test clients against it.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unit Test Resolver',
      language: 'typescript',
      code: `import { resolvers } from '../resolvers';
import { GraphQLError } from 'graphql';

// Mock context factory
const mockContext = (overrides = {}) => ({
  user: { id: 'user-1', role: 'USER' },
  db: {
    posts: {
      findById: jest.fn(),
      create: jest.fn()
    }
  },
  loaders: {
    user: { load: jest.fn() }
  },
  ...overrides
});

describe('Query.post', () => {
  it('returns post when found', async () => {
    const post = { id: 'p1', title: 'Test', authorId: 'user-1' };
    const ctx = mockContext({ db: { posts: { findById: jest.fn().mockResolvedValue(post) } } });

    const result = await resolvers.Query.post(null, { id: 'p1' }, ctx, null as any);
    expect(result).toEqual(post);
    expect(ctx.db.posts.findById).toHaveBeenCalledWith('p1');
  });

  it('throws NOT_FOUND when post missing', async () => {
    const ctx = mockContext({ db: { posts: { findById: jest.fn().mockResolvedValue(null) } } });

    await expect(resolvers.Query.post(null, { id: 'p1' }, ctx, null as any))
      .rejects.toThrow(GraphQLError);
  });

  it('throws UNAUTHENTICATED when no user', async () => {
    const ctx = mockContext({ user: null });
    await expect(resolvers.Query.post(null, { id: 'p1' }, ctx, null as any))
      .rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});`
    },
    {
      label: 'Integration Test (executeOperation)',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../schema';
import { resolvers } from '../resolvers';
import { createTestDb, cleanupTestDb } from './testDb';

let server: ApolloServer;
let db: any;

beforeAll(async () => {
  db = await createTestDb();
  server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
});

afterAll(async () => {
  await server.stop();
  await cleanupTestDb(db);
});

const GET_POST = \`
  query GetPost($id: ID!) {
    post(id: $id) { id title author { name } }
  }
\`;

it('returns post with author', async () => {
  const post = await db.posts.create({ title: 'Hello', authorId: 'u1' });

  const response = await server.executeOperation(
    { query: GET_POST, variables: { id: post.id } },
    { contextValue: { user: { id: 'u1', role: 'USER' }, db } }
  );

  if (response.body.kind !== 'single') throw new Error('Expected single response');
  const { data, errors } = response.body.singleResult;
  expect(errors).toBeUndefined();
  expect(data?.post.title).toBe('Hello');
});`
    },
    {
      label: 'MockedProvider (Client)',
      language: 'typescript',
      code: `import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { PostPage } from './PostPage';

const GET_POST = gql\`query GetPost($id: ID!) { post(id: $id) { id title } }\`;

it('renders post title', async () => {
  const mocks = [{
    request: { query: GET_POST, variables: { id: 'p1' } },
    result: { data: { post: { id: 'p1', title: 'Hello World' } } }
  }];

  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <PostPage id="p1" />
    </MockedProvider>
  );

  // Loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for query to resolve
  await waitFor(() => {
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});

it('renders error state', async () => {
  const errorMocks = [{
    request: { query: GET_POST, variables: { id: 'bad' } },
    error: new Error('Not found')
  }];

  render(
    <MockedProvider mocks={errorMocks} addTypename={false}>
      <PostPage id="bad" />
    </MockedProvider>
  );

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Testing only the happy path',
      wrong: `// Only tests success — misses auth, not found, partial errors
it('returns post', async () => { /* success path only */ })`,
      right: `// Test all paths
it('returns post', async () => { /* success */ })
it('throws UNAUTHENTICATED when no user', async () => { /* auth */ })
it('throws NOT_FOUND for missing post', async () => { /* not found */ })`,
      explanation: 'GraphQL APIs have multiple error paths (auth, not found, validation). Test all paths — a resolver that only passes happy-path tests can still break production with auth or missing data.'
    },
    {
      title: 'Mocking the DB in integration tests',
      wrong: `// Integration test with mocked DB — does not test the actual query
server.executeOperation({ query }, { contextValue: { db: mockDb } })`,
      right: `// Use a real (in-memory or test) DB for integration tests
const db = await setupTestDatabase();
server.executeOperation({ query }, { contextValue: { user, db } })`,
      explanation: 'Integration tests should use a real (or realistic) database. Mocking the DB in integration tests doesn\'t catch ORM queries, migrations, or DB-specific bugs.'
    },
    {
      title: 'Not waiting for async resolution in MockedProvider',
      wrong: `render(<MockedProvider mocks={mocks}><PostPage /></MockedProvider>);
// Asserting immediately — query is still loading!
expect(screen.getByText('Hello')).toBeInTheDocument();`,
      right: `render(<MockedProvider mocks={mocks}><PostPage /></MockedProvider>);
await waitFor(() => {
  expect(screen.getByText('Hello')).toBeInTheDocument();
});`,
      explanation: 'GraphQL queries in MockedProvider are async. Use waitFor (or act + flush) to wait for the mock response to resolve before asserting on the rendered output.'
    },
    {
      title: 'Not calling server.stop() after tests',
      wrong: `beforeAll(async () => { server = new ApolloServer(...); await server.start(); })
// No afterAll — server and DB connections leak between test files`,
      right: `afterAll(async () => {
  await server.stop();
  await db.disconnect();
})`,
      explanation: 'Leaving the server running after tests causes port conflicts, leaked DB connections, and flaky tests. Always clean up in afterAll.'
    },
    {
      title: 'Testing schema validation in unit tests',
      wrong: `// Testing that GraphQL validation rejects a bad query
// in a unit test for a resolver — resolvers don't do validation`,
      right: `// Schema validation is done by executeOperation or HTTP test
const response = await server.executeOperation({ query: malformedQuery });
expect(response.body.singleResult.errors).toBeDefined();`,
      explanation: 'Schema validation (unknown fields, type errors) runs before resolvers. Test it with executeOperation or HTTP tests, not by calling resolver functions directly.'
    }
  ];

  challenge: Challenge = {
    title: 'Write Resolver Unit Tests',
    language: 'typescript',
    description: 'Write Jest unit tests for a `Mutation.updatePost` resolver that: (1) throws UNAUTHENTICATED when context.user is null, (2) throws NOT_FOUND when the post doesn\'t exist, (3) throws FORBIDDEN when user.id !== post.authorId and user.role !== "ADMIN", (4) returns the updated post on success. Mock all DB calls.',
    hints: [
      'Create a mockContext() factory with db.posts.findById and db.posts.update mocks',
      'Test each throw case in its own it() block',
      'Use .rejects.toMatchObject({ extensions: { code: ... } }) for error assertions',
      'Success test: db.findById returns a post owned by the user, db.update returns updated post'
    ],
    starterCode: `import { resolvers } from '../resolvers';
import { GraphQLError } from 'graphql';

const mockCtx = (overrides?: any) => ({
  user: { id: 'u1', role: 'USER' },
  db: {
    posts: {
      findById: jest.fn(),
      update: jest.fn()
    }
  },
  ...overrides
});

describe('Mutation.updatePost', () => {
  // TODO: 4 test cases
});`,
    solution: `describe('Mutation.updatePost', () => {
  it('throws UNAUTHENTICATED when no user', async () => {
    const ctx = mockCtx({ user: null });
    await expect(resolvers.Mutation.updatePost(null, { id: 'p1', input: {} }, ctx, null as any))
      .rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });

  it('throws NOT_FOUND when post missing', async () => {
    const ctx = mockCtx();
    ctx.db.posts.findById.mockResolvedValue(null);
    await expect(resolvers.Mutation.updatePost(null, { id: 'p1', input: {} }, ctx, null as any))
      .rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } });
  });

  it('throws FORBIDDEN when user does not own post', async () => {
    const ctx = mockCtx();
    ctx.db.posts.findById.mockResolvedValue({ id: 'p1', authorId: 'other-user' });
    await expect(resolvers.Mutation.updatePost(null, { id: 'p1', input: {} }, ctx, null as any))
      .rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('returns updated post on success', async () => {
    const ctx = mockCtx();
    ctx.db.posts.findById.mockResolvedValue({ id: 'p1', authorId: 'u1' });
    ctx.db.posts.update.mockResolvedValue({ id: 'p1', title: 'Updated', authorId: 'u1' });
    const result = await resolvers.Mutation.updatePost(null, { id: 'p1', input: { title: 'Updated' } }, ctx, null as any);
    expect(result).toMatchObject({ id: 'p1', title: 'Updated' });
    expect(ctx.db.posts.update).toHaveBeenCalledWith('p1', { title: 'Updated' });
  });
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does server.executeOperation() do?', options: ['Sends an HTTP request to the server', 'Runs the full GraphQL execution stack without HTTP', 'Executes raw SQL', 'Validates the schema'], answer: 1, explanation: 'executeOperation runs the full GraphQL request lifecycle (parsing, validation, execution) without going through HTTP — ideal for integration tests without supertest.' },
    { q: 'What is MockedProvider used for?', options: ['Mocking the GraphQL server', 'Testing React components that use Apollo Client hooks without a real network', 'Mocking the InMemoryCache', 'Providing test data to resolvers'], answer: 1, explanation: 'MockedProvider intercepts Apollo Client queries and returns pre-defined mock responses. Use it to test React components that use useQuery, useMutation, etc., without a network.' },
    { q: 'Why should integration tests use a real DB?', options: ['It is faster', 'It catches ORM, migration, and DB-specific bugs that mocked DBs miss', 'It is required by Jest', 'Apollo only works with real databases'], answer: 1, explanation: 'Mocking the DB in integration tests doesn\'t test the actual queries, indices, or constraints. Real (or in-memory test) databases catch bugs that mocks hide.' },
    { q: 'What do you need after rendering with MockedProvider to assert on query results?', options: ['act()', 'A setTimeout', 'waitFor() from @testing-library/react', 'Nothing — rendering is synchronous'], answer: 2, explanation: 'MockedProvider resolves queries asynchronously. Use waitFor() to wait for the DOM to update after the mock query resolves before making assertions.' },
    { q: 'What is addMocksToSchema used for?', options: ['Mocking HTTP responses', 'Adding automatic scalar mock resolvers to a schema for testing', 'Generating test data from a DB', 'Validating mock types'], answer: 1, explanation: 'addMocksToSchema from @graphql-tools/mock adds default resolvers that return random scalar values for each type. Useful for contract testing or quick schema smoke tests.' },
    { q: 'When should you call server.stop() in tests?', options: ['Before each test', 'In beforeAll', 'In afterAll, after all tests in the file complete', 'Never — it stops automatically'], answer: 2, explanation: 'server.stop() should run in afterAll to clean up after all tests. Running it before each test would restart the server unnecessarily; not running it leaks connections.' }
  ];

  qna: QnaItem[] = [
    { q: 'Should I write tests for every resolver or just integration tests?', a: 'Both. Unit tests for individual resolvers are fast and give precise failure messages. Integration tests (via executeOperation) catch cross-cutting issues like middleware, directives, and resolver chain ordering. Use a pyramid: many unit tests, fewer integration, minimal E2E.' },
    { q: 'How do I test subscriptions?', a: 'Use pubsub.publish() to emit events in tests, then subscribe via client.subscribe() and assert the emitted values. For integration, use graphql-ws\'s createClient with a test WebSocket server. For Apollo Server 4, use the executeOperation with a subscription operation and collect async iterator values.' },
    { q: 'How do I test error formatting (formatError)?', a: 'Write an integration test with executeOperation where the resolver throws a known error. Assert that the response contains the expected error code and message. Test that stack traces are absent in production mode (set NODE_ENV=production in the test).' },
    { q: 'Can I test federation subgraphs independently?', a: 'Yes — each subgraph is a standalone Apollo Server. Test it with executeOperation just like any other server. Test __resolveReference by calling it with a known @key object. Cross-subgraph integration tests require a running Router and all subgraphs.' },
    { q: 'What is the difference between MockedProvider mocks and jest.mock?', a: 'MockedProvider intercepts Apollo Client query network requests at the link layer. jest.mock replaces a module or function. Use MockedProvider for component tests that use Apollo hooks; use jest.fn() to mock resolver dependencies (DB, services).' },
    { q: 'How do I seed test data efficiently?', a: 'Create factory functions that insert minimal test fixtures. Use beforeEach only when each test needs fresh data; beforeAll for read-only shared data. Clean up with afterEach (truncate tables) or use transactions that roll back after each test.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Test GraphQL at three levels: unit (resolver functions), integration (executeOperation + real DB), and component (MockedProvider for Apollo hooks).',
    mustKnow: [
      'Unit test resolvers directly as plain functions with mocked context',
      'executeOperation runs full schema execution without HTTP — best for integration tests',
      'MockedProvider intercepts Apollo Client queries for React component tests',
      'waitFor() needed after rendering with MockedProvider — queries are async',
      'Use real (in-memory) DB in integration tests — mocked DBs miss real bugs',
      'Call server.stop() in afterAll to prevent connection leaks'
    ],
    interviewFocus: [
      'How do you test a GraphQL resolver without starting an HTTP server?',
      'What is MockedProvider and when would you use it?',
      'Explain the testing pyramid for a GraphQL application'
    ]
  };
}
