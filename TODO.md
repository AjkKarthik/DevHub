# DevHub TODO

Living backlog. Claude: pick tasks from **In Progress** first, then **Next Up**.
Move items between sections as work happens, and check items off as they complete.
Add newly discovered work here instead of leaving it only in chat.

## In Progress

- [ ] **ASP.NET Core hub (`/aspnet`)** — multi-session effort. Plan:
  - Accent: teal `#0e7490` (dark `#155e75`, tint `#ecfeff`, dark-mode `#67e8f9`) —
    distinct from C# purple. Add to CLAUDE.md theming table when scaffolded.
  - Search route prefix: `aspnet-`; progress keys `aspnet-<slug>`.
  - [x] Phase 1 (scaffold) DONE 2026-06-11: home page (`backend/aspnet/home/`, 22 topic
    cards all `available: false`, roadmap) + shell wiring (route block, currentSection,
    nav section + teal colors, footer, breadcrumb ASPNET_LABELS, sidebar section-aspnet,
    search url() aspnet- prefix, hub-home card flipped available). Build passes.
  - [x] Phase 2 Batch 1 DONE 2026-06-11: 6 Fundamentals topics (hosting-startup, middleware,
    routing, configuration, dependency-injection, logging) — 18 files, full wiring:
    routes, nav+progress bar, search entries, home cards flipped, progress.service
    aspnetTotal/aspnetCount/aspnetPct, page-meta tech="aspnet" support. Build passes.
  - [x] Phase 2 Batch 2 DONE 2026-06-11: static-files (Fundamentals), controllers,
    minimal-apis, model-binding, filters, error-handling (Web API) — 18 files, full wiring:
    routes, nav Web API group, search entries, home cards flipped. Build passes.
  - [x] Phase 2 Batch 3 DONE 2026-06-12: openapi-swagger, api-versioning, http-clients, grpc — 12 files, full wiring: routes, nav, search, home cards flipped, sidebar entries. Build passes.
  - [x] Phase 2 Batch 4 DONE 2026-06-12: ef-core-basics, ef-relationships, ef-performance, caching — 12 files, full wiring: routes, nav Data group, search, home cards flipped, sidebar entries. Build passes.
  - [x] Phase 2 Batch 5 DONE 2026-06-12: authentication, authorization, cors, rate-limiting, web-security, secrets — 18 files, full wiring: routes, nav Security group, search, home cards flipped, sidebar entries. Build passes.
  - [x] Phase 2 Batch 6 DONE 2026-06-12: testing, background-services, signalr, health-checks, deployment, performance, aspire — 21 files, full wiring: routes, nav Quality group, search, home cards flipped, sidebar entries. Build passes. All 33/33 topics live.
  - [x] Phase 3 DONE 2026-06-12: 9 parity practice/reference pages — cheatsheet, errors, quiz-practice, interview-prep, design-patterns, decision-guides, glossary, mini-projects, learning-paths. Full wiring: routes, Reference nav group, search (9 entries), home cards (Reference badge + new group), breadcrumb labels, sidebar entries. Build passes.
  - STATUS: Phase 3 complete — ASP.NET Core hub has 33 topic pages + 9 reference pages (42 total). Hub is feature-complete.

## Next Up

- [ ] **SQL hub expansion** — rewrite all 12 existing topic pages (dual MSSQL+PostgreSQL examples,
  dialect-diff callouts) + write 23 new topic pages. Home restructured with 9 categories + 35 cards
  (DONE 2026-06-12). Execute in sessions:
  - [x] **Session A DONE 2026-06-13**: Foundations (5 new: rdbms-concepts, data-modeling,
    normalization, db-architecture, data-types) + Core SQL rewrites (basics, joins, aggregations).
    Full wiring: routes, nav (new Foundations group + renamed Core SQL group), search (5 entries),
    breadcrumb labels, sidebar entries (5), sqlTotal 12→17. Build passes.
  - [ ] **Session B**: Functions (3 new: string-functions, date-functions, conditional-expressions)
    + Core SQL (2 new: set-operations, null-handling) + Advanced rewrites (ctes, window-functions)
  - [ ] **Session C**: Schema & Objects (constraints, views, sequences + rewrite schema-design)
    + Programmatic (triggers, dynamic-sql + rewrite stored-procedures)
  - [ ] **Session D**: Transactions (isolation-levels, locking + rewrite transactions)
    + Performance (execution-plans, partitioning, bulk-operations + rewrite indexes, performance)
  - [ ] **Session E**: Advanced Features (full-text-search, security + rewrite json-features)
    + Advanced Queries (pivoting + rewrite subqueries)
  - [ ] **Session F**: Update reference pages with dual-dialect examples; update progress total
    to sqlTotal=35; update CLAUDE.md Current state
  - After each session: add routes to app.routes.ts, nav entries to app.html, search entries,
    breadcrumb labels, sidebar entries per the wiring checklist

## Backlog — new technology hubs (hub-home cards are "Soon")

- [ ] **Blazor hub (`/blazor`)** — build AFTER ASP.NET Core Phase 2 (its pages link back
  to ASP.NET hosting/DI/auth as prerequisites). Hub-home card added 2026-06-11 (frontend
  group, purple #5c2d91). ~20 planned topics: components & parameters, render modes
  (SSR/Server/WASM/Auto), data binding, event handling, component lifecycle, forms &
  validation, routing & navigation, layouts, dependency injection, state management,
  cascading values, templated components, JS interop, authentication & authorization,
  streaming rendering & enhanced navigation, error boundaries, performance (virtualize,
  prerendering), bUnit testing, deployment (WASM hosting), what's new (.NET 9-11 Blazor).
- [ ] TypeScript hub (`/typescript`) — types, generics, utility types, decorators, tsconfig
- [ ] JavaScript hub (`/javascript`) — ES2025, closures, event loop, modules, DOM/Fetch
- [ ] HTML hub (`/html`) — semantics, forms, accessibility, SEO
- [ ] CSS hub (`/css`) — Flexbox, Grid, animations, custom properties
- [x] SQL hub (`/sql`) — DONE 2026-06-12 (see Done section)
- [ ] Node.js hub (`/node`)
- [ ] Follow the "Adding a whole NEW technology hub" playbook in CLAUDE.md for each.

## Backlog — improvements

- [ ] **Resource enrichment (GitHub + video links)** — per-topic curated links in
  page-sidebar SIDEBAR_MAP `resources`: official GitHub repos (dotnet/runtime,
  dotnet/aspnetcore, angular/angular, source files for the topic), and official-channel
  YouTube *links* (badge 'video'). Batch ~10 topics per session. Prefer official
  channels (dotnet, Microsoft Developer, Angular) — stable, authoritative, no rot.
- [ ] **Video embeds on high-traffic pages** — use the `app-video-embed` lazy facade
  component (shared/video-embed). Embed only on: hub home pages, learning paths, top
  topics. Official channels only; youtube-nocookie domain (built into component).
  Verify embedding is enabled per video before adding.

- [ ] Flashcards mode (both hubs) — spaced-repetition style review of glossary/quiz content
- [ ] "C# vs TypeScript/Java" comparison page (once a second language hub exists)
- [ ] Per-page reading-progress indicator
- [ ] Quiz Practice: persist best scores in localStorage

## Tech debt

- [ ] Sass `lighten()` deprecation warnings (null-safety.scss and others) — migrate to `color.adjust`
- [ ] Bundle initial size exceeds 500 kB budget (769 kB) — consider raising budget or deferring
- [ ] `hub-home.scss` exceeds 16 kB component style budget
- [ ] CRLF/LF warnings on every commit — consider a `.gitattributes`

## Done (recent)

- [x] 2026-06-12 — **SQL hub** (`/sql`) complete: 12 topic pages (basics, joins, aggregations,
  subqueries, ctes, window-functions, indexes, transactions, schema-design, stored-procedures,
  performance, json-features) + 9 reference pages (cheatsheet, errors, quiz-practice,
  interview-prep, design-patterns, decision-guides, glossary, mini-projects, learning-paths).
  Full wiring: routes, nav (4 groups), search (21 entries), sidebar (21 entries + SQL_DEFAULT),
  breadcrumb, progress service (`sqlTotal=12`), hub-home card. Shared code-block + challenge-block
  extended with `'sql'` language. Orange theme `#e05c00`. Build passes.

- [x] 2026-06-11 — 8 advanced C# topics (reflection, iterators, regex, channels,
  unit-testing, expression-trees, dynamic, source-generators) + full wiring; C# now
  41 trackable topics / 50 cards; hub hero "100+ Live Pages"
- [x] 2026-06-11 — challenge-block playground now language-aware (C# → .NET Fiddle)
- [x] 2026-06-11 — hub-home Live Now carousel: white card fix + seamless loop
- [x] 2026-06-11 — ASP.NET Core hub Phase 1 scaffold (see In Progress for phases)

- [x] 2026-06-11 — Sidebar SIDEBAR_MAP entries for all 12 new practice/reference pages
- [x] 2026-06-11 — C# home roadmap "⑦ Practice & Reference" group
- [x] 2026-06-11 — 12 practice/reference pages both hubs (quiz, interview prep, patterns,
  decision guides, glossary, C# mini-projects/learning-paths) + dotnet CLI tab + full wiring
- [x] 2026-06-10 — C# cheatsheet & errors pages; search route fix; section-aware
  breadcrumb/footer/sidebar/nav/progress; dark-mode `body.dark` fix
- [x] 2026-06 — all 33 C# topic pages, C# home redesign, playground links
