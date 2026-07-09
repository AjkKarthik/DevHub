import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-usefetcher-revalidates-loader-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './usefetcher-revalidates-the-current-routes-loader.html',
  styleUrl: './usefetcher-revalidates-the-current-routes-loader.scss',
})
export class UsefetcherRevalidatesTheCurrentRoutesLoaderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Separate Claims That Are Never Connected',
      points: [
        'The Actions section says: "After an action completes, React Router automatically re-runs the current route\'s loader to refresh data." The Navigation section separately says <code>useFetcher()</code> "lets you call loaders or actions without navigating."',
        '"Without navigating" could easily be read as "without any of the usual post-action side effects" — including the loader re-run the first claim describes. This subtopic tests whether a <code>useFetcher()</code>-submitted action ALSO triggers that automatic loader re-run, even though the URL never changes.',
      ],
    },
    {
      heading: 'Why Revalidation and Navigation Are Independent Concepts',
      points: [
        '<code>useFetcher()</code> skips NAVIGATION specifically — it does not push a new history entry, does not change <code>useLocation()</code>, and does not remount the route\'s element. But it still submits to a route\'s <code>action</code> exactly like a normal <code>&lt;Form&gt;</code> would.',
        'React Router\'s automatic revalidation is tied to a SUCCESSFUL action completing, not to a navigation happening. After any action resolves — whether triggered by <code>&lt;Form&gt;</code> (which navigates) or <code>fetcher.Form</code>/<code>fetcher.submit()</code> (which does not) — React Router re-runs every currently-active route\'s loader to keep displayed data in sync with whatever the action just changed.',
        'This is precisely why <code>useFetcher()</code> is the recommended tool for inline mutations like "toggle done" or "delete item": the mutation happens, the surrounding list\'s loader re-runs and refreshes automatically, and the user never leaves the page or sees a URL change.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "usefetcher-revalidation-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.22.0"
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
  <head><title>useFetcher and loader revalidation</title></head>
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
      content: `import { createBrowserRouter, RouterProvider, useLoaderData, useFetcher, useLocation } from 'react-router-dom';

// Module-level counter -- simulates a "database" whose value the
// loader reads fresh every time it runs.
let serverCounter = 0;

async function homeLoader() {
  return { counterAtLoad: serverCounter, loadedAt: new Date().toLocaleTimeString() };
}

async function incrementAction() {
  serverCounter += 1;
  return null;
}

function Home() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const location = useLocation();

  return (
    <div>
      <p>Loader's counterAtLoad: {data.counterAtLoad} (loaded at {data.loadedAt})</p>
      <p>Current URL pathname: {location.pathname}</p>
      <fetcher.Form method="post" action="/increment">
        <button type="submit">
          Increment via useFetcher (no navigation)
        </button>
      </fetcher.Form>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Click the button a few times. Does the URL pathname above ever
        change? Does the loader's counterAtLoad value update anyway?
      </p>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', loader: homeLoader, element: <Home /> },
  { path: '/increment', action: incrementAction },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click the "Increment via useFetcher" button a few times. Does the URL pathname ever change? Does the loader\'s counterAtLoad value update anyway?',
    hint: 'useFetcher() skips navigation specifically — but revalidation (re-running active loaders) is triggered by any successful action completing, regardless of whether a navigation happened.',
    solution: `The URL pathname stays exactly "/" the entire time -- confirming
useFetcher() genuinely never navigates, exactly as the main page's
Navigation section describes.

counterAtLoad still updates after each click, incrementing right
along with the button presses -- even though useLoaderData() is only
supposed to reflect data from when the loader last ran. This proves
the Home route's loader is being automatically re-run after each
fetcher-submitted action, exactly as the Actions section's "re-runs
the current route's loader" claim describes -- "without navigating"
and "without revalidating" turn out to be two independent things, not
one combined guarantee.

The practical lesson: useFetcher() removes the URL/history side effect
of an action, not the data-freshness side effect. This is exactly why
it's the right tool for inline mutations (toggle, delete, increment)
that should update what's on screen without moving the user anywhere
-- you get automatic data refresh for free, the same as a full
navigating action would provide.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'useFetcher()\'s "without navigating" behavior means it also skips the automatic loader re-run that normally follows a successful action — the two behaviors are bundled together.',
      reality: 'navigation and revalidation are independent in React Router — useFetcher() specifically skips the URL/history change, but any successful action (fetcher-submitted or not) still triggers a re-run of every currently active route\'s loader.',
    },
    {
      thought: 'because useFetcher() doesn\'t navigate, a component using useLoaderData() elsewhere on the page won\'t see fresh data after a fetcher action completes — you\'d need to manually refetch or update state.',
      reality: 'useLoaderData() DOES reflect fresh data after a fetcher action, automatically — React Router re-runs the active loader(s) as part of every successful action\'s lifecycle, with no manual refetch needed on the developer\'s part.',
    },
    {
      thought: 'the "re-runs the current route\'s loader" behavior described in the Actions section is specific to actions triggered by a normal <Form> submission — useFetcher is a fundamentally different, lighter-weight mechanism that bypasses this.',
      reality: 'useFetcher.Form submits to the exact same action function a normal <Form> would — the revalidation behavior comes from the action completing successfully, not from which component triggered the submission.',
    },
  ];
}
