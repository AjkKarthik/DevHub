# DevHub TODO

Living backlog. Claude: pick tasks from **In Progress** first, then **Next Up**.
Move items between sections as work happens, and check items off as they complete.
Add newly discovered work here instead of leaving it only in chat.

## In Progress

_(nothing — last batch completed 2026-06-11)_

## Next Up

- [ ] ASP.NET Core hub (`/aspnet`) — card exists on hub home as "Soon"; natural next
  step after C#. MVC, Web API, Minimal APIs, middleware, DI, EF Core, auth.
- [ ] Sidebar data (SIDEBAR_MAP entries) for the 12 new practice/reference pages —
  they currently fall back to DEFAULT.
- [ ] C# home roadmap section: add a "⑦ Practice & Reference" group linking the new pages.

## Backlog — new technology hubs (hub-home cards are "Soon")

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

- [x] 2026-06-11 — 12 practice/reference pages both hubs (quiz, interview prep, patterns,
  decision guides, glossary, C# mini-projects/learning-paths) + dotnet CLI tab + full wiring
- [x] 2026-06-10 — C# cheatsheet & errors pages; search route fix; section-aware
  breadcrumb/footer/sidebar/nav/progress; dark-mode `body.dark` fix
- [x] 2026-06 — all 33 C# topic pages, C# home redesign, playground links
