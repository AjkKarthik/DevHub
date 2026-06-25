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
  selector: 'app-gql-apollo-client',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './apollo-client.html',
  styleUrl: './apollo-client.scss'
})
export class GqlApolloClient {
  quickRef: QuickRefItem[] = [
    { type: 'class', name: 'ApolloClient', desc: 'Core client — accepts link chain and cache, handles queries/mutations' },
    { type: 'class', name: 'InMemoryCache', desc: 'Normalized in-memory cache — stores objects by __typename + id' },
    { type: 'hook', name: 'useQuery(QUERY, opts)', desc: 'React hook — runs a query and returns { data, loading, error }' },
    { type: 'hook', name: 'useMutation(MUTATION, opts)', desc: 'React hook — returns [mutate, { data, loading, error }]' },
    { type: 'hook', name: 'useLazyQuery(QUERY)', desc: 'Like useQuery but does not run until you call the returned execute function' },
    { type: 'hook', name: 'useSubscription(SUB)', desc: 'React hook — opens a subscription and streams data updates' },
    { type: 'keyword', name: 'fetchPolicy', desc: 'Controls cache vs network behavior: cache-first, network-only, no-cache, cache-and-network' },
    { type: 'method', name: 'client.refetchQueries()', desc: 'Programmatically re-run one or more active queries' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Apollo Client Architecture',
      points: [
        'Apollo Client = InMemoryCache + Link chain + React hooks.',
        'The link chain processes every request: HttpLink sends to the server, AuthLink attaches tokens, ErrorLink intercepts errors.',
        'Links are composable with `from([link1, link2, httpLink])` or the `split()` helper for routing (e.g., WebSocket vs HTTP).',
        'ApolloProvider wraps your React app and makes the client available to all useQuery/useMutation calls via context.'
      ]
    },
    {
      heading: 'useQuery',
      points: [
        'useQuery runs the query when the component mounts and re-runs when variables change.',
        'Returns { data, loading, error, refetch, fetchMore, networkStatus }.',
        'data is undefined while loading; error is set if the query fails. Both can coexist for partial results.',
        'fetchPolicy controls where Apollo looks for data: cache-first (default), network-only, cache-and-network, no-cache.'
      ]
    },
    {
      heading: 'useMutation',
      points: [
        'useMutation returns a tuple: `[mutate, { data, loading, error }]`. Call mutate() to trigger the mutation.',
        'Options: refetchQueries (re-run queries after), update (manual cache update), onCompleted, onError, optimisticResponse.',
        'The mutate function can receive variables, optimisticResponse, and update as overrides on each call.',
        'Mutations do not re-run automatically — they only fire when you call the mutate function.'
      ]
    },
    {
      heading: 'Fetch Policies',
      points: [
        'cache-first (default): return cached data immediately; only fetch from network if cache misses.',
        'network-only: always fetch from network; store result in cache for future use.',
        'cache-and-network: return cached data immediately, also fetch from network and update when it returns.',
        'no-cache: always fetch from network; never write to or read from cache. Use for sensitive/real-time data.'
      ]
    },
    {
      heading: 'Link Chain',
      points: [
        'Links are middleware for GraphQL requests. Each link passes the operation to the next link in the chain.',
        'Common links: HttpLink (HTTP transport), WebSocketLink (subscriptions), AuthLink (headers), RetryLink (retry on network error), ErrorLink (global error handling).',
        'Use split() to route operations: subscriptions via WebSocket, queries/mutations via HTTP.',
        'from([authLink, errorLink, httpLink]) — links execute left to right on request, right to left on response.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

// Auth link — attach Bearer token
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return { headers: { ...headers, authorization: token ? \`Bearer \${token}\` : '' } };
});

// Error link — global error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
    window.location.href = '/login';
  }
});

const httpLink = new HttpLink({ uri: '/graphql' });

const client = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache()
});

// Wrap React app
function App() {
  return (
    <ApolloProvider client={client}>
      <Router />
    </ApolloProvider>
  );
}`
    },
    {
      label: 'useQuery & useMutation',
      language: 'typescript',
      code: `import { useQuery, useMutation, gql } from '@apollo/client';

const GET_POSTS = gql\`
  query GetPosts($limit: Int!) {
    posts(limit: $limit) { id title author { name } }
  }
\`;

const CREATE_POST = gql\`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) { id title }
  }
\`;

function PostList() {
  const { data, loading, error, refetch } = useQuery(GET_POSTS, {
    variables: { limit: 10 },
    fetchPolicy: 'cache-and-network'
  });

  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    refetchQueries: ['GetPosts'],
    onCompleted: (data) => console.log('Created:', data.createPost.id),
    onError: (err) => console.error(err.message)
  });

  if (loading && !data) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data?.posts.map(p => <PostCard key={p.id} post={p} />)}
      <button onClick={() => createPost({ variables: { input: { title: 'New' } } })}
        disabled={creating}>
        Add Post
      </button>
    </div>
  );
}`
    },
    {
      label: 'Fetch Policies',
      language: 'typescript',
      code: `// cache-first (default) — serve from cache, fetch if miss
const { data } = useQuery(GET_POST, {
  variables: { id },
  fetchPolicy: 'cache-first'
});

// network-only — always fresh data
const { data: fresh } = useQuery(GET_POSTS, {
  fetchPolicy: 'network-only'
});

// cache-and-network — instant cached result + background refresh
const { data: fast } = useQuery(GET_POSTS, {
  fetchPolicy: 'cache-and-network'
  // data updates automatically when network response arrives
});

// no-cache — skip cache entirely (auth checks, OTP, etc.)
const { data: secure } = useQuery(VERIFY_OTP, {
  fetchPolicy: 'no-cache'
});

// nextFetchPolicy — first load vs subsequent loads
const { data } = useQuery(GET_POSTS, {
  fetchPolicy: 'network-only',     // first load: always fresh
  nextFetchPolicy: 'cache-first'   // re-renders: use cache
});`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not providing variables that affect the query shape',
      wrong: `const { data } = useQuery(GET_POSTS);
// Later: setFilter('published') — query doesn't re-run`,
      right: `const [filter, setFilter] = useState('all');
const { data } = useQuery(GET_POSTS, {
  variables: { filter }  // re-runs when filter changes
});`,
      explanation: 'useQuery automatically re-runs when variables change. Keep all query parameters in variables, not in external state that the query doesn\'t know about.'
    },
    {
      title: 'Using network-only everywhere',
      wrong: `// Always fetches from network — defeats the purpose of caching
useQuery(GET_USER, { fetchPolicy: 'network-only' })`,
      right: `// cache-first for stable data; network-only only when staleness is critical
useQuery(GET_USER, { fetchPolicy: 'cache-first' })`,
      explanation: 'network-only makes every render trigger a network request. Use cache-first (default) for most queries and network-only only when you need guaranteed fresh data.'
    },
    {
      title: 'Forgetting to handle loading + error states',
      wrong: `const { data } = useQuery(GET_POSTS);
return <div>{data.posts.map(...)}</div>;  // crashes when data is undefined`,
      right: `const { data, loading, error } = useQuery(GET_POSTS);
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <div>{data!.posts.map(...)}</div>;`,
      explanation: 'data is undefined during loading and error states. Always destructure all three states and handle them before rendering data-dependent UI.'
    },
    {
      title: 'Using gql inside component renders',
      wrong: `function MyComponent() {
  const query = gql\`{ posts { id } }\`;  // re-parses on every render
  const { data } = useQuery(query);
}`,
      right: `const GET_POSTS = gql\`{ posts { id } }\`;  // define once outside component
function MyComponent() { const { data } = useQuery(GET_POSTS); }`,
      explanation: 'gql() parses the query string into an AST on every call. Move query definitions to module scope so they are parsed once and reused.'
    },
    {
      title: 'Not using ApolloProvider',
      wrong: `// Calling useQuery without ApolloProvider in the tree
function Root() { return <App />; }  // no ApolloProvider`,
      right: `function Root() {
  return <ApolloProvider client={apolloClient}><App /></ApolloProvider>;
}`,
      explanation: 'useQuery, useMutation, and useSubscription all read the ApolloClient from React context. Without ApolloProvider, they throw "No Apollo Client found".'
    }
  ];

  challenge: Challenge = {
    title: 'Build a Search Component with useLazyQuery',
    language: 'typescript',
    description: 'Create a `PostSearch` React component that: (1) uses useLazyQuery with a SEARCH_POSTS query (accepts $query: String!), (2) triggers the query only on form submit (not on mount), (3) shows loading state, (4) renders results or an "No results" message, (5) uses fetchPolicy: "network-only" to always get fresh results.',
    hints: [
      'useLazyQuery returns [executeQuery, { data, loading, error }]',
      'Call executeQuery({ variables: { query: input } }) on submit',
      'fetchPolicy goes in useLazyQuery options',
      'Check data?.searchPosts.length === 0 for empty results'
    ],
    starterCode: `import { useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react';

const SEARCH_POSTS = gql\`
  query SearchPosts($query: String!) {
    searchPosts(query: $query) { id title }
  }
\`;

function PostSearch() {
  const [input, setInput] = useState('');
  // TODO: useLazyQuery
  // TODO: form with submit handler
  // TODO: results display
}`,
    solution: `import { useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react';

const SEARCH_POSTS = gql\`
  query SearchPosts($query: String!) {
    searchPosts(query: $query) { id title }
  }
\`;

function PostSearch() {
  const [input, setInput] = useState('');
  const [search, { data, loading, error, called }] = useLazyQuery(SEARCH_POSTS, {
    fetchPolicy: 'network-only'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) search({ variables: { query: input } });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Search posts..." />
        <button type="submit" disabled={loading}>Search</button>
      </form>
      {loading && <p>Searching...</p>}
      {error && <p>Error: {error.message}</p>}
      {called && !loading && data?.searchPosts.length === 0 && <p>No results</p>}
      {data?.searchPosts.map(p => <div key={p.id}>{p.title}</div>)}
    </div>
  );
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does useQuery return?', options: ['A Promise', '{ data, loading, error, refetch, fetchMore }', 'An Observable', 'A tuple [data, setData]'], answer: 1, explanation: 'useQuery returns an object with data (query result), loading (boolean), error (ApolloError or undefined), plus refetch and fetchMore utilities.' },
    { q: 'When does useMutation fire?', options: ['On component mount', 'When variables change', 'Only when you call the returned mutate function', 'When the cache is updated'], answer: 2, explanation: 'useMutation does not run automatically. It returns a mutate function — you call it explicitly to trigger the mutation.' },
    { q: 'What is the default fetchPolicy?', options: ['network-only', 'no-cache', 'cache-first', 'cache-and-network'], answer: 2, explanation: 'cache-first is the default: Apollo returns cached data immediately if available; only fetches from the network on a cache miss.' },
    { q: 'What does ApolloProvider do?', options: ['Wraps fetch with retry logic', 'Makes the ApolloClient available to all hooks via React context', 'Sets up CORS for GraphQL', 'Provides type definitions to the app'], answer: 1, explanation: 'ApolloProvider wraps the React tree and injects the ApolloClient instance into context. All useQuery/useMutation/useSubscription hooks read from this context.' },
    { q: 'What is the difference between useQuery and useLazyQuery?', options: ['No difference', 'useQuery fires on mount; useLazyQuery fires when you call the returned execute function', 'useLazyQuery supports mutations', 'useQuery only supports cache-first'], answer: 1, explanation: 'useQuery runs immediately on mount and re-runs on variable changes. useLazyQuery does not run until you call the returned execute function — useful for search, user-triggered events.' },
    { q: 'What does cache-and-network fetch policy do?', options: ['Only fetches from cache', 'Only fetches from network', 'Returns cached data immediately, then also fetches from network and updates', 'Disables caching'], answer: 2, explanation: 'cache-and-network gives instant cached results AND fetches from the network to update — best of both for UIs that need fast first paint and fresh data.' }
  ];

  qna: QnaItem[] = [
    { q: 'How do I share Apollo Client state without drilling props?', a: 'Use Apollo reactive variables (makeVar) for global client-side state, or write query results to the cache with client.writeQuery. Both integrate with useQuery so components re-render when state changes.' },
    { q: 'How do I abort an in-flight query?', a: 'Pass an AbortController signal to useQuery via fetchPolicy: "no-cache" queries, or use the client.watchQuery().cancel() method. Apollo 3+ supports React 18 AbortSignal integration.' },
    { q: 'What is the difference between refetchQueries and update in useMutation?', a: 'refetchQueries fires additional network requests after the mutation. update modifies the cache directly with data already returned in the mutation response — no extra round-trip. Use update when the mutation returns enough data to update the cache.' },
    { q: 'Can I use Apollo Client with Angular?', a: 'Yes — Apollo Angular (@apollo/client + apollo-angular) provides Angular services and pipes. inject(Apollo) gives access to the client. watchQuery() returns an Observable for subscription-friendly Angular patterns.' },
    { q: 'What is a "split link" and when do I need it?', a: 'A split link routes operations to different link chains based on the operation type. The canonical use case: send subscriptions via WebSocketLink and queries/mutations via HttpLink. Use split(({ query }) => isSubscription(query), wsLink, httpLink).' },
    { q: 'How do I globally handle UNAUTHENTICATED errors?', a: 'Use the onError link from @apollo/client/link/error. In the error handler, check if any graphQLError has extensions.code === "UNAUTHENTICATED" and redirect to the login page. This runs for every operation automatically.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Apollo Client = link chain + InMemoryCache + React hooks — use useQuery for reads, useMutation for writes, and fetchPolicy to control cache behaviour.',
    mustKnow: [
      'useQuery: runs on mount, returns { data, loading, error, refetch }',
      'useMutation: returns [mutate, state] — only fires when you call mutate()',
      'fetchPolicy: cache-first (default), network-only, cache-and-network, no-cache',
      'ApolloProvider wraps the tree — required for all Apollo hooks',
      'Link chain: from([authLink, errorLink, httpLink]) — left to right on request',
      'cache-and-network: instant cached result + background network refresh'
    ],
    interviewFocus: [
      'Explain the different fetchPolicy options and when to use each',
      'What is the difference between useQuery and useLazyQuery?',
      'How do you handle global auth errors in Apollo Client?'
    ]
  };
}
