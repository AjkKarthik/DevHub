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
  selector: 'app-gql-pagination',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss'
})
export class GqlPagination {
  quickRef: QuickRefItem[] = [
    { type: 'syntax', name: 'limit / offset', desc: 'Offset pagination — simple but inconsistent with live data' },
    { type: 'syntax', name: 'first / after', desc: 'Cursor pagination — forward traversal using an opaque cursor' },
    { type: 'syntax', name: 'last / before', desc: 'Cursor pagination — backward traversal' },
    { type: 'type', name: 'Connection', desc: 'Relay spec type wrapping a paginated list: { edges, pageInfo }' },
    { type: 'type', name: 'Edge', desc: 'Relay spec: wraps one item — { node: T, cursor: String! }' },
    { type: 'type', name: 'PageInfo', desc: 'Relay spec: { hasNextPage, hasPreviousPage, startCursor, endCursor }' },
    { type: 'type', name: 'cursor', desc: 'Opaque string identifying a position in the list (often base64 of id or sort key)' },
    { type: 'keyword', name: 'Relay connection spec', desc: 'Community standard for cursor pagination with Connection/Edge/PageInfo' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Offset Pagination',
      points: [
        'Offset pagination uses `limit` and `offset` (or `page` and `size`) to slice a sorted list.',
        'Simple to implement and familiar from SQL: `SELECT * FROM posts LIMIT 10 OFFSET 20`.',
        'Problem: if new items are inserted or deleted between pages, the same item can appear twice or be skipped.',
        'Best for: static datasets, admin panels, total-count-required UIs. Not suitable for real-time feeds.'
      ]
    },
    {
      heading: 'Cursor Pagination',
      points: [
        'Cursor pagination uses an opaque pointer to a specific position: `first: 10, after: "<cursor>"`.',
        'The cursor identifies where to start the next page — typically a base64-encoded id or timestamp.',
        'Stable under insertions/deletions: new items don\'t shift existing cursors.',
        'Cannot jump to page 5 directly — you must traverse sequentially. Good for infinite scroll, bad for numbered pages.'
      ]
    },
    {
      heading: 'Relay Connection Specification',
      points: [
        'The Relay connection spec defines a standard schema pattern for cursor pagination used by many APIs.',
        'PostConnection has `edges: [PostEdge!]!` and `pageInfo: PageInfo!`. PostEdge has `node: Post!` and `cursor: String!`.',
        'PageInfo has: hasNextPage, hasPreviousPage, startCursor, endCursor.',
        'Relay and Apollo Client have built-in support for connection merging and pagination when you follow the spec.'
      ]
    },
    {
      heading: 'Total Count',
      points: [
        'For paginated UIs showing "Page X of Y", you need a total count. Add `totalCount: Int!` to the connection type.',
        'Total count is an extra DB query. Cache it aggressively or use approximate counts for large datasets.',
        'Cursor pagination doesn\'t require a total count — `hasNextPage` is sufficient for infinite scroll.',
        'Avoid COUNT(*) on every page request in high-traffic APIs — it\'s often the slowest part of pagination.'
      ]
    },
    {
      heading: 'Apollo Client Pagination',
      points: [
        'Apollo Client\'s InMemoryCache supports pagination merging via field policies (`keyArgs`, `merge`, `read`).',
        'Without field policies, Apollo treats `posts(first: 10)` and `posts(first: 20)` as separate cache keys.',
        'The `relayStylePagination()` helper provides a pre-built field policy for Relay-spec connections.',
        'Implement custom merge to concatenate pages: `existing.concat(incoming)` for infinite scroll.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema Patterns',
      language: 'typescript',
      code: `# Offset pagination (simple)
type Query {
  posts(limit: Int = 10, offset: Int = 0): PostsResult!
}
type PostsResult {
  items: [Post!]!
  total: Int!
}

# Relay connection (cursor pagination)
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
type PostEdge {
  node: Post!
  cursor: String!
}
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
type Query {
  posts(first: Int, after: String, last: Int, before: String): PostConnection!
}`
    },
    {
      label: 'Resolver',
      language: 'typescript',
      code: `import { encode, decode } from 'base-64';

const resolvers = {
  Query: {
    posts: async (_, { first = 10, after, last, before }, { db }) => {
      // Decode cursor to get the last-seen ID
      const afterId = after ? decode(after) : null;

      // Fetch one extra to determine hasNextPage
      const items = await db.posts.findMany({
        take: first + 1,
        cursor: afterId ? { id: afterId } : undefined,
        skip: afterId ? 1 : 0,
        orderBy: { createdAt: 'desc' }
      });

      const hasNextPage = items.length > first;
      const nodes = hasNextPage ? items.slice(0, first) : items;
      const totalCount = await db.posts.count();

      return {
        edges: nodes.map(node => ({
          node,
          cursor: encode(node.id)  // opaque cursor
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!afterId,
          startCursor: nodes[0] ? encode(nodes[0].id) : null,
          endCursor: nodes.at(-1) ? encode(nodes.at(-1)!.id) : null
        },
        totalCount
      };
    }
  }
};`
    },
    {
      label: 'Apollo Client',
      language: 'typescript',
      code: `import { InMemoryCache, ApolloClient, gql } from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

// Cache with relay-style pagination field policy
const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: relayStylePagination()  // handles merge automatically
        }
      }
    }
  })
});

// Query with fetchMore for infinite scroll
function PostFeed() {
  const { data, fetchMore, loading } = useQuery(gql\`
    query GetPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after) {
        edges { node { id title } cursor }
        pageInfo { hasNextPage endCursor }
      }
    }
  \`, { variables: { first: 10 } });

  const loadMore = () => {
    fetchMore({
      variables: { after: data.posts.pageInfo.endCursor }
    });
  };

  return (
    <div>
      {data?.posts.edges.map(({ node }) => <PostCard key={node.id} post={node} />)}
      {data?.posts.pageInfo.hasNextPage && (
        <button onClick={loadMore} disabled={loading}>Load more</button>
      )}
    </div>
  );
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using offset pagination for real-time feeds',
      wrong: `posts(offset: 20, limit: 10)  # new posts inserted — page 3 now includes page 2's last item`,
      right: `posts(first: 10, after: $cursor)  # cursor-based — stable under insertions`,
      explanation: 'Offset pagination breaks when data is inserted or deleted between requests. Cursor pagination is stable because it references a specific position.'
    },
    {
      title: 'Not fetching one extra to detect hasNextPage',
      wrong: `const items = await db.findMany({ take: first });
// No way to know if there are more results!`,
      right: `const items = await db.findMany({ take: first + 1 });
const hasNextPage = items.length > first;
const nodes = hasNextPage ? items.slice(0, first) : items;`,
      explanation: 'Fetch limit+1 items. If you get limit+1 results, there is a next page. Slice to limit before returning. This avoids an extra COUNT(*) query.'
    },
    {
      title: 'Using transparent (non-opaque) cursors',
      wrong: `cursor: post.id.toString()  // exposes internal ID format — brittle`,
      right: `cursor: Buffer.from(post.id).toString('base64')  // opaque — internal details hidden`,
      explanation: 'Cursors should be opaque to clients. Base64-encoding (or similar) hides the internal key format and allows you to change the cursor implementation without breaking clients.'
    },
    {
      title: 'Running COUNT(*) on every request without caching',
      wrong: `totalCount: async (_, __, { db }) => db.posts.count()  // expensive on large tables`,
      right: `// Cache totalCount, use approximate count, or omit it for infinite scroll
// Infinite scroll only needs hasNextPage — no total count required`,
      explanation: 'COUNT(*) on large tables is slow. Cache total counts aggressively, use DB statistics for approximations, or design UIs that don\'t require exact totals.'
    },
    {
      title: 'Ignoring field policies in Apollo Client',
      wrong: `// Without field policy, Apollo treats posts(first:10) and posts(first:20) as different cached keys
// Clicking "Load more" replaces the first page instead of appending`,
      right: `cache: new InMemoryCache({
  typePolicies: { Query: { fields: { posts: relayStylePagination() } } }
})`,
      explanation: 'Without a field policy, Apollo cannot merge paginated results. Use relayStylePagination() for Relay connections or implement a custom merge function.'
    }
  ];

  challenge: Challenge = {
    title: 'Implement Relay-Style Pagination Resolver',
    language: 'typescript',
    description: 'Write a complete `posts(first: Int!, after: String)` resolver that returns a PostConnection. The resolver should: fetch first+1 items from a Prisma DB, compute hasNextPage, encode cursors as base64, and return edges with node+cursor, pageInfo with hasNextPage/endCursor, and a totalCount.',
    hints: [
      'Use Buffer.from(id).toString("base64") for cursor encoding',
      'Buffer.from(cursor, "base64").toString() to decode',
      'Fetch first+1 to detect hasNextPage without COUNT',
      'Slice to first before building edges'
    ],
    starterCode: `const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }, { db }) => {
      const cursor = after ? Buffer.from(after, 'base64').toString() : null;
      // TODO: fetch, compute hasNextPage, build edges, return connection
    }
  }
};`,
    solution: `const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }, { db }) => {
      const cursorId = after ? Buffer.from(after, 'base64').toString() : null;

      const items = await db.posts.findMany({
        take: first + 1,
        cursor: cursorId ? { id: cursorId } : undefined,
        skip: cursorId ? 1 : 0,
        orderBy: { createdAt: 'desc' }
      });

      const hasNextPage = items.length > first;
      const nodes = hasNextPage ? items.slice(0, first) : items;
      const totalCount = await db.posts.count();

      return {
        edges: nodes.map(node => ({
          node,
          cursor: Buffer.from(node.id).toString('base64')
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!cursorId,
          startCursor: nodes[0] ? Buffer.from(nodes[0].id).toString('base64') : null,
          endCursor: nodes.at(-1) ? Buffer.from(nodes.at(-1)!.id).toString('base64') : null
        },
        totalCount
      };
    }
  }
};`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the main disadvantage of offset pagination?', options: ['It is too slow', 'Items can be skipped or duplicated when data changes between pages', 'It doesn\'t work with SQL', 'It requires a cursor'], answer: 1, explanation: 'If items are inserted or deleted between page requests, items shift positions and can appear twice or be skipped in subsequent pages.' },
    { q: 'What does the Relay Connection spec define?', options: ['A WebSocket protocol', 'Connection/Edge/PageInfo types for cursor pagination', 'An HTTP caching strategy', 'A schema stitching approach'], answer: 1, explanation: 'The Relay spec defines Connection (with edges and pageInfo), Edge (node + cursor), and PageInfo (hasNextPage, hasPreviousPage, startCursor, endCursor).' },
    { q: 'How do you detect if there is a next page without a COUNT query?', options: ['Check the cursor length', 'Fetch limit+1 items — if you get limit+1, there are more', 'Check the response headers', 'Use hasNextPage field on each item'], answer: 1, explanation: 'Fetching limit+1 items reveals whether more exist. If the result has limit+1 items, set hasNextPage=true and return only the first limit items.' },
    { q: 'Why should cursors be opaque (base64-encoded)?', options: ['To reduce bandwidth', 'To hide internal implementation details from clients', 'To enable compression', 'To avoid JSON serialization'], answer: 1, explanation: 'Opaque cursors hide the internal key format. Clients treat them as tokens and cannot rely on their structure, freeing you to change the cursor implementation.' },
    { q: 'What is relayStylePagination() in Apollo Client?', options: ['A React hook for infinite scroll', 'A pre-built InMemoryCache field policy for Relay-spec connections', 'A server-side plugin', 'A schema validator'], answer: 1, explanation: 'relayStylePagination() provides a ready-made field policy that handles cursor-based result merging (appending pages) in Apollo Client\'s InMemoryCache.' },
    { q: 'When is offset pagination preferred over cursor pagination?', options: ['For real-time feeds', 'For infinite scroll', 'For numbered pages with total count on static data', 'Never'], answer: 2, explanation: 'Offset pagination is simpler and enables numbered pages with total counts — appropriate for static datasets, admin grids, and UIs where jumping to a specific page is required.' }
  ];

  qna: QnaItem[] = [
    { q: 'Can I implement both offset and cursor pagination on the same field?', a: 'You can, but it\'s complex and usually unnecessary. Pick one based on your UI needs. Some APIs provide both: `posts(page: Int, limit: Int)` for offset and `posts(first: Int, after: String)` for cursor, but this doubles the implementation surface.' },
    { q: 'What should the cursor encode?', a: 'Typically the primary key or a composite of the sort key + primary key. Example: for posts sorted by createdAt desc, the cursor might encode { createdAt, id } to ensure stable ordering even with identical timestamps.' },
    { q: 'How do I handle backward pagination (last/before)?', a: 'Fetch results in reverse order using the before cursor, then reverse the array before returning. The complexity is why many APIs only implement forward pagination (first/after) and accept the limitation.' },
    { q: 'What is keyset pagination?', a: 'Keyset pagination is a DB-level cursor technique using WHERE clauses on sorted columns instead of OFFSET. It\'s more efficient than OFFSET for large tables and is the underlying DB pattern for cursor-based GraphQL pagination.' },
    { q: 'How do I support search + cursor pagination?', a: 'Pass the search term as a stable argument alongside the cursor. The cursor encodes the position within the filtered result set. Note: cursors from one search term are invalid for a different search term.' },
    { q: 'Can cursor pagination show a total count?', a: 'Yes — add `totalCount: Int!` to the connection type and resolve it with a COUNT query. Cache it aggressively since it\'s expensive. For infinite scroll UIs, consider omitting totalCount and only using hasNextPage.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Cursor pagination is stable and scalable; offset is simple but brittle — the Relay Connection spec is the community standard for cursor-based GraphQL pagination.',
    mustKnow: [
      'Offset: simple but unstable under mutations — use for static data',
      'Cursor: stable position in list — use for feeds, infinite scroll',
      'Relay spec: Connection → edges[] (node + cursor) + pageInfo',
      'PageInfo: hasNextPage, hasPreviousPage, startCursor, endCursor',
      'Fetch limit+1 to detect hasNextPage without COUNT(*)',
      'relayStylePagination() provides Apollo Client field policy for Relay connections'
    ],
    interviewFocus: [
      'Why does offset pagination break with real-time data?',
      'Explain the Relay Connection specification',
      'How do you detect hasNextPage efficiently without a COUNT query?'
    ]
  };
}
