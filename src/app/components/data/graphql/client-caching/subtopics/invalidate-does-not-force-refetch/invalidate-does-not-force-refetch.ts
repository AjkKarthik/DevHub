import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-client-caching-invalidate',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './invalidate-does-not-force-refetch.html',
  styleUrl: './invalidate-does-not-force-refetch.scss'
})
export class InvalidateDoesNotForceRefetchSubtopic {
  topicLabel = 'Client-Side Caching';
  topicRoute = '/graphql/client-caching';

  theory: TheoryPoint[] = [
    {
      heading: 'What the main page originally claimed, and what is actually verified true',
      points: [
        'The main page\'s own theory bullet and QnA both originally said returning <code>INVALIDATE</code> from a <code>cache.modify()</code> field function "causes Apollo to re-fetch it from the network on the next read" — verified against a real GitHub issue on the Apollo Client project that this is NOT what happens on its own.',
        '<code>INVALIDATE</code> marks a field as stale WITHOUT changing its cached value at all. With the default <code>cache-first</code> fetchPolicy, a query re-reading that field sees the exact same (unchanged) value it already had — and since nothing actually looks different, Apollo has no reason to issue a network request.',
        'The documented, actually-working pattern is combining <code>cache.modify({ ... INVALIDATE })</code> with <code>client.refetchQueries({ updateCache })</code> — the <code>refetchQueries</code> call is what forces the network round-trip; <code>INVALIDATE</code> alone only marks which watched queries should be considered for that refetch.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The pattern that looks correct but does nothing',
      language: 'typescript',
      code: `// This is exactly what the main page's own (now-corrected) theory bullet
// used to show as "the" way to force a refetch:
cache.modify({
  fields: {
    posts: (_, { INVALIDATE }) => INVALIDATE,
  },
});

// With the default fetchPolicy ('cache-first'), any component whose
// useQuery watches 'posts' re-reads the SAME cached value it already had
// -- INVALIDATE never actually replaced or removed anything -- so Apollo
// has no signal that anything changed and typically issues ZERO network
// requests. The UI stays exactly as stale as it was before this call.`
    },
    {
      label: 'The documented, actually-working pattern',
      language: 'typescript',
      code: `import { useMutation } from '@apollo/client';

const [markPostsStale] = useMutation(SOME_MUTATION, {
  async update(_cache, _result, { client }) {
    // client.refetchQueries with an updateCache callback is what actually
    // forces a network round-trip for the invalidated field -- INVALIDATE
    // alone (as shown above) never does this by itself.
    await client!.refetchQueries({
      updateCache(cache) {
        cache.modify({
          fields: {
            posts: (_, { INVALIDATE }) => INVALIDATE,
          },
        });
      },
    });
  },
});

// client.refetchQueries scans for active queries whose watched fields were
// just marked stale by the updateCache callback, and re-runs THOSE queries
// against the network -- this is the actual mechanism that produces a
// real refetch, not the bare cache.modify(INVALIDATE) call on its own.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A component uses <code>useQuery(GET_POSTS, { fetchPolicy: \'cache-and-network\' })</code> instead of the default <code>cache-first</code>. After a mutation calls <code>cache.modify({ fields: { posts: (_, { INVALIDATE }) => INVALIDATE } })</code> alone (no <code>refetchQueries</code>), does THIS component\'s query issue a network request on its next re-render?',
    hint: '<code>cache-and-network</code> means: return the cached result immediately, AND ALSO always issue a network request in parallel, regardless of whether the cache changed at all.',
    solution: 'Yes -- but not because of INVALIDATE. A component using cache-and-network always issues a network request on every query execution, completely independent of whether anything in the cache was marked stale or changed. This is a coincidence of fetchPolicy choice, not INVALIDATE doing its documented job -- a DIFFERENT component on the same page using the default cache-first policy would still see zero network activity from that same INVALIDATE call, exactly as this subtopic\'s first codeTab describes. This distinction matters: relying on INVALIDATE alone produces inconsistent behavior across components with different fetchPolicies, which is exactly why the documented fix uses client.refetchQueries -- it forces a refetch deterministically, regardless of any individual component\'s own fetchPolicy setting.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Returning <code>INVALIDATE</code> from a <code>cache.modify()</code> field function is, by itself, enough to force Apollo to refetch that field from the network.',
      reality: 'Verified against Apollo\'s own GitHub issue tracker: <code>INVALIDATE</code> alone only marks a field as stale, without changing its cached value. Under the default <code>cache-first</code> fetchPolicy, a query re-reading that unchanged value has no reason to hit the network — the actual refetch requires wrapping the call in <code>client.refetchQueries({ updateCache })</code>.'
    },
    {
      thought: '<code>INVALIDATE</code> and <code>cache.evict()</code> do essentially the same thing — remove a field so it gets refetched.',
      reality: '<code>evict()</code> genuinely removes a field\'s cached value, so a subsequent read is a real cache miss that DOES trigger a network fetch under <code>cache-first</code>. <code>INVALIDATE</code> leaves the value in place and only marks it stale — a much weaker, purely-advisory signal that needs <code>refetchQueries</code> to have any real effect.'
    }
  ];

  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = { label: 'Unnormalized Objects Are Embedded, Never Referenced', route: '/graphql/client-caching/embedded-vs-normalized-objects' };
}
