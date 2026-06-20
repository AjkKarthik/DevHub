# CLAUDE.md — DevHub Project Guide

This file is the source of truth for how DevHub is built. **Read it before making changes.
Update it whenever a convention, structure, or wiring step changes** so any future session
can continue consistently.

**Task tracking lives in [TODO.md](TODO.md).** At the start of a session, read it to see
what's in progress / next up. As you work: move items to In Progress, check them off when
done (with date), and add any newly discovered tasks there. If a session ends mid-task,
record exactly where things stand under In Progress before stopping.

## What is DevHub

A free, hands-on learning hub for developers (Angular, C#, and more technologies coming).
Deployed to GitHub Pages. Each technology gets a "hub": a home page with filterable topic
cards, topic pages with theory/code/challenges/quizzes, and practice & reference pages.

- Repo: https://github.com/AjkKarthik/DevHub
- Work happens on the `development` branch; `main` is for releases/PRs.
- **Never commit or push unless the user explicitly asks.** Build first, report issues,
  wait for "commit".

## Tech stack & build

- Angular 22, **standalone components only** — no NgModules, imports go in the
  `@Component({ imports: [...] })` array.
- Signals everywhere: `signal`, `computed`, `effect` from `@angular/core`.
- SCSS per component. Global styles in `src/styles.scss`, app shell styles in `src/app/app.scss`.
- Build check: `npx ng build --configuration=production` — must pass before reporting done.
  Known harmless warnings: bundle budget exceeded, Sass `lighten()` deprecation.

## Directory layout

```
src/app/
  app.ts / app.html / app.scss      # shell: left nav, footer, breadcrumb, sidebar slots
  app.routes.ts                     # ALL routes (lazy loadComponent)
  services/
    progress.service.ts             # topic completion (localStorage key 'ng-learn-done')
    search.service.ts               # SEARCH_INDEX + Ctrl+K search
    dark-mode.service.ts            # toggles body.dark class
  components/
    hub-home/                       # DevHub landing page (tech cards, paths, footer)
    shared/                         # page-meta, quick-ref, theory-block, code-block,
                                    # challenge-block, quiz-block, qna-block, page-complete,
                                    # breadcrumb, page-sidebar, search, back-to-top
    angular/<topic>/                # Angular hub pages
    backend/csharp/<topic>/         # C# hub pages
```

Component class naming: Angular hub → `XxxComponent` or `XxxDemo`; C# hub → `CsharpXxx`.
Each page = 3 files: `<name>.ts`, `<name>.html`, `<name>.scss` in its own folder.

## Theming — section identity (CRITICAL)

| Hub | `$accent` | `$tint` | Dark accent | rgba accent |
|---|---|---|---|---|
| Angular | `#dd0031` | `#fff1f2` | `#ff5a76` | `rgba(221,0,49,…)` |
| C# | `#7c3aed` (dark `#6b21a8`) | `#f5f3ff` | `#a78bfa` | `rgba(124,58,237,…)` |
| ASP.NET Core | `#0e7490` (dark `#155e75`) | `#ecfeff` | `#67e8f9` | `rgba(14,116,144,…)` |
| SQL | `#e05c00` | `#fff7ed` | `#fdba74` | `rgba(224,92,0,…)` |
| TypeScript | `#3178c6` | `#eff6ff` | `#93c5fd` | `rgba(49,120,198,…)` |
| React | `#0ea5e9` (dark `#0284c7`) | `#f0f9ff` | `#67e8f9` | `rgba(14,165,233,…)` |
| JavaScript | `#f7df1e` (text `#854d0e`) | `#fefce8` | `#fde68a` | `rgba(247,223,30,…)` |
| CSS | `#264de4` | `#eff6ff` | `#93c5fd` | `rgba(38,77,228,…)` |
| Web Performance | `#16a34a` (dark `#15803d`) | `#f0fdf4` | `#86efac` | `rgba(22,163,74,…)` |

Define `$accent` / `$tint` at the top of every page SCSS. New page types are built once and
ported to the other hub by swapping these colors — structure/UX must stay identical.

**Dark mode: ALWAYS `:host-context(body.dark) { ... }` — NEVER
`@media (prefers-color-scheme: dark)`.** The site toggles dark via a class on `<body>`;
the media query caused a major rendering bug once already.

Section-aware shell pieces (already implemented, keep them in sync when adding a hub):
- Left nav: `.left-nav.section-csharp` class → purple hover/active (see `app.scss`)
- Sidebar: `page-sidebar.ts` host classes `section-angular` / `section-csharp`
- Footer text in `app.html` switches on `currentSection()`
- Breadcrumb section chip links to the hub home (`/angular` or `/csharp`)

## Hub CSS naming conventions (CRITICAL — never mix these across hubs)

Every hub has a fixed set of CSS class names. Using the wrong hub's class on a page is a
design bug — it breaks icon colors, section headings, and dark mode.

| Hub | Page wrapper | Section class | Icon class | Icon content | `tech=` in page-meta |
|---|---|---|---|---|---|
| Angular | `.ng-page` | `.ng-section` | `.ng-icon` | `A` | `angular` |
| C# | `.cs-page` | `.cs-section` | `.cs-icon` | `C#` | `csharp` |
| ASP.NET | `.asp-page` | `.asp-section` | `.asp-icon` | `ASP` | `aspnet` |
| SQL | `.sq-page` | `.sq-section` | `.sq-icon` | `SQL` | `sql` |
| TypeScript | `.ts-page` | `.ts-section` | `.ts-icon` | `TS` | `typescript` |
| React | `.react-page` | `.react-section` | `.react-icon` | `⚛` (atom — React's brand symbol) | `react` |
| JavaScript | `.js-page` | `.js-section` | `.js-icon` | `JS` | `javascript` |
| CSS | `.css-page` | `.css-section` | `.css-icon` | `CSS` | `javascript` (CSS pages share JS playground; no dedicated CSS fiddle) |
| Web Performance | `.perf-page` | `.perf-section` | `.perf-icon` | `⚡` | `javascript` (shares JS playground) |

### Icon pattern — exact HTML required

```html
<div class="page-header-icon <hub>-icon">CONTENT</div>
```

Rules:
- **Always two classes**: `page-header-icon` (global layout — 48×48, flex, border-radius)
  AND the hub icon class (colors). One without the other is wrong.
- **React uses ⚛, not text**: ALL React pages (including library pages like hook-form,
  native, animations) use the atom symbol `⚛` at `font-size: 1.8rem`. Never "React",
  "RHF", "RN", "FM", or "SEC" — those looked like labels not icons.
- **Other hubs use short text abbreviations**: "A" (Angular), "C#", "ASP", "SQL", "TS", "JS" —
  2–3 characters max, no emoji for these hubs.
- **Always the correct hub class**: React pages use `react-icon`, not `cs-icon` or `ip-icon`.
  C# pages use `cs-icon`. Never mix hub classes across hubs.

### Two icon visual generations (NEVER mix within a hub)

The global `src/styles.scss` now defines canonical icon styles for ALL hubs. Do NOT
override them in component SCSS unless something special is needed for that page.

**Solid fill** (Angular, C#, ASP.NET): accent bg, white text, `font-size: 1.4rem`.
- Angular: `background: #dd0031; color: #fff` — 48×48 square, `border-radius: 12px`
- C#: `background: #6b21a8; color: #fff` — pill shape, `padding: 0.4rem 0.8rem`
- ASP.NET: `background: #0e7490; color: #fff` — 48×48 square, `border-radius: 12px`
- If a component SCSS defines `background: $tint; color: $accent;` for the icon of these
  hubs — that is WRONG. It must be `background: $accent; color: #fff;` (solid fill).

**Light tint** (SQL, TypeScript, React, JavaScript): tint bg, accent-colored text.
- SQL, TS, JS: defined globally in styles.scss — usually no component override needed
- React: adds `font-size: 1.8rem` for the atom symbol; global already does this

**CRITICAL: inline `<code>` inside `.page-subtitle` ALWAYS uses light tint regardless of
hub fill pattern.** Example: `code { background: $tint; color: $accent; }`. Never use
`background: $accent; color: #fff;` for inline code — that produces solid red on code text.

**Padding within .ng-page / .cs-page etc. — must be consistent within a hub:**
Standard padding for Angular topic pages: `padding: 2rem 1.25rem 4rem;`
Standard padding for C# topic pages: `padding: 2rem 1.25rem 4rem;`
If a component SCSS defines `.ng-page` with DIFFERENT padding (e.g. `1.5rem 1.25rem 3rem`),
that creates visible inconsistency between pages. Keep all `.ng-page` padding identical.

### Nav home-link pattern

Every hub in `app.html` must follow this structure exactly:

```html
<a routerLink="/hub" ... class="nav-home-link">   ← standalone, outside nav-groups
  <span class="nl-text">🏠 Hub Home</span>
</a>

<div class="nav-group">
  <p class="nav-group-label">Foundations</p>    ← NO hub name label here
  <a routerLink="/hub/topic1" ...>…</a>
  …
</div>
```

**Never put the home link inside a `<div class="nav-group">`** — that creates a visible
section label above the home link (e.g. the "🅰️ ANGULAR" label bug). The home link
must be a standalone `<a class="nav-home-link">` before the first nav-group.

## Component rules by hub type

### Standard topic page (Angular, C#, ASP.NET, TypeScript, React, JavaScript)

Required: `app-page-meta`, `app-quick-ref`, `app-theory-block`, `app-code-block`,
`app-common-mistakes` (4–6 entries), `app-challenge-block`, `app-quiz-block`,
`app-qna-block`, `app-revision-card`, `app-page-complete`

Optional: `app-prerequisites` (intermediate/advanced only), `app-before-after` (old-vs-new
contrast only), `app-video-embed` (official video exists)

### SQL topic page (simpler structure — intentionally different)

Required: `app-page-meta`, `app-quick-ref`, `app-theory-block`, `app-code-block`,
`app-challenge-block`, `app-quiz-block`, `app-qna-block`, `app-page-complete`

**Omitted on SQL pages**: `app-common-mistakes`, `app-revision-card` — SQL pages use a
simpler structure by design (SQL is a data query language, not a programming language;
the interview-prep angle is lighter). Do NOT add these to SQL pages.

### Reference pages (cheatsheet, interview-prep, glossary, etc.)

**No `app-page-complete`** — reference pages are not trackable topics.
**No `app-revision-card`** — not applicable to reference material.
**No `app-common-mistakes`** — optional; only add if there's a meaningful pitfalls section.

Older hub reference pages (Angular, C#, ASP.NET) use bespoke layouts (`<div class="page">`,
`<div class="cs-cheatsheet">`, etc.) — these are intentionally customised for their tab/filter
UIs. Do not "standardise" them unless rewriting the page. Newer hub reference pages (SQL,
TS, React, JS) use the standard topic wrapper pattern.

## Topic page anatomy (language-topic pages like /csharp/generics)

Template order is fixed:
```html
<div class="cs-page">                       <!-- 860px max-width wrapper -->
  <div class="page-header-icon cs-icon">C#</div>
  <h1 class="page-title">…</h1>
  <p class="page-subtitle">…</p>
  <app-page-meta [readingTime]="25" difficulty="intermediate" since=".NET 6+" tech="csharp" />
  <app-prerequisites [items]="prerequisites" />          <!-- optional: intermediate/advanced only -->
  <app-quick-ref [items]="quickRef" />
  <app-theory-block [sections]="theory" />
  <section class="cs-section"><h2>Code Examples</h2><app-code-block [tabs]="codeTabs" /></section>
  <app-before-after [items]="beforeAfter" beforeLabel="Old" afterLabel=".NET 8+" />  <!-- optional -->
  <app-video-embed videoId="…" title="…" />              <!-- optional: official video only -->
  <app-common-mistakes [items]="mistakes" />             <!-- required: 4–6 entries -->
  <app-challenge-block [item]="challenge" />
  <app-quiz-block [items]="quiz" />
  <app-qna-block [items]="qna" />
  <app-revision-card [summary]="revision" />
  <app-page-complete route="csharp-<slug>" nextRoute="/csharp/<next>" nextLabel="<Next title>" />
</div>
```
Order is **Mistakes → Challenge → Quiz → QnA → RevisionCard → PageComplete**. Never reorder.
Optional components (prerequisites, before-after, video-embed) may be omitted when not applicable.

### Shared component data shapes (exact field names — common agent mistakes!)

- `RevisionSummary` (import `RevisionCardComponent, RevisionSummary` from
  `shared/revision-card/revision-card`):
  `{ oneLiner: string; mustKnow: string[]; interviewFocus: string[] }`
  — place after `app-qna-block`, before `app-page-complete`. Every page needs one.
  `mustKnow`: 5–7 bullets — core concepts. `interviewFocus`: 3–5 interview talking points.
- `CommonMistake` (import `CommonMistakesComponent, CommonMistake` from
  `shared/common-mistakes/common-mistakes`):
  `{ title: string; wrong: string; right: string; explanation: string }`
  — `wrong`/`right` are plain code strings (no HTML), rendered in `<pre><code>`. 4–6 entries.
  Place after Code Examples section, before `app-challenge-block`. Required on every page.
- `Prerequisite` (import `PrerequisitesComponent, Prerequisite` from
  `shared/prerequisites/prerequisites`):
  `{ label: string; route: string }` — `route` is the full path e.g. `/csharp/generics`.
  Optional `note` string input on the component. Place after `app-page-meta`, before
  `app-quick-ref`. Use on intermediate/advanced pages only (2–4 items max).
- `BeforeAfterExample` (import `BeforeAfterComponent, BeforeAfterExample` from
  `shared/before-after/before-after`):
  `{ title: string; before: string; after: string; note?: string; language?: string }`
  — `before`/`after` are plain code strings. Use `beforeLabel` / `afterLabel` inputs to label
  the contrast (e.g. `afterLabel=".NET 8+"`). Optional — only when old-vs-new contrast exists.
- `QnaItem`: `{ q: string; a: string }` — **NOT** `question`/`answer`
- `QuizQuestion`: `{ q: string; options: string[]; answer: number; explanation: string }`
  (`answer` is the index)
- `Challenge`: `{ title, language, description, hints, starterCode, solution }` —
  **NO `difficulty` field**
- `Challenge.language` / `CodeTab.language` include `'csharp'`
- `QuickRefItem.type` union: `'function'|'decorator'|'directive'|'pipe'|'class'|'interface'|
  'token'|'operator'|'hook'|'method'|'constraint'|'syntax'|'keyword'|'accessor'|'type'`
- `page-meta` with `tech="csharp"` auto-shows .NET Fiddle + SharpLab links — do not pass
  `[hidePlayground]`
- `challenge-block` auto-picks the playground from `Challenge.language`: `'csharp'` →
  ".NET Fiddle" button; anything else → Angular playground. `playgroundUrl` overrides.
- `app-video-embed` (shared/video-embed): two-step collapsed video accordion —
  click 1 on the "▶ Watch: <title>" toggle expands to the video THUMBNAIL (still no
  YouTube scripts); click 2 on the thumbnail's play button loads the youtube-nocookie
  iframe and plays. "Hide video" collapses + unloads. `<app-video-embed videoId="…"
  title="…" />` placed after the Code Examples section. Only embed official-channel
  videos with embedding enabled; prefer links in sidebar resources otherwise.
- Sidebar `Resource.badge` union: `'docs'|'video'|'blog'|'tool'|'code'` — use `'code'`
  (GitHub-dark badge) for GitHub repo/source links. Prefer official org repos
  (dotnet/*, angular/*) and reference apps (dotnet/eShop).

### TypeScript gotcha
In TS template literals containing C# code, escape interpolation: `\${x}` — otherwise JS
swallows it. (C# `$"{x}"` is safe; only `${` needs escaping.)

## Practice & Reference pages (exist in BOTH hubs — keep parity)

**Rule: any new page type added to one hub MUST be added to the other** with identical
structure/UX, only content + accent differ.

| Page | Angular route | C# route |
|---|---|---|
| Cheat Sheet (tabbed, searchable; has CLI tab) | `/angular/cheatsheet` | `/csharp/cheatsheet` |
| Common Errors (tag filter, bad/fix columns) | `/angular/errors` | `/csharp/errors` |
| Quiz Practice (setup→quiz→result phases) | `/angular/quiz-practice` | `/csharp/quiz-practice` |
| Interview Prep (difficulty+topic chips) | `/angular/interview-prep` | `/csharp/interview-prep` |
| Design Patterns (12 expandable cards) | `/angular/design-patterns` | `/csharp/design-patterns` |
| Decision Guides (8 comparison tables) | `/angular/decision-guides` | `/csharp/decision-guides` |
| Glossary (A–Z, search, see-also links) | `/angular/glossary` | `/csharp/glossary` |
| Mini Projects (4 walkthroughs) | `/angular/mini-projects` | `/csharp/mini-projects` |
| Learning Paths | `/angular/learning-paths` | `/csharp/learning-paths` |
| What's New | `/angular/whats-new` | 3 topic pages (`whats-new-9-10` etc.) |

## WIRING CHECKLIST — adding any new page (do ALL of these)

1. **Files**: `<folder>/<name>.ts|.html|.scss` under the correct hub folder.
2. **Route** in `app.routes.ts` inside the hub's `children` array (lazy `loadComponent`).
3. **Left nav** in `app.html` — add the link to the right `nav-group` (both hubs if parity
   page). Topic pages also get the done-check + difficulty dot:
   `@if(progress.isDone('csharp-<slug>')){…✓…}@if(diff('csharp-<slug>');as d){…nl-dot…}`
4. **Search index** in `services/search.service.ts`:
   - Angular pages: `route` = bare slug (e.g. `'glossary'`)
   - C# pages: `route` = `'csharp-<slug>'`
   - `search.ts` maps these to URLs: `csharp-` prefix → `/csharp/<rest>`, else `/angular/<slug>`.
   - These same keys feed the nav difficulty dots (`DIFF` map in `app.ts`).
5. **Breadcrumb labels** in `shared/breadcrumb/breadcrumb.ts` — `ROUTE_LABELS` (Angular)
   or `CSHARP_LABELS` (C#).
6. **Hub home card** in `angular/home/home.ts` or `backend/csharp/home/home.ts` ALL_TOPICS
   (title, route, badge, description, keyPoints). Update hero topic counts if changed.
7. **Sidebar data** (optional) in `shared/page-sidebar/page-sidebar.ts` SIDEBAR_MAP —
   C# pages use full-path keys (`'csharp/cheatsheet'`); legacy bare keys still work via
   fallback. Pages without an entry get DEFAULT.
8. **Progress totals** if a *trackable topic* page (has `app-page-complete`):
   `progress.service.ts` — `total` (Angular, currently 45) / `csharpTotal` (currently 33).
   Practice/reference pages are NOT counted.
9. **DevHub home** (`hub-home/hub-home.ts`) — **do this after EVERY page that flips a card
   to `available: true`**: update tech card `topics:` count, hero stat ("100+ Live Pages"
   → actual running total), What's New bar if a hub milestone is reached. Never skip this.
10. **Build**: `npx ng build --configuration=production` must pass.

## Adding a whole NEW technology hub (e.g. TypeScript, SQL, ASP.NET)

1. Pick an accent color + tint; add a column to the theming table above.
2. Folder: `components/<area>/<tech>/…` with `home/` first (copy the C# home pattern:
   signals filter, badge categories, roadmap).
3. Routes: new `{ path: '<tech>', children: […] }` block.
4. `app.ts` `currentSection()` — add the URL prefix; footer text in `app.html`.
5. Left nav block in `app.html` (`@if (currentSection() === '<tech>')`) + `.section-<tech>`
   class & colors in `app.scss`.
6. Breadcrumb: add to `TECH_SECTIONS` + a labels map; sidebar: host class + accent override;
   search: pick a route-key prefix (`<tech>-`) and extend `url()` in `search.ts`.
7. Progress service: add per-section count/total/pct; wire nav progress bar in `app.html`.
8. Hub-home: flip the tech card `available: true`, set route/topics; add to whatsNew + footer links.
9. Build all parity Practice/Reference pages over time (track in Current state below).

## Current state (update when it changes!)

- **Angular hub**: 58 trackable topics + 10 practice/reference pages (68 cards). Feature-complete.
  Progress: `total=58` in progress.service. All cards `available: true`.
- **C# hub**: 50 trackable topics + 9 practice/reference pages (59 cards). Feature-complete.
  Progress: `csharpTotal=50` in progress.service. Categories: Foundations, OOP, Modern, Data,
  Async, Safety, Advanced, What's New, Reference. All cards `available: true`.
- **ASP.NET Core hub**: 45 trackable topic pages + 9 practice/reference pages (54 total).
  Feature-complete. Search prefix `aspnet-`. Progress: `aspnetTotal=45` in progress.service.
  Teal theme `#0e7490`. All topics `available: true` in `backend/aspnet/home/home.ts`.
- **SQL hub**: 44 trackable topic pages + 9 practice/reference pages (53 total). Feature-complete.
  Orange theme `$accent: #e05c00`. Search prefix `sql-`. Progress: `sqlTotal=44` in progress.service.
  Nav groups: Foundations, Core SQL, Functions, Programmatic, Schema & Objects, Concurrency &
  Performance (+ Bulk Ops/Query Store/Statistics/FTS/Security/Connection Pooling), Advanced Queries,
  Design & Operations, Reference. Dual-dialect pattern: MSSQL (T-SQL) + PostgreSQL throughout.
  SQL pages use simpler structure: no `app-common-mistakes`, no `app-revision-card`.
- **TypeScript hub**: 20 trackable topic pages + 2 reference pages (22 total). Feature-complete.
  Blue theme `$accent: #3178c6`, dark `#93c5fd`. Search prefix `ts-`. Progress: `tsTotal=20` in progress.service.
  Nav groups: Foundations, Type System, Generics, Advanced Types, OOP, Tooling, Reference.
  CSS classes: `ts-page`, `ts-icon`, `ts-section`. All cards `available: true`.
- **React hub**: 17 trackable topic pages + 2 reference pages (19 total). Feature-complete.
  Sky-blue theme `$accent: #0ea5e9`, tint `#f0f9ff`, dark `#67e8f9`. Search prefix `react-`.
  Progress: `reactTotal=17` in progress.service. CSS classes: `react-page`, `react-icon`, `react-section`.
  Nav groups: Foundations, Hooks, State Management, Routing, Ecosystem, Performance, Patterns, Reference.
  React pages use `app-common-mistakes` but NOT `app-revision-card` (no PageComplete on reference pages).
  All 19 cards `available: true`.
- **JavaScript hub**: 22 trackable topic pages + 2 reference pages (24 total). Feature-complete.
  Yellow theme `$accent: #f7df1e`, tint `#fefce8`, dark `#fde68a`. Search prefix `js-`.
  Progress: `jsTotal=22` in progress.service. CSS classes: `js-page`, `js-icon`, `js-section`.
  Nav groups: Foundations, Functions & Scope, Objects & Prototypes, Arrays & Destructuring,
  Async, Browser & Modules, Patterns, Advanced, Reference. All 24 cards `available: true`.
  JS pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
- **CSS hub**: 22 trackable topic pages + 2 reference pages (24 total). Feature-complete.
  Blue theme `$accent: #264de4`, tint `#eff6ff`, dark `#93c5fd`. Search prefix `css-`.
  Progress: `cssTotal=22` in progress.service. CSS classes: `css-page`, `css-icon`, `css-section`.
  Icon content: `CSS`. `tech="javascript"` in page-meta (CSS pages share JS playground).
  Nav groups: Foundations, Layout, Visual, Responsive, Animation, Modern CSS, Reference.
  All 24 cards `available: true`. CSS pages use `app-common-mistakes` AND `app-revision-card`.
  Reference pages have no PageComplete. Challenge.language must be `'html'` or `'scss'` (no `'css'`).
- **HTML hub**: 23 trackable topic pages + 2 reference pages (25 total). Feature-complete.
  Orange theme `$accent: #e34c26`, tint `#fff7ed`, dark `#fb923c`. Search prefix `html-`.
  Progress: `htmlTotal=23` in progress.service. CSS classes: `html-page`, `html-icon`, `html-section`.
  Icon content: `&lt;/&gt;`. `tech="javascript"` in page-meta (HTML pages share JS playground).
  Nav groups: Foundations, Text & Media, Forms, Semantic & Accessibility, HTML5 APIs, Reference.
  All 25 cards `available: true`. HTML pages use `app-common-mistakes` AND `app-revision-card`.
  Reference pages have no PageComplete. Challenge.language must be `'html'` (not `'css'`).
- **Web Performance hub**: 0 trackable topic pages live (20 total planned) + 2 reference pages (22 cards total). In progress — Phase 3F.
  Green theme `$accent: #16a34a`, tint `#f0fdf4`, dark `#86efac`. Search prefix `perf-`. Route: `/performance`.
  CSS classes: `.perf-page`, `.perf-icon`, `.perf-section`. Icon content: `⚡` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Core Web Vitals, Rendering, Loading, Assets, JavaScript, Measurement, Reference.
  All topic cards `available: false` until pages are written. Progress: `perfTotal=20` in progress.service.ts.
  Pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete. Challenge.language: `'html'` or `'typescript'`.
  First page written: `core-web-vitals` (available: false still — flip to true when wiring that card).
- **Blazor hub**: 20 trackable topic pages + 3 reference pages (23 cards total). Feature-complete.
  Purple theme `$accent: #5c2d91`, tint `#f5f3ff`, dark `#c4b5fd`. Search prefix `blazor-`. Route: `/blazor`.
  CSS classes: `.blazor-page`, `.blazor-icon`, `.blazor-section`. Icon content: `🔥` at `font-size: 1.8rem`. `tech="csharp"`.
  Nav groups: Foundations, Components, Data & Forms, Routing, State & Services, Advanced, Reference.
  All 23 cards `available: true` in `frontend/blazor/home/home.ts`. Progress: `blazorTotal=20` in progress.service.ts.
  Blazor pages use `app-common-mistakes` AND `app-revision-card`. Reference pages (bunit, cheatsheet, interview-prep) have no PageComplete.
  Challenge.language: `'csharp'`. Pages with prerequisites: authentication, performance.
  Data properties use plain typed arrays (NOT signals) — same pattern as all other hubs.
- **Hub home**: Angular, C#, ASP.NET Core, SQL, TypeScript, React, JavaScript, CSS, HTML, and Blazor are `available: true`. Web Performance hub home exists at `/performance` but topic cards are `available: false`. Everything else "Soon".
- Progress totals: Angular 58, C# 50, ASP.NET Core 45, SQL 44, TypeScript 20, React 17, JavaScript 22, CSS 22, HTML 23, Web Performance 20, Blazor 20 (`progress.service.ts`).
- Hero stat: "375+ Live Pages".

## Working practices

**Token/credit economy (user is budget-conscious):**
- Content-first rule: scaffold a new hub ONLY when its first content batch ships in the
  same or next session. Never scaffold multiple empty hubs ahead of content.
- One content batch (~5-7 topic pages) per FRESH chat session — start new chats instead
  of continuing long ones; read this file + TODO.md and go.
- Write topic pages directly (no subagents for content — they have died mid-task and
  wasted quota). Build once per batch, not per file.
- Keep responses/output lean; skip exploratory reading when CLAUDE.md already answers it.

**Model choice (pick per session via /model to minimise cost):**
- Routine content batches & wiring (topic pages, cards, search/nav entries — recipe is
  fully defined in this file): **Sonnet** (claude-sonnet-4-6) — cheapest model that
  reliably follows the conventions. Default choice.
- Trivial edits (count updates, label fixes, single-file tweaks): **Haiku** is enough.
- Architecture decisions, debugging weird build/rendering issues, designing new page
  types or hubs, reviewing a large batch before commit: **Opus/Fable** — use briefly,
  then switch back.
- Review flow on a budget: the production build is the first reviewer (must pass);
  then a quick self-review of the diff in the SAME session (no extra context cost).
  Reserve a top-model review pass for big risky changes only, not routine batches.

- Build and report issues first; **commit/push only when the user says so**.
- Commit style: conventional (`feat(csharp): …`), bullet body, co-authored-by Claude line.
- When using subagents for content generation, ALWAYS include in the prompt: the exact
  data-shape field names above, the dark-mode rule, the accent colors, the `\${` escape
  rule, and "do NOT edit routes/app/shared files" (orchestrator wires those). Verify agent
  output compiles — agents have previously used wrong field names and the wrong dark-mode
  mechanism, and have died mid-task leaving partial files (check file existence + sizes).
- PowerShell is the shell; `python` is NOT installed. Bash tool is available for sed/grep.
- User's OS is in dark mode — visual bugs that "look dark" are usually the
  `prefers-color-scheme` mistake.
