import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-inline-object-querykey-no-refetch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './inline-object-querykey-does-not-refetch-on-rerender.html',
  styleUrl: './inline-object-querykey-does-not-refetch-on-rerender.scss',
})
export class InlineObjectQuerykeyDoesNotRefetchOnRerenderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #1\'s Claim Never Gets Checked Against an Actual Fetch Count',
      points: [
        'Mistake #1 warns: <code>queryKey: [\'user\', { filter: { active: true } }]</code> — "Object literal creates new reference on every render → refetches on every render." The fix replaces the object with a primitive string.',
        'This subtopic tests the wrong example directly: does re-rendering a component with that exact inline object queryKey actually trigger a new network request every time, or does something else happen first?',
      ],
    },
    {
      heading: 'Why TanStack Query Hashes queryKey by VALUE, Not Reference',
      points: [
        'TanStack Query does not compare <code>queryKey</code>s by JavaScript reference (<code>===</code>) the way React compares dependency arrays. It runs every key through a deterministic, key-sorted serialization (its default <code>queryKeyHashFn</code>) to produce a stable string hash, and uses THAT hash to look up the cache entry.',
        'Two different object instances with identical shape and values — <code>{ filter: { active: true } }</code> created fresh on render 1 and again on render 2 — serialize to the exact same hash string. TanStack Query sees "same cache entry," not "new query," regardless of the fact that <code>Object.is</code> on the two objects would return <code>false</code>.',
        'This means Mistake #1\'s wrong example, run exactly as written, does NOT refetch on every render — the queryFn only runs once (until real staleness or an actual value change triggers a legitimate refetch). The example\'s own claimed failure mode doesn\'t reproduce.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "querykey-hashing-demo",
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
  <head><title>queryKey hashing by value</title></head>
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
import { useState, useRef } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

// Module-level counter -- how many times the queryFn actually ran.
let fetchCount = 0;

function UserList() {
  // The main page's OWN Mistake #1 wrong example, unchanged:
  // a fresh object literal, recreated on every render.
  const { data } = useQuery({
    queryKey: ['user', { filter: { active: true } }],
    queryFn: () => {
      fetchCount += 1;
      return Promise.resolve({ users: ['Alice', 'Bob'] });
    },
  });

  return (
    <div>
      <p>fetchCount (queryFn actually ran this many times): {fetchCount}</p>
      <p>Users: {data?.users.join(', ')}</p>
    </div>
  );
}

function App() {
  const [, forceRerender] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
        <p>App render count: {renderCount.current}</p>
        <button onClick={() => forceRerender(n => n + 1)}>
          Force re-render (new object queryKey created each time)
        </button>
        <UserList />
        <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
          Click the button several times. App render count climbs, and
          a brand-new {'{ filter: { active: true } }'} object is created
          fresh on every one of those renders. Does fetchCount climb
          too, or stay frozen at 1?
        </p>
      </div>
    </QueryClientProvider>
  );
}

export default App;
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Force re-render" several times. The queryKey\'s object literal is recreated fresh on every render — does fetchCount climb along with the render count, or stay frozen?',
    hint: 'TanStack Query hashes queryKey by serializing its VALUE, not by comparing JS references — two structurally identical objects hash to the same cache entry.',
    solution: `fetchCount stays frozen at 1 no matter how many times you click,
even though App render count climbs steadily and a genuinely new
{ filter: { active: true } } object is constructed on every single
one of those renders.

This directly contradicts Mistake #1's literal claim ("refetches on
every render"). What actually happens: TanStack Query hashes the
queryKey via a stable, deterministic serialization before ever
looking at object identity. Since { filter: { active: true } }
serializes to the identical string every time (same keys, same
values), TanStack Query recognizes it as the SAME cache entry across
every render, not a new one -- so the queryFn simply never re-runs
(within the staleTime window), regardless of how many fresh object
references were created along the way.

The practical lesson: the risk with unstable object queryKeys isn't
"refetch on every render" (React Query's value-based hashing already
protects against that) -- it's a subtler correctness issue: if the
object's VALUES genuinely differ between calls (not just its
reference), each distinct value combination gets its own cache entry,
which can fragment the cache into many entries you didn't intend, or
make invalidation harder to reason about. The fix Mistake #1
recommends (stable primitive/string keys) is still good practice for
those reasons -- just not for the specific "extra refetch on render"
mechanism the main page describes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'TanStack Query compares queryKeys the same way React compares a useEffect dependency array — by reference (Object.is) — so a fresh object literal on every render causes a new cache entry (and a refetch) every time.',
      reality: 'TanStack Query hashes queryKey by VALUE using a deterministic serialization, not by reference — two object literals with identical shape and values, even created fresh each time, hash to the same cache entry and do not cause extra fetches.',
    },
    {
      thought: 'the main page\'s Mistake #1 wrong example, run as literally written, is a proven, reproducible bug — you can copy it into any component and watch it refetch on every render.',
      reality: 'running that exact example does NOT reproduce a per-render refetch — the queryFn call count stays at 1 across many re-renders, because the object literal\'s serialized value is identical each time.',
    },
    {
      thought: 'because value-based hashing means object-literal queryKeys are "safe" from unnecessary refetches, there\'s no real reason to prefer stable primitive keys over object literals for readability.',
      reality: 'value-based hashing solves the specific refetch-on-render concern, but object literals with genuinely varying values (not just reference) still fragment the cache into separate entries per unique value combination — the main page\'s recommendation to prefer stable, primitive keys remains good practice for cache-shape reasons, just not for the reason originally given.',
    },
  ];
}
