import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-child-errorelement-bubbles-up-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './child-errorelement-bubbles-up-replaces-parent-layout.html',
  styleUrl: './child-errorelement-bubbles-up-replaces-parent-layout.scss',
})
export class ChildErrorelementBubblesUpReplacesParentLayoutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Never Shows a Missing errorElement',
      points: [
        'The theory section says: "<code>errorElement</code> on a route catches errors thrown by loaders, actions, or the component itself." Every code-tab example gives EVERY route its own <code>errorElement</code> — the "Loader + useLoaderData" tab and the Challenge\'s solution both attach one to every single route entry.',
        'Real apps are rarely this thorough — a child route often has no <code>errorElement</code> of its own. This subtopic tests what actually renders when that happens: does the error just vanish, does the whole app crash, or does something bubble up — and if it bubbles, how much of the page does it take with it?',
      ],
    },
    {
      heading: 'Why the Nearest Ancestor\'s ENTIRE Element Gets Replaced',
      points: [
        'When a route throws (from its loader, action, or render) and has no <code>errorElement</code> of its own, React Router walks UP the route tree looking for the nearest ANCESTOR that does have one — not just the nearest ancestor\'s <code>&lt;Outlet /&gt;</code> slot.',
        'Critically, the ancestor\'s error handling doesn\'t just swap out what the failing child would have rendered inside <code>&lt;Outlet /&gt;</code> — it replaces THAT ANCESTOR\'S OWN <code>element</code> ENTIRELY with its <code>errorElement</code>. If the ancestor is a layout route rendering a nav bar and sidebar around <code>&lt;Outlet /&gt;</code>, the nav bar and sidebar disappear too, because the whole layout element was swapped out, not just the outlet contents.',
        'This means the ONLY way to keep a layout\'s chrome (nav, sidebar) visible while showing an error for just the failing content area is to put an <code>errorElement</code> directly ON the child route itself (or an intermediate route) — never relying on a distant ancestor to absorb the error.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "errorelement-bubbling-demo",
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
  <head><title>errorElement bubbling</title></head>
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
      content: `import { createBrowserRouter, RouterProvider, Outlet, Link, useRouteError } from 'react-router-dom';

// Layout renders a nav bar around the Outlet -- this is what we're
// watching to see if it survives a child error or disappears too.
function Layout() {
  return (
    <div>
      <nav style={{ background: '#1e293b', color: '#fff', padding: 10 }}>
        NAV BAR -- watch whether this survives the error below
      </nav>
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
}

function ErrorPage() {
  const error = useRouteError();
  return <div><h2>Something broke: {error.message}</h2><Link to="/">Go home</Link></div>;
}

function Home() {
  return <p>Home page. <Link to="/broken">Go to the broken route</Link></p>;
}

function BrokenRoute() {
  throw new Error('This component always throws');
}

// BrokenRoute has NO errorElement of its own -- only the Layout does.
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'broken', element: <BrokenRoute /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Go to the broken route". BrokenRoute has no errorElement of its own — only Layout does. Does the nav bar stay visible above the error message, or does it disappear too?',
    hint: 'The ancestor\'s error handling replaces its OWN element entirely, not just the Outlet contents — the nav bar lives in the same element as the Outlet that error was routed through.',
    solution: `The nav bar disappears completely -- the whole page shows only the
"Something broke" error message and the "Go home" link, with no trace
of the NAV BAR that Layout was rendering a moment ago.

This happens because BrokenRoute has no errorElement, so React Router
looks up to the nearest ancestor that does -- Layout, in this case.
But Layout's error handling doesn't selectively replace just its
Outlet's contents; it replaces LAYOUT'S OWN ELEMENT ENTIRELY with
ErrorPage. Since the nav bar was part of Layout's own JSX (not a
separate route), it vanishes along with everything else Layout was
rendering.

The practical lesson: attaching errorElement only to a top-level
layout route is a common but incomplete pattern -- it technically
"catches" every error beneath it, but at the cost of tearing down the
entire layout chrome for even a small, single-route failure. To keep
navigation/sidebar UI visible while showing a scoped error for just
the broken content area, errorElement needs to be attached to the
SPECIFIC route (or an intermediate route between the layout and the
leaf) whose failures you want contained -- exactly what every example
on the main page does by giving each individual route its own
errorElement, which now reads as a deliberate design choice rather
than defensive boilerplate.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'errorElement on a parent layout route "catches" errors from child routes by swapping out just the failing child\'s content inside the Outlet, leaving the rest of the layout (nav, sidebar) untouched.',
      reality: 'the ancestor\'s errorElement replaces that ancestor\'s ENTIRE element, not just its Outlet — any nav bar, sidebar, or other chrome defined in the same component as the Outlet disappears along with the failed content.',
    },
    {
      thought: 'giving only the top-level layout route an errorElement is a reasonable, DRY way to handle errors for an entire app section, since it technically catches everything beneath it.',
      reality: 'it technically catches every error, but at the cost of tearing down the ENTIRE layout for any single route\'s failure — a scoped error experience (keeping nav/sidebar visible) requires errorElement on the specific routes whose failures should stay contained.',
    },
    {
      thought: 'every code example on the main page attaching its own errorElement to each individual route is just defensive boilerplate — one errorElement higher up the tree would functionally cover the same cases.',
      reality: 'it is a deliberate scoping choice, not redundant boilerplate — each route-level errorElement contains that route\'s failures to just that route\'s content area, which a single ancestor-level errorElement cannot do since it always takes down its own whole element.',
    },
  ];
}
