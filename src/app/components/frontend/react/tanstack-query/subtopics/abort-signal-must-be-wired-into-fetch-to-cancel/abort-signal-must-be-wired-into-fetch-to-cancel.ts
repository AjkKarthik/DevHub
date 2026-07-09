import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-abort-signal-must-be-wired-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './abort-signal-must-be-wired-into-fetch-to-cancel.html',
  styleUrl: './abort-signal-must-be-wired-into-fetch-to-cancel.scss',
})
export class AbortSignalMustBeWiredIntoFetchToCancelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Says "Automatically" While Also Saying "Pass It"',
      points: [
        'The QnA states: "TanStack Query automatically passes an <code>AbortSignal</code> to <code>queryFn</code> as <code>{ signal }</code>. Pass it to fetch: <code>fetch(url, { signal })</code>. When the component unmounts or the queryKey changes, TanStack Query calls <code>signal.abort()</code> — the fetch is cancelled."',
        '"Automatically passes" and "the fetch is cancelled" read like an unconditional guarantee — but the same sentence also instructs the developer to manually pass <code>signal</code> to <code>fetch</code>. This subtopic tests what happens to the underlying request if that manual step is skipped.',
      ],
    },
    {
      heading: 'Why the Cancellation Is Opt-In, Not Automatic',
      points: [
        'TanStack Query genuinely creates an <code>AbortController</code> per query execution and calls <code>.abort()</code> on it when the query is unmounted or superseded — that part IS automatic and always happens.',
        'But an <code>AbortSignal</code> only cancels something that is actually LISTENING to it. If <code>queryFn</code> never passes the signal into <code>fetch</code> (or any other cancelable operation), calling <code>.abort()</code> on TanStack Query\'s internal controller has nothing to affect — the underlying request keeps running to completion, unaware that anything happened.',
        'The observable difference: TanStack Query\'s OWN bookkeeping (its internal promise, its cache update logic) does correctly ignore a late result either way — so from the component\'s perspective, both versions "work." But only the signal-wired version actually stops sending bytes over the network or spending server-side compute on a result nobody will use.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "abort-signal-demo",
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
  <head><title>AbortSignal must be wired in</title></head>
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
import { useState } from 'react';

const queryClient = new QueryClient();

// A "server" call that RESPECTS the signal -- clears its own timer on abort.
function fetchWithSignal(signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => resolve('Signal-aware fetch: completed'), 2500);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

// A "server" call that IGNORES the signal entirely -- keeps its timer
// running regardless, simulating a fetch() call that never received signal.
function fetchIgnoringSignal() {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('IGNORED-signal request actually completed on the "server" -- ' +
        'the underlying work ran to completion even though nobody is listening anymore.');
      resolve('Ignored-signal fetch: completed');
    }, 2500);
  });
}

function SignalAwareQuery() {
  const { data, status } = useQuery({
    queryKey: ['signal-aware'],
    queryFn: ({ signal }) => fetchWithSignal(signal),
  });
  return <p>Signal-aware: {status} -- {data}</p>;
}

function SignalIgnoringQuery() {
  const { data, status } = useQuery({
    queryKey: ['signal-ignoring'],
    // Deliberately never touches the { signal } argument.
    queryFn: () => fetchIgnoringSignal(),
  });
  return <p>Signal-ignoring: {status} -- {data}</p>;
}

export default function App() {
  const [mounted, setMounted] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
        <button onClick={() => setMounted(m => !m)}>
          {mounted ? 'Unmount both queries NOW (before either finishes)' : 'Remount'}
        </button>
        {mounted && (
          <div>
            <SignalAwareQuery />
            <SignalIgnoringQuery />
          </div>
        )}
        <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
          Click "Unmount" within 2.5 seconds of loading. Open the
          console. Does the ignored-signal request still log
          "actually completed" a couple seconds later, even though
          it was unmounted?
        </p>
      </div>
    </QueryClientProvider>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Immediately click "Unmount both queries NOW" before either query resolves (within ~2.5 seconds). Watch the console. Does the signal-ignoring request still log "actually completed" a couple seconds later?',
    hint: 'TanStack Query always calls .abort() on its internal AbortController — but that only cancels the underlying work if queryFn actually passed the signal somewhere that listens for it.',
    solution: `The signal-ignoring request's console log DOES appear, roughly 2.5
seconds after you unmounted -- "IGNORED-signal request actually
completed on the 'server'" -- proving the underlying timer (standing
in for a real network request) ran all the way to completion despite
the component being gone and TanStack Query having already called
.abort() on its side internally.

The signal-aware request never logs a completion message at all --
its own abort listener fired the moment TanStack Query called
.abort(), clearing the timer before it could resolve.

Both queries "work" from TanStack Query's own perspective either way
-- neither one updates any UI with a late result, since the component
is gone. But only the signal-aware version actually stopped the
underlying work. In a real app, the signal-ignoring version keeps a
real HTTP request in flight, consuming client bandwidth and server
compute for a response that will be thrown away the instant it
arrives.

The practical lesson: "TanStack Query automatically cancels your
requests" is only true for its OWN internal bookkeeping. Actual
network-level cancellation requires the developer to explicitly wire
{ signal } into fetch (or any other cancelable API) inside queryFn --
skip that step, and the phrase "automatically cancels" only describes
half of what's happening.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'TanStack Query "automatically passes an AbortSignal... the fetch is cancelled" means any queryFn, written any way, gets its underlying request cancelled on unmount or key change — no extra work required.',
      reality: 'TanStack Query automatically creates and aborts an internal AbortController, but that only cancels the underlying operation if queryFn explicitly wires the signal into something that listens for it (like passing it to fetch) — otherwise the request keeps running regardless.',
    },
    {
      thought: 'if a queryFn doesn\'t use the signal argument, the visible behavior in the app would clearly show something is wrong — a stale response overwriting fresh data, a console error, or a crash.',
      reality: 'the visible behavior is identical either way, since TanStack Query\'s own cache/promise bookkeeping ignores late results regardless of whether the underlying request was actually cancelled — the only difference is invisible, happening at the network/server level.',
    },
    {
      thought: 'this distinction mainly matters for correctness (avoiding stale data bugs), so if your app never seems to show stale results, you don\'t need to worry about wiring up the signal.',
      reality: 'the main cost of skipping signal wiring isn\'t a correctness bug in this specific scenario — it\'s wasted network bandwidth, wasted server compute, and (for real APIs with rate limits) requests that count against your quota for responses nobody will ever use.',
    },
  ];
}
