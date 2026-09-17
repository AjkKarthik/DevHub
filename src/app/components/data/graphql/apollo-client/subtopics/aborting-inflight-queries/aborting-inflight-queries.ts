import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-apollo-client-aborting',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './aborting-inflight-queries.html',
  styleUrl: './aborting-inflight-queries.scss'
})
export class AbortingInflightQueriesSubtopic {
  topicLabel = 'Apollo Client';
  topicRoute = '/graphql/apollo-client';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s original QnA answer was wrong on three separate counts',
      points: [
        'It claimed you could pass an AbortController signal "via fetchPolicy: \'no-cache\' queries" — <code>fetchPolicy</code> controls cache read/write behavior; it has nothing to do with aborting a request at all.',
        'It claimed <code>client.watchQuery().cancel()</code> exists — verified against Apollo Client\'s own <code>ObservableQuery</code> API surface: there is no <code>cancel()</code> method. Stopping an active <code>watchQuery()</code> means unsubscribing from the subscription it returns.',
        'It claimed "Apollo 3+ supports React 18 AbortSignal integration" — there is no such React-18-specific feature. The real mechanism (below) has existed for years and has nothing to do with React versioning.'
      ]
    },
    {
      heading: 'The real, verified mechanism',
      points: [
        'Apollo Client uses the browser\'s <code>fetch()</code> API under the hood for HttpLink — and <code>fetch()</code> already accepts an <code>AbortSignal</code>. Apollo forwards <code>context.fetchOptions</code> straight through to the underlying <code>fetch()</code> call.',
        'Pass the signal per-call: <code>client.query({ query, context: { fetchOptions: { signal } } })</code> — since the same query document can be reused in multiple places with different contexts, the signal is supplied at the CALL SITE, not baked into the query definition.',
        'A real, documented gotcha (confirmed via Apollo\'s own GitHub issue tracker): Apollo Client deduplicates identical in-flight requests. Re-running the SAME query with the SAME variables shortly after aborting it can resolve against the already-aborted in-flight request instead of firing a genuinely new one.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Aborting a query with AbortController',
      language: 'typescript',
      code: `import { useEffect, useRef } from 'react';
import { useApolloClient, gql } from '@apollo/client';

const SEARCH_POSTS = gql\`
  query SearchPosts($query: String!) {
    searchPosts(query: $query) { id title }
  }
\`;

function useAbortableSearch() {
  const client = useApolloClient();
  const controllerRef = useRef<AbortController | null>(null);

  async function search(query: string) {
    // Abort any request still in flight from a previous call
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      return await client.query({
        query: SEARCH_POSTS,
        variables: { query },
        fetchPolicy: 'no-cache',       // fetchPolicy is orthogonal to aborting -- this
                                        // just avoids caching a stale search result
        context: { fetchOptions: { signal: controller.signal } },
      });
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return null;  // silently ignore -- a newer search superseded this one
      }
      throw err;
    }
  }

  useEffect(() => () => controllerRef.current?.abort(), []); // cleanup on unmount

  return search;
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A component calls <code>watchQuery()</code> directly (not via <code>useQuery</code>) to poll for updates, and wants to stop watching when the user navigates away. Given that <code>ObservableQuery</code> has no <code>cancel()</code> method, how should the cleanup actually be written?',
    hint: '<code>watchQuery()</code> returns an <code>ObservableQuery</code>, which you call <code>.subscribe(observerOrCallback)</code> on to start receiving updates -- what does that <code>.subscribe()</code> call itself return, and what would you normally do with THAT return value to stop listening?',
    solution: 'The cleanup should call .unsubscribe() on the Subscription object returned by .subscribe(), not any method on the ObservableQuery itself: const observable = client.watchQuery({ query }); const subscription = observable.subscribe({ next: (result) => { /* ... */ } }); // later, on cleanup: subscription.unsubscribe(); Unsubscribing stops the component from receiving further updates and lets Apollo Client garbage-collect the underlying watch, but it does NOT necessarily abort an already-in-flight network request for the current fetch -- for that, the same context.fetchOptions.signal technique from this subtopic\'s own codeTab would need to be combined with watchQuery\'s own options.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>fetchPolicy: \'no-cache\'</code> is the mechanism Apollo Client uses to support aborting a query.',
      reality: '<code>fetchPolicy</code> only controls whether a query reads from or writes to the cache — it has no relationship to request cancellation at all. Aborting is done entirely through <code>context.fetchOptions.signal</code>, independent of whatever <code>fetchPolicy</code> is set.'
    },
    {
      thought: '<code>ObservableQuery</code> (returned by <code>watchQuery()</code>) has a <code>cancel()</code> method for stopping an active watch.',
      reality: 'Verified against Apollo Client\'s own API surface: no such method exists. The correct way to stop receiving updates from a <code>watchQuery()</code> is to <code>.unsubscribe()</code> from the <code>Subscription</code> object its own <code>.subscribe()</code> call returns.'
    },
    {
      thought: 'Once a query is aborted, immediately re-running the identical query with the same variables always fires a fresh network request.',
      reality: 'Apollo Client\'s own request deduplication (confirmed via a real GitHub issue on the project) can cause a re-run of the same query+variables shortly after an abort to resolve against the already-aborted in-flight request instead of triggering a genuinely new one — a real, documented limitation of this technique.'
    }
  ];

  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = { label: 'Reactive Variables for Global Client-Side State', route: '/graphql/apollo-client/reactive-variables-global-state' };
}
