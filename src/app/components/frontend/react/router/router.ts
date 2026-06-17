import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-router',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './router.html',
  styleUrl: './router.scss',
})
export class ReactRouter {
  quickRef: QuickRefItem[] = [
    { name: 'createBrowserRouter(routes)',  type: 'function', desc: 'Modern router with data APIs (loaders, actions). Preferred over BrowserRouter.' },
    { name: '<RouterProvider router={r} />', type: 'syntax',   desc: 'Mount a router created with createBrowserRouter.' },
    { name: '<Outlet />',                   type: 'syntax',   desc: 'Renders the matched child route inside a layout component.' },
    { name: 'loader: async ({ params })',   type: 'function', desc: 'Fetch data before the route renders. Return value available via useLoaderData().' },
    { name: 'useLoaderData()',              type: 'hook',     desc: 'Access data returned by the route\'s loader function.' },
    { name: 'useParams()',                  type: 'hook',     desc: 'Read dynamic route params — e.g. { id } from /users/:id.' },
    { name: 'useNavigate()',                type: 'hook',     desc: 'Programmatic navigation. navigate("/path") or navigate(-1) for back.' },
    { name: 'useSearchParams()',            type: 'hook',     desc: 'Read/write URL search params. Returns [params, setParams].' },
    { name: 'useLocation()',                type: 'hook',     desc: 'Current location object — pathname, search, hash, state.' },
    { name: '<Link to="/path">',            type: 'syntax',   desc: 'Client-side navigation link — no page reload.' },
    { name: '<NavLink>',                    type: 'syntax',   desc: 'Like Link but adds active/pending classes automatically.' },
    { name: 'action: async ({ request })', type: 'function', desc: 'Handle form submissions server-side style. Use with <Form method="post">.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'createBrowserRouter — data-first routing',
      points: [
        '<strong>React Router v6.4+ introduced data APIs</strong> — loaders, actions, and error boundaries baked into the route definition. Use <code>createBrowserRouter(routes)</code> instead of the older JSX-based <code>&lt;BrowserRouter&gt;</code> to access these features.',
        '<strong>Route config is a plain array of objects.</strong> Each route has <code>path</code>, <code>element</code>, and optionally <code>loader</code>, <code>action</code>, <code>errorElement</code>, and <code>children</code>. This is more explicit and easier to split into modules.',
        '<strong>Nested routes and layouts:</strong> parent routes render <code>&lt;Outlet /&gt;</code> which is replaced by the matching child route. This enables shared navigation shells, sidebars, and breadcrumbs that persist across child navigation.',
        '<strong>React Router v7</strong> builds on the same APIs and introduces first-class SSR, pre-rendering, and Remix-style framework mode. The core data API (loaders, actions) is identical.',
      ],
    },
    {
      heading: 'Loaders — data fetching before render',
      points: [
        '<strong>loader</strong> is an async function that runs before the route component renders. It receives <code>{ params, request }</code> and returns data (or throws a Response/error). The component reads it with <code>useLoaderData()</code>.',
        '<strong>Benefits over useEffect fetch:</strong> data is available before the component mounts (no loading flash); multiple loaders run in parallel for sibling routes; errors are caught by <code>errorElement</code> automatically.',
        '<strong>Parallel loaders:</strong> sibling routes\'s loaders fire simultaneously. Parent loaders run first; child loaders run in parallel with siblings. This is the main performance advantage over sequential useEffect chains.',
        '<strong>Deferred loading:</strong> <code>defer({ data: slowPromise })</code> + <code>&lt;Await&gt;</code> lets you stream slow data to the client while the route renders immediately with fast data.',
      ],
    },
    {
      heading: 'Actions — form submissions',
      points: [
        '<strong>Actions</strong> handle form mutations. Use <code>&lt;Form method="post"&gt;</code> in the component and define an <code>action</code> function on the route. The action receives the <code>FormData</code> via <code>request.formData()</code>.',
        '<strong>After an action completes</strong>, React Router automatically re-runs the current route\'s loader to refresh data — the list updates without a manual state invalidation.',
        '<strong>useActionData()</strong> reads the return value of the most recent action — useful for returning server-side validation errors back to the form.',
        '<strong>useFetcher()</strong> lets you call loaders or actions without navigating — perfect for inline mutations (toggle done, delete item) that should not change the URL.',
      ],
    },
    {
      heading: 'Navigation hooks',
      points: [
        '<strong>useNavigate()</strong> returns a function for programmatic navigation: <code>navigate("/dashboard")</code>, <code>navigate(-1)</code> (back), <code>navigate(1)</code> (forward). Pass <code>{ replace: true }</code> to replace the current history entry.',
        '<strong>useParams()</strong> reads dynamic segments from the URL path: <code>const { id } = useParams()</code> for a route <code>/users/:id</code>. Values are always strings.',
        '<strong>useSearchParams()</strong> is the hook equivalent of URLSearchParams — reads and writes query strings without causing a full navigation. Use it for filter state that should be bookmarkable.',
        '<strong>useLocation()</strong> gives the full location object including <code>state</code> (passed via <code>navigate("/path", { state: { from: "login" } })</code>) which is useful for redirect-back-after-login patterns.',
      ],
    },
    {
      heading: 'Error handling and lazy routes',
      points: [
        '<strong>errorElement</strong> on a route catches errors thrown by loaders, actions, or the component itself. Use <code>useRouteError()</code> inside the error component to read the thrown error.',
        '<strong>Lazy routes</strong> split bundles per route: <code>lazy: () =&gt; import("./UserPage")</code>. React Router defers the import until the route is navigated to. Wrap the router in <code>&lt;Suspense&gt;</code> for the loading state.',
        '<strong>Index routes</strong> (<code>index: true</code>) render at the parent\'s exact path — they are the default child when no child path matches, equivalent to <code>path: ""</code>.',
        '<strong>Splat routes</strong> (<code>path: "*"</code>) match any unmatched URL — use for 404 pages at the root or inside a layout.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'createBrowserRouter + nested routes',
      language: 'typescript',
      code: `import { createBrowserRouter, RouterProvider, Outlet, Link, NavLink } from 'react-router-dom';

// Layout component — shared shell
function RootLayout() {
  return (
    <div>
      <nav>
        <NavLink to="/"        end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/users"       className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
        <NavLink to="/settings"    className={({ isActive }) => isActive ? 'active' : ''}>Settings</NavLink>
      </nav>
      <main>
        <Outlet />   {/* child route renders here */}
      </main>
    </div>
  );
}

function HomePage()     { return <h1>Home</h1>; }
function UsersPage()    { return <div><h1>Users</h1><Outlet /></div>; }
function UserDetail()   { const { id } = useParams(); return <h2>User {id}</h2>; }
function SettingsPage() { return <h1>Settings</h1>; }
function NotFound()     { return <h1>404 — Not Found</h1>; }

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <div>Something went wrong</div>,
    children: [
      { index: true,  element: <HomePage /> },
      {
        path: 'users',
        element: <UsersPage />,
        children: [
          { path: ':id', element: <UserDetail /> },
        ],
      },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*',        element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}`,
    },
    {
      label: 'Loader + useLoaderData',
      language: 'typescript',
      code: `import { createBrowserRouter, RouterProvider, useLoaderData, Link } from 'react-router-dom';

interface User { id: number; name: string; email: string; }

// Loaders run before the component renders — data is ready on first paint
async function usersLoader(): Promise<User[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  if (!res.ok) throw new Response('Failed to fetch', { status: res.status });
  return res.json();
}

async function userLoader({ params }: { params: { id?: string } }): Promise<User> {
  const res = await fetch(\`https://jsonplaceholder.typicode.com/users/\${params.id}\`);
  if (!res.ok) throw new Response('User not found', { status: 404 });
  return res.json();
}

function UserList() {
  const users = useLoaderData() as User[];
  return (
    <ul>
      {users.map(u => <li key={u.id}><Link to={\`\${u.id}\`}>{u.name}</Link></li>)}
    </ul>
  );
}

function UserDetail() {
  const user = useLoaderData() as User;
  return <div><h1>{user.name}</h1><p>{user.email}</p></div>;
}

function ErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string };
  return <h1>Error {error?.status}: {error?.statusText}</h1>;
}

const router = createBrowserRouter([
  { path: '/', element: <div><h1>Home</h1></div> },
  {
    path: '/users',
    loader: usersLoader,
    element: <UserList />,
    errorElement: <ErrorPage />,
    children: [
      { path: ':id', loader: userLoader, element: <UserDetail />, errorElement: <ErrorPage /> },
    ],
  },
]);`,
    },
    {
      label: 'Action + Form',
      language: 'typescript',
      code: `import { Form, useActionData, redirect, useFetcher } from 'react-router-dom';

interface ActionResult { error?: string; }

// Action handles form POST — runs on submit
async function createTodoAction({ request }: { request: Request }): Promise<ActionResult | Response> {
  const formData = await request.formData();
  const text = formData.get('text') as string;

  if (!text?.trim()) return { error: 'Text is required' };

  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  return redirect('/todos');   // After action: navigate and re-run the /todos loader
}

function NewTodoForm() {
  const result = useActionData() as ActionResult | undefined;

  return (
    // React Router intercepts this form submission and calls the action
    <Form method="post" action="/todos/new">
      <input name="text" placeholder="Add todo…" />
      {result?.error && <span>{result.error}</span>}
      <button type="submit">Add</button>
    </Form>
  );
}

// useFetcher — inline mutation without navigating
function TodoItem({ id, text, done }: { id: number; text: string; done: boolean }) {
  const fetcher = useFetcher();
  const isToggling = fetcher.state !== 'idle';

  return (
    <li>
      <fetcher.Form method="post" action={\`/todos/\${id}/toggle\`}>
        <button type="submit" disabled={isToggling}>
          {isToggling ? '…' : done ? '✓' : '○'} {text}
        </button>
      </fetcher.Form>
    </li>
  );
}`,
    },
    {
      label: 'Navigation hooks',
      language: 'typescript',
      code: `import { useNavigate, useParams, useSearchParams, useLocation, Link } from 'react-router-dom';

// useNavigate — programmatic navigation
function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const handleLogin = async () => {
    await login();
    navigate(from, { replace: true });   // replace: don't add login to history
  };

  return <button onClick={handleLogin}>Log in</button>;
}

// useParams — read dynamic segments
function ProductPage() {
  const { categoryId, productId } = useParams<{ categoryId: string; productId: string }>();
  // For route: /shop/:categoryId/products/:productId
  return <p>Category: {categoryId}, Product: {productId}</p>;
}

// useSearchParams — bookmarkable filter state
function UserSearch() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const page  = Number(params.get('page') ?? '1');

  const updateQuery = (q: string) => setParams({ q, page: '1' });
  const nextPage    = ()           => setParams({ q: query, page: String(page + 1) });

  return (
    <div>
      <input value={query} onChange={e => updateQuery(e.target.value)} placeholder="Search users…" />
      <button onClick={nextPage}>Page {page} →</button>
      {/* URL becomes /users?q=alice&page=2 — bookmarkable and shareable */}
    </div>
  );
}`,
    },
    {
      label: 'Lazy routes + protected route',
      language: 'typescript',
      code: `import { createBrowserRouter, RouterProvider, Suspense, Navigate, useLocation } from 'react-router-dom';

// Lazy route — bundle split per route
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, lazy: () => import('./pages/Home').then(m => ({ Component: m.default })) },
      { path: 'dashboard', lazy: () => import('./pages/Dashboard').then(m => ({ Component: m.default })) },
      { path: 'settings',  lazy: () => import('./pages/Settings').then(m => ({ Component: m.default })) },
    ],
  },
]);

// Protected route — redirect to login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Pass current location as state so login can redirect back
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

// Usage in route config
const protectedRouter = createBrowserRouter([
  { path: '/login',     element: <LoginPage /> },
  { path: '/dashboard', element: <RequireAuth><Dashboard /></RequireAuth> },
]);

// Wrap RouterProvider in Suspense for lazy loading fallback
function App() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using useEffect for route data fetching instead of loaders',
      wrong: `function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading…</p>;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
      right: `// In route config
{ path: '/users', loader: () => fetch('/api/users').then(r => r.json()), element: <UserList /> }

// In component — data is ready before first render
function UserList() {
  const users = useLoaderData() as User[];
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
      explanation: 'Loaders run before the route renders, eliminating the loading flash. useEffect fires after render — users see a blank state briefly. Loaders also run in parallel for sibling routes.',
    },
    {
      title: 'Using <a href> instead of <Link>',
      wrong: `function Nav() {
  return (
    <nav>
      <a href="/about">About</a>   {/* full page reload, loses React state */}
      <a href="/users">Users</a>
    </nav>
  );
}`,
      right: `import { Link, NavLink } from 'react-router-dom';

function Nav() {
  return (
    <nav>
      <Link to="/about">About</Link>
      <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
    </nav>
  );
}`,
      explanation: '<a href> causes a full browser navigation — page reload, React state lost, React DevTools lost. <Link> does client-side navigation via the History API, keeping the app mounted.',
    },
    {
      title: 'Not handling useParams as possibly undefined',
      wrong: `function UserDetail() {
  const { id } = useParams();
  const user = users.find(u => u.id === parseInt(id));   // id may be undefined if route not matched
  return <p>{user.name}</p>;  // TypeError if user not found
}`,
      right: `function UserDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <p>Invalid route</p>;
  const user = users.find(u => u.id === parseInt(id, 10));
  if (!user) return <p>User not found</p>;
  return <p>{user.name}</p>;
}`,
      explanation: 'useParams returns Record<string, string | undefined>. A param is undefined if the route was not matched correctly. Always guard against undefined before parsing.',
    },
    {
      title: 'Forgetting <Outlet /> in a layout route',
      wrong: `function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        {/* Forgot <Outlet /> — child routes never render */}
      </main>
    </div>
  );
}`,
      right: `import { Outlet } from 'react-router-dom';

function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet />   {/* child route renders here */}
      </main>
    </div>
  );
}`,
      explanation: '<Outlet /> is the placeholder where React Router renders the matched child route. Without it, navigation within the layout renders nothing — the parent shows but the child never appears.',
    },
    {
      title: 'Using BrowserRouter instead of createBrowserRouter',
      wrong: `import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/users" element={<UserList />} />
        {/* Cannot use loaders, actions, or errorElement with this API */}
      </Routes>
    </BrowserRouter>
  );
}`,
      right: `import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/users', loader: usersLoader, element: <UserList />, errorElement: <ErrorPage /> },
]);

function App() { return <RouterProvider router={router} />; }`,
      explanation: 'BrowserRouter + Routes is the v5 API — it works but has no loader/action/errorElement support. createBrowserRouter is the v6.4+ API with data fetching built in. Use it for new projects.',
    },
    {
      title: 'Not using replace: true after authentication redirect',
      wrong: `function LoginForm() {
  const navigate = useNavigate();
  const login = async () => {
    await authenticate();
    navigate('/dashboard');   // pushes /login to history — Back button returns to login
  };
}`,
      right: `function LoginForm() {
  const navigate = useNavigate();
  const login = async () => {
    await authenticate();
    navigate('/dashboard', { replace: true });  // replace login in history — Back goes further back
  };
}`,
      explanation: 'After login or any redirect-style navigation, use replace: true so the source page is not left in the browser history. Otherwise the Back button takes the user to the login page while still authenticated.',
    },
  ];

  challenge: Challenge = {
    title: 'Blog App with React Router Data API',
    language: 'typescript',
    description: `Build a minimal blog app using createBrowserRouter with loaders and actions:

Routes:
- / — Home: show list of posts (loader fetches from JSONPlaceholder)
- /posts/:id — Post detail: show post + author (loader fetches post + user in parallel with Promise.all)
- /posts/new — New post form: action POSTs to API, redirects to / on success

Requirements:
1. Define all loaders/actions in the route config (not in components)
2. The /posts/:id loader must fetch post and author in parallel
3. The new post form uses <Form method="post"> — action reads formData
4. Each route has an errorElement that displays the error message
5. Navigation: Home link in header, Back link on detail page`,
    hints: [
      'Promise.all([fetchPost(id), fetchUser(userId)]) in the detail loader for parallel fetching',
      'In the action: const formData = await request.formData(); const title = formData.get("title") as string',
      'return redirect("/") from the action to navigate after success',
      'useRouteError() in the error element gives the thrown Response or Error',
    ],
    starterCode: `import { createBrowserRouter, RouterProvider, Outlet, Link, Form, useLoaderData, redirect } from 'react-router-dom';

// Types
interface Post { id: number; userId: number; title: string; body: string; }
interface User { id: number; name: string; email: string; }

const BASE = 'https://jsonplaceholder.typicode.com';

// TODO: define loaders
// TODO: define action for new post

// TODO: Layout, PostList, PostDetail, NewPost, ErrorPage components

// TODO: createBrowserRouter with routes
// TODO: export App with RouterProvider`,
    solution: `import { createBrowserRouter, RouterProvider, Outlet, Link, Form, useLoaderData, useRouteError, redirect } from 'react-router-dom';

interface Post { id: number; userId: number; title: string; body: string; }
interface User { id: number; name: string; email: string; }
const BASE = 'https://jsonplaceholder.typicode.com';

async function postsLoader(): Promise<Post[]> {
  const r = await fetch(\`\${BASE}/posts?_limit=10\`);
  if (!r.ok) throw new Response('Failed to load posts', { status: r.status });
  return r.json();
}

async function postLoader({ params }: { params: { id?: string } }): Promise<{ post: Post; user: User }> {
  const [post, users] = await Promise.all([
    fetch(\`\${BASE}/posts/\${params.id}\`).then(r => { if (!r.ok) throw new Response('Post not found', { status: 404 }); return r.json(); }),
    fetch(\`\${BASE}/users\`).then(r => r.json()),
  ]);
  const user = users.find((u: User) => u.id === post.userId);
  return { post, user };
}

async function newPostAction({ request }: { request: Request }) {
  const fd = await request.formData();
  const title = (fd.get('title') as string)?.trim();
  const body  = (fd.get('body')  as string)?.trim();
  if (!title || !body) return { error: 'Title and body are required' };
  await fetch(\`\${BASE}/posts\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body, userId: 1 }) });
  return redirect('/');
}

function Layout()     { return <div><header><Link to="/">Blog</Link> | <Link to="/posts/new">New Post</Link></header><main><Outlet /></main></div>; }
function ErrorPage()  { const err = useRouteError() as any; return <div><h2>Error {err?.status}</h2><p>{err?.statusText ?? err?.message}</p><Link to="/">← Home</Link></div>; }

function PostList() {
  const posts = useLoaderData() as Post[];
  return <ul>{posts.map(p => <li key={p.id}><Link to={\`/posts/\${p.id}\`}>{p.title}</Link></li>)}</ul>;
}

function PostDetail() {
  const { post, user } = useLoaderData() as { post: Post; user: User };
  return <article><h1>{post.title}</h1><p>By {user?.name}</p><p>{post.body}</p><Link to="/">← Back</Link></article>;
}

function NewPost() {
  return (
    <Form method="post">
      <h1>New Post</h1>
      <div><label>Title<input name="title" required /></label></div>
      <div><label>Body<textarea name="body" required /></label></div>
      <button type="submit">Publish</button>
    </Form>
  );
}

const router = createBrowserRouter([{
  path: '/', element: <Layout />, errorElement: <ErrorPage />, children: [
    { index: true,    loader: postsLoader,   element: <PostList />,   errorElement: <ErrorPage /> },
    { path: 'posts/new',                     element: <NewPost />,    action: newPostAction, errorElement: <ErrorPage /> },
    { path: 'posts/:id', loader: postLoader, element: <PostDetail />, errorElement: <ErrorPage /> },
  ],
}]);

export default function App() { return <RouterProvider router={router} />; }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of using a loader over useEffect for data fetching in React Router?',
      options: ['Loaders run in parallel automatically', 'Loaders run before the component renders, so data is available on first paint with no loading flash', 'Loaders cache data automatically', 'Loaders do not require async/await'],
      answer: 1,
      explanation: 'Loaders run before the route component renders. The component receives data via useLoaderData() on its first render — no loading state, no empty render, no flash of empty content.',
    },
    {
      q: 'What does <Outlet /> render inside a layout component?',
      options: ['The layout\'s own children prop', 'The matched child route\'s element', 'A loading spinner', 'The parent route\'s element'],
      answer: 1,
      explanation: '<Outlet /> is a placeholder inside a layout route\'s component. React Router replaces it with the matched child route\'s component. Without it, child routes render nothing.',
    },
    {
      q: 'What happens after a route\'s action function returns redirect("/")?',
      options: ['The action data is saved and the component re-renders', 'React Router navigates to "/" and re-runs that route\'s loader', 'The page performs a full reload', 'Nothing — redirect() is only for BrowserRouter'],
      answer: 1,
      explanation: 'redirect() returns a redirect Response. After the action completes, React Router navigates to the target route and re-runs its loader — automatically refreshing the data.',
    },
    {
      q: 'Which hook reads the value returned by a route\'s loader function?',
      options: ['useParams()', 'useLoaderData()', 'useRouteData()', 'useLocation()'],
      answer: 1,
      explanation: 'useLoaderData() returns the data returned by the route\'s loader. It must be called inside the route\'s element component (or a component it renders).',
    },
    {
      q: 'When should you use useSearchParams() instead of useState for filter values?',
      options: ['When the filter state is expensive to compute', 'When the filter values should be in the URL — bookmarkable, shareable, and preserved on refresh', 'When using TypeScript', 'When the filter component is deeply nested'],
      answer: 1,
      explanation: 'useSearchParams() syncs state to the URL query string. Users can bookmark, share, or refresh the page and the filters are preserved. useState is lost on refresh.',
    },
    {
      q: 'What is useFetcher() used for in React Router?',
      options: ['Fetching data before the component renders', 'Calling a loader or action without changing the URL or navigating', 'Making HTTP requests with automatic error handling', 'Creating a new router instance'],
      answer: 1,
      explanation: 'useFetcher() submits forms or fetches data from any route without navigating. Ideal for inline mutations (toggle, delete) that should update data but keep the user on the current page.',
    },
    {
      q: 'What does navigate("/login", { replace: true }) do differently from navigate("/login")?',
      options: ['It navigates without adding to the browser history', 'It replaces the current history entry instead of pushing a new one', 'It triggers a full page reload', 'It is slower than a regular navigate call'],
      answer: 1,
      explanation: 'replace: true replaces the current history entry instead of pushing a new one. The user cannot press Back to return to the previous page. Required after logout or post-login redirect to prevent returning to a protected page.',
    },
    {
      q: 'Which component provides active/pending styling classes automatically?',
      options: ['<Link>', '<ActiveLink>', '<NavLink>', '<Route>'],
      answer: 2,
      explanation: '<NavLink> adds an "active" class (or calls a className function) when its to prop matches the current URL. It also adds "pending" during navigation transitions. <Link> provides no active state.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between React Router v6 and v7?',
      a: 'React Router v7 merges React Router and Remix into one package. The data API (loaders, actions, errorElement) is identical. v7 adds first-class SSR, pre-rendering, and a framework mode. For client-side-only apps the migration is mostly a package name change.',
    },
    {
      q: 'How do I pass state when navigating programmatically?',
      a: 'Use navigate("/path", { state: { from: "/login" } }). Read it in the destination with const { from } = useLocation().state as { from: string }. State is not in the URL — it is lost on refresh. Use search params for state that should survive refresh.',
    },
    {
      q: 'How do I prefetch a route\'s loader data before the user clicks the link?',
      a: 'Use <Link prefetch="intent"> (React Router v7) or router.prefetch("/path") imperatively. This runs the route\'s loader in the background when the user hovers a link, so navigation feels instant.',
    },
    {
      q: 'How do I scroll to the top on route change?',
      a: 'Use the <ScrollRestoration /> component from react-router-dom — it restores scroll position to the saved position (or top) after navigation. Place it once in your root layout. For programmatic scroll: call window.scrollTo(0,0) in a useEffect watching useLocation().',
    },
    {
      q: 'Can I use React Router loaders with TanStack Query together?',
      a: 'Yes — a common pattern is to call queryClient.ensureQueryData() inside loaders. The loader populates the TanStack Query cache; the component calls useQuery() with the same key and immediately gets the cached data. This gives you both the no-loading-flash benefit of loaders and TanStack Query\'s background refetch.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'createBrowserRouter with loaders runs data fetching before render, <Outlet /> renders child routes in layouts, and hooks like useParams/useNavigate handle navigation logic.',
    mustKnow: [
      'createBrowserRouter + RouterProvider: use over BrowserRouter to get loaders, actions, errorElement',
      'loader runs before render — data via useLoaderData(); action handles form POST — redirect() after mutation',
      '<Outlet /> required in layout components; index: true is the default child route',
      'useParams() → dynamic URL segments; useSearchParams() → query string (bookmarkable); useNavigate() → programmatic navigation',
      'replace: true on post-auth navigates to avoid Back returning to login/protected routes',
      'useFetcher() for inline mutations that should not change the URL',
    ],
    interviewFocus: [
      'What is the advantage of React Router loaders over useEffect for data fetching?',
      'How do nested routes and <Outlet /> work — draw a layout + child route example',
      'Difference between useSearchParams and useState for filter state',
      'When would you use useFetcher() instead of navigate()?',
    ],
  };
}
