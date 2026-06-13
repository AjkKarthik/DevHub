# DevHub Master Roadmap

Living task file. Claude: read this at the start of every session, pick the highest
priority incomplete item, and update status as you go. Check items off when done (add date).
Add newly discovered work here — never leave scope only in chat.

---

## Working Method (read before every session — these are hard rules)

**1. One page at a time. No exceptions.**
Write one complete topic page per task. Do not batch multiple pages in one go.
Do not use parallel subagents to generate content. Each page deserves full attention.

**2. Research before writing.**
Before writing a topic page, spend time understanding the topic deeply:
- What do 2024–2025 job listings ask about this topic?
- What concepts trip people up in interviews?
- What are the common production pitfalls?
- What does an expert know that a beginner doesn't?
Then write the page. Do not skip research to save time — shallow pages defeat the purpose.

**3. Cover the topic completely.**
A page should leave no important stone unturned. If a topic has 8 important sub-concepts,
cover all 8 — in theory, code examples, quiz, Q&A, and pitfalls. Do not thin out content
because it feels like "too much". Learners benefit from depth.

**4. Before starting any new hub — research the hub first.**
Run a full market research pass on the hub before writing a single page:
- Review current home.ts topic cards
- Research 2024–2025 job requirements for the technology
- Identify any missing topics not yet in the home cards
- Add new cards to home.ts if gaps found (available: false, coming-soon)
- Only then begin writing page 1
This ensures the hub's table of contents is complete before content starts.

**5. No "coming soon" is the finish line.**
Every card on every hub home must eventually link to a real, fully-written page.
The plan is long — that is fine. One solid page at a time gets there.

---

## Vision

**Goal: zero "coming soon" across all 34 hubs.**
Every card on every hub home must link to a real, fully-written topic page.
Every existing page must meet the enhanced content standard defined in Phase 2.

**Total scope:**
- 751 topic pages to build (across 30 hubs at 0% + 4 partially done hubs)
- 146 existing pages to enhance (Angular 55 + C# 41 + ASP.NET 33 + SQL 17)
- 1 component fix (TheoryBlock collapsed default)
- Estimated sessions: ~140 build sessions + ~20 enhancement sessions

---

## Current State (as of 2026-06-13)

| Hub | Live | Coming Soon | Status |
|---|---|---|---|
| Angular | 55 | 13 | Active — 13 remaining |
| C# | 50 | 9 | Active — 9 remaining |
| ASP.NET Core | 42 | 12 | Active — 12 remaining |
| SQL | 26 | 27 | Active — in-progress (Session B next) |
| TypeScript | 0 | 22 | Not started |
| JavaScript | 0 | 24 | Not started |
| React | 0 | 24 | Not started |
| HTML | 0 | 22 | Not started |
| CSS | 0 | 22 | Not started |
| Web Performance | 0 | 22 | Not started |
| Blazor | 0 | 23 | Not started |
| Node.js | 0 | 25 | Not started |
| Python | 0 | 23 | Not started |
| Go | 0 | 23 | Not started |
| DevOps | 0 | 22 | Not started |
| Containers/K8s | 0 | 23 | Not started |
| AWS | 0 | 22 | Not started |
| Azure | 0 | 23 | Not started |
| Linux | 0 | 21 | Not started |
| Terraform | 0 | 21 | Not started |
| Service Mesh | 0 | 21 | Not started |
| System Design | 0 | 26 | Not started |
| Architecture Patterns | 0 | 25 | Not started |
| Design Patterns | 0 | 39 | Not started |
| Security | 0 | 25 | Not started |
| API Design | 0 | 21 | Not started |
| Observability | 0 | 22 | Not started |
| MongoDB | 0 | 21 | Not started |
| Redis | 0 | 21 | Not started |
| GraphQL | 0 | 20 | Not started |
| Messaging/Kafka | 0 | 22 | Not started |
| DSA | 0 | 21 | Not started |
| Testing | 0 | 22 | Not started |
| AI/ML | 0 | 22 | Not started |

---

## Phase 0 — Component Fix (do this first, one session, ~30 min)

**TheoryBlock: starts collapsed by default — learners never see theory.**
Fix: `visible = signal(false)` → `signal(true)` in `shared/theory-block/theory-block.ts`.
This one change makes theory visible on all 146 existing pages immediately.

- [ ] **Fix TheoryBlock collapsed default** — change `signal(false)` to `signal(true)` in
  `src/app/components/shared/theory-block/theory-block.ts`. Build + verify.

---

## Phase 1 — Complete the Near-Done Hubs

These hubs are already wired and partially built. Completing them is the highest ROI
work — small number of pages to write, huge improvement to the user experience.

**Work one page at a time through this list. Research each topic before writing.**

### 1A — Angular hub (13 remaining) `src/app/components/angular/`

All topics already in the home, nav, and search. Just need the page files.
Write one per session in priority order:
- [ ] `advanced-forms` — Reactive forms deep-dive: FormArray, cross-field validation,
  async validators, custom ControlValueAccessor, typed forms (Angular 14+)
- [ ] `custom-directives` — Attribute directives, structural directives, exportAs,
  hostDirectives, directive composition API (Angular 15+)
- [ ] `custom-pipes` — Pure vs impure pipes, async pipe internals, creating transform pipes,
  pipe chaining, performance implications
- [ ] `server-side-rendering` — Angular Universal/SSR: hydration, transfer state,
  prerendering, App Shell, SEO benefits, pitfalls
- [ ] `pwa` — Service worker setup, manifest, offline strategy, push notifications,
  background sync, Angular Service Worker CLI
- [ ] `angular-animations` — trigger/state/transition, keyframes, query/stagger, route
  animations, AnimationBuilder for imperative animations

- [ ] `testing-components` — TestBed, ComponentFixture, fakeAsync/tick, signal testing,
  HttpClientTestingModule, harnesses
- [ ] `performance` — OnPush change detection, trackBy, defer blocks (Angular 17+), lazy
  routes, preloading strategies, zone.js-less
- [ ] `state-management` — NgRx Store vs Signals-based state vs lightweight services,
  ComponentStore, when to use each
- [ ] `micro-frontends` — Module Federation with Angular, independent deployment, shared
  libraries, routing across MFEs
- [ ] `angular-libraries` — Creating an Angular library: ng-packagr, secondary entry points,
  publishing to npm, peer dependencies
- [ ] `internationalization` — @angular/localize, $localize, ICU expressions, locale data,
  build-time vs runtime i18n
- [ ] `accessibility` — Angular CDK a11y: FocusTrap, LiveAnnouncer, HighContrastMode,
  RouterLink a11y, ARIA patterns, axe-core integration

After all 13 pages: update `progress.service.ts` angularTotal (currently 45 → 58),
confirm all cards `available: true` in home.ts, build.

---

### 1B — C# hub (9 remaining) `src/app/components/backend/csharp/`

Write one per session in priority order:
- [ ] `functional-csharp` — Result<T,E> pattern, OneOf discriminated unions, railway-
  oriented programming, FluentResults, avoiding exception-driven control flow
- [ ] `source-generators` — ISourceGenerator vs IIncrementalGenerator, SyntaxReceiver,
  output → compile, AutoMapper/Mapperly pattern
- [ ] `expression-trees` — Expression<Func<T>>, compiling to delegates, building dynamic
  queries (EF Core uses this), Visitor pattern on expression trees
- [ ] `dynamic-csharp` — dynamic keyword, ExpandoObject, DynamicObject, DLR, trade-offs
  vs generics, COM interop use case
- [ ] `channels` — System.Threading.Channels: bounded vs unbounded, producer/consumer
  pattern, backpressure, vs BlockingCollection<T>
- [ ] `iterators` — yield return mechanics, IEnumerable<T> deferred execution, iterator
  state machines (IL output), infinite sequences, LINQ pipeline laziness
- [ ] `regex` — Regex class, named groups, compiled regex, Regex.IsMatch vs Match vs
  Matches, source-generated Regex (.NET 7+), common patterns
- [ ] `reflection` — Type, MethodInfo, PropertyInfo, ActivatorCreateInstance, attribute
  reading, performance (caching vs dynamic), Reflection.Emit intro
- [ ] `unit-testing-advanced` — xUnit theories, Moq/NSubstitute, AutoFixture,
  FluentAssertions, test data builders, mutation testing with Stryker

After all 9 pages: update `csharpTotal` (currently 41 → 50), confirm all cards live, build.

---

### 1C — ASP.NET Core hub (12 remaining) `src/app/components/backend/aspnet/`

Write one per session in priority order:
- [ ] `minimal-api-advanced` — Route groups, typed results, endpoint filters, OpenAPI with
  Scalar, output caching, problem details middleware
- [ ] `output-caching` — OutputCache attribute, cache policies, cache tags, vary-by,
  distributed output cache with Redis
- [ ] `request-pipeline-advanced` — Endpoint routing internals, custom middleware ordering,
  IMiddlewareFactory, terminal middleware, short-circuit middleware
- [ ] `masstransit` — AddMassTransit setup, Consumers, Sagas (state machine), request/
  response, outbox pattern, RabbitMQ and Azure Service Bus
- [ ] `blazor-integration` — Hosting Blazor in ASP.NET Core, shared auth state,
  SignalR circuits, pre-rendering with data, streaming
- [ ] `aspnet-testing-advanced` — WebApplicationFactory, custom test server, integration
  test DB setup, Respawn, TestContainers, snapshot testing responses
- [ ] `microservices-patterns` — API Gateway with YARP, service discovery with Consul,
  health checks for orchestrators, resiliency with Polly v8
- [ ] `observability-aspnet` — OTel tracing (AddOpenTelemetry), custom spans, metrics
  with System.Diagnostics.Meter, structured logging, Application Insights
- [ ] `api-security-advanced` — API key auth, DPAPI, data protection API, certificate
  auth, token binding, refresh token rotation
- [ ] `http3-quic` — Kestrel HTTP/3, alt-svc header, QUIC transport, 0-RTT, TLS 1.3
- [ ] `native-aot` — Native AOT publishing, trimming, source generator compatibility,
  what breaks (reflection), when to use
- [ ] `aspire` — .NET Aspire AppHost, orchestration, service defaults, dashboard,
  integrations (Redis, Postgres, RabbitMQ), deployment to Azure

After all 12 pages: update `aspnetTotal` (currently 33 → 45), confirm all cards live, build.

---

### 1D — SQL hub (27 remaining) `src/app/components/data/sql/`

Continuing from Session A (17 live). Write one page at a time in the order below.
Research each SQL topic across both MSSQL (T-SQL) and PostgreSQL before writing —
every page must cover both dialects with explicit diff callouts.

**Next up — Functions + Core SQL**
- [ ] `string-functions` — LEN/TRIM/CONCAT/SUBSTRING/REPLACE/CHARINDEX, FORMAT,
  T-SQL vs PostgreSQL function names
- [ ] `date-functions` — GETDATE/NOW, DATEADD/INTERVAL, DATEDIFF/AGE, EXTRACT,
  AT TIME ZONE, date arithmetic
- [ ] `conditional-expressions` — CASE/WHEN, IIF (T-SQL), COALESCE, NULLIF,
  GREATEST/LEAST (PG), DECODE
- [ ] `set-operations` — UNION/UNION ALL, INTERSECT, EXCEPT/MINUS, set semantics
  vs bag semantics, ordering with set ops
- [ ] `null-handling` — NULL semantics, three-valued logic, IS NULL/IS NOT NULL,
  COALESCE, NULLIF, NULL in aggregations, NULL in JOINs
- [ ] Rewrites: `ctes` and `window-functions` (add dual dialect, depth)

**Schema & Objects + Programmatic**
- [ ] `constraints` — CHECK, UNIQUE, DEFAULT, NOT NULL, FK with ON DELETE CASCADE/
  SET NULL/RESTRICT, deferrable constraints (PG)
- [ ] `views` — Simple and complex views, updatable views, WITH CHECK OPTION,
  indexed/materialized views (MSSQL), materialized views (PG)
- [ ] `sequences` — CREATE SEQUENCE, NEXT VALUE FOR (T-SQL), nextval (PG), vs IDENTITY,
  gaps in sequences, restart/increment
- [ ] `triggers` — AFTER/INSTEAD OF triggers (T-SQL), BEFORE/AFTER/INSTEAD OF (PG),
  audit logging pattern, trigger pitfalls
- [ ] `dynamic-sql` — EXEC/sp_executesql (T-SQL), EXECUTE (PG), parameterisation,
  SQL injection in dynamic SQL, QUOTENAME
- [ ] Rewrites: `schema-design`, `stored-procedures`

**Transactions + Performance**
- [ ] `isolation-levels` — READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE,
  SNAPSHOT (MSSQL), phenomena (dirty/phantom/non-repeatable read)
- [ ] `locking` — Shared/exclusive/update locks, lock escalation, deadlocks,
  WITH (NOLOCK) dangers, SKIP LOCKED (PG), optimistic vs pessimistic
- [ ] `execution-plans` — Reading SSMS/EXPLAIN plans, seek vs scan, key lookup,
  hash/merge/nested loop joins, statistics, cardinality estimation
- [ ] `partitioning` — Table partitioning (T-SQL: partition functions/schemes,
  PG: declarative partitioning), partition pruning, partition switching
- [ ] `bulk-operations` — BULK INSERT/COPY, bcp, OPENROWSET, minimal logging,
  batching large INSERTs, staging patterns
- [ ] Rewrites: `transactions`, `indexes`, `performance`

**Advanced Features + Queries**
- [ ] `full-text-search` — Full-Text Index (T-SQL: CONTAINS/FREETEXT),
  tsvector/tsquery (PG), ranking, phrase search, vs LIKE
- [ ] `security-sql` — Row-level security (both), column-level permissions,
  GRANT/REVOKE/DENY, schemas as security boundaries, always-encrypted
- [ ] `json-features` — FOR JSON (T-SQL), JSON functions, jsonb (PG): @> operator,
  GIN indexes, JSON path queries, JSON aggregation
- [ ] `pivoting` — PIVOT/UNPIVOT (T-SQL), crosstab (PG), conditional aggregation
  as cross-dialect alternative, dynamic pivot
- [ ] Rewrite: `subqueries` (add correlated subquery depth, EXISTS vs IN, scalar subquery)

**Reference pages update + final wiring**
- [ ] Update all 9 reference pages with dual-dialect examples
- [ ] Update `sqlTotal` in progress.service.ts to 35
- [ ] Update CLAUDE.md Current State section

---

## Phase 2 — Enhance All Existing Pages (146 pages)

Work through existing pages one at a time. Re-read each page fully before enhancing —
understand what it covers, what's missing, then bring it up to the full standard below.
Every live page (Angular 55, C# 41, ASP.NET 33, SQL 17) must meet this standard.

### The Enhanced Content Standard

Each topic page must have ALL of the following:

**Theory block (currently 4 sections, 3–5 pts each):**
- Minimum 5–6 sections per topic
- Each section minimum 5–7 bullet points
- Each point: 2–3 sentences (state the rule, explain WHY, give a consequence or gotcha)
- Include inline `<code>` snippets within theory points for clarity
- Cover: the problem it solves, how it works, constraints/rules, when NOT to use,
  performance/gotcha implications

**Quiz (currently 4 questions):**
- 6–8 questions per page
- Mix of difficulty: 2 easy, 3 medium, 2–3 hard
- Hard questions should test edge cases and compiler/runtime behaviour, not just recall
- Each explanation: 2–3 sentences, not one

**Q&A (currently 4 entries):**
- 6–8 entries per page
- Include at least 2 "trap" questions (things candidates get wrong in interviews)
- Answers should use `<code>`, `<strong>`, `<ul>` for structure — not plain text walls

**New: Common Pitfalls section (missing entirely):**
- Add between Code Examples and Challenge (or before Quiz if no Challenge)
- 4–6 bullet points: each is a mistake real developers make, with why and the fix
- Format: `<strong>Wrong pattern</strong> + consequence → <strong>Correct pattern</strong>`

**Sidebar resources (currently most pages use DEFAULT):**
- Add page-specific SIDEBAR_MAP entry in `shared/page-sidebar/page-sidebar.ts`
- Minimum 2 resources per page: official docs + 1 of (blog/code/video)
- Prefer: Microsoft Docs, Angular.dev, MDN, official GitHub repos (dotnet/*, angular/*)
- badge: 'docs' for official docs, 'code' for GitHub, 'video' for YouTube, 'blog' for articles

**Reading time:**
- Recalculate after enhancement (most pages claiming 25 min read ~12 min actual)
- Formula: (theory words / 200) + (code tabs × 2) + (quiz count × 0.5) + (QnA count × 1)

### Enhancement order (one page per session, priority order)

**C# — enhance in this order (one page per session):**
- [ ] `csharp/generics` — add 2 theory sections, expand quiz to 8q, Q&A to 8, add pitfalls
- [ ] `csharp/linq` — LINQ is deep; add deferred execution, query syntax vs method syntax, expression trees
- [ ] `csharp/async-await` — ConfigureAwait, SynchronizationContext, ValueTask, CancellationToken patterns
- [ ] `csharp/generics` → `csharp/delegates-events` → `csharp/pattern-matching` → `csharp/records`
- [ ] Continue through all remaining C# pages in hub nav order

**Angular — enhance in this order (one page per session):**
- [ ] `angular/signals` — computed, effect, resource, linkedSignal; migration from RxJS
- [ ] `angular/change-detection` — OnPush, signal-based, ChangeDetectorRef, zone.js-less
- [ ] `angular/routing` — guards, resolvers, deferrable views, title strategy
- [ ] Continue through all remaining Angular pages in hub nav order

**ASP.NET Core — enhance in this order (one page per session):**
- [ ] `aspnet/middleware` — pipeline ordering, short-circuit, IMiddlewareFactory
- [ ] `aspnet/ef-core-basics` — tracking vs no-tracking, SaveChanges, concurrency
- [ ] Continue through all remaining ASP.NET pages in hub nav order

**SQL — enhance as new pages are written (dual-dialect standard from the start)**

---

## Phase 3 — Frontend Hubs

Build order chosen by market demand and learner overlap with existing Angular/React users.
**Before writing the first page of each hub:** run the pre-hub research step (see Session
Guidelines Step 2) — read home.ts, research current job market, add any missing cards.

### 3A — TypeScript hub (22 topics) `src/app/components/frontend/typescript/`

Hub home, wiring, and 22 coming-soon cards already exist.
**Pre-hub research step required** before page 1 — verify topic list against 2024–2025 TS
job requirements and add any missing cards to home.ts.
Accent: `#3178c6` (TypeScript blue). Search prefix: `ts-`. Progress key: `tsTotal`.
Write one page per session in this order:

- [ ] `ts-basics` — Type annotations, inference, `any` vs `unknown`, `never`, type assertions
- [ ] `ts-functions` — Parameter types, return types, optional/default/rest, overloads,
  `this` parameter, function type expressions
- [ ] `ts-interfaces-types` — interface vs type alias, structural typing, extends vs
  intersection (&), declaration merging, index signatures
- [ ] `ts-generics` — Generic functions, constraints (`extends`), generic interfaces,
  generic classes, default type params
- [ ] `ts-utility-types` — Partial, Required, Readonly, Pick, Omit, Record, Extract,
  Exclude, NonNullable, ReturnType, Parameters
- [ ] `ts-narrowing` — typeof, instanceof, in operator, discriminated unions, assertion
  functions, control flow analysis

- [ ] `ts-mapped-types` — `[K in keyof T]`, Readonly/Partial implementation, custom mapped
  types, `+/-` modifiers, key remapping with `as`
- [ ] `ts-conditional-types` — `T extends U ? X : Y`, infer keyword, distributive
  conditional types, built-in conditional utilities
- [ ] `ts-template-literal-types` — Template literal type syntax, string manipulation types,
  `Uppercase`/`Lowercase`/`Capitalize`/`Uncapitalize`
- [ ] `ts-decorators` — Experimental vs TC39 decorators, class/method/property/parameter
  decorators, metadata reflection, Angular/NestJS usage
- [ ] `ts-modules` — ES modules in TS, `import type`, module resolution strategies,
  path aliases in tsconfig, declaration files (`.d.ts`)
- [ ] `ts-tsconfig` — Strict mode flags, target/lib, moduleResolution, paths, composite
  projects, project references

- [ ] `ts-classes` — Access modifiers, abstract classes, parameter properties, static,
  override keyword, class implements interface
- [ ] `ts-enums` — const vs regular enums, string enums, reverse mapping, enum pitfalls,
  prefer union types over enums (when/why)
- [ ] `ts-advanced-patterns` — Builder pattern in TS, fluent API design, branded types,
  phantom types, opaque types
- [ ] `ts-react-typescript` — FC vs function declaration, event types, useRef<T>, custom
  hook typing, generic components, discriminated union props
- [ ] Reference pages: cheatsheet, interview-prep (already in home — build them)

Wiring checklist per CLAUDE.md: routes, nav block, search entries, breadcrumb labels,
sidebar entries, progress service (`tsTotal`), hub-home card flip.

---

### 3B — React hub (24 topics) `src/app/components/frontend/react/`

Accent: `#61dafb` (React blue), text on dark: `#20232a`. Search prefix: `react-`.


- [ ] `react-basics` — JSX, components (function), props, rendering, keys, fragments
- [ ] `react-hooks-core` — useState, useEffect, useRef, useContext, hook rules
- [ ] `react-hooks-advanced` — useReducer, useMemo, useCallback, useTransition,
  useDeferredValue, useId, custom hooks
- [ ] `react-forms` — Controlled vs uncontrolled, form events, React Hook Form basics,
  Zod validation integration
- [ ] `react-router` — React Router v6/7: createBrowserRouter, loader, action,
  useNavigate, useParams, Outlet, nested routes
- [ ] `react-context` — Context API, createContext, useContext, context splitting for
  performance, Zustand as a lighter alternative


- [ ] `react-state-management` — useState vs useReducer vs Zustand vs Jotai,
  when to pick each, derived state
- [ ] `react-tanstack-query` — useQuery, useMutation, stale-while-revalidate,
  cache invalidation, optimistic updates, prefetching
- [ ] `react-performance` — React.memo, useMemo, useCallback, Profiler, virtualization
  with react-window, concurrent features
- [ ] `react-patterns` — Compound components, render props, higher-order components,
  custom hooks as the modern pattern
- [ ] `react-typescript` — Typing props, events, refs, generic components, discriminated
  union props, ComponentPropsWithRef
- [ ] `react-testing` — Testing Library: render, queries, userEvent, MSW for API mocks,
  async testing, snapshot anti-patterns


- [ ] `react-nextjs` — App Router, Server Components, Client Components (`'use client'`),
  Server Actions, Suspense, streaming, layout.tsx
- [ ] `react-native` — View/Text/ScrollView, StyleSheet, Expo, React Navigation,
  New Architecture (Fabric + JSI)
- [ ] `react-hook-form` — register, handleSubmit, Controller, formState.errors,
  Zod + zodResolver, field arrays
- [ ] `react-animations` — Framer Motion: motion.div, animate, variants, layout animations,
  AnimatePresence, useSpring
- [ ] `react-security` — XSS prevention (dangerouslySetInnerHTML), CSP, auth patterns,
  CSRF in Next.js
- [ ] Reference pages: cheatsheet, interview-prep

---

### 3C — JavaScript hub (24 topics) `src/app/components/frontend/javascript/`

Accent: `#f7df1e` (JS yellow), text `#1a1a1a`. Search prefix: `js-`.


- [ ] `js-types-coercion` — Primitive types, typeof, loose vs strict equality,
  type coercion rules, truthy/falsy, the spec rules
- [ ] `js-closures` — Lexical scope, closure over variables (not values), IIFE,
  module pattern, memory and closure leaks
- [ ] `js-prototypes` — Prototype chain, `__proto__` vs `prototype`, Object.create,
  class syntax desugaring, `instanceof`, mixin patterns
- [ ] `js-this-binding` — call/apply/bind, arrow function `this`, method shorthand,
  class fields vs prototype methods, common `this` bugs
- [ ] `js-event-loop` — Call stack, task queue, microtask queue (Promises), setTimeout(0),
  queueMicrotask, requestAnimationFrame
- [ ] `js-modules` — ES modules (import/export), CommonJS (require), dynamic import(),
  module bundlers (Vite, Rollup), tree-shaking


- [ ] `js-promises` — Promise constructor, then/catch/finally, Promise.all/allSettled/
  race/any, error propagation, unhandled rejections
- [ ] `js-async-await` — async function, await, top-level await, error handling patterns,
  parallel vs sequential, async iterators
- [ ] `js-destructuring` — Array/object destructuring, default values, renaming, rest/spread,
  nested destructuring, function parameter destructuring
- [ ] `js-iterators-generators` — Iterator protocol, for...of, Symbol.iterator, generator
  functions (function*), yield, two-way communication
- [ ] `js-proxy-reflect` — Proxy traps (get/set/has/deleteProperty), Reflect API,
  Vue 3 reactivity model, revocable proxies
- [ ] `js-symbols-weakrefs` — Symbol(), well-known symbols (iterator/toPrimitive),
  WeakMap, WeakSet, WeakRef, FinalizationRegistry


- [ ] `js-dom` — querySelector, event delegation, MutationObserver, IntersectionObserver,
  ResizeObserver, custom events
- [ ] `js-fetch-xhr` — fetch(), Response, Request, Headers, AbortController, streaming
  responses, vs XMLHttpRequest
- [ ] `js-storage` — localStorage, sessionStorage, IndexedDB basics, cookies vs storage,
  quota and eviction
- [ ] `js-patterns` — Observer, pub/sub, mediator, strategy, module pattern — all in
  idiomatic modern JS without classes
- [ ] `js-performance` — Debounce/throttle, memoization, Web Workers, SharedArrayBuffer,
  Atomics, profiling in DevTools
- [ ] Reference pages: cheatsheet, interview-prep

---

### 3D — HTML hub (22 topics) `src/app/components/frontend/html/`

Accent: `#e34c26` (HTML orange). Search prefix: `html-`.


- [ ] `html-document-structure` — DOCTYPE, `<html lang>`, `<meta charset>`, `<head>` vs
  `<body>`, rendering pipeline, parse vs DOMContentLoaded
- [ ] `html-semantic-elements` — `<main>`, `<article>`, `<section>`, `<aside>`, `<nav>`,
  `<figure>`, `<time>`, `<address>` — when and why each
- [ ] `html-forms` — `<form>`, `<input>` types, `<label>`, `<fieldset>`, `<select>`,
  `<textarea>`, HTML5 validation attributes, constraint API
- [ ] `html-media` — `<img>` (srcset, sizes, loading=lazy, decoding=async), `<picture>`,
  `<video>` (controls, poster, track), `<audio>`, `<source>`
- [ ] `html-tables` — `<table>`, `<thead>`, `<tbody>`, `<th scope>`, `<caption>`,
  `<colgroup>` — accessibility requirements, when not to use tables
- [ ] `html-links-navigation` — `<a>` (href, rel, target, download), relative vs absolute
  URLs, `<link>`, `<base>`, fragment navigation, skip links


- [ ] `html-accessibility` — ARIA roles, aria-label vs aria-labelledby, aria-live, focus
  management, landmark roles, WCAG 2.1 checklist
- [ ] `html-head-metadata` — `<meta>` charset/viewport/description, Open Graph, Twitter
  Cards, canonical, `<link rel>` preload/prefetch/dns-prefetch
- [ ] `html-custom-elements` — Web Components: `<template>`, `<slot>`, shadow DOM,
  `customElements.define`, `HTMLElement` lifecycle callbacks
- [ ] `html-iframes-embeds` — `<iframe>` sandbox, srcdoc, allow, CSP frame-ancestors,
  `<embed>`, `<object>`, security implications
- [ ] `html-pwa-service-workers` — manifest.json, service worker lifecycle, Cache API,
  offline strategies, Background Sync, Push API
- [ ] `html-seo` — Structured data (JSON-LD), canonical URLs, robots.txt, sitemap.xml,
  Core Web Vitals meta tags, hreflang


- [ ] `html-performance` — Resource hints (preload/prefetch/preconnect), `loading=lazy`,
  critical rendering path, render-blocking resources
- [ ] `html-canvas-svg` — `<canvas>` 2D context API vs `<svg>` — use cases, text, shapes,
  gradients, animation approaches
- [ ] `html-apis` — Geolocation, Notifications, File API, Drag and Drop, Clipboard API,
  Web Share API — feature detection pattern
- [ ] Reference pages: cheatsheet, interview-prep

---

### 3E — CSS hub (22 topics) `src/app/components/frontend/css/`

Accent: `#264de4` (CSS blue). Search prefix: `css-`.


- [ ] `css-box-model` — content/padding/border/margin, box-sizing: border-box,
  collapsing margins, BFC, intrinsic vs extrinsic sizing
- [ ] `css-flexbox` — flex container (direction, wrap, justify-content, align-items,
  align-content), flex items (flex shorthand, order, align-self)
- [ ] `css-grid` — grid-template-columns/rows, fr unit, auto-fill vs auto-fit, named
  areas, implicit grid, subgrid (CSS Grid Level 2)
- [ ] `css-positioning` — static/relative/absolute/fixed/sticky, z-index stacking contexts,
  containing block, logical properties (inset-block/inline)
- [ ] `css-custom-properties` — CSS variables (--name: value), var(), fallback, scope,
  inheritance, updating via JS, design token patterns
- [ ] `css-responsive` — Media queries, container queries, fluid typography (clamp()),
  aspect-ratio, min()/max()/clamp(), logical properties


- [ ] `css-selectors` — Specificity calculation, :is/:where/:has/:not, combinators,
  attribute selectors, pseudo-elements (::before/::after/::marker)
- [ ] `css-typography` — font-family stack, variable fonts, text-wrap: balance/pretty,
  line-height units, font-display, optical sizing
- [ ] `css-animations` — @keyframes, animation shorthand, timing functions, will-change,
  prefers-reduced-motion, vs transitions
- [ ] `css-tailwind` — Utility-first philosophy, JIT mode, tailwind.config.ts, dark mode
  class strategy, cn()/clsx, component extraction vs @apply
- [ ] `css-transforms-3d` — translate/scale/rotate/skew, 3D transforms, perspective,
  transform-origin, GPU compositing layers
- [ ] `css-scroll-driven` — animation-timeline: scroll()/view(), animation-range, View
  Transitions API, no IntersectionObserver needed


- [ ] `css-modern-features` — @layer (cascade layers), @scope, color-mix(), oklch
  color space, nesting (native CSS), :has() selector
- [ ] `css-theming` — Dark mode (prefers-color-scheme + class toggle), CSS variable
  theming architecture, design token layers
- [ ] `css-architecture` — BEM, CSS Modules, CSS-in-JS (Emotion/styled-components),
  atomic CSS, when to choose each
- [ ] Reference pages: cheatsheet, interview-prep

---

### 3F — Web Performance hub (22 topics) — already detailed in home

Accent: `#16a34a` (green). Search prefix: `perf-`.
Batches: Core Metrics (CWV) → Loading → Runtime → Tooling → Reference.
Build in 3 sessions of ~6 topics each. (Detailed topic list is in home.ts.)

---

### 3G — Blazor hub (23 topics) — already detailed in home

Accent: `#5c2d91` (Blazor purple). Search prefix: `blazor-`.
Build in 3 sessions of ~7 topics each. (Detailed topic list is in home.ts.)

---

## Phase 4 — Backend Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 4A — Node.js hub (25 topics) `src/app/components/backend/nodejs/`

Accent: `#339933` (Node green). Search prefix: `node-`.

Batches guided by home.ts topic list (Foundations → HTTP & APIs → Async → Database →
Auth → Performance → Tooling → Reference). 3 sessions of ~7 topics each.

**Key pages to prioritise:**
- `node-architecture` (event loop deep-dive — most-asked Node interview topic)
- `express` (most common framework, foundational)
- `nestjs` (enterprise, increasingly required in job listings)
- `database-prisma` (most popular modern ORM)
- `auth-jwt-passport` (every production app needs this)

---

### 4B — Python hub (23 topics) `src/app/components/backend/python/`

Accent: `#3776ab` (Python blue). Search prefix: `py-`.

Batches guided by home.ts (Foundations → OOP → Web & APIs → Async → Data Science →
Tooling → Reference). 3 sessions.

**Key pages to prioritise:**
- `python-data-types` (foundational — dicts, lists, sets, tuples)
- `fastapi` (most demanded Python web framework 2024-2025)
- `pydantic` (ubiquitous in modern Python)
- `async-python` (asyncio — essential for FastAPI and modern Python)
- `celery-task-queues` (appears in most production job specs)

---

### 4C — Go hub (23 topics) `src/app/components/backend/go/`

Accent: `#00add8` (Go blue). Search prefix: `go-`.

Batches guided by home.ts (Foundations → Concurrency → HTTP & APIs → Data → Tooling →
Patterns → Reference). 3 sessions.

**Key pages to prioritise:**
- `go-fundamentals` (syntax, defer, multiple returns — most distinctive Go features)
- `goroutines` (core concurrency — Go's unique strength)
- `channels` (channel patterns — critical interview topic)
- `gin-framework` (most-required Go framework in job listings)
- `error-handling` (Go's error pattern — often tested in interviews)

---

## Phase 5 — Cloud & DevOps Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).
Build order: DevOps → Containers → AWS → Azure → Linux → Terraform → Service Mesh.

### 5A — DevOps hub (22 topics) `src/app/components/cloud/devops/`

Accent: `#ee5d25` (DevOps orange). Search prefix: `devops-`.
Key topics: GitHub Actions, Docker fundamentals, CI/CD pipelines, GitOps, ArgoCD,
SonarQube, container registries, deployment strategies (blue/green, canary).

### 5B — Containers/K8s hub (23 topics) `src/app/components/cloud/containers/`

Accent: `#326ce5` (Kubernetes blue). Search prefix: `k8s-`.
Key topics: Pods/Deployments/Services (foundational), Helm, RBAC, HPA, Network Policies,
Operators & CRDs, StatefulSets.

### 5C — AWS hub (22 topics) `src/app/components/cloud/aws/`

Accent: `#ff9900` (AWS orange). Search prefix: `aws-`.
Key topics: IAM (most tested), Lambda, VPC, EC2, S3, RDS, CloudFormation, CDK,
SQS/SNS, ECS/EKS, CloudWatch.

### 5D — Azure hub (23 topics) `src/app/components/cloud/azure/`

Accent: `#0089d6` (Azure blue). Search prefix: `azure-`.
Key topics: Entra ID, AKS, App Service, Azure Functions, Key Vault, Service Bus,
Bicep deep-dive, Monitor + App Insights.

### 5E — Linux hub (21 topics) `src/app/components/cloud/linux/`

Accent: `#fcc624` (Linux yellow). Search prefix: `linux-`.
Key topics: File permissions, process management, systemd, networking (ss/netstat/curl),
shell scripting, SSH, cron, logs.

### 5F — Terraform hub (21 topics) `src/app/components/cloud/terraform/`

Accent: `#7b42bc` (Terraform purple). Search prefix: `tf-`.
Key topics: State, modules, variables, remote backends, CI/CD integration,
Terratest, workspace patterns, security scanning.

### 5G — Service Mesh hub (21 topics) `src/app/components/cloud/service-mesh/`

Accent: `#466bb0` (Istio blue). Search prefix: `mesh-`.
Key topics: Istio architecture, mTLS, traffic management, circuit breaking, Kiali,
ambient mesh, Gateway API.

---

## Phase 6 — Architecture Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 6A — System Design hub (26 topics) `src/app/components/architecture/system-design/`

Accent: `#0f172a` (slate). Search prefix: `sysdesign-`.
Key topics: URL shortener (canonical beginner), rate limiter, distributed cache,
message queue, news feed, payment system, AI/ML system design.

### 6B — Architecture Patterns hub (25 topics) `src/app/components/architecture/arch-patterns/`

Accent: `#7c3aed` (violet). Search prefix: `arch-`.
Key topics: Microservices, event-driven, CQRS+Event Sourcing, DDD aggregates,
hexagonal architecture, strangler fig, saga pattern.

### 6C — Design Patterns hub (39 topics) `src/app/components/architecture/design-patterns/`

Accent: `#0369a1` (blue). Search prefix: `dp-`.
Largest hub — 39 topics. Build in 5 sessions of ~7 topics each.
Groups: Creational (6) → Structural (7) → Behavioral (9) → Enterprise (7) →
Principles (4) + Clean Architecture → Reference (3+).

### 6D — Security hub (25 topics) `src/app/components/architecture/security/`

Accent: `#dc2626` (red). Search prefix: `sec-`.
Key topics: OWASP Top 10, JWT security, OAuth 2.0 + OIDC, mTLS, secrets management,
supply chain security, threat modelling, SAST/DAST.

### 6E — API Design hub (21 topics) `src/app/components/architecture/api-design/`

Accent: `#0891b2` (cyan). Search prefix: `api-`.
Key topics: REST maturity model, OpenAPI 3.1, versioning strategies, gRPC, GraphQL
schema design, rate limiting, pagination patterns.

### 6F — Observability hub (22 topics) `src/app/components/architecture/observability/`

Accent: `#059669` (emerald). Search prefix: `obs-`.
Key topics: OpenTelemetry SDK setup, PromQL, Grafana dashboards, distributed tracing,
SLO/error budget design, alerting, chaos engineering.

---

## Phase 7 — Data Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 7A — MongoDB hub (21 topics) `src/app/components/data/mongodb/`

Accent: `#00ed64` (MongoDB green). Search prefix: `mongo-`.
Key topics: CRUD, aggregation pipeline, indexing, schema design patterns,
transactions, Atlas Search, time series collections.

### 7B — Redis hub (21 topics) `src/app/components/data/redis/`

Accent: `#dc382d` (Redis red). Search prefix: `redis-`.
Key topics: Data structures (string/hash/list/set/zset), persistence (RDB/AOF),
pub/sub, streams, Lua scripting, Redis Stack (JSON/Search/TimeSeries).

### 7C — GraphQL hub (20 topics) `src/app/components/data/graphql/`

Accent: `#e535ab` (GraphQL pink). Search prefix: `gql-`.
Key topics: Schema SDL, resolvers, DataLoader (N+1 fix), mutations, subscriptions,
Federation, persisted queries, error handling.

### 7D — Messaging/Kafka hub (22 topics) `src/app/components/data/messaging/`

Accent: `#231f20` (Kafka dark). Search prefix: `kafka-`.
Key topics: Producer/consumer, partitioning, consumer groups, offsets,
exactly-once semantics, Schema Registry, Kafka Connect, Kafka Streams.

---

## Phase 8 — Fundamentals Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 8A — Testing hub (22 topics) `src/app/components/fundamentals/testing/`

Accent: `#16a34a` (green). Search prefix: `test-`.
Key topics: Jest, TDD/Red-Green-Refactor, test doubles, Playwright, MSW,
contract testing (Pact), mutation testing, property-based testing.

### 8B — DSA hub (21 topics) `src/app/components/fundamentals/dsa/`

Accent: `#ea580c` (orange). Search prefix: `dsa-`.
Key topics: Big-O, arrays/strings, linked lists, stacks/queues, trees (BFS/DFS),
graphs, dynamic programming, sorting algorithms.
Each page: 2 code tabs (theory pattern + LeetCode-style problem with solution).

### 8C — AI/ML hub (22 topics) `src/app/components/fundamentals/ai/`

Accent: `#7c3aed` (violet). Search prefix: `ai-`.
Key topics: ML fundamentals, transformers, LLM fine-tuning, RAG pipeline,
prompt engineering, AI agents/tool use, vector databases, MLOps.

---

## Session Guidelines

**One page per session. Follow this order every time:**

### Step 1 — Research (do not skip)
Before touching any file, research the topic:
- What are the 5–8 core concepts a developer must understand?
- What are the 3–5 things that routinely cause bugs or interview failures?
- What does the official documentation emphasise?
- What real-world patterns and production code look like for this topic?
- Are there any concepts that belong on this page that aren't in the home.ts keyPoints yet?
Write down what you find. This shapes the entire page.

### Step 2 — Hub research (first page of a new hub only)
If this is the first page of a hub that has never had a live page:
- Read the hub home.ts in full
- Research the technology's current job market requirements (2024–2025)
- Identify any missing topic cards
- Add missing cards to home.ts (`available: false`) before writing anything
- Then proceed to Step 1 for the actual page

### Step 3 — Write the page (one page, all sections complete)
Do not move to the next topic until this page meets the full content standard:

**Theory block — minimum standard:**
- 5–6 sections covering the topic end-to-end
- Each section: 5–7 bullet points
- Each point: 2–3 sentences — state the concept, explain WHY it works that way,
  give a concrete consequence or gotcha
- Use `<code>` inline for identifiers, `<strong>` for emphasis
- Sections must cover: the problem it solves, how it works internally, the rules/
  constraints, edge cases, performance/gotcha implications, when NOT to use it

**Code tabs — minimum standard:**
- 4–5 tabs, each focused on one aspect of the topic
- Each tab: 30–70 lines of real, runnable, production-quality code
- Comments in code explain the WHY, not the what
- Last tab should show a real-world pattern (not just a toy example)

**Common Pitfalls (required section, add between code and challenge):**
- 4–6 pitfalls that real developers hit in production or interviews
- Format per pitfall: what goes wrong → why → correct approach
- Use `<code>` for the bad/good patterns inline

**Challenge:**
- Non-trivial — should require understanding the topic to solve, not just syntax
- Hints guide without giving away
- Solution is complete, clean, and production-quality

**Quiz — minimum standard:**
- 6–8 questions
- Difficulty spread: 2 easy (recall), 3 medium (application), 2–3 hard (edge case/gotcha)
- Hard questions should test: what happens when X meets Y, compiler/runtime behaviour,
  subtle difference between two similar things
- Each explanation: 2–3 sentences with the "why"

**Q&A — minimum standard:**
- 6–8 entries
- At least 2 "trap" questions (things people confidently get wrong)
- At least 1 "how does this work internally" question
- Answers use `<code>`, `<ul>`, `<strong>` — not plain text walls
- Each answer should be the kind of response that impresses in a technical interview

**Sidebar resources:**
- Add a page-specific entry in `shared/page-sidebar/page-sidebar.ts` SIDEBAR_MAP
- Minimum 2 resources: official docs link (badge: 'docs') + 1 of code/blog/video
- Prefer: official docs, official GitHub repos (dotnet/*, angular/*, etc.)

### Step 4 — Wire the page (all 8 checklist items)
1. [ ] Files created: `.ts`, `.html`, `.scss` in correct folder
2. [ ] Route added in `app.routes.ts` (lazy `loadComponent`)
3. [ ] Nav entry added in `app.html` (correct group, progress dot + check mark)
4. [ ] Search entry added in `services/search.service.ts`
5. [ ] Breadcrumb label added in `shared/breadcrumb/breadcrumb.ts`
6. [ ] Hub home card flipped to `available: true`
7. [ ] Sidebar entry added in `shared/page-sidebar/page-sidebar.ts`
8. [ ] Progress service `*Total` count updated

### Step 5 — Build
`npx ng build --configuration=production` must pass before marking the page done.
Known harmless warnings (ignore): Sass `lighten()`/`darken()` deprecation, bundle budget.

### Step 6 — Update this file
- Check off the completed page
- Update the Current State table counts
- Note anything discovered during research that should be added to a future page

---

**Dark mode rule (never break this):**
Always `:host-context(body.dark) { ... }` — NEVER `@media (prefers-color-scheme: dark)`.

**Model choice:**
- Regular topic pages: Sonnet (default — follows conventions reliably)
- Architecture decisions, debugging weird issues, new page type design: Opus briefly
- Single-file count/label fixes: Haiku

---

## Tech Debt

- [ ] Sass `lighten()`/`darken()` deprecation in `interview-prep.scss` and `null-safety.scss`
  → migrate to `color.scale()` or `color.adjust()`
- [ ] Bundle initial size ~947 kB vs 500 kB budget — raise budget in `angular.json`
  or defer more chunks
- [ ] `hub-home.scss` exceeds 16 kB component style budget
- [ ] CRLF/LF warnings on every commit — add `.gitattributes` with `* text=auto`

---

## Done History

- [x] 2026-06-13 — Market-gap topic additions across all 34 hubs (18 new coming-soon
  cards): NestJS, Gin, a11y, MassTransit, Functional C#, AI/ML System Design, Celery,
  K8s Operators, MongoDB Time Series, Azure Bicep, TanStack Query, React Hook Form,
  Next.js App Router, React Native, Symbols/Generators/Proxy/WeakMap (JS), Tailwind CSS,
  Scroll-Driven Animations, PWA/Service Workers, SEO/Meta, Kafka Connect, Schema Registry,
  Redis Stack, Supply Chain Security, Clean Architecture. README rewrite. Build passes.
- [x] 2026-06-13 — SQL hub Session A: 5 new Foundations topics + Core SQL rewrites.
  sqlTotal 12 → 17. Build passes.
- [x] 2026-06-12 — ASP.NET Core hub Phase 3: 9 parity practice/reference pages. Hub
  feature-complete at 33 topic + 9 reference = 42 total pages. Build passes.
- [x] 2026-06-12 — SQL hub scaffold: 26 live (12 topic + 9 reference + 5 Session A),
  orange theme #e05c00, full wiring.
- [x] 2026-06-12 — ASP.NET Core hub Phases 1–2 (all 6 batches): all 33 topic pages live.
- [x] 2026-06-11 — 8 advanced C# topics; C# 41 trackable topics / 50 cards live.
- [x] 2026-06-11 — ASP.NET Core hub Phase 1 scaffold.
- [x] 2026-06-11 — 12 practice/reference pages for Angular + C# hubs.
- [x] 2026-06 — All 33 C# topic pages, C# home redesign, playground links.
