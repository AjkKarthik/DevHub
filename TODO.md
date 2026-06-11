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
  - [ ] Phase 2 (topics 33, build in batches of ~5): Fundamentals: hosting-startup,
    middleware, routing, configuration, dependency-injection, logging, static-files ·
    Web API: controllers, minimal-apis, model-binding, filters, error-handling,
    openapi-swagger, api-versioning, http-clients, grpc · Data: ef-core-basics,
    ef-relationships, ef-performance, caching · Security: authentication, authorization,
    cors, rate-limiting, web-security, secrets · Quality: testing, background-services,
    signalr, health-checks, performance, deployment, aspire.
    Per topic: 3 files + route + nav link + search entry (`aspnet-<slug>`) + flip
    `available: true` on home card + breadcrumb label exists already.
    First trackable topic also needs: progress.service aspnetTotal/counts + nav progress
    branch in app.html + page-meta `tech="aspnet"` support check.
  - [ ] Phase 3: parity practice/reference pages (cheatsheet, errors, quiz, interview prep, …)
  - STATUS: Phase 1 complete; next session starts Phase 2 batch 1 (Fundamentals, 6 topics).

## Next Up

_(empty — promote from Backlog)_

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
- [ ] SQL hub (`/sql`)
- [ ] Node.js hub (`/node`)
- [ ] Follow the "Adding a whole NEW technology hub" playbook in CLAUDE.md for each.

## Backlog — improvements

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
