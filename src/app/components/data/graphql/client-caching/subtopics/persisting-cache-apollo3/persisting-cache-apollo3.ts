import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-client-caching-persist',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './persisting-cache-apollo3.html',
  styleUrl: './persisting-cache-apollo3.scss'
})
export class PersistingCacheApollo3Subtopic {
  topicLabel = 'Client-Side Caching';
  topicRoute = '/graphql/client-caching';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the library in one QnA sentence and never shows it in code',
      points: [
        'The main page\'s own QnA says: "apollo3-cache-persist serializes the InMemoryCache to localStorage or AsyncStorage and restores it on page load" — but no codeTab on the page ever calls it.',
        'The real, verified API is <code>persistCache({ cache, storage })</code> — a single async call, given the SAME <code>InMemoryCache</code> instance that will later be passed to <code>ApolloClient</code>, plus a storage adapter (<code>LocalStorageWrapper</code> for the web, an AsyncStorage-backed wrapper for React Native).',
        '<code>persistCache()</code> must be <code>await</code>ed BEFORE the <code>ApolloClient</code> instance is created — restoring the persisted cache into the (still-empty) <code>InMemoryCache</code> object is what the await is waiting for; creating the client first risks it running queries against a cache that has not finished being restored yet.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Restoring the cache before the app renders',
      language: 'typescript',
      code: `import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
import { useEffect, useState } from 'react';

async function setupClient() {
  const cache = new InMemoryCache();

  // Must be awaited BEFORE creating the ApolloClient -- this restores
  // whatever was persisted from a previous session directly into 'cache'.
  await persistCache({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
  });

  return new ApolloClient({ uri: '/graphql', cache });
}

function App() {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  useEffect(() => {
    setupClient().then(setClient);
  }, []);

  // Render nothing (or a splash screen) until the cache has finished
  // restoring -- rendering with a null client would crash any component
  // calling useQuery.
  if (!client) return <SplashScreen />;

  return (
    <ApolloProvider client={client}>
      <Router />
    </ApolloProvider>
  );
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes <code>const client = new ApolloClient({ uri, cache });</code> FIRST, then calls <code>await persistCache({ cache, storage })</code> AFTERWARD, reasoning that "the cache object is passed by reference either way, so order shouldn\'t matter." Is this reasoning correct?',
    hint: 'Consider what could happen between the moment <code>ApolloClient</code> is constructed and the moment <code>persistCache</code> finishes reading from storage and populating <code>cache</code> -- is the app guaranteed to sit idle during that window?',
    solution: 'The reasoning is wrong in practice, even though the cache object reference is technically shared either way. The real risk is TIMING, not object identity: once ApolloClient is constructed, any component already mounted (or a route that renders immediately) can call useQuery and read from the cache RIGHT AWAY -- before persistCache has finished its own asynchronous read from localStorage/AsyncStorage and populated it. A query executed in that window sees an EMPTY cache and treats it as a genuine cache miss, firing an unnecessary network request the persisted data was specifically meant to avoid -- or, in a worse case, a component reads a partially-restored cache mid-restoration. Awaiting persistCache() BEFORE constructing ApolloClient (and gating the app\'s render behind that await, as shown in this subtopic\'s own codeTab) closes this window entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since <code>persistCache()</code> and <code>new ApolloClient()</code> both just reference the same <code>cache</code> object, calling them in either order produces the same end result.',
      reality: 'Object reference sharing is not the issue — TIMING is. Constructing <code>ApolloClient</code> before <code>persistCache()</code> finishes restoring data creates a window where a component can read from the still-empty cache and trigger an unnecessary network request, defeating the entire point of persisting it.'
    },
    {
      thought: 'apollo3-cache-persist is only useful for offline-first mobile apps using AsyncStorage.',
      reality: 'The exact same API works with <code>LocalStorageWrapper</code> for ordinary web apps too — the main page\'s own QnA already states this ("localStorage or AsyncStorage"), and the benefit (faster initial loads, avoiding a blank-then-populated flash) applies to any Apollo Client app, mobile or web.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Unnormalized Objects Are Embedded, Never Referenced', route: '/graphql/client-caching/embedded-vs-normalized-objects' };
  next: SubtopicLink | null = null;
}
