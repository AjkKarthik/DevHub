import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-navlink-end-prop-needed-for-root-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './navlink-end-prop-needed-for-root-breaks-nested-active.html',
  styleUrl: './navlink-end-prop-needed-for-root-breaks-nested-active.scss',
})
export class NavlinkEndPropNeededForRootBreaksNestedActiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Example Applies end Asymmetrically',
      points: [
        'The very first code tab shows: <code>&lt;NavLink to="/" end className={...}&gt;Home&lt;/NavLink&gt;</code> — but the Users and Settings <code>NavLink</code>s right next to it have NO <code>end</code> prop at all: <code>&lt;NavLink to="/users" className={...}&gt;Users&lt;/NavLink&gt;</code>.',
        'Neither the theory section nor the Quick Reference explains why <code>end</code> appears on exactly one of the three links. This subtopic tests what breaks if that asymmetry is "corrected" — either by adding <code>end</code> everywhere, or by removing it from Home.',
      ],
    },
    {
      heading: 'Why end Solves Two Opposite Problems for Two Different Routes',
      points: [
        '<code>NavLink</code> without <code>end</code> matches by PREFIX by default: it is "active" whenever the current URL starts with its <code>to</code> path. For <code>to="/users"</code>, that correctly means the link stays highlighted while the user is on <code>/users</code> OR any nested child like <code>/users/5</code> — exactly the behavior you usually want for a nav item representing a whole section.',
        'For <code>to="/"</code>, that same prefix-matching rule is a problem: literally EVERY path in the app starts with <code>/</code>, so a bare <code>&lt;NavLink to="/"&gt;</code> would show as "active" no matter which page the user is actually on. <code>end</code> switches the match to EXACT, so Home is only active when the URL is precisely <code>/</code>.',
        'Applying <code>end</code> to <code>/users</code> as well would "fix" nothing there (since <code>/users</code> itself only has one legitimate exact match anyway) but WOULD break the nested-highlighting behavior: visiting <code>/users/5</code> would no longer count as a prefix match, so the Users nav item would stop appearing active exactly when the user is deep in that section — the opposite of what a section-level nav link is for.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "navlink-end-prop-demo",
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
  <head><title>NavLink end prop</title></head>
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
      content: `import { createBrowserRouter, RouterProvider, Outlet, NavLink } from 'react-router-dom';

const linkStyle = ({ isActive }) => ({
  marginRight: 12,
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#0ea5e9' : '#333',
});

function Layout() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <nav>
        {/* Home HAS end -- the main page's own pattern */}
        <NavLink to="/" end style={linkStyle}>Home</NavLink>

        {/* Users has NO end -- also the main page's own pattern */}
        <NavLink to="/users" style={linkStyle}>Users</NavLink>

        {/* This one intentionally adds end, to compare against Users above */}
        <NavLink to="/users-strict" end style={linkStyle}>Users (with end, for comparison)</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}

function Home()      { return <p>Home page.</p>; }
function UsersList()   { return <div><p>Users list.</p><Outlet /></div>; }
function UserDetail()  { return <p>A single user's detail page (nested under Users).</p>; }
function UsersStrictList() { return <div><p>Users (strict) list.</p><Outlet /></div>; }
function UserStrictDetail() { return <p>Nested under Users (strict).</p>; }

const router = createBrowserRouter([
  {
    path: '/', element: <Layout />, children: [
      { index: true, element: <Home /> },
      { path: 'users', element: <UsersList />, children: [{ path: ':id', element: <UserDetail /> }] },
      { path: 'users-strict', element: <UsersStrictList />, children: [{ path: ':id', element: <UserStrictDetail /> }] },
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
    prompt: 'Navigate to /users/1 by editing the URL (or add a link and click it). Does the plain "Users" NavLink stay highlighted? Now compare against /users-strict/1 — does "Users (with end, for comparison)" stay highlighted too?',
    hint: 'Without end, NavLink matches by prefix — active on the section root AND any nested child. With end, it only matches the exact path.',
    solution: `On /users/1: the plain "Users" NavLink (no end) IS highlighted --
prefix matching correctly recognizes /users/1 as "inside" the /users
section.

On /users-strict/1: "Users (with end, for comparison)" is NOT
highlighted, even though the user is just as clearly inside that
section. Adding end forced exact-path matching, so only the literal
path /users-strict counts as active -- the nested child route breaks
the highlight.

This confirms exactly why the main page's own example applies end
asymmetrically: Home needs end because "/" is a prefix of every path
in the app (without end, Home would ALWAYS look active). Users
specifically needs to NOT have end, because losing prefix matching
there breaks the exact behavior a section-level nav link exists to
provide -- staying highlighted throughout that whole section, not
just on its bare root path.

The practical lesson: end isn't a stylistic default to apply
everywhere for "more precise" matching -- it's a targeted fix for
routes whose path is a prefix of everything else (almost always just
"/"), and applying it to section-root links breaks the nested-active
highlighting those links are usually meant to provide.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the `end` prop on the main page\'s `<NavLink to="/" end>` is just a stylistic convention for the Home link — adding it to every NavLink, or removing it from just that one, would work equivalently.',
      reality: '`end` solves a problem specific to the root path "/" being a PREFIX of every other route — applying it consistently to section-root links like `/users` actively breaks their intended "stay active on nested children" behavior.',
    },
    {
      thought: 'without `end`, a NavLink is "less precise" or "buggier" than one with `end` — `end` should generally be preferred for more accurate active-state matching.',
      reality: 'prefix matching (no `end`) is the CORRECT default behavior for most section-level nav links, since it\'s what makes a "Users" link stay highlighted while browsing any user\'s detail page — `end` is the exception for links whose path would otherwise match everything.',
    },
    {
      thought: 'the choice of whether to add `end` only affects the Home link in a typical app — other top-level nav links are unaffected by this consideration.',
      reality: 'ANY nav link whose path is a literal prefix of another route needs the same consideration — "/" is simply the most common case since every route starts with it, but the same reasoning applies to any deliberately overlapping route structure.',
    },
  ];
}
