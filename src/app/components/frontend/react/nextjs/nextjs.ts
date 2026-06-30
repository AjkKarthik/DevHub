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
  selector: 'app-react-nextjs',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './nextjs.html',
  styleUrl: './nextjs.scss',
})
export class ReactNextjs {
  quickRef: QuickRefItem[] = [
    { name: '"use client"',                 type: 'keyword',  desc: 'Opt a component into the Client Component tree. All imports below it are also client.' },
    { name: 'Server Component (default)',   type: 'syntax',   desc: 'No directive needed — any component without "use client" is a Server Component by default.' },
    { name: 'async function Page()',        type: 'syntax',   desc: 'Server Components can be async — await data directly in the component body, no useEffect.' },
    { name: 'layout.tsx',                  type: 'syntax',   desc: 'Persistent shell across navigations in the same route segment. Receives children.' },
    { name: 'loading.tsx',                 type: 'syntax',   desc: 'Automatic Suspense boundary — shown while the page segment loads.' },
    { name: 'error.tsx',                   type: 'syntax',   desc: 'Error boundary for the segment. Must be a Client Component ("use client").' },
    { name: 'Server Action',               type: 'function', desc: 'Async function with "use server". Called from forms or buttons; runs on the server.' },
    { name: 'revalidatePath(path)',        type: 'function', desc: 'Invalidate cached data for a path after a mutation (Server Action). Triggers re-render.' },
    { name: 'cookies() / headers()',       type: 'function', desc: 'Read-only server APIs for incoming cookies and headers in Server Components/Actions.' },
    { name: 'useRouter / usePathname',     type: 'hook',     desc: 'Client-side navigation hooks. Must be in a Client Component.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Server Components vs Client Components',
      points: [
        '<strong>Server Components (default)</strong> run only on the server — they can await databases, read files, access secrets, and send zero JavaScript to the client. They cannot use hooks, browser APIs, or event handlers.',
        '<strong>Client Components</strong> are opted-in with <code>"use client"</code> at the top of the file. They hydrate in the browser and support hooks, event handlers, and browser APIs. They can still be pre-rendered on the server (SSR).',
        '<strong>The "use client" boundary</strong> propagates down: when you mark a file "use client", all imports in that file become client code too. You cannot import a Server Component into a Client Component — but you CAN pass Server Components as children/props.',
        '<strong>Decision rule:</strong> start with Server Components. Add "use client" only when you need interactivity (onClick, onChange), hooks (useState, useEffect), browser APIs (localStorage, window), or third-party client libraries.',
      ],
    },
    {
      heading: 'App Router — file-based routing',
      points: [
        '<strong>The App Router</strong> uses the <code>app/</code> directory. Each folder maps to a route segment. <code>page.tsx</code> is the rendered UI; <code>layout.tsx</code> is the persistent shell; <code>loading.tsx</code> is the Suspense fallback; <code>error.tsx</code> is the error boundary.',
        '<strong>Nested layouts:</strong> layouts wrap child segments and persist across navigations — ideal for nav bars, sidebars, and auth wrappers. A layout at <code>app/dashboard/layout.tsx</code> wraps all <code>app/dashboard/**</code> routes.',
        '<strong>Dynamic segments:</strong> <code>app/blog/[slug]/page.tsx</code> creates a dynamic route. Access params with <code>{ params }: { params: { slug: string } }</code> in the page component.',
        '<strong>Route Groups:</strong> <code>app/(marketing)/about/page.tsx</code> — parentheses create a group that does not appear in the URL. Use for shared layouts without a URL prefix (e.g., marketing pages vs dashboard pages).',
      ],
    },
    {
      heading: 'Data fetching in Server Components',
      points: [
        '<strong>Fetch directly in Server Components</strong> — no useEffect, no loading state management, no client-side fetch. <code>const data = await fetch(url)</code> in an async Server Component is the standard pattern.',
        '<strong>Next.js extends fetch</strong> with caching options: <code>{ cache: "force-cache" }</code> (static, cached forever), <code>{ cache: "no-store" }</code> (dynamic, never cached), <code>{ next: { revalidate: 60 } }</code> (ISR — revalidate every 60s).',
        '<strong>Parallel data fetching:</strong> use <code>Promise.all</code> to fetch multiple resources concurrently in a Server Component. Sequential awaits add latency — fetch in parallel when data is independent.',
        '<strong>generateStaticParams</strong> pre-generates dynamic routes at build time: return an array of <code>{ slug: "..." }</code> objects for <code>app/blog/[slug]/page.tsx</code> — Next.js pre-renders one page per entry.',
      ],
    },
    {
      heading: 'Server Actions',
      points: [
        '<strong>Server Actions</strong> are async functions marked with <code>"use server"</code>. They run on the server and are called from Client Components via form actions or event handlers. No API route needed for simple mutations.',
        '<strong>Form integration:</strong> pass a Server Action to a form\'s action prop — <code>&lt;form action={createPost}&gt;</code>. On submit, Next.js serialises the form data and calls the action on the server without any client-side JavaScript.',
        '<strong>Revalidation:</strong> after a mutation, call <code>revalidatePath("/posts")</code> or <code>revalidateTag("posts")</code> to invalidate cached data and trigger a re-render of the affected pages.',
        '<strong>useActionState (React 19 / Next.js 15):</strong> manages Server Action state in a Client Component — returns <code>[state, formAction, isPending]</code>. Use for inline error display and optimistic UI without separate useState.',
      ],
    },
    {
      heading: 'Streaming and Suspense',
      points: [
        '<strong>Streaming</strong> sends HTML to the browser progressively — the shell renders immediately, async segments stream in as they resolve. Add <code>loading.tsx</code> or wrap in <code>&lt;Suspense fallback={...}&gt;</code> to enable streaming for a segment.',
        '<strong>Parallel routes</strong> (<code>@slot</code> convention) render multiple pages simultaneously in the same layout — useful for dashboards with independent data-fetching panels. Each slot has its own loading and error state.',
        '<strong>Intercepting routes</strong> (<code>(.)photos/[id]</code>) render a route in a modal when navigated from within the app, but as a full page when navigated directly (e.g., sharing a URL). Used for "photo feed + detail modal" patterns.',
        '<strong>Metadata API:</strong> export a <code>metadata</code> object or <code>generateMetadata</code> function from any page to set title, description, and Open Graph tags. Server-only — cannot be in a Client Component.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Server vs Client Components',
      language: 'typescript',
      code: `// app/products/page.tsx — Server Component (default, no directive)
// Runs on server, can await DB/API, zero JS shipped for this component
async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 },   // ISR: revalidate every 60 seconds
  }).then(r => r.json());

  return (
    <main>
      <h1>Products</h1>
      {/* ProductCard is a Server Component too */}
      {products.map((p: { id: number; name: string; price: number }) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </main>
  );
}

// app/products/ProductCard.tsx — still a Server Component
function ProductCard({ product }: { product: { id: number; name: string; price: number } }) {
  return <div>{product.name} — \${product.price}</div>;
}

// ──────────────────────────────────────────────────────────────
// app/products/AddToCartButton.tsx — Client Component (needs onClick)
'use client';   // <-- opt in to client bundle

import { useState } from 'react';

export function AddToCartButton({ productId }: { productId: number }) {
  const [added, setAdded] = useState(false);
  return (
    <button onClick={() => setAdded(true)} disabled={added}>
      {added ? '✓ Added' : 'Add to cart'}
    </button>
  );
}

// Composition: Server Component renders a Client Component
// app/products/[id]/page.tsx
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(\`/api/products/\${params.id}\`).then(r => r.json());
  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} />  {/* Client rendered inside Server */}
    </div>
  );
}`,
    },
    {
      label: 'App Router file structure',
      language: 'typescript',
      code: `// ──── Directory layout ────────────────────────────────────────
// app/
//   layout.tsx          ← root layout (html, body)
//   page.tsx            ← home page (/)
//   loading.tsx         ← global loading UI (Suspense)
//   error.tsx           ← global error boundary
//   (marketing)/        ← route group — no URL segment
//     about/page.tsx    ← /about
//     pricing/page.tsx  ← /pricing
//   dashboard/
//     layout.tsx        ← persistent dashboard shell (/dashboard/*)
//     page.tsx          ← /dashboard
//     settings/
//       page.tsx        ← /dashboard/settings
//   blog/
//     [slug]/
//       page.tsx        ← /blog/any-slug (dynamic)
//       loading.tsx     ← shown while page renders

// app/layout.tsx — root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>…</nav>
        {children}
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx — nested layout
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: 240 }}><DashboardNav /></aside>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

// app/blog/[slug]/page.tsx — dynamic segment
export async function generateStaticParams() {
  const posts = await fetch('/api/posts').then(r => r.json());
  return posts.map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetch(\`/api/posts/\${params.slug}\`).then(r => r.json());
  return <article><h1>{post.title}</h1><p>{post.content}</p></article>;
}`,
    },
    {
      label: 'Server Actions',
      language: 'typescript',
      code: `// app/actions/post.ts — Server Actions file
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title   = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title?.trim()) return { error: 'Title is required' };

  await db.post.create({ data: { title, content } });
  revalidatePath('/posts');         // invalidate cached /posts page
  redirect('/posts');               // navigate after success
}

export async function deletePost(id: number) {
  await db.post.delete({ where: { id } });
  revalidatePath('/posts');
}

// ──── Form with Server Action (no JS required for submission) ──
// app/posts/new/page.tsx
import { createPost } from '../actions/post';

export default function NewPostPage() {
  return (
    <form action={createPost}>          {/* Server Action as form action */}
      <label>
        Title
        <input name="title" required />
      </label>
      <label>
        Content
        <textarea name="content" />
      </label>
      <button type="submit">Publish</button>
    </form>
  );
}

// ──── useActionState (React 19 / Next 15) — error feedback ────
'use client';
import { useActionState } from 'react';
import { createPost } from '../actions/post';

export function PostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);
  return (
    <form action={formAction}>
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
      <input name="title" required />
      <textarea name="content" />
      <button type="submit" disabled={isPending}>{isPending ? 'Publishing…' : 'Publish'}</button>
    </form>
  );
}`,
    },
    {
      label: 'Streaming + Suspense',
      language: 'typescript',
      code: `// app/dashboard/page.tsx — parallel data fetching with streaming
import { Suspense } from 'react';
import { RevenueChart } from './RevenueChart';
import { RecentOrders } from './RecentOrders';
import { UserStats } from './UserStats';

export default async function DashboardPage() {
  // Fetch non-streaming data early
  const stats = await fetchUserStats();

  return (
    <div>
      <UserStats stats={stats} />

      {/* Each Suspense boundary streams independently */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />          {/* slow — streams in later */}
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />          {/* also slow — streams independently */}
      </Suspense>
    </div>
  );
}

// app/dashboard/loading.tsx — automatic Suspense for the whole segment
export default function Loading() {
  return <DashboardSkeleton />;
}

// ──── Parallel data fetching (avoid waterfall) ─────────────────
async function RevenueChart() {
  // Promise.all runs both fetches concurrently — not sequentially
  const [revenue, forecast] = await Promise.all([
    fetchRevenue(),
    fetchForecast(),
  ]);
  return <Chart data={revenue} forecast={forecast} />;
}

// ──── Metadata API ─────────────────────────────────────────────
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  };
}`,
    },
    {
      label: 'Client navigation hooks',
      language: 'typescript',
      code: `'use client';   // navigation hooks require a Client Component

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

// ──── useRouter ────────────────────────────────────────────────
function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()}>← Back</button>
  );
}

function Nav() {
  const router    = useRouter();
  const pathname  = usePathname();   // current path, reactive
  const [isPending, startTransition] = useTransition();

  function navigate(href: string) {
    startTransition(() => router.push(href));
  }

  return (
    <nav>
      {['/dashboard', '/posts', '/settings'].map(href => (
        <a key={href} onClick={(e) => { e.preventDefault(); navigate(href); }}
          aria-current={pathname === href ? 'page' : undefined}
          style={{ fontWeight: pathname === href ? 700 : 400 }}>
          {href.slice(1)}
        </a>
      ))}
      {isPending && <span>Loading…</span>}
    </nav>
  );
}

// ──── useSearchParams ──────────────────────────────────────────
function SearchFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = searchParams.get('q') ?? '';

  function updateSearch(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q); else params.delete('q');
    router.replace(\`\${pathname}?\${params.toString()}\`);
  }

  return (
    <input value={query} onChange={e => updateSearch(e.target.value)} placeholder="Search…" />
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Adding "use client" to every component',
      wrong: `'use client';   // added "just in case" to all components
import { formatDate } from '../utils';

export function PostMeta({ date }: { date: string }) {
  return <time>{formatDate(date)}</time>;
  // No hooks, no events — does not need to be a Client Component
}`,
      right: `// No directive — PostMeta is a Server Component
// Zero JS shipped for this component
import { formatDate } from '../utils';

export function PostMeta({ date }: { date: string }) {
  return <time>{formatDate(date)}</time>;
}`,
      explanation: '"use client" sends component code to the browser. Components without interactivity, hooks, or browser APIs should remain Server Components — they render on the server and ship zero JS. Over-using "use client" defeats the performance benefits of the App Router.',
    },
    {
      title: 'Importing a Server Component into a Client Component',
      wrong: `'use client';
import { ServerDataTable } from './ServerDataTable';  // Server Component — ERROR

export function Dashboard() {
  const [filter, setFilter] = useState('all');
  return <ServerDataTable filter={filter} />;  // Cannot import SC into CC
}`,
      right: `// Pass Server Component as children/props — composition pattern
// app/dashboard/page.tsx (Server Component)
import { Dashboard } from './Dashboard';          // Client
import { ServerDataTable } from './ServerDataTable';  // Server

export default function Page() {
  return (
    <Dashboard>
      <ServerDataTable />        {/* SC passed as children to CC — valid */}
    </Dashboard>
  );
}`,
      explanation: 'You cannot import a Server Component into a Client Component — the client bundle cannot contain server-only code. Instead, pass Server Components as children or props from a Server Component parent. The Client Component receives the already-rendered server output.',
    },
    {
      title: 'Using fetch without cache options (unintentional dynamic rendering)',
      wrong: `async function ProductPage() {
  // No cache option — defaults to no-store in Next.js 15, re-fetches on every request
  const product = await fetch('/api/product/1').then(r => r.json());
  return <div>{product.name}</div>;
}`,
      right: `async function ProductPage() {
  // Be explicit about caching intent
  const product = await fetch('/api/product/1', {
    next: { revalidate: 3600 },  // ISR: cache for 1 hour
    // OR: { cache: 'force-cache' }  for fully static
    // OR: { cache: 'no-store' }    for always dynamic
  }).then(r => r.json());
  return <div>{product.name}</div>;
}`,
      explanation: 'In Next.js 15, fetch defaults to no-store (no caching). Be explicit: force-cache for static data, next: { revalidate: N } for ISR (time-based revalidation), no-store for always-fresh dynamic data. Unintentional no-store makes pages unexpectedly slow.',
    },
    {
      title: 'Sequential data fetching instead of parallel',
      wrong: `async function Dashboard() {
  const user     = await fetchUser();      // waits...
  const orders   = await fetchOrders();   // then waits...
  const products = await fetchProducts(); // then waits...
  // Total time = sum of all three fetches
}`,
      right: `async function Dashboard() {
  const [user, orders, products] = await Promise.all([
    fetchUser(),
    fetchOrders(),
    fetchProducts(),
  ]);
  // Total time = slowest of the three fetches (parallel)
}`,
      explanation: 'Awaiting fetches sequentially in a Server Component creates a waterfall — each fetch waits for the previous. Use Promise.all to run independent fetches concurrently. This is critical for dashboard pages that need multiple data sources.',
    },
    {
      title: 'Calling a Server Action from a Server Component directly',
      wrong: `// Server Actions are for client-triggered mutations — not server-side calls
async function ServerPage() {
  const result = await myServerAction();  // Calling SA from SC — not the intended pattern
}`,
      right: `// Call the underlying function directly from Server Components
async function ServerPage() {
  const result = await myDatabaseFunction();  // Direct call, no "use server" needed
}

// Server Actions are for Client Component forms and event handlers:
'use client';
export function MyForm() {
  return <form action={myServerAction}><button>Submit</button></form>;
}`,
      explanation: 'Server Actions ("use server") are designed for client-to-server calls — form submissions and button clicks from Client Components. In a Server Component, call your data layer directly without the Server Action wrapper.',
    },
    {
      title: 'Using useSearchParams without Suspense wrapping',
      wrong: `'use client';
// useSearchParams reads from the URL — Next.js requires Suspense boundary
export default function SearchPage() {
  const searchParams = useSearchParams();   // missing Suspense — build warning
  return <div>Query: {searchParams.get('q')}</div>;
}`,
      right: `'use client';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  return <div>Query: {searchParams.get('q')}</div>;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}`,
      explanation: 'useSearchParams opts the component into dynamic rendering. Next.js requires it to be wrapped in a Suspense boundary so the shell can still be statically rendered. Without Suspense, Next.js logs a build warning and the page may not render correctly.',
    },
  ];

  challenge: Challenge = {
    title: 'Blog with Server Actions',
    language: 'typescript',
    description: `Build a minimal Next.js App Router blog with:

1. app/posts/page.tsx — Server Component that fetches and lists posts from a mock API
2. app/posts/[slug]/page.tsx — Dynamic Server Component that shows a single post
3. app/posts/new/page.tsx — Form that uses a Server Action to create a post
4. Server Action createPost(formData) — validates title (required), saves to "DB", revalidates /posts, redirects
5. app/posts/new/loading.tsx — Simple skeleton while the page loads

The mock "DB" is a module-level array. Use generateStaticParams to pre-generate the existing post routes.`,
    hints: [
      'All page components are async Server Components — await the data directly, no useEffect',
      'The form action prop receives the Server Action directly: <form action={createPost}>',
      'generateStaticParams returns: posts.map(p => ({ slug: p.slug }))',
      'revalidatePath("/posts") + redirect("/posts") at the end of the Server Action',
    ],
    starterCode: `// The mock DB (posts.ts)
export const posts = [
  { id: 1, slug: 'hello-world', title: 'Hello World', content: 'My first post.' },
  { id: 2, slug: 'next-js-rocks', title: 'Next.js Rocks', content: 'The App Router is great.' },
];

// TODO: app/posts/page.tsx — Server Component listing all posts with links
// TODO: app/posts/[slug]/page.tsx — Server Component showing one post
//         + generateStaticParams to pre-generate routes
// TODO: app/actions/createPost.ts — "use server" action
//         Validate title, push to posts array, revalidatePath, redirect
// TODO: app/posts/new/page.tsx — form with action={createPost}
// TODO: app/posts/new/loading.tsx — skeleton UI`,
    solution: `// posts.ts
export const posts = [
  { id: 1, slug: 'hello-world',   title: 'Hello World',    content: 'My first post.'           },
  { id: 2, slug: 'next-js-rocks', title: 'Next.js Rocks', content: 'The App Router is great.' },
];

// app/actions/createPost.ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { posts } from '../../posts';

export async function createPost(formData: FormData) {
  const title   = (formData.get('title') as string)?.trim();
  const content = (formData.get('content') as string) ?? '';
  if (!title) return { error: 'Title is required' };
  const slug = title.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  posts.push({ id: posts.length + 1, slug, title, content });
  revalidatePath('/posts');
  redirect('/posts');
}

// app/posts/page.tsx
import Link from 'next/link';
import { posts } from '../../posts';
export default function PostsPage() {
  return (
    <main style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Blog</h1>
      <Link href="/posts/new">+ New Post</Link>
      <ul>{posts.map(p => (
        <li key={p.id}><Link href={\`/posts/\${p.slug}\`}>{p.title}</Link></li>
      ))}</ul>
    </main>
  );
}

// app/posts/[slug]/page.tsx
import { posts } from '../../../posts';
import { notFound } from 'next/navigation';
export async function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }));
}
export default function PostPage({ params }: { params: { slug: string } }) {
  const post = posts.find(p => p.slug === params.slug);
  if (!post) notFound();
  return <article><h1>{post.title}</h1><p>{post.content}</p></article>;
}

// app/posts/new/page.tsx
import { createPost } from '../../actions/createPost';
export default function NewPostPage() {
  return (
    <main style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>New Post</h1>
      <form action={createPost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>Title<input name="title" required style={{ display: 'block', width: '100%' }} /></label>
        <label>Content<textarea name="content" rows={6} style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit">Publish</button>
      </form>
    </main>
  );
}

// app/posts/new/loading.tsx
export default function Loading() {
  return <div style={{ maxWidth: 600, margin: '2rem auto' }}>Loading form…</div>;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does adding "use client" to a file do?',
      options: ['It disables server-side rendering for that component', 'It marks the component and all its imports as part of the client bundle — they hydrate in the browser', 'It enables browser APIs in all components globally', 'It is the same as React.lazy()'],
      answer: 1,
      explanation: '"use client" creates a client boundary: the marked file and everything it imports becomes part of the client JavaScript bundle. The component still pre-renders on the server (SSR) but also hydrates in the browser to add interactivity.',
    },
    {
      q: 'Can you import a Server Component into a Client Component?',
      options: ['Yes — always', 'No — but you can pass Server Components as children/props from a Server Component parent', 'Yes, but only with React.lazy()', 'Yes, if the Server Component has no async functions'],
      answer: 1,
      explanation: 'You cannot import Server Components into Client Components — the client bundle cannot contain server-only code (like direct DB calls). The workaround is composition: a Server Component parent renders both the Client Component and the Server Component, passing the server output as children.',
    },
    {
      q: 'What does revalidatePath("/posts") do in a Server Action?',
      options: ['Redirects the user to /posts', 'Invalidates the cached data for /posts — Next.js will re-fetch and re-render on the next request', 'Deletes all posts', 'Runs the page\'s Server Action again'],
      answer: 1,
      explanation: 'revalidatePath invalidates the Next.js cache for the given path. On the next request to /posts, Next.js re-fetches the data and re-renders the page. Without it, the page continues to show stale cached data after a mutation.',
    },
    {
      q: 'What is the difference between layout.tsx and page.tsx?',
      options: ['They are identical', 'layout.tsx is a persistent shell across navigations; page.tsx is the unique UI for that route segment', 'page.tsx is for server rendering; layout.tsx is client-only', 'layout.tsx replaces page.tsx in Next.js 15'],
      answer: 1,
      explanation: 'layout.tsx wraps all child segments and persists across navigations — its state and DOM are preserved when navigating between sibling routes. page.tsx is re-mounted on each navigation to that route. Use layout.tsx for nav bars, sidebars, and auth wrappers.',
    },
    {
      q: 'What is the purpose of loading.tsx in the App Router?',
      options: ['It is the 404 page', 'It creates an automatic Suspense boundary — shown while the page segment is streaming or loading', 'It runs before the layout', 'It replaces error.tsx'],
      answer: 1,
      explanation: 'loading.tsx is automatically wrapped in a Suspense boundary by Next.js. While the async page component is fetching data and rendering on the server, the loading UI is shown immediately. When the page resolves, it streams in and replaces the loading state.',
    },
    {
      q: 'How do you pass data to a Server Action from a form?',
      options: ['JSON.stringify the data and pass as a hidden field', 'Pass the Server Action as the form\'s action prop — Next.js serialises the FormData and sends it to the server', 'Use fetch() inside the form\'s onSubmit', 'Server Actions cannot receive form data'],
      answer: 1,
      explanation: '<form action={myServerAction}> wires the form directly to the Server Action. On submit, Next.js serialises the form fields as FormData, sends them to the server, and calls the action with that FormData. No JavaScript is required for the submission itself.',
    },
    {
      q: 'Why must useSearchParams be wrapped in a Suspense boundary?',
      options: ['It is a Client Component hook — all Client Component hooks need Suspense', 'useSearchParams reads dynamic URL data — Next.js requires a Suspense boundary so the outer shell can be statically rendered', 'Suspense is required for all hooks', 'It is only needed on dynamic routes'],
      answer: 1,
      explanation: 'useSearchParams reads from the dynamic URL query string, opting the component into dynamic rendering. Next.js requires a Suspense boundary around it so the rest of the page can be statically generated while the dynamic part streams in.',
    },
    {
      q: 'What does generateStaticParams return for a [slug] dynamic route?',
      options: ['A list of all pages to exclude from static generation', 'An array of param objects — e.g. [{ slug: "hello" }, { slug: "world" }] — one entry per page to pre-render', 'The default props for the page component', 'A revalidation configuration object'],
      answer: 1,
      explanation: 'generateStaticParams returns an array of parameter objects. For app/blog/[slug]/page.tsx, it returns [{ slug: "post-1" }, { slug: "post-2" }, ...]. Next.js pre-renders one static HTML page per entry at build time.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use the App Router vs Pages Router?',
      a: 'New projects should use the App Router — it is the stable, recommended approach since Next.js 13.4. It enables Server Components, streaming, nested layouts, and Server Actions. The Pages Router is still fully supported for existing projects. Do not mix both deeply; the App Router is the future direction.',
    },
    {
      q: 'Can I use TanStack Query with Server Components?',
      a: 'Yes — with the right separation. Fetch initial data in Server Components and pass it as props or prefetch it into the QueryClient. Client Components can then use useQuery with the pre-filled cache (no loading state on first render). The pattern is: Server Component fetches → prefetches into HydrationBoundary → Client Component reads with useQuery.',
    },
    {
      q: 'What is the difference between revalidatePath and revalidateTag?',
      a: 'revalidatePath("/posts") invalidates all cached data for a specific URL path. revalidateTag("posts") invalidates all fetch calls tagged with { next: { tags: ["posts"] } } across any path. Tags are more flexible — one mutation can invalidate data shown on multiple pages.',
    },
    {
      q: 'How do I handle auth in the App Router?',
      a: 'Use Middleware (middleware.ts at the root) to protect routes — it runs on the edge before the request reaches the page. Check cookies/headers for the session token and redirect to login if missing. For finer control, check auth in Server Components or Server Actions and redirect() or return an error.',
    },
    {
      q: 'Does "use server" mean the code only runs on the server?',
      a: 'Yes — "use server" marks a function as a Server Action. The function body runs exclusively on the server; only a reference is passed to the client. The client calls it via a network request. This means you can safely access secrets, databases, and server-only APIs inside a Server Action.',
    },
    {
      q: 'How do I implement incremental static regeneration (ISR) in Next.js App Router?',
      a: 'Export a revalidate number from a layout or page: `export const revalidate = 60` (seconds). For on-demand ISR, call `revalidatePath("/blog/[slug]")` or `revalidateTag("posts")` inside a Server Action or Route Handler. The route stays cached until the next request after the interval, or until explicitly invalidated — no background worker needed.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Default to Server Components — add "use client" only for interactivity. Server Actions for mutations; revalidatePath to refresh cache.',
    mustKnow: [
      'Server Components: async, no hooks/events, zero JS shipped. Client Components: "use client", hooks, browser APIs',
      '"use client" propagates to all imports — keep the boundary as deep as possible',
      'Cannot import Server Component into Client Component — pass as children from a Server parent',
      'fetch caching: force-cache (static), next: { revalidate: N } (ISR), no-store (dynamic)',
      'Server Actions: "use server", called from form action prop or Client Component; revalidatePath after mutation',
      'loading.tsx = automatic Suspense boundary; error.tsx = error boundary (must be "use client")',
    ],
    interviewFocus: [
      'What is the difference between a Server Component and a Client Component — what can each do?',
      'How do you pass a Server Component into a Client Component (the children composition pattern)?',
      'What is a Server Action and how does it differ from a traditional API route?',
      'Explain ISR with revalidate — how does it differ from static and dynamic rendering?',
    ],
  };
}
