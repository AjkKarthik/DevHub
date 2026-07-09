import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-initialdata-vs-placeholderdata-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './initialdata-skips-fetch-placeholderdata-always-fetches.html',
  styleUrl: './initialdata-skips-fetch-placeholderdata-always-fetches.scss',
})
export class InitialdataSkipsFetchPlaceholderdataAlwaysFetchesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A One-Sentence Distinction With No Demonstration',
      points: [
        'The Optimistic Updates section states, in a single sentence: "<code>initialData</code> is treated as real cached data (subject to <code>staleTime</code>); <code>placeholderData</code> is shown immediately but triggers a fetch right away and does not pollute the cache."',
        'That sentence packs in two separate, testable claims: (1) <code>initialData</code> respects <code>staleTime</code> and can skip a fetch entirely; (2) <code>placeholderData</code> ALWAYS triggers an immediate fetch, regardless of any <code>staleTime</code> setting. This subtopic checks both, side by side, with the exact same <code>staleTime</code> applied to each.',
      ],
    },
    {
      heading: 'Why initialData Can Skip the Fetch and placeholderData Never Can',
      points: [
        '<code>initialData</code> is written directly into the query\'s cache entry as if a real fetch had already completed and returned it. Once there, it is subject to the SAME staleness rules as any other cached data — if <code>staleTime</code> hasn\'t elapsed, TanStack Query considers it fresh and skips fetching entirely, exactly like data returned from a real prior fetch.',
        '<code>placeholderData</code> is never written to the cache at all — it exists purely as a rendering fallback, shown to the UI while the ACTUAL query state remains "no data yet." Because there is no real cache entry to be fresh or stale, TanStack Query always proceeds to fetch, with no <code>staleTime</code> check to potentially skip it.',
        'This means with the identical <code>staleTime: Infinity</code> setting, <code>initialData</code> can result in ZERO network requests ever, while <code>placeholderData</code> always triggers exactly one — the two options look similar (both show something instantly) but have fundamentally different fetching behavior.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "initialdata-vs-placeholderdata-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@tanstack/react-query": "^5.28.0"
  },
  "scripts": {
    "start": "react-scripts start"
  }
}
`,
    },
    {
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html>
  <head><title>initialData vs placeholderData</title></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
    },
    {
      path: 'src/index.js',
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
`,
    },
    {
      path: 'src/App.js',
      content: `import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

let initialDataFetchCount = 0;
let placeholderDataFetchCount = 0;

function InitialDataExample() {
  const { data, isFetching } = useQuery({
    queryKey: ['profile-a'],
    queryFn: () => {
      initialDataFetchCount += 1;
      return Promise.resolve({ name: 'Fresh from server' });
    },
    initialData: { name: 'Instant (initialData)' },
    staleTime: Infinity, // never becomes stale on its own
  });

  return (
    <div>
      <p>initialData example -- name: {data?.name} (isFetching: {String(isFetching)})</p>
      <p>Fetch count so far: {initialDataFetchCount}</p>
    </div>
  );
}

function PlaceholderDataExample() {
  const { data, isFetching } = useQuery({
    queryKey: ['profile-b'],
    queryFn: () => {
      placeholderDataFetchCount += 1;
      return Promise.resolve({ name: 'Fresh from server' });
    },
    placeholderData: { name: 'Instant (placeholderData)' },
    staleTime: Infinity, // the SAME staleTime as the initialData example above
  });

  return (
    <div>
      <p>placeholderData example -- name: {data?.name} (isFetching: {String(isFetching)})</p>
      <p>Fetch count so far: {placeholderDataFetchCount}</p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
        <InitialDataExample />
        <hr />
        <PlaceholderDataExample />
        <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
          Both examples use the identical staleTime: Infinity. Reload
          the preview a few times if needed. Does the initialData
          example's fetch count ever leave 0? Does the
          placeholderData example's fetch count ever stay at 0?
        </p>
      </div>
    </QueryClientProvider>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both examples use the identical staleTime: Infinity. Watch each "Fetch count so far" line after the page loads. Does the initialData example\'s count ever leave 0? Does the placeholderData example\'s count ever stay at 0?',
    hint: 'initialData is written into the cache as if a real fetch already happened, so it\'s subject to staleTime — placeholderData is never written to the cache at all, so there\'s no staleness to check.',
    solution: `The initialData example's fetch count stays at 0 permanently -- the
queryFn never runs. Because initialData is treated as genuine cached
data and staleTime is Infinity, TanStack Query considers "Instant
(initialData)" perpetually fresh and has no reason to fetch anything
new.

The placeholderData example's fetch count becomes 1 almost
immediately -- the queryFn runs right away, and data updates from
"Instant (placeholderData)" to "Fresh from server" once that
resolves, even though staleTime is set to the exact same Infinity
value as the other example.

This confirms both halves of the main page's single-sentence claim:
initialData genuinely can prevent a fetch entirely, subject to
staleTime like any real cached data; placeholderData never gets that
same treatment, because it was never written to the cache as real
data in the first place -- it is purely a rendering placeholder while
the real query definitely still needs to run.

The practical lesson: pick initialData when you already have data
you're confident is current enough to trust as-is (e.g. passed in
from a parent route's own already-fetched data) and want to
potentially skip a redundant fetch entirely. Pick placeholderData
when you want to show SOMETHING immediately (a skeleton value, a
cached-elsewhere approximation) but you always want the real fetch to
run regardless.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'initialData and placeholderData are two different APIs for achieving the same outcome — showing something on screen immediately while a fetch happens in the background — so they can be used interchangeably.',
      reality: 'they differ in a way that changes whether a fetch happens at all — initialData can prevent a fetch entirely if staleTime hasn\'t elapsed, while placeholderData ALWAYS triggers a real fetch, regardless of staleTime.',
    },
    {
      thought: 'setting staleTime: Infinity alongside placeholderData is a valid way to permanently avoid fetching, similar to setting it alongside initialData.',
      reality: 'staleTime has no effect on placeholderData\'s fetch behavior at all — placeholderData is never written to the cache as real data, so there is no staleness check for staleTime to influence; only initialData actually respects it.',
    },
    {
      thought: 'if a query shows data immediately on first render (no loading spinner), it must be using initialData rather than placeholderData, since a "real" fetch would show a loading state first.',
      reality: 'both initialData and placeholderData show something immediately with no initial loading state — the difference isn\'t visible in the FIRST render, only in whether a fetch happens afterward, which requires checking isFetching or a network/fetch-count observation to actually distinguish.',
    },
  ];
}
