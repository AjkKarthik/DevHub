import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-ssr-streaming',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './ssr-streaming.html',
  styleUrl: './ssr-streaming.scss',
})
export class PerfSsrStreaming {

  quickRef: QuickRefItem[] = [
    { name: 'SSR',               type: 'keyword', desc: 'Server-Side Rendering — HTML generated on the server per request; fast first paint, slower TTFB' },
    { name: 'SSG',               type: 'keyword', desc: 'Static Site Generation — HTML pre-built at deploy time; fastest TTFB, no dynamic content per request' },
    { name: 'ISR',               type: 'keyword', desc: 'Incremental Static Regeneration (Next.js) — SSG with background revalidation after a TTL' },
    { name: 'Streaming HTML',    type: 'keyword', desc: 'Flush HTML in chunks as it\'s ready — browser can paint and download assets before the full response ends' },
    { name: 'Suspense',          type: 'keyword', desc: 'React 18 boundary that streams a fallback first, then replaces with real content when data resolves' },
    { name: 'Hydration',         type: 'keyword', desc: 'Client-side JS taking over server-rendered HTML — makes it interactive; adds JS parse/exec cost' },
    { name: 'Partial hydration', type: 'keyword', desc: 'Hydrate only interactive components (islands) — static parts stay HTML, reducing JS payload' },
    { name: 'Edge SSR',          type: 'keyword', desc: 'Run SSR at a CDN edge node near the user — reduces TTFB vs a single-region origin server' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CSR vs SSR vs SSG — choose the right model',
      points: [
        'CSR (Client-Side Rendering): blank HTML, JS downloads, renders in browser. Slow LCP, bad for SEO.',
        'SSR (Server-Side Rendering): full HTML from server per request. Fast LCP, requires server, slower TTFB than static.',
        'SSG (Static Site Generation): HTML built at deploy time. Fastest TTFB (CDN-cached), no server compute, stale on updates.',
        'ISR (Next.js Incremental Static Regeneration): SSG + background revalidation — balance of freshness and speed.',
        'Hybrid: SSG for mostly-static pages (marketing, blog), SSR for dynamic pages (user dashboard, real-time data).',
      ],
    },
    {
      heading: 'Streaming HTML — send content before it\'s all ready',
      points: [
        'Traditional SSR: server waits for ALL data (DB queries, APIs) before sending any HTML — high TTFB.',
        'Streaming SSR: send HTML header + shell immediately; stream deferred sections as data arrives.',
        'Browser starts downloading CSS/fonts/scripts from the streamed <head> before the body is complete.',
        'React 18: <Suspense> boundaries mark deferred sections — fallback is streamed first, replaced when resolved.',
        'Node.js: use ReadableStream or pipeline() to stream res.write() chunks, flushing after each section.',
      ],
    },
    {
      heading: 'Time to First Byte (TTFB) — server speed matters for LCP',
      points: [
        'TTFB is the time from navigation to first response byte — high TTFB directly delays LCP.',
        'Causes of slow TTFB: slow database queries, no caching, single-region server far from user.',
        'Fix slow TTFB: cache rendered HTML (CDN, Redis), use edge SSR, move to a closer region.',
        'Good TTFB: < 800ms total (includes DNS + TCP + TLS + server time). Measure with Navigation Timing API.',
        'Streaming reduces perceived TTFB — the first byte arrives fast; remaining content streams in.',
      ],
    },
    {
      heading: 'Hydration — the hidden CSR cost',
      points: [
        'After SSR sends HTML, the page looks rendered but is not interactive until JS hydrates it.',
        'Hydration downloads the same component JS, parses it, and attaches event listeners — adds 1–5s on slow devices.',
        'Hydration mismatch: server HTML doesn\'t match client render — causes full re-render and layout flash.',
        'Progressive hydration: hydrate components in priority order (above-fold first, idle-time for below-fold).',
        'Partial hydration (islands architecture): only interactive components hydrate — Astro, Fresh, Marko use this.',
      ],
    },
    {
      heading: 'Edge rendering — reduce TTFB with geography',
      points: [
        'Traditional SSR runs in one region — users on the other side of the world have high latency.',
        'Edge SSR runs the same server function at the CDN PoP closest to the user — reduces TTFB by 100–400ms.',
        'Cloudflare Workers, Vercel Edge Functions, Deno Deploy: run V8-based JS at 100+ edge locations.',
        'Limitation: edge runtimes are sandboxed — no filesystem, limited Node.js APIs, cold-start latency.',
        'Best for: personalised SSR pages (greet user by name, locale-specific content) that cannot be fully static.',
      ],
    },
    {
      heading: 'Angular Universal / SSR (Angular 17+)',
      points: [
        'Angular 17+ ships SSR built-in: ng add @angular/ssr adds server.ts and hydration support.',
        'provideClientHydration() in app.config.ts enables Angular\'s non-destructive hydration (reuses server DOM).',
        'withEventReplay() buffers user events during hydration and replays them — prevents lost interactions.',
        'Angular 17 streaming: not yet fully supported; SSR outputs full HTML then transfers.',
        'Route-level rendering modes: renderMode: RenderMode.Server | Prerender | Client per route.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Node.js streaming SSR',
      language: 'typescript',
      code: `// Express streaming SSR — flush head immediately, stream body
import express from 'express';
import { pipeline } from 'stream';
import { Readable } from 'stream';

const app = express();

app.get('/product/:id', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 1. Flush <head> immediately — browser starts loading CSS/fonts NOW
  res.write(\`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Product</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
</head>
<body>
<header><!-- fast static shell --></header>
<main id="product">\`);

  // 2. Fetch product data (may be slow)
  try {
    const product = await fetchProduct(req.params.id);

    // 3. Stream the dynamic content when ready
    res.write(\`
      <h1>\${escapeHtml(product.name)}</h1>
      <p>\${escapeHtml(product.description)}</p>
      <button>Add to cart</button>
    \`);
  } catch {
    res.write('<p>Product unavailable</p>');
  }

  // 4. Close the document
  res.end('</main></body></html>');
});`,
    },
    {
      label: 'React 18 streaming with Suspense',
      language: 'typescript',
      code: `// React 18 — renderToPipeableStream with Suspense boundaries
import { renderToPipeableStream } from 'react-dom/server';
import { Suspense } from 'react';

// Component with async data
async function ProductDetails({ id }: { id: string }) {
  const product = await fetchProduct(id);  // suspends until resolved
  return <div><h1>{product.name}</h1><p>{product.price}</p></div>;
}

// Page component with Suspense boundary
function ProductPage({ id }: { id: string }) {
  return (
    <html>
      <head>
        <title>Product</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <header>Static header — streamed immediately</header>
        <main>
          {/* Fallback skeleton streamed first; replaced when data arrives */}
          <Suspense fallback={<div className="skeleton">Loading product…</div>}>
            <ProductDetails id={id} />
          </Suspense>
        </main>
      </body>
    </html>
  );
}

// Server handler (Next.js handles this automatically)
function handler(req: Request, res: Response) {
  const { pipe, abort } = renderToPipeableStream(
    <ProductPage id={req.params.id} />,
    {
      onShellReady() {
        // Shell (everything outside Suspense) is ready — start streaming
        res.setHeader('Content-Type', 'text/html');
        pipe(res);
      },
      onShellError(error) {
        res.status(500).send('<h1>Something went wrong</h1>');
      },
    }
  );
  // Abort streaming after 10s
  setTimeout(abort, 10_000);
}`,
    },
    {
      label: 'Angular SSR (Angular 17+)',
      language: 'typescript',
      code: `// app.config.ts — enable SSR hydration
import { ApplicationConfig } from '@angular/core';
import { provideRouter }     from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(
      withEventReplay()  // buffer clicks during hydration, replay after
    ),
  ],
};

// app.routes.ts — per-route rendering mode (Angular 19+)
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '',              renderMode: RenderMode.Prerender },    // SSG
  { path: 'product/:id',  renderMode: RenderMode.Server },       // SSR per request
  { path: 'dashboard',    renderMode: RenderMode.Client },       // CSR only
  { path: '**',           renderMode: RenderMode.Prerender },
];

// server.ts (generated by ng add @angular/ssr)
// Angular SSR creates an Express server that:
// 1. Serves pre-rendered HTML for SSG routes from dist/browser/
// 2. Renders SSR routes on demand with the Angular engine
// 3. Falls through to the client bundle for CSR routes`,
    },
    {
      label: 'Measure TTFB with Navigation Timing',
      language: 'typescript',
      code: `// Measure TTFB and streaming phases in production
function measureTTFB() {
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (!nav) return;

  const dns        = nav.domainLookupEnd - nav.domainLookupStart;
  const tcp        = nav.connectEnd - nav.connectStart;
  const tls        = nav.secureConnectionStart > 0
                     ? nav.connectEnd - nav.secureConnectionStart : 0;
  const ttfb       = nav.responseStart - nav.requestStart;
  const serverTime = nav.responseStart - nav.fetchStart - dns - tcp - tls;
  const transfer   = nav.responseEnd - nav.responseStart;
  const domParse   = nav.domInteractive - nav.responseStart;

  console.table({
    'DNS (ms)':         Math.round(dns),
    'TCP+TLS (ms)':     Math.round(tcp),
    'TTFB (ms)':        Math.round(ttfb),
    'Server time (ms)': Math.round(serverTime),
    'Transfer (ms)':    Math.round(transfer),
    'DOM parse (ms)':   Math.round(domParse),
  });

  // Streaming indicator: if transfer > 500ms, server is streaming
  if (transfer > 500) {
    console.log('Page is likely streaming — transfer phase is long');
  }
}

window.addEventListener('load', measureTTFB);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using CSR for public marketing pages (bad for SEO and LCP)',
      wrong: `// Angular/React CSR — Google sees a blank page on first crawl
// LCP = 4+ seconds on mobile (JS download + parse + render)
bootstrapApplication(AppComponent);  // blank index.html, JS renders everything`,
      right: `// Use SSG for marketing pages — pre-rendered HTML, instant LCP
// Angular: ng add @angular/ssr → set renderMode: RenderMode.Prerender
// Next.js: export default function Page() {} — SSG by default
// Astro: all pages are SSG/SSR by default with zero client JS`,
      explanation: 'CSR requires JS to download, parse, and execute before anything renders. For public pages (homepage, blog, product pages), SSG or SSR is essential for good LCP and SEO. Google can render JavaScript but first-crawl timing is unreliable.',
    },
    {
      title: 'Fetching all data before streaming any HTML',
      wrong: `// Waits for slowest query (500ms) before sending ANY HTML
async function handler(req, res) {
  const [user, products, recommendations] = await Promise.all([
    fetchUser(),           // 50ms
    fetchProducts(),       // 200ms
    fetchRecommendations() // 500ms — bottleneck
  ]);
  res.send(renderPage(user, products, recommendations));
}`,
      right: `// Stream shell immediately; defer slow sections with Suspense/late flush
async function handler(req, res) {
  res.write(renderShell());          // flush header + layout immediately
  const user = await fetchUser();    // 50ms — fast data first
  res.write(renderUserSection(user));
  const products = await fetchProducts(); // 200ms
  res.write(renderProducts(products));
  // Slow section streamed last — doesn't block fast sections
  const recs = await fetchRecommendations(); // 500ms
  res.end(renderRecommendations(recs) + '</body></html>');
}`,
      explanation: 'Promise.all() waits for the slowest query before any HTML is sent. Instead, flush the page shell immediately, then stream each section as its data arrives. This gives the browser time to download assets while slower sections load.',
    },
    {
      title: 'Hydration mismatches causing full client re-render',
      wrong: `// Server renders Date.now() — client re-renders with different timestamp
function ServerComponent() {
  return <time>{new Date().toLocaleString()}</time>;  // different on client
}
// Result: React warns, re-renders entire tree, causes layout shift`,
      right: `// Suppress hydration on dynamic content OR generate server-side and pass as prop
function ServerComponent({ serverTime }: { serverTime: string }) {
  return <time suppressHydrationWarning>{serverTime}</time>;
  // OR: generate once server-side, pass as serialised prop
}`,
      explanation: 'If server-rendered HTML doesn\'t match what the client would render, React/Angular discards the server HTML and re-renders from scratch — defeating the purpose of SSR. Avoid rendering random values, dates, or window-dependent data during SSR.',
    },
    {
      title: 'SSR-ing everything including authenticated user data',
      wrong: `// SSR renders user-specific HTML — not cacheable at CDN
// Every request hits the origin: 200ms TTFB instead of 10ms from CDN cache
async function handler(req, res) {
  const user = await getUser(req.cookies.token);
  res.send(renderPage(user));  // unique per user — uncacheable`,
      right: `// SSG/SSR the page shell (cacheable), fetch user data client-side
// Shell: CDN-cached, ~10ms TTFB
// User data: fetched after hydration from /api/me — fast with HTTP/2
function Page() {
  const user = useSWR('/api/me', fetcher);  // client-side after hydration
  return <Layout><UserSection user={user.data} /></Layout>;
}`,
      explanation: 'Personalized SSR (different HTML per user) cannot be cached at the CDN — every request hits the origin server. The hybrid approach SSGs the page shell (cacheable) and fetches user-specific data client-side after hydration — combining CDN speed with personalisation.',
    },
    {
      title: 'Not implementing Angular\'s withEventReplay()',
      wrong: `// Without event replay: user clicks "Add to cart" during hydration
// The click fires before event listeners are attached — silently ignored
provideClientHydration()  // no withEventReplay`,
      right: `// withEventReplay() buffers events during hydration, replays after
provideClientHydration(
  withEventReplay()
)
// User clicks during hydration → event is queued → replayed once hydrated`,
      explanation: 'During Angular SSR hydration, the HTML is visible but event listeners are not yet attached. Without withEventReplay(), user interactions (clicks, form submits) during this window are lost. withEventReplay() buffers them and replays them once hydration completes.',
    },
    {
      title: 'Using SSR for pages with no meaningful dynamic content',
      wrong: `// Marketing blog post: same content for everyone, never changes
// SSR-ing it adds server costs and 200ms TTFB vs CDN-cached SSG
export async function getServerSideProps() {
  return { props: { post: await fetchPost() } };  // runs on EVERY request`,
      right: `// SSG: built once at deploy time, served from CDN instantly
export async function getStaticProps() {
  return { props: { post: await fetchPost() }, revalidate: 3600 };
  // ISR: rebuild every hour if post changes; 10ms TTFB from CDN cache`,
      explanation: 'SSR runs server-side logic on every request — adding cost and latency. For content that is the same for all users and changes infrequently, SSG (or ISR with a revalidation TTL) is always faster and cheaper. Reserve SSR for truly dynamic, per-user content.',
    },
  ];

  challenge: Challenge = {
    title: 'Convert a CSR Angular route to prerendered SSG',
    language: 'typescript',
    description: `You have an Angular app where the homepage ("/") is currently CSR (Client-Side Rendering).
It serves a blank index.html and renders everything via JavaScript — resulting in 4s LCP on mobile.

Add Angular SSR and configure the homepage as prerendered (SSG) so it:
1. Serves pre-built HTML immediately from the server
2. Enables non-destructive hydration so Angular reuses the server DOM
3. Buffers user interactions during hydration with event replay
4. Keeps the dashboard ("/dashboard") as CSR-only (user-specific data)`,
    hints: [
      'Run: ng add @angular/ssr to add the SSR package',
      'Add serverRoutes array to app.routes.ts with RenderMode per path',
      'Add provideClientHydration(withEventReplay()) to app.config.ts providers',
      'RenderMode.Prerender = SSG (built at ng build time)',
      'RenderMode.Client = CSR, no server rendering',
    ],
    starterCode: `// app.config.ts — BEFORE (CSR only)
import { ApplicationConfig } from '@angular/core';
import { provideRouter }     from '@angular/router';
import { routes }            from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // No SSR hydration
  ],
};

// app.routes.ts — BEFORE (no server route modes)
export const routes = [
  { path: '',         loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
];`,
    solution: `// 1. Add Angular SSR: ng add @angular/ssr

// app.config.ts — enable SSR hydration
import { ApplicationConfig }                         from '@angular/core';
import { provideRouter }                             from '@angular/router';
import { provideClientHydration, withEventReplay }   from '@angular/platform-browser';
import { routes }                                    from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(
      withEventReplay()  // buffer user events during hydration window
    ),
  ],
};

// app.routes.ts — add server rendering modes
import { RenderMode, ServerRoute } from '@angular/ssr';

export const routes = [
  { path: '',          loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
];

export const serverRoutes: ServerRoute[] = [
  { path: '',          renderMode: RenderMode.Prerender },  // SSG — built at ng build
  { path: 'dashboard', renderMode: RenderMode.Client },     // CSR — no server rendering
  { path: '**',        renderMode: RenderMode.Prerender },  // default: SSG
];

// app.config.server.ts (generated by ng add @angular/ssr)
// Registers the server-specific providers — do not modify manually`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key performance advantage of streaming SSR over traditional SSR?',
      options: [
        'Streaming SSR eliminates the need for JavaScript hydration',
        'Streaming SSR sends HTML chunks as they\'re ready — the browser can paint and load assets before the full response ends',
        'Streaming SSR runs on the CDN edge, eliminating server latency entirely',
        'Streaming SSR pre-builds all HTML at deploy time, removing runtime server cost',
      ],
      answer: 1,
      explanation: 'Traditional SSR waits for all data before sending any HTML, creating a high TTFB. Streaming SSR flushes the <head> and shell immediately, letting the browser start downloading CSS, fonts, and scripts while the server is still fetching data for deferred sections.',
    },
    {
      q: 'What causes hydration mismatches in SSR frameworks?',
      options: [
        'Using TypeScript instead of JavaScript for server components',
        'Server-rendered HTML differing from what the client-side render produces — often from date/random values or window access',
        'Importing CSS modules in server components',
        'Using async/await inside server-side data fetching functions',
      ],
      answer: 1,
      explanation: 'Hydration mismatches occur when server HTML doesn\'t match client re-render output — common causes are Date.now(), Math.random(), window/document access, or user-specific values during SSR. React/Angular detect the mismatch and re-render from scratch, causing a visible flash.',
    },
    {
      q: 'Which Angular feature buffers user interactions that happen during the hydration window?',
      options: [
        'withNoHttpTransferCache()',
        'withEventReplay()',
        'withI18nSupport()',
        'withIncrementalHydration()',
      ],
      answer: 1,
      explanation: 'withEventReplay() (passed to provideClientHydration()) records user events (clicks, inputs) that fire before Angular\'s event listeners are attached during hydration. Once hydration completes, the buffered events are replayed in order — preventing lost interactions on SSR pages.',
    },
    {
      q: 'When should you use SSG (Static Site Generation) over SSR?',
      options: [
        'For authenticated dashboards showing user-specific data',
        'For real-time chat features requiring WebSockets',
        'For content that is the same for all users and changes infrequently — like blog posts or marketing pages',
        'When you need to personalise content by geography',
      ],
      answer: 2,
      explanation: 'SSG pre-builds HTML at deploy time and serves it from a CDN — providing the fastest possible TTFB (10–50ms vs 200ms+ for SSR). It\'s ideal when content is the same for all users and doesn\'t need to update on every request. Dynamic, user-specific, or real-time content requires SSR.',
    },
    {
      q: 'What is the purpose of Incremental Static Regeneration (ISR)?',
      options: [
        'Render only the parts of the page that changed since the last request',
        'Serve SSG pages from CDN while revalidating and rebuilding them in the background after a TTL expires',
        'Incrementally add hydration to components as the user scrolls',
        'Split SSG builds across multiple servers to reduce build time',
      ],
      answer: 1,
      explanation: 'ISR (Next.js) lets you set a revalidate TTL on SSG pages. The page is served from CDN cache (fast, like SSG) until the TTL expires, then rebuilt in the background on the next request — giving CDN speed with eventual freshness without a full site rebuild.',
    },
    {
      q: 'What is Partial Hydration and how does it differ from full SSR hydration?',
      options: ['Partial Hydration means hydrating only the HTML <head>', 'Only interactive components receive hydration JS — static content remains as HTML without any JS bundle attached', 'Partial Hydration defers hydration until user scroll', 'It is the same as Progressive Enhancement'],
      answer: 1,
      explanation: 'Full SSR hydration sends JavaScript for every component so the browser can "take over" the entire DOM. Partial Hydration (or Island Architecture, used by Astro) sends zero JS for static components — only interactive "islands" get hydration code. This drastically reduces JS bundle size and TTI. Progressive Hydration is related but different — it hydrates all components but in priority order (visible first).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does SSR actually help LCP for Angular apps?',
      a: 'Yes, significantly. A CSR Angular app serves blank HTML — the browser must download, parse, and execute the full JS bundle before anything renders. On mid-tier mobile, this can take 3–6s for LCP. With SSR/prerender, the server sends complete HTML — the browser paints immediately, giving LCP of 0.5–1.5s. The JS then hydrates silently in the background without delaying the paint.',
    },
    {
      q: 'What is the difference between hydration and re-rendering in SSR?',
      a: 'Hydration is non-destructive: the framework reuses the server-rendered DOM and attaches event listeners to it — no re-painting occurs. Re-rendering (caused by hydration mismatch) discards the server HTML and rebuilds the DOM from scratch client-side — equivalent to CSR, defeating SSR\'s purpose. Angular\'s provideClientHydration() and React\'s hydrateRoot() both do non-destructive hydration when there are no mismatches.',
    },
    {
      q: 'Can I use Angular SSR with a static host like GitHub Pages?',
      a: 'GitHub Pages only serves static files — you need prerendered (SSG) output. Run ng build with renderMode: RenderMode.Prerender for all routes — Angular outputs static HTML files for each route to dist/browser/. For routes with dynamic parameters (:id), you must provide getPrerenderParams() to enumerate all possible parameter values at build time.',
    },
    {
      q: 'What is the "islands architecture" and how does it reduce JS?',
      a: 'Islands architecture (Astro, Fresh) renders the full page as static HTML and only hydrates interactive "islands" (components that need JS). A blog post page might have 0 KB of client JS — except for a comment box (1 island) and a theme toggle (1 island). Traditional SSR/hydration sends JS for every component even if 90% are purely static. Islands eliminate that waste.',
    },
    {
      q: 'How do I handle SSR with components that use window or document?',
      a: 'During SSR, window and document don\'t exist — accessing them throws ReferenceError. In Angular, use isPlatformBrowser (inject PLATFORM_ID) to guard browser-only code. In React/Next.js, use typeof window !== "undefined" or move the code to useEffect (which only runs client-side). For third-party libraries that access window, use dynamic import with ssr: false (Next.js) or skip the import in server.ts.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SSR improves LCP by sending server-rendered HTML immediately; streaming SSR reduces perceived TTFB by flushing the shell before data is ready; SSG is fastest when content is static.',
    mustKnow: [
      'CSR = blank HTML + JS renders → slow LCP; SSR/SSG = HTML from server → fast LCP',
      'Streaming SSR flushes <head> first — browser downloads assets while data is still loading',
      'Hydration mismatch = full re-render; avoid date/random/window in server-rendered output',
      'Angular: provideClientHydration(withEventReplay()) for non-destructive hydration',
      'SSG serves pre-built HTML from CDN — fastest TTFB; ISR adds background revalidation',
      'Edge SSR runs server functions at CDN PoPs — reduces TTFB for global audiences',
    ],
    interviewFocus: [
      'What is the difference between SSR, SSG, and ISR?',
      'How does streaming SSR improve Time to First Byte?',
      'What causes hydration mismatches and how do you fix them?',
      'When would you choose SSG over SSR for a page?',
    ],
  };
}
