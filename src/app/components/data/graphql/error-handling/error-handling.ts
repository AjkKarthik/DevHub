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
  selector: 'app-gql-error-handling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss'
})
export class GqlErrorHandling {
  quickRef: QuickRefItem[] = [
    { type: 'type', name: 'GraphQLError', desc: 'Base error class — has message, path, locations, extensions' },
    { type: 'class', name: 'GraphQLError(msg, opts)', desc: 'Throw from resolvers to return a typed error with extensions' },
    { type: 'method', name: 'extensions.code', desc: 'Convention: error code string (NOT_FOUND, UNAUTHENTICATED, etc.)' },
    { type: 'type', name: 'ApolloError', desc: 'Apollo Server base class — wraps GraphQLError with a code shorthand' },
    { type: 'class', name: 'AuthenticationError', desc: 'Apollo: 401-equivalent — UNAUTHENTICATED code' },
    { type: 'class', name: 'ForbiddenError', desc: 'Apollo: 403-equivalent — FORBIDDEN code' },
    { type: 'class', name: 'UserInputError', desc: 'Apollo: 400-equivalent — BAD_USER_INPUT code' },
    { type: 'method', name: 'formatError', desc: 'Server hook to sanitize/transform errors before sending to client' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The GraphQL Error Response',
      points: [
        'A GraphQL response can contain both data and errors simultaneously. Partial success is possible.',
        'The top-level `errors` array contains GraphQLError objects with message, path, locations, and extensions.',
        '`path` traces which field in the query caused the error — useful for pinpointing failures in nested selections.',
        'When a field throws, the error goes into `errors`, and the field value in `data` becomes null (propagating up if non-null).'
      ]
    },
    {
      heading: 'Error Types & Codes',
      points: [
        'Extensions.code is the community convention for categorizing errors: NOT_FOUND, UNAUTHENTICATED, FORBIDDEN, BAD_USER_INPUT, INTERNAL_SERVER_ERROR.',
        'Apollo Server provides pre-built classes: AuthenticationError, ForbiddenError, UserInputError — each sets the correct code.',
        'In Apollo Server v4, throw new GraphQLError(msg, { extensions: { code: "NOT_FOUND" } }) is the canonical form.',
        'Never expose internal details (stack traces, DB errors) in the message field — sanitize in formatError.'
      ]
    },
    {
      heading: 'formatError — Sanitizing Errors',
      points: [
        'Apollo Server\'s formatError hook runs on every error before it reaches the client.',
        'Use it to strip stack traces, map internal DB errors to safe messages, and add request IDs for correlation.',
        'In development, include the stacktrace. In production, return only code + message.',
        'formatError receives the formatted error + the original error. Access originalError.stack for logging.'
      ]
    },
    {
      heading: 'Nullable Fields & Error Propagation',
      points: [
        'When a nullable field throws, only that field becomes null in the response. Sibling fields still resolve.',
        'When a non-null field throws, the error propagates to the nearest nullable parent.',
        'Over-using `!` (non-null) means one failing field can null out an entire parent object.',
        'Design nullability with error propagation in mind — make fields nullable when errors should be contained.'
      ]
    },
    {
      heading: 'Client-Side Error Handling',
      points: [
        'Apollo Client exposes `error` from useQuery/useMutation — it combines network errors and GraphQL errors.',
        'Use `error.graphQLErrors` for field-level errors and `error.networkError` for transport-level failures.',
        'GraphQL errors and data coexist — always check both `data` and `error` after a query.',
        'Apollo Link Error is a link that intercepts all errors for global handling (logout on UNAUTHENTICATED, retry on network failure).'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Throwing Errors',
      language: 'typescript',
      code: `import { GraphQLError } from 'graphql';

// Apollo Server v4 style
const resolvers = {
  Query: {
    post: async (_, { id }, { db, user }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const post = await db.posts.findById(id);
      if (!post) {
        throw new GraphQLError(\`Post \${id} not found\`, {
          extensions: { code: 'NOT_FOUND', id }
        });
      }

      if (!user.canRead(post)) {
        throw new GraphQLError('Access denied', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return post;
    }
  }
};`
    },
    {
      label: 'formatError',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // Log internal errors with full detail
    if (!formattedError.extensions?.code ||
        formattedError.extensions.code === 'INTERNAL_SERVER_ERROR') {
      console.error('[GraphQL Error]', error);
    }

    // Strip stacktrace in production
    if (process.env.NODE_ENV === 'production') {
      return {
        message: formattedError.message,
        path: formattedError.path,
        extensions: {
          code: formattedError.extensions?.code ?? 'INTERNAL_SERVER_ERROR'
        }
      };
    }

    return formattedError;
  }
});`
    },
    {
      label: 'Client Error Handling',
      language: 'typescript',
      code: `import { useQuery, gql } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Global error link — intercept all errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Redirect to login
        window.location.href = '/login';
      }
    }
  }
  if (networkError) {
    console.error('Network error:', networkError);
  }
});

// Per-query error handling
function PostPage({ id }: { id: string }) {
  const { data, error, loading } = useQuery(GET_POST, { variables: { id } });

  if (loading) return <p>Loading...</p>;

  // Check GraphQL errors
  if (error?.graphQLErrors.some(e => e.extensions?.code === 'NOT_FOUND')) {
    return <p>Post not found</p>;
  }

  if (error) return <p>Error: {error.message}</p>;

  return <PostView post={data.post} />;
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Exposing internal error details to clients',
      wrong: `throw new Error(dbError.message);  // exposes SQL error / stack trace`,
      right: `console.error(dbError);
throw new GraphQLError('Internal server error', {
  extensions: { code: 'INTERNAL_SERVER_ERROR' }
});`,
      explanation: 'Internal DB or system error messages can leak schema/data details. Always sanitize in formatError and log privately.'
    },
    {
      title: 'Using HTTP 4xx/5xx status codes for all GraphQL errors',
      wrong: `// Returning 404 when a post is not found — not GraphQL convention`,
      right: `// GraphQL always returns 200 for partial success
// Use extensions.code for semantic error codes`,
      explanation: 'GraphQL convention: always return HTTP 200 with error details in the response body (except for fatal server errors). HTTP status codes indicate transport failure, not business logic failure.'
    },
    {
      title: 'Not checking both data and error on the client',
      wrong: `const { data } = useQuery(GET_POST);
return <Post post={data.post} />;  // crashes if error occurred`,
      right: `const { data, error, loading } = useQuery(GET_POST);
if (loading) return <Loading />;
if (error) return <Error error={error} />;
return <Post post={data?.post} />;`,
      explanation: 'GraphQL can return both data and errors simultaneously. Always handle all three states: loading, error, and data.'
    },
    {
      title: 'Throwing on every resolver error with non-null fields',
      wrong: `// Post.author is User! (non-null) — throwing here nulls the entire Post
author: async (post) => { throw new Error('Author unavailable'); }`,
      right: `// Make author nullable: author: User
// Or return a fallback author object instead of throwing`,
      explanation: 'Non-null fields propagate errors to nullable parents. A non-null field that throws can null out a large chunk of the response tree.'
    },
    {
      title: 'Using UserInputError for system errors',
      wrong: `// Database down — throwing UserInputError is misleading
if (!db.connected) throw new UserInputError('DB unavailable');`,
      right: `if (!db.connected) throw new GraphQLError('Service unavailable', {
  extensions: { code: 'SERVICE_UNAVAILABLE' }
});`,
      explanation: 'UserInputError (BAD_USER_INPUT) signals a client data problem. Use INTERNAL_SERVER_ERROR or a specific code for system/infrastructure failures.'
    }
  ];

  challenge: Challenge = {
    title: 'Add Typed Error Handling to a Resolver',
    language: 'typescript',
    description: 'Write a `getPost` resolver that: (1) throws UNAUTHENTICATED if context.user is null, (2) throws NOT_FOUND with the id in extensions if the post doesn\'t exist, (3) throws FORBIDDEN if user.role is not ADMIN and post.draft is true, (4) sanitizes all other errors via formatError to remove stack traces in production.',
    hints: [
      'Use GraphQLError from "graphql" with extensions.code',
      'Check user → post existence → post.draft + role in sequence',
      'formatError should check NODE_ENV and strip stacktrace',
      'Log original error before sanitizing'
    ],
    starterCode: `import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    getPost: async (_, { id }, context) => {
      // TODO: implement auth, not found, forbidden checks
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // TODO: sanitize
  }
});`,
    solution: `import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    getPost: async (_, { id }, { user, db }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const post = await db.posts.findById(id);
      if (!post) {
        throw new GraphQLError(\`Post \${id} not found\`, {
          extensions: { code: 'NOT_FOUND', id }
        });
      }

      if (post.draft && user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied to draft post', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return post;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, originalError) => {
    console.error('[GraphQL Error]', originalError);
    if (process.env.NODE_ENV === 'production') {
      return {
        message: formattedError.message,
        path: formattedError.path,
        extensions: { code: formattedError.extensions?.code ?? 'INTERNAL_SERVER_ERROR' }
      };
    }
    return formattedError;
  }
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'Can a GraphQL response contain both data and errors?', options: ['No — it\'s one or the other', 'Yes — partial success is valid', 'Only for mutations', 'Only when using Apollo'], answer: 1, explanation: 'GraphQL supports partial success. A response can have data (with some null fields where errors occurred) and a top-level errors array simultaneously.' },
    { q: 'What HTTP status code should a successful GraphQL request return?', options: ['200 always', '404 for not found', '401 for auth errors', 'Depends on the error code'], answer: 0, explanation: 'GraphQL convention is to always return HTTP 200 for a valid GraphQL response. HTTP error codes are reserved for transport-level failures (server down, bad JSON).' },
    { q: 'What does extensions.code provide?', options: ['The HTTP status code', 'A semantic error category string (NOT_FOUND, UNAUTHENTICATED, etc.)', 'The TypeScript error type', 'The stack trace'], answer: 1, explanation: 'extensions.code is the community convention for categorizing GraphQL errors. Clients use it to distinguish auth errors, not-found, validation errors, etc.' },
    { q: 'What happens when a non-null field\'s resolver throws?', options: ['The field returns null', 'The error propagates to the nearest nullable parent', 'The entire request fails with 500', 'The field retries automatically'], answer: 1, explanation: 'Non-null fields cannot return null. If they throw, the error bubbles up to the nearest nullable ancestor, which becomes null instead.' },
    { q: 'What is formatError used for?', options: ['Formatting query syntax', 'Sanitizing/transforming errors before sending to clients', 'Parsing error codes', 'Logging queries'], answer: 1, explanation: 'formatError is an Apollo Server hook that runs on every error. Use it to strip internal details, add correlation IDs, and log errors privately.' },
    { q: 'Which Apollo Client property contains field-level GraphQL errors?', options: ['error.message', 'error.graphQLErrors', 'error.fields', 'error.statusCode'], answer: 1, explanation: 'Apollo Client\'s error object has graphQLErrors (array of field-level errors from the server) and networkError (transport-level failures).' }
  ];

  qna: QnaItem[] = [
    { q: 'When should I use the top-level errors array vs a payload UserError?', a: 'Use top-level errors (throw GraphQLError) for unexpected system errors, auth failures, and invalid queries. Use payload UserErrors (return in data) for domain validation failures like "title too short" — these are expected outcomes, not exceptions.' },
    { q: 'How do I add a request ID to every error for correlation?', a: 'In formatError, access the context (available via a plugin in Apollo Server v4). Add the request ID to extensions: `{ ...formattedError, extensions: { ...formattedError.extensions, requestId: context.requestId } }`.' },
    { q: 'What is Apollo Link Error?', a: 'An Apollo Client link that intercepts all errors globally. Use it for cross-cutting concerns: redirect to login on UNAUTHENTICATED, retry on network failure, log all errors to an observability service.' },
    { q: 'Can I return a partial result when one field fails?', a: 'Yes — this is one of GraphQL\'s strengths. If `posts[0].author` throws, the author field becomes null and the error appears in the errors array, but `posts[0].title` and other fields still resolve normally.' },
    { q: 'How do I test error handling in resolvers?', a: 'Use executeOperation from @apollo/server/testing to call the resolver directly. Assert that the response.body.errors array contains the expected code and message. Test both the throw path and the success path.' },
    { q: 'Should I ever return an HTTP 4xx for GraphQL errors?', a: 'Only for fatal, pre-execution errors: malformed JSON body (400), authentication at the HTTP level (401), or rate limiting (429). Once GraphQL starts processing, use 200 with errors in the body.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'GraphQL errors coexist with data — use typed error codes, sanitize in formatError, and design nullability to contain failure scope.',
    mustKnow: [
      'GraphQL responses can have both data and errors (partial success)',
      'HTTP 200 for all valid GraphQL responses — use extensions.code for semantics',
      'Non-null field errors propagate to nearest nullable parent',
      'formatError sanitizes errors before sending to clients',
      'error.graphQLErrors (field errors) vs error.networkError (transport)',
      'UserErrors in payload for domain validation; throw for system/auth errors'
    ],
    interviewFocus: [
      'Explain partial success in GraphQL — what does the response look like?',
      'How do non-null fields affect error propagation?',
      'What is the difference between a GraphQL error and a user error in a mutation payload?'
    ]
  };
}
