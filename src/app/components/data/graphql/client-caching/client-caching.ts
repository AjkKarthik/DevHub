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
  selector: 'app-gql-client-caching',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './client-caching.html',
  styleUrl: './client-caching.scss'
})
export class GqlClientCaching {
  quickRef: QuickRefItem[] = [
    { type: 'class', name: 'InMemoryCache', desc: 'Apollo Client\'s normalized in-memory store — objects identified by __typename + id' },
    { type: 'method', name: 'cache.readQuery(opts)', desc: 'Read data from cache without triggering a network request' },
    { type: 'method', name: 'cache.writeQuery(opts)', desc: 'Write data directly into the cache (update without mutation)' },
    { type: 'method', name: 'cache.modify(opts)', desc: 'Modify specific cached fields without replacing the whole object' },
    { type: 'method', name: 'cache.evict(opts)', desc: 'Remove a specific object or field from the cache' },
    { type: 'method', name: 'cache.gc()', desc: 'Garbage collect — remove orphaned cache entries' },
    { type: 'keyword', name: 'keyFields', desc: 'InMemoryCache: customize which fields form the unique cache key for a type' },
    { type: 'keyword', name: 'field policies', desc: 'read/merge/keyArgs functions on InMemoryCache fields for custom cache behavior' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'InMemoryCache Normalization',
      points: [
        'Apollo Client normalizes every response: objects are extracted by __typename + id and stored flat in a lookup table.',
        'Multiple queries that return the same User (by id) share one cache entry — updating it updates all queries automatically.',
        'Without __typename or id, objects cannot be normalized and are stored by reference under their parent object.',
        'Normalization is why Apollo components stay in sync — editing a user in one component reflects everywhere that user appears.'
      ]
    },
    {
      heading: 'cache.readQuery & cache.writeQuery',
      points: [
        'readQuery reads from the cache synchronously. Returns null if the query or required fields are not cached.',
        'writeQuery writes data into the cache as if a query had returned it — no network request needed.',
        'Use writeQuery to pre-populate cache after a mutation that returns enough data to update a query.',
        'writeQuery requires the full shape matching the query including all requested fields — missing fields cause issues.'
      ]
    },
    {
      heading: 'cache.modify',
      points: [
        'cache.modify surgically updates individual fields on a cached object without replacing the entire object.',
        'Receives a fields object: each key is a field name, value is a function receiving the current cached value.',
        'Use readField to read other fields from the same cached object within the modify call.',
        'Use INVALIDATE sentinel to force a refetch of a field: `fields: { posts: (_, { INVALIDATE }) => INVALIDATE }`.'
      ]
    },
    {
      heading: 'Field Policies',
      points: [
        'Field policies customize how the cache reads, writes, and identifies specific fields.',
        'keyArgs: specifies which arguments affect the cache key for a field — use for pagination or filtering.',
        'read: a function that transforms cached data before returning it to components.',
        'merge: a function that combines incoming data with existing cached data — critical for pagination.'
      ]
    },
    {
      heading: 'Reactive Variables',
      points: [
        'Apollo reactive variables (`makeVar`) store client-side state outside the normalized cache.',
        'Components using `useReactiveVar(myVar)` re-render when the variable changes.',
        'Reactive variables are ideal for UI state that should be globally accessible: theme, logged-in user, modals.',
        'They can be read from inside field policies: combine server data + reactive variable for hybrid client state.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cache Operations',
      language: 'typescript',
      code: `import { useApolloClient, gql } from '@apollo/client';

const GET_POSTS = gql\`query GetPosts { posts { id title } }\`;

function AddPostButton() {
  const client = useApolloClient();

  const handleAdd = async (newPost: Post) => {
    // Option 1: cache.writeQuery — update a query result
    const existing = client.cache.readQuery<{ posts: Post[] }>({ query: GET_POSTS });
    if (existing) {
      client.cache.writeQuery({
        query: GET_POSTS,
        data: { posts: [newPost, ...existing.posts] }
      });
    }

    // Option 2: cache.modify — add to a list field
    client.cache.modify({
      fields: {
        posts(existingRefs, { toReference }) {
          return [toReference(newPost), ...existingRefs];
        }
      }
    });

    // Option 3: evict stale data and let refetch handle it
    client.cache.evict({ fieldName: 'posts' });
    client.cache.gc();  // clean up orphaned entries
  };
}`
    },
    {
      label: 'Field Policies',
      language: 'typescript',
      code: `import { InMemoryCache, Reference } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    // Custom key fields — use slug instead of id
    Post: {
      keyFields: ['slug']  // Post:slug-value instead of Post:1
    },

    // No normalization (store by reference)
    SearchResult: {
      keyFields: false
    },

    Query: {
      fields: {
        // Field policy for posts: don't split cache by limit/offset
        posts: {
          keyArgs: ['filter'],  // same cache entry for all pages with same filter
          merge(existing: Reference[] = [], incoming: Reference[]) {
            return [...existing, ...incoming];  // append pages
          }
        },

        // Computed read function
        recentPosts: {
          read(_, { readField, toReference }) {
            // Read from another cached field
            return cache.readQuery({ query: gql\`{ posts { id createdAt } }\` })
              ?.posts.filter(p => /* recent logic */ true);
          }
        }
      }
    }
  }
});`
    },
    {
      label: 'Reactive Variables',
      language: 'typescript',
      code: `import { makeVar, useReactiveVar, InMemoryCache, gql } from '@apollo/client';

// Define reactive variables
export const isLoggedInVar = makeVar(false);
export const cartItemsVar = makeVar<string[]>([]);

// Read/write from anywhere
isLoggedInVar(true);  // set
isLoggedInVar();      // get → true

cartItemsVar([...cartItemsVar(), 'item-123']);  // append

// Use in React component
function Navbar() {
  const isLoggedIn = useReactiveVar(isLoggedInVar);
  const cartCount = useReactiveVar(cartItemsVar).length;
  return <nav>{isLoggedIn ? <UserMenu /> : <LoginBtn />} ({cartCount})</nav>;
}

// Integrate with InMemoryCache field policy
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        isLoggedIn: { read: () => isLoggedInVar() },
        cartItems: { read: () => cartItemsVar() }
      }
    }
  }
});`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not including __typename in mutation responses',
      wrong: `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) { title }  # no id or __typename
}`,
      right: `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) { id title }  # id enables normalization
}`,
      explanation: 'Without id (and __typename, which Apollo adds automatically), the cache cannot normalize the new object. It won\'t be linked to the existing Post cache entry.'
    },
    {
      title: 'Reading undefined cache entries without null check',
      wrong: `const { posts } = client.cache.readQuery({ query: GET_POSTS })!;  // ! is dangerous`,
      right: `const result = client.cache.readQuery({ query: GET_POSTS });
if (result) { /* use result.posts */ }`,
      explanation: 'readQuery returns null when the query is not fully cached. Using non-null assertion without checking causes a runtime error when the cache is empty.'
    },
    {
      title: 'Calling cache.gc() without evicting first',
      wrong: `client.cache.gc();  // gc without prior evict — nothing is orphaned yet`,
      right: `client.cache.evict({ id: client.cache.identify(post) });
client.cache.gc();  // now collect the orphaned refs`,
      explanation: 'gc() only removes entries with no references. Evict first to remove the reference, then gc() cleans up dangling objects.'
    },
    {
      title: 'Not using keyArgs for paginated fields',
      wrong: `// Without keyArgs, posts(filter: "A") and posts(filter: "B") share cache
posts: { merge(existing = [], incoming) { return [...existing, ...incoming]; } }`,
      right: `posts: {
  keyArgs: ['filter'],  // separate cache per filter value
  merge(existing = [], incoming) { return [...existing, ...incoming]; }
}`,
      explanation: 'Without keyArgs, the cache uses all arguments as the cache key by default. Set keyArgs to only the arguments that identify different result sets (not pagination cursors).'
    },
    {
      title: 'Using writeQuery with incomplete data shapes',
      wrong: `cache.writeQuery({
  query: GET_POST,
  data: { post: { title: 'New' } }  // missing id, __typename, other fields
})`,
      right: `cache.writeQuery({
  query: GET_POST,
  data: { post: { __typename: 'Post', id: 'p1', title: 'New', body: '' } }
})`,
      explanation: 'writeQuery requires a complete shape matching all fields in the query. Missing fields cause the cache entry to be incomplete and future reads may return unexpected results.'
    }
  ];

  challenge: Challenge = {
    title: 'Update Cache After Mutation with cache.modify',
    language: 'typescript',
    description: 'After a `createPost` mutation, add the new post to the beginning of the `posts` list in the cache using `cache.modify` (no refetch). Use `toReference` to create a cache reference for the new post, and `readField` to verify the ID isn\'t already in the list before adding it.',
    hints: [
      'cache.modify targets the ROOT_QUERY by default (or pass a specific id)',
      'fields.posts receives (existingRefs, { toReference, readField })',
      'toReference(newPost) creates a Reference from the object',
      'Check existingRefs with readField("id", ref) to avoid duplicates'
    ],
    starterCode: `useMutation(CREATE_POST, {
  update(cache, { data }) {
    const newPost = data?.createPost;
    if (!newPost) return;

    cache.modify({
      fields: {
        posts(existingRefs, /* helpers */) {
          // TODO: avoid duplicates, prepend newPost ref
        }
      }
    });
  }
})`,
    solution: `useMutation(CREATE_POST, {
  update(cache, { data }) {
    const newPost = data?.createPost;
    if (!newPost) return;

    cache.modify({
      fields: {
        posts(existingRefs = [], { toReference, readField }) {
          const newRef = toReference(newPost);
          // Avoid adding duplicate
          const isDuplicate = existingRefs.some(
            (ref: Reference) => readField('id', ref) === newPost.id
          );
          if (isDuplicate) return existingRefs;
          return [newRef, ...existingRefs];
        }
      }
    });
  }
})`
  };

  quiz: QuizQuestion[] = [
    { q: 'How does Apollo Client normalize cached objects?', options: ['By URL', 'By __typename + id', 'By field order', 'By query name'], answer: 1, explanation: 'Apollo InMemoryCache normalizes objects using __typename + id as a unique key. All queries returning the same object share one cache entry.' },
    { q: 'What does cache.modify do?', options: ['Clears the entire cache', 'Updates specific fields on a cached object without replacing it', 'Reads a cached query', 'Evicts an object from cache'], answer: 1, explanation: 'cache.modify surgically updates individual fields on a cached object. The fields object maps field names to functions that receive and return the new cached value.' },
    { q: 'When does cache.readQuery return null?', options: ['When the query has errors', 'When the query is not fully cached', 'Always for mutations', 'When id is missing'], answer: 1, explanation: 'readQuery returns null when the query or any of its required fields are not present in the cache. Always check for null before using the result.' },
    { q: 'What is the purpose of keyArgs in a field policy?', options: ['Defines the sort order', 'Specifies which arguments form the cache key — separating result sets', 'Sets the max cache size', 'Encrypts cached data'], answer: 1, explanation: 'keyArgs determines which field arguments are used to create separate cache entries. Critical for pagination: filter is a keyArg but cursor/offset are not.' },
    { q: 'What are Apollo reactive variables?', options: ['GraphQL variables passed to queries', 'Client-side state stored outside the normalized cache that triggers re-renders on change', 'Server-side computed fields', 'Cache eviction keys'], answer: 1, explanation: 'Reactive variables (makeVar) store client-side state outside the cache. Components using useReactiveVar re-render automatically when the variable changes.' },
    { q: 'What does cache.gc() do?', options: ['Clears the entire cache', 'Removes orphaned cache entries with no references', 'Triggers a garbage collection of the JS heap', 'Evicts stale data by age'], answer: 1, explanation: 'gc() removes cache entries that are no longer referenced by any query or object. Call it after cache.evict() to clean up dangling references.' }
  ];

  qna: QnaItem[] = [
    { q: 'When should I use cache.writeQuery vs cache.modify?', a: 'writeQuery: you have a complete result matching a specific query shape and want to populate or replace it. cache.modify: you want to surgically update one or more fields on an existing cached object without knowing its full query shape.' },
    { q: 'How does Apollo handle queries that return the same object?', a: 'Through normalization. If two queries return User { id: "1", name: "Alice" }, both write to the same cache entry (User:1). When any query updates that entry, all components reading from it re-render with the new data.' },
    { q: 'What is cache.identify()?', a: 'cache.identify(obj) returns the cache key for a given object: `User:1` for { __typename: "User", id: "1" }. Use it with cache.evict({ id: cache.identify(obj) }) to evict a specific object.' },
    { q: 'How do I reset the Apollo cache on logout?', a: 'Use client.resetStore() — it clears the cache and re-runs all active queries. Or client.clearStore() to clear without re-running queries. Call it after clearing auth tokens on logout.' },
    { q: 'What is the INVALIDATE sentinel in cache.modify?', a: '`INVALIDATE` is a special sentinel value from the modify helpers. Setting a field to INVALIDATE marks it as stale, causing Apollo to re-fetch it from the network on the next read without evicting the entire object.' },
    { q: 'Can the cache persist between sessions?', a: 'Yes — apollo3-cache-persist serializes the InMemoryCache to localStorage or AsyncStorage and restores it on page load. Useful for offline-first apps and faster initial loads.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Apollo InMemoryCache normalizes by __typename+id — use modify for surgical updates, writeQuery for full replacement, and field policies for pagination and computed reads.',
    mustKnow: [
      'Normalization: objects stored by __typename + id — shared across all queries',
      'readQuery: synchronous cache read — returns null on miss',
      'writeQuery: write complete query result; cache.modify: surgical field update',
      'keyArgs: which args form separate cache entries (exclude pagination cursors)',
      'cache.evict() then cache.gc() to remove and clean up entries',
      'makeVar + useReactiveVar for client-side state outside the cache'
    ],
    interviewFocus: [
      'How does Apollo Client InMemoryCache normalization work?',
      'What is the difference between cache.writeQuery and cache.modify?',
      'Explain field policies — what are keyArgs and merge used for?'
    ]
  };
}
