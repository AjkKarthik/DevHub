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

## Phase 10 — Subtopic ("Learn Mode") pages

Deep-dive pages nested one level under a topic page, for "I read the topic page but still
don't really get it" learners. Locked in after a full pilot (`/angular/counter` — Signals &
Reactive State, all 6 subtopics) was built, wired, and browser-verified. See TODO.md's
Phase 10 section for the full rollout plan and the complete 836-page checklist to work
through — this section is just the exact wiring recipe, kept in sync as more get built.

### File layout & component naming

`components/<hub-area>/<topic-folder>/subtopics/<subtopic-slug>/<subtopic-slug>.ts|.html|.scss`
— a `subtopics/` folder inside the existing topic folder, one sub-folder per subtopic.
Class naming: `<PascalCaseSlug>Subtopic` (e.g. `EffectsSubtopic`, `ControlFlowSubtopic`).

### Required shared components (all in `components/shared/`)

- `page-meta/page-meta` (`app-page-meta`) — same as topic pages.
- `theory-block/theory-block` (`app-theory-block`) — **one single `theory: TheoryPoint[]`
  array, one `<app-theory-block [sections]="theory" />` call.** Do NOT split into multiple
  arrays with multiple `<app-theory-block>` calls — that renders several redundant stacked
  "Theory & Key Points" accordions. This was a real mistake caught in the pilot.
- `live-playground/live-playground` (`app-live-playground`) — collapsed-by-default,
  click-to-load StackBlitz embed (dynamic `import('@stackblitz/sdk')`, kept out of the main
  bundle). Inputs: `title` (required), `files: PlaygroundFile[]` (required, `{ path, content }`),
  `template` (default `'angular-cli'`), `openFile?`, `height` (default 480).
- `try-it/try-it` (`app-try-it`) — one `exercise: TryItExercise = { prompt, hint, solution }`.
  `prompt` and `hint` bind via `[innerHTML]` (they contain `<code>`/`<em>` tags); `solution`
  stays plain interpolation (rendered as literal code in `<pre><code>`).
- `misconceptions/misconceptions` (`app-misconceptions`) — `misconceptions:
  Misconception[] = [{ thought, reality }]`, 3 entries typical. Both fields bind via
  `[innerHTML]` — they contain `<code>`/`<strong>` tags.
- `subtopic-nav/subtopic-nav` (`app-subtopic-nav`) — prev/next pager + "back to topic
  overview" footer. Inputs: `topicLabel`, `topicRoute` (required), `prev?`, `next?`
  (`SubtopicLink | null`, default `null` — omit the input entirely on the first/last
  subtopic, the template handles a missing prev/next gracefully with a spacer).
- `subtopic-eyebrow/subtopic-eyebrow` (`app-subtopic-eyebrow`) — the "Topic › Subtopic" row
  at the top of the page. Inputs: `topicLabel`, `topicRoute`, `subtopicLabel` (all required).
  **Always use this component — do not inline the eyebrow markup/CSS.** It was copy-pasted
  into the first 3 pilot pages before being extracted; retrofitting is wasted work.

### Page template order (fixed — matches topic-page anatomy)

```html
<div class="ng-page subtopic-page">                     <!-- swap hub wrapper class per hub -->
  <app-subtopic-eyebrow topicLabel="…" topicRoute="/angular/<topic>" subtopicLabel="…" />
  <div class="page-header-icon ng-icon">A</div>
  <h1 class="page-title">…</h1>
  <p class="page-subtitle">…</p>
  <app-page-meta [readingTime]="…" difficulty="…" since="…" tech="…" />
  <app-theory-block [sections]="theory" />
  <section class="ng-section"><h2>See it run</h2><p>…</p>
    <app-live-playground title="…" template="angular-cli" openFile="…" [files]="liveDemoFiles" />
  </section>
  <app-try-it [exercise]="exercise" />
  <app-misconceptions [items]="misconceptions" />
  <section class="ng-section"><h2>Where this fits</h2><p>… links to what comes next …</p></section>
  <app-subtopic-nav topicLabel="…" topicRoute="/angular/<topic>" [prev]="{…}" [next]="{…}" />
</div>
```

No `app-page-complete` on subtopics — they are not counted in progress totals (the parent
topic page remains the trackable unit). No `app-quick-ref`, `app-common-mistakes`,
`app-challenge-block`, `app-quiz-block`, `app-qna-block`, `app-revision-card` — those belong
to the topic page, not its subtopics.

### Wiring checklist (do ALL of these per subtopic page)

1. **Files** as above.
2. **Route**: convert the topic's flat route entry in `app.routes.ts` into a parent with a
   `children` array (first child `path: ''` = the existing topic component), then add one
   child entry per subtopic (`path: '<subtopic-slug>'`, lazy `loadComponent`).
3. **Left nav accordion** — two separate edits, both required (a real gap: the first pilot
   subtopics on a SECOND topic silently had no toggle at all until this was caught):
   a. **`app.ts`**: add an entry to the `SUBTOPICS: Record<string, SubtopicNavEntry[]>` map
      (`{ label, route }[]`) keyed by the topic's route slug. The underlying logic —
      `toggleSubtopics()`, the collapsed-by-default `expandedTopics` signal, and
      auto-expand-on-direct-navigation (`autoExpandForCurrentUrl()`) — IS generic and needs
      no changes.
   b. **`app.html`**: the chevron toggle button + nested `<div class="nav-subtopics">` list
      is NOT rendered generically for every nav link — it must be added to THAT SPECIFIC
      topic's own `<a routerLink="/angular/<topic>">` entry, by hand, once per topic (copy
      the exact block from an existing topic like `counter` or `todo` and swap the route
      slug in the four `subtopicsOf('<slug>')` / `isSubtopicsExpanded('<slug>')` /
      `toggleSubtopics('<slug>', ...)` / button spots). Forgetting step (b) leaves the
      subtopic pages fully working and reachable by URL, but with **no visible way to find
      them from the nav** — verify the chevron actually appears next to the topic's own nav
      link, not just that the SUBTOPICS map has the entry.
4. **Breadcrumb**: the 4th-level crumb is already generic (`parentTopicRoute()` /
   `parentTopicLabel()` in `breadcrumb.ts`) — just add the subtopic slug → title mapping to
   the hub's labels map (`ROUTE_LABELS` for Angular, etc.). **Check for a slug collision
   first**: each hub's labels map is flat, keyed by last URL segment only — if a subtopic
   slug happens to match an unrelated EXISTING top-level topic's own slug elsewhere in the
   hub (e.g. `/angular/todo/route-guards` vs the real standalone `/angular/route-guards`
   page), a bare-key entry silently overwrites/collides with that page's label. `pageLabel()`
   already checks a composite `'<topic-slug>/<subtopic-slug>'` key first for 3-segment
   `/hub/topic/subtopic` routes before falling back to the bare key — use that composite
   form for the colliding
   entry instead of a bare one (real collision hit and fixed this way: `todo/route-guards`,
   `todo/custom-validators`).
5. **Sidebar**: add a **genuinely tailored** entry to `SIDEBAR_MAP` in `page-sidebar.ts`,
   keyed `'<topic-slug>/<subtopic-slug>'` — scoped `apis`/`related`/`tip`/`docs`/`gotchas` for
   THAT subtopic specifically (link `related` to the prev/next subtopics + the topic
   overview). **Leaving it on the generic DEFAULT is a real mistake caught during the
   pilot review — do not skip this.**
6. **Search index**: add an entry to `SEARCH_INDEX` in `search.service.ts` keyed
   `'<topic-slug>/<subtopic-slug>'` (Angular pages — no prefix needed; `search.ts`'s `url()`
   already falls through to `/angular/<route>` for unprefixed keys, confirmed working with
   nested slugs, no changes needed there).
7. **No progress/hub-home wiring** — subtopics are not trackable topics and are not hub-home
   cards. Skip WIRING CHECKLIST steps 6–9 above for subtopic pages.
8. **Build**: `npx ng build --configuration=production` must pass.
9. **Verify in browser** — do not just trust the build: nav accordion expands/collapses and
   auto-expands on direct navigation, breadcrumb shows all 4 levels, sidebar shows the
   tailored (not DEFAULT) content, playground loads (click-to-load StackBlitz iframe
   actually appears), dark mode renders correctly, prev/next footer nav is correct.

### Gotchas specific to subtopic pages

- **A literal void-element end tag (e.g. `</br>`) as bare TEXT in a `.html` template's own
  markup is parsed by the Angular compiler as an actual (invalid) end tag, not literal text**,
  and fails the build with `NG5002: Void elements do not have end tags "br"`. Confirmed via a
  real build failure on `/html/fundamentals`'s own `</br>` subtopic (2026-07-10) — the
  `page-subtitle` prose literally described the `</br>` mistake using the raw characters,
  which the HTML template parser tried to parse as a real tag. **Fix: HTML-entity-escape it**
  — `&lt;/br&gt;` — the same treatment as the pre-existing brace/`@word` gotchas below, just
  for a different trigger character sequence. Only applies to bare TEXT nodes in the `.html`
  file itself; the exact same raw `</br>` characters are completely safe inside a TS string
  field (`theory.points`, `misconceptions`, etc.) since those never pass through the template
  parser at all — confirmed by every OTHER occurrence in the same file's `.ts` needing no
  escaping.
- **Inside a `[innerHTML]`-bound TS string field (`theory.points`, `misconceptions.thought`/
  `.reality`, `try-it.prompt`/`.hint`), a literal raw HTML tag you intend to appear as VISIBLE
  TEXT (e.g. writing `<br>` or `<span>` to literally talk ABOUT that tag) is instead parsed
  and rendered as a REAL element** — an empty `<span>` renders invisibly, a bare `<br>` inserts
  an actual line break, silently swallowing the very text meant to describe it. Confirmed via
  two real instances caught during browser verification (not the build, which stayed green) on
  the same `/html/fundamentals` batch: a misconception's `reality` string discussing `<br>` and
  `<br></br>`, and another discussing `<span>` — both needed the standard `<code>&lt;br&gt;</code>`-
  style entity-escaping treatment already used everywhere else in the same files. **Fix: always
  wrap literal tag-name text meant for display inside `[innerHTML]`-bound fields in
  `<code>&lt;tag&gt;</code>`, exactly like every other reference to a tag name in this codebase**
  — never leave a bare `<tag>` as raw text there. This is the OPPOSITE of the `heading` field on
  the same `TheoryPoint` object, which binds via plain `{{ }}` interpolation (not `[innerHTML]`)
  and therefore must NOT use `<code>`/entity-escaping — raw literal characters display correctly
  as-is there (confirmed by a THIRD instance in the same batch: a `<code>&lt;br&gt;...</code>`-
  wrapped `heading` string rendered its own `<code>` tags and un-decoded `&lt;`/`&gt;` entities
  as ugly literal text, since interpolation never parses or decodes the string content at all —
  removing the `<code>`/entity-wrapping and using bare `</br>`-style characters directly, matching
  every other `heading` string in the same file, fixed it). **Net rule per shared-component field:
  `heading` (plain interpolation) → raw characters, no entities, no tags; `points`/`thought`/
  `reality`/`prompt`/`hint` (`[innerHTML]`) → wrap tag-name mentions in `<code>&lt;tag&gt;</code>`;
  `solution` (plain interpolation inside `<pre><code>`) → raw characters, no entities, no tags** —
  check which binding a shared component actually uses (grep its own `.ts` template) rather than
  assuming based on a sibling field in the same data shape.

- **A backtick-wrapped inline-code span containing an escaped shell single-quote, inside a
  single-quoted TS field, is a real string-termination trap distinct from the plain
  apostrophe-in-prose gotcha.** Confirmed via a real, self-caught bug during authoring
  (`/containers/storage`'s Released-PV subtopic, 2026-07-21): a `solution:` field (itself
  single-quoted, `'...'`) contained an inline code span meant to render `` `kubectl patch pv
  <name> -p '{"spec":{"claimRef":null}}'` `` — the trailing `\'` (the escaped closing shell
  quote, correctly escaped per the standard apostrophe rule) was immediately followed by ONE
  MORE stray, unescaped `'` left over from drafting — that extra unescaped quote closed the
  outer TS string right there, turning the rest of the sentence (`, which flips the PV's
  status...`) into loose, invalid syntax outside any string at all. This is mechanically the
  SAME root cause as every other delimiter-collision gotcha in this file (a delimiter
  character appearing literally where it isn't expected), but the fix here was not
  re-escaping — the extra character was a genuine typo, not a missing escape — caught only
  by a direct file re-read, not by the standard "grep for a bare `'` after a letter" sweep
  (the character before it was itself a `'`, not a letter). **Any subtopic field mixing
  inline code (backticks) with a quoted shell command inside it is worth a manual re-read of
  that specific line before building**, since the standard automated sweeps are tuned for
  apostrophes-after-letters and don't reliably catch a doubled/stray quote character next to
  another quote.

- **Literal `@word` text (anywhere — `<h1>`, `<p>`, `<code>`, etc.) in the `.html` template**
  must be escaped as `&#64;word` — writing a literal `@if`/`@defer`/`@placeholder`/etc. as TEXT
  CONTENT between tags is parsed by the Angular compiler as the start of a control-flow/defer
  block, not literal text, and fails with `NG5002: Incomplete block`. Confirmed via a real
  build failure on a topic with heavy `@defer` prose (multiple `<h1>`/`<h2>`/`<p>` misses,
  each caught by a separate build run) — **grep the whole `.html` file for `@[a-z]` before
  building**, do not rely on spotting it by eye. Two exceptions, confirmed safe unescaped by
  the same build: (1) **attribute/property-binding values** — `topicLabel="@defer — ..."`,
  `title="@defer basics"`, `[prev]="{ label: '...@defer...' }"` — never trip this, only bare
  text NODES do; (2) text inside a TS string field (theory `points`, misconceptions, etc.)
  bound via `[innerHTML]` is also safe as literal `@if`, since it never passes through the
  template parser at all. **Literal `{{ }}` text is a RELATED but DIFFERENT problem — the
  `&#123;`/`&#125;` HTML-entity trick does NOT work for it** (confirmed by a real build
  failure: `NG5002: Parser Error: Blank expressions are not allowed in interpolated strings`
  — entities decode too late to stop Angular's interpolation lexer, unlike the block-syntax
  parser which respects them). The correct fix, taken from the pre-existing `/angular/templates`
  page: use Angular's OWN interpolation with single-character string literals to render the
  braces — `{{ '{' }}{{ '{' }} {{ '}' }}{{ '}' }}` produces the literal visual text `{{ }}` at
  runtime. Needed on any subtopic that is itself ABOUT interpolation syntax.
- **A single literal `{...}` pair (not `{{ }}`) in ordinary prose text — e.g. describing a
  TypeScript template literal type like `on${string}` in a `<p>` or `<h1>`— also fails the
  build**, even though it's not `{{ }}` interpolation syntax. Confirmed via a real build
  failure (`NG5002: Unexpected character "EOF" (Do you have an unescaped "{" in your
  template? Use "{{ '{' }}") to escape it.)"`) writing a subtopic ABOUT a template-literal-type
  utility (`/typescript/mapped-types`'s `EventHandlers<T>` example, whose type is
  `on${string}`) — Angular's HTML parser treats a bare `{` as a potential ICU-expansion start
  regardless of whether a matching `}` appears later on the same text node. **Fix: HTML-entity
  escape the braces directly** — `&#123;` for `{` and `&#125;` for `}` (optionally `&#36;` for
  `$` too, though `$` alone is never the trigger) — e.g. `on&#36;&#123;string&#125;`. This is
  a DIFFERENT fix from the `{{ }}` case above (which needs Angular's own `{{ '{' }}`
  interpolation trick, since HTML entities decode too late for the interpolation lexer) —
  single braces use HTML entities; double braces need the interpolation trick. Grep for a
  bare `{` in prose text (not inside a bound attribute expression) before building any
  subtopic whose main page uses template literal types.
- **`${` inside a nested playground code string is a live double-escaping trap.** The
  `PlaygroundFile.content` fields are themselves TS template literals inside the subtopic's
  real `.ts` source file. If the nested playground code needs a literal `$` immediately
  followed by `{` — e.g. Angular interpolation for a price, `${{ item.price }}` — escape it
  as a SINGLE `\$` (not `\\\$`). `\$` evaluates to a literal `$` at runtime; `\\\$` evaluates
  to a literal `\$` (visible stray backslash — a real bug caught and fixed during the pilot).
  If instead you want the nested code's OWN template literal interpolation to survive (e.g.
  `` `Count: ${val}` `` inside the nested Angular component's own TS), that also needs
  `\${val}` — same single-backslash rule as the existing TypeScript gotcha above, just
  applied one level deeper because playground content is itself nested in a template literal.
- **Any playground demo importing a package beyond Angular core** (`@angular/material`,
  `@angular/cdk`, Chart.js, any third-party npm library) **must pass `[dependencies]`** to
  `app-live-playground`, e.g. `[dependencies]="{ '@angular/material': 'latest', '@angular/cdk':
  'latest' }"` (declared as a class field, same pattern as `liveDemoFiles`). The `angular-cli`
  StackBlitz template only ships Angular core + RxJS by default — without `dependencies`, any
  `import` from an uninstalled package fails to resolve in the embedded editor. This was missed
  on the first pass building the Angular Material topic (5 subtopics all needed the fix
  retroactively) — check whether a topic's demo code imports anything beyond `@angular/core`,
  `@angular/common`, `@angular/forms`, `@angular/router`, or `rxjs` BEFORE writing the
  `liveDemoFiles`, not after.
- **Long descriptive subtopic slugs can exceed the Windows/git `MAX_PATH` (260 chars) even
  though the `Write` tool succeeds.** A subtopic folder path is
  `C:\Users\...\DevHub\src\app\components\<hub-area>\<topic>\subtopics\<slug>\<slug>.ts` —
  the slug appears TWICE (folder + filename), so a ~90-character descriptive slug alone
  produces a ~290-character absolute path. The `Write` tool writes the file fine (Node's fs
  tolerates long paths), but `git add` then fails with `error: open(...): Filename too long`
  — this surfaces only at commit time, not at write time. Confirmed twice in one topic's
  batch (`/csharp/pattern-matching`, 2026-07-04): two of three subtopic slugs were long
  enough to trip this. **Fix**: keep the folder/file name short (~40 chars, e.g.
  `pattern-matching-ef-core-sql-translation`) while leaving the ROUTE URL itself as
  descriptive as normal in `app.routes.ts` — only the `loadComponent` import path needs to
  point at the short folder; the `path:` (URL segment) and every other wiring touchpoint
  (SUBTOPICS map, breadcrumb, sidebar, search index, nav labels) keep using the long,
  descriptive route string unchanged. Run `git add -A` before considering a subtopic batch
  done — a successful build does NOT catch this, only `git add` does.
- **A markdown-style inline-code backtick inside a `solution:` (or any backtick-delimited
  `content:`) TS template literal breaks the build with a confusing cascade of unrelated
  parser errors, not an obvious "unterminated string" message.** Confirmed via a real build
  failure (`/react/context`'s mega-context subtopic, 2026-07-08): writing `` destructuring
  only `theme` in ThemeDisplay's own code `` inside a `solution: \`...\`` block used a bare
  backtick around "theme" for emphasis (a habit carried over from writing prose in this same
  file's `misconceptions`/`theory` fields, which use SINGLE-QUOTED strings where a backtick
  is just a literal character) — the backtick prematurely closed the outer template literal,
  and everything after it was parsed as loose top-level code, producing unrelated errors like
  `TS2339: Property 'misconceptions' does not exist`, `TS2693: 'Misconception' only refers to
  a type`, and `Unexpected "]"` scattered across the rest of the class body — none of which
  point at the actual backtick. **Fix: never use backtick-wrapped inline code inside a
  `solution:`/`content:` field's own backtick-delimited string — use plain text or double
  quotes for emphasis instead** (backticks are completely safe inside the SINGLE-quoted
  `thought:`/`reality:`/`prompt:`/`hint:` fields elsewhere in the same file, since those use
  `'...'` not `` `...` ``, so this is specific to which delimiter a given field uses, not a
  blanket "no backticks in subtopic files" rule). Before trusting a "no errors" build result
  on a file with `solution:`/`content:` fields, a quick sanity check is comparing total
  backtick count per file is even (`grep -o '`' file | wc -l`) — odd catches the obvious case,
  but even-but-still-broken (two internal pairs) needs eyeballing each `solution:` block.
- **A straight apostrophe inside a single-quoted Angular binding string (`[prev]`/`[next]`
  label text) breaks template parsing the same way a stray backtick breaks a TS template
  literal — but the fix is different and it happens in the `.html` file, not the `.ts` file.**
  Confirmed via a real catch during authoring (`/react/typescript`'s discriminated-union
  subtopic, 2026-07-09): writing `[next]="{ label: 'Select's Runtime Coercion...' }"` — a
  literal possessive apostrophe in "Select's" — prematurely closes the single-quoted `label`
  string inside the double-quoted Angular attribute, the same category of bug as the
  backtick-in-template-literal gotcha above (a delimiter character appearing literally inside
  a string that uses that same delimiter). **Fix: use the typographic right single quote `’`
  (U+2019) instead of a straight apostrophe `'` for every possessive/contraction inside a
  `[prev]`/`[next]` label string** — this is already the established convention for every
  other apostrophe in subtopic titles/labels throughout the project (confirmed safe since
  `’` has no special meaning to the Angular expression parser), so the fix is consistency
  with existing labels, not a new pattern. This is the SAME root cause as the backtick
  gotcha (delimiter character leaking into delimited text) but manifests in `.html` files
  specifically in `[prev]`/`[next]`, `topicLabel`, `subtopicLabel`, and any other
  single-quoted-string-valued bound attribute — grep any new subtopic's bound attributes for
  a bare `'` immediately preceded by a letter (a possessive/contraction pattern) before
  building, the same way `@word` and brace gotchas are grepped for.
- **A new variant of the SAME delimiter-collision family, this time a literal DOUBLE quote
  inside a `[prev]`/`[next]` label string — caught and fixed BEFORE it ever reached a build**
  (`/linux/log-analysis`'s own first subtopic, 2026-07-24): a subtopic title quoting raw shell
  syntax (`sort -t"` ...) contains a literal `"` character. Since a subtopic's own title gets
  embedded verbatim as the `label:` value inside OTHER pages' `[prev]`/`[next]` bindings — and
  those bindings are themselves wrapped in DOUBLE quotes at the HTML-attribute level
  (`[prev]="{ label: '...', route: '...' }"`) — a bare `"` inside that label string prematurely
  closes the OUTER double-quoted attribute the moment the HTML parser reaches it, breaking the
  binding entirely (not merely mis-parsing an inner expression — the attribute itself
  terminates early). This is distinct from the single-quote/apostrophe case above precisely
  because it collides with the OUTER delimiter, not the inner one. **Fix: never use a literal
  `"` character in a subtopic title/label at all — rephrase to avoid it entirely** (there is no
  safe entity-escape or typographic-substitute equivalent to reach for here, unlike the
  apostrophe case, since the outer attribute itself is what's at risk). **New standing sweep
  step, add to the existing checklist**: `grep -rnE "label: '[^']*\""` against every new
  subtopic's `.html` files — a hit means some OTHER page's `[prev]`/`[next]` will embed a raw
  double-quote inside this page's own referenced title before it's ever written, so catch this
  by inspecting a subtopic's own H1/eyebrow title text for a bare `"` BEFORE creating any
  cross-page references to it, not just by sweeping the `.html` files after the fact.

### Non-Angular hubs (C#, SQL, Python, Go, etc.) — the "See it run" section has no live playground

`app-live-playground` embeds a StackBlitz project and only supports JS/TS-runnable
templates (`angular-cli` and similar) — there is no in-browser runtime for C#/.NET, SQL,
Python, or Go. Piloted on the C# hub's first subtopic set (`/csharp/basics`, 2026-07-03):
**drop `app-live-playground` and `PlaygroundFile` entirely** for these hubs. Replace the
"See it run" section with a plain `<app-code-block [tabs]="codeTabs" />` (the same
`CodeTab[]` shape and shared component every main topic page already uses) inside a
`<section class="cs-section"><h2>Code Examples</h2>...</section>` (swap the hub's own
section class). **No separate "run it" link needs to be added by hand** — `app-page-meta`
with `tech="csharp"` (or the hub's equivalent) ALREADY auto-renders the right external
run-it buttons (.NET Fiddle + SharpLab for C#) next to the reading-time/difficulty badges,
exactly as it does on every main topic page — confirmed rendering correctly in the pilot's
browser verification. This means a non-Angular subtopic page is one shared component
lighter than an Angular one: no `LivePlaygroundComponent`/`PlaygroundFile` import, no
`liveDemoFiles` class field, no dependency-injection concerns (no StackBlitz template to
configure). `TryIt`, `Misconceptions`, `SubtopicEyebrow`, `SubtopicNav`, `PageMeta`, and
`TheoryBlock` are all unchanged and still required.

### C# hub subtopic wiring — differs from Angular in three specific places

Confirmed by direct file inspection before the C# pilot (do this same check before any
OTHER non-Angular hub's first subtopic set — do not assume these conventions transfer
identically):
1. **Progress/search keys are `csharp-` PREFIXED** (`csharp-basics`), unlike Angular's bare
   `counter`. Nav `@if (progress.isDone('csharp-basics'))` / `diff('csharp-basics')` — but
   the **subtopic-accordion helper calls (`subtopicsOf`, `isSubtopicsExpanded`,
   `toggleSubtopics`) key off the BARE topic slug** (`'basics'`, not `'csharp-basics'`),
   because they index into `app.ts`'s single flat `SUBTOPICS` map shared across ALL hubs —
   don't prefix these three calls.
2. **`SUBTOPICS` map in `app.ts` has NO hub namespacing** — it's one
   `Record<string, SubtopicNavEntry[]>` keyed by bare route slug for every hub combined.
   This is a genuine collision risk, **hit for real** on 2026-07-04: ASP.NET's `routing`
   topic collided with Angular's PRE-EXISTING bare `routing` key (`/angular/routing`'s own
   subtopics, `custom-url-matchers-route-config` etc.) — `ng build` failed with
   `TS1117: An object literal cannot have multiple properties with the same name`.
   **Always grep for the exact bare key (unquoted AND quoted forms, e.g. both `routing:`
   and `'routing':`) across the ENTIRE file before adding a new hub's SUBTOPICS entry** —
   an `Edit` tool old_string match on a nearby anchor line succeeding does NOT mean the key
   itself is unique; the build's duplicate-key error is what actually caught this, not the
   grep-first check (which used the wrong quoting style and missed the existing entry).
   **Resolution applied**: hub-prefixed the COLLIDING entry only (`'aspnet-routing'`, not
   bare `'routing'`) rather than restructuring the whole map — Angular's existing bare
   `routing` key was left untouched. Every consumer of the colliding hub's key
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics` calls in that hub's own
   `app.html` nav block) must then use the SAME prefixed string, not the bare topic slug —
   this is hub-specific once a collision forces prefixing, unlike the normal (collision-free)
   case where these three calls key off the bare slug shared with `SUBTOPICS`. **Blazor
   also has its own `routing` topic** (`frontend/blazor/routing/routing.ts`, still bare
   `routing` if it ever gets subtopics) — since Angular already occupies bare `routing` and
   ASP.NET now uses `aspnet-routing`, Blazor's future subtopic entry must ALSO be
   hub-prefixed (e.g. `blazor-routing`) to avoid a three-way clash.
3. **`SIDEBAR_MAP` keys for ordinary C# topic pages are BARE** (`basics`, `oop`, `fields`),
   matching Angular — NOT hub-prefixed as an earlier reading of this file's own WIRING
   CHECKLIST step 7 implied. That `'csharp/cheatsheet'`-style full-path prefix is used ONLY
   by C#'s Practice/Reference pages (cheatsheet, errors, learning-paths, etc.), not regular
   topic pages — confirmed via `page-sidebar.ts`'s lookup fallback, which tries the full key
   first, then strips a leading `angular/`/`csharp/` and retries. **Subtopic sidebar keys
   follow the Angular convention exactly**: bare composite `'basics/<subtopic-slug>'`, no
   `csharp/` prefix.

### ASP.NET Core hub subtopic wiring — differs from C# in one specific place

Confirmed by direct file inspection before the ASP.NET pilot (`/aspnet/hosting-startup`,
2026-07-04) — do this same check before any other new hub's first subtopic set:
1. **`SIDEBAR_MAP` keys for ordinary ASP.NET topic pages are FULL-PATH PREFIXED**
   (`'aspnet/hosting-startup'`, not bare `'hosting-startup'`) — the OPPOSITE of the C# hub's
   bare-key convention. Confirmed via `page-sidebar.ts`'s `routeKey()` (the full URL path
   minus leading slash) and its lookup fallback, which only strips a leading `angular/` or
   `csharp/` prefix — **not** `aspnet/` — meaning a bare key would never be found for this
   hub. **Subtopic composite sidebar keys follow the SAME full-path convention**:
   `'aspnet/hosting-startup/<subtopic-slug>'`, not a bare `'hosting-startup/<subtopic-slug>'`.
2. Progress/search keys are `aspnet-` prefixed (`aspnet-hosting-startup`), same pattern as
   C#'s `csharp-` prefix. Breadcrumb `ASPNET_LABELS` map uses bare keys (`hosting-startup`),
   same as C#'s `CSHARP_LABELS` — composite subtopic keys there are bare too
   (`'hosting-startup/<subtopic-slug>'`), confirmed via the same generic composite-key-first
   lookup all hubs share in `breadcrumb.ts`. The nav accordion helper calls
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) key off the bare topic slug,
   exactly as in C# — this part of `app.ts`'s single flat `SUBTOPICS` map is unaffected by
   hub-specific sidebar/prefix differences.
3. Theme: ASP.NET subtopic pages use the hub's teal accent (`$accent: #0e7490`,
   `$tint: #ecfeff`) and the `.asp-page`/`.asp-icon`/`.asp-section` CSS classes (NOT C#'s
   purple/`.cs-page`), `tech="aspnet"` in `app-page-meta`. Icon content stays `ASP`.

### CRITICAL — check whether a hub's `.<prefix>-page` wrapper class is GLOBAL or LOCAL
before that hub's first subtopic set

Confirmed via a real, live bug found and fixed across the ENTIRE SQL hub (2026-07-08, after
all 44 SQL topics' subtopics were already built and pushed): Angular's, C#'s, and ASP.NET
Core's `.ng-page` / `.cs-page` / `.asp-page` wrapper classes (max-width: 860px; margin: 0
auto) are defined **globally** in `src/styles.scss` — global styles are NOT view-encapsulated,
so they apply to every component's template, including a separate subtopic component's. SQL's
`.sq-page` (and, discovered at the same time, TypeScript's `.ts-page`) are **not** in that
global list — each main topic page defines its own wrapper rule inside its OWN scoped
component stylesheet, which a separate subtopic component does NOT inherit.

The result: every SQL subtopic page (132 pages, all 44 topics) rendered **full-bleed,
uncapped width** on desktop viewports instead of the intended 860px reading column — verified
860px on the main topic page vs. 1033px+ on its own subtopics at a 1600px viewport — because
every subtopic's own `.scss` only ever defined `.subtopic-page { padding: ...; }` (per the
"Wiring checklist" below) and never redefined the wrapper's own `max-width`/`margin`.

**Before any new hub's first subtopic set**: grep `src/styles.scss` for that hub's
`.<prefix>-page` class. If it's NOT there (confirmed so far: SQL, TypeScript — check every
future hub before assuming either way), every subtopic `.scss` for that hub MUST include the
full wrapper rule, not just `.subtopic-page`'s padding — e.g. for SQL/TypeScript:
```scss
$accent: #e05c00;   // hub's own accent
$tint: #fff7ed;      // hub's own tint

.sq-page { max-width: 860px; margin: 0 auto; }   // ← the line that was missing on all 132 pages

.subtopic-page {
  padding: 2rem 1.5rem 4rem;
}
```
All 132 pre-existing SQL subtopic `.scss` files were bulk-fixed with this exact one-line
insertion (verified safe because every one of them had byte-for-byte identical content before
the fix) — if a similar gap is ever found on another hub, the same bulk-insert approach (find
the uniform stale pattern, verify every file matches it exactly, one bulk replace) is far
faster and safer than editing hundreds of files individually.

### TypeScript/JavaScript-family hubs — DO get a live playground, with a different template

Unlike the non-Angular hubs in the section above (C#, SQL, Python, Go — no in-browser
runtime), TypeScript and JavaScript run natively in a browser, so their subtopic pages use
`app-live-playground` fully, exactly like Angular's — just with StackBlitz's `'typescript'`
project template (confirmed valid via the SDK's own `PROJECT_TEMPLATES`, and confirmed
working end-to-end in the browser: `POST https://stackblitz.com/run?...&file=index.ts` → 200,
StackBlitz editor loads, console output appears) instead of `'angular-cli'`.

**Required: an `index.html` file in `liveDemoFiles`, even for pure-TypeScript examples with
no DOM interaction.** The `'typescript'` EngineBlock template expects an HTML entry point —
without one, the embedded editor loads with a visible "Import error, can't find file:
/index.html" banner (confirmed via a real browser screenshot during the TypeScript pilot,
`/typescript/basics`, 2026-07-08) even though the `.ts` file itself is present and correct.
Minimum working file set for a TS-only (no DOM) demo:
```ts
liveDemoFiles: PlaygroundFile[] = [
  {
    path: 'index.html',
    content: `<!doctype html>
<html>
  <head><title>…</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
  },
  { path: 'index.ts', content: `…` },
];
```
`openFile="index.ts"` in the `<app-live-playground>` tag (not `index.html`) still correctly
focuses the TS file in the editor on load — StackBlitz's file tabs work normally with this
setup, `console.log` output appears in StackBlitz's own Console tab (confirmed: a badge
showing the exact console.log call count appeared after loading).

### TypeScript hub subtopic wiring — differs from C#/ASP.NET in one place, confirms the rest

Confirmed via direct file inspection before the pilot (`/typescript/basics`, 2026-07-08):
1. **`app.ts`'s flat `SUBTOPICS` map had a real bare-key collision**: TypeScript's first
   topic slug, `basics`, was already taken by `/csharp/basics`. Grepped for `^  'basics':`
   before adding — found the C# entry — so this hub's entry is hub-prefixed as `'ts-basics'`
   or every future colliding TypeScript slug the same way, per the established
   collision-resolution pattern (`aspnet-routing` etc.). **The nav accordion helper calls
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) must then ALSO use `'ts-basics'`**,
   not the bare slug — unlike the normal (collision-free) case, once a slug is hub-prefixed in
   `SUBTOPICS`, every consumer of that key follows suit. Always grep the bare slug (unquoted
   AND quoted forms) across the whole file before adding — do not assume TypeScript topic
   slugs are collision-free just because this is the hub's first subtopic set.
2. **Progress/search keys are `ts-` PREFIXED** (`ts-basics`), confirmed via the existing nav
   markup (`progress.isDone('ts-basics')`) — this conveniently matches the SUBTOPICS map key
   chosen for the collision above, but that is a coincidence of this specific slug, not a
   rule; check the hub's actual prefix (`ts-` for TypeScript) independently.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'typescript/basics'`, not bare `'basics'`)
   — confirmed by finding the base entry ALREADY existed (unlike every SQL topic, which was
   consistently missing its base sidebar entry — TypeScript topics do not have this gap).
   Subtopic composite keys follow the same full-path convention:
   `'typescript/basics/<subtopic-slug>'`.
4. Breadcrumb `TYPESCRIPT_LABELS` map uses bare keys (`'basics'`), same as every other hub's
   own dedicated labels map — composite subtopic keys there are bare too
   (`'basics/<subtopic-slug>'`), confirmed via the same generic composite-key-first lookup
   every hub shares in `breadcrumb.ts`.
5. Theme: `$accent: #3178c6`, `$tint: #eff6ff`, `.ts-page`/`.ts-icon`/`.ts-section` CSS
   classes, `tech="typescript"` in `app-page-meta` (auto-renders a TypeScript Playground
   run-it link). Icon content stays `TS`. **`.ts-page`'s wrapper rule is NOT global — see the
   max-width gotcha above; every TypeScript subtopic `.scss` must include it.**

### JavaScript hub subtopic wiring — first subtopic set for this hub, no base sidebar entries existed at all

Confirmed via direct file inspection before the pilot (`/javascript/fundamentals`, 2026-07-09):
1. **No bare-key collision**: `fundamentals` was not already claimed anywhere in `app.ts`'s flat
   `SUBTOPICS` map — left as the bare key, unlike TypeScript/React's own first-topic slug
   collisions (both happened to be `basics`). Do not assume every new hub's first topic collides
   — always grep first, but the outcome varies per hub.
2. **Progress/search keys are `js-` PREFIXED** (`js-fundamentals`), confirmed via the existing
   nav markup (`progress.isDone('js-fundamentals')`).
3. **`SIDEBAR_MAP` had NO entry at all for ANY JavaScript hub topic** — not even a base entry
   for the main `/javascript/fundamentals` page, confirmed by grepping `'javascript/` with zero
   results anywhere in `page-sidebar.ts`. Every JS hub page was silently falling back to
   `DEFAULT` sidebar content before this. Added a tailored BASE entry (`'javascript/fundamentals'`)
   alongside the 3 required composite subtopic entries (`'javascript/fundamentals/<slug>'`),
   following the full-path convention established by React/TypeScript (the other newer hubs) —
   this fixes a real, pre-existing gap rather than just avoiding a new one. **Check whether a
   hub's main topic pages already have base sidebar entries before assuming DEFAULT fallback is
   an intentional, acceptable state** — for a hub with dozens of topic pages this is worth
   flagging to the user as a separate follow-up rather than silently fixing one page at a time.
4. Breadcrumb `JAVASCRIPT_LABELS` map uses bare keys (`'fundamentals'`), same generic pattern
   every hub shares — composite subtopic keys there are bare too (`'fundamentals/<slug>'`).
5. Theme: `$accent: #f7df1e`, `.js-page`/`.js-icon`/`.js-section` CSS classes, `tech="javascript"`
   in `app-page-meta`. **The JS hub's icon is SOLID FILL, not light tint** — despite
   `styles.scss`'s documented default for "SQL, TypeScript, React, JavaScript" being light tint,
   the actual `fundamentals.scss` uses `background: $accent; color: #1a1a1a;` (solid yellow bg,
   near-black text) — confirmed by reading the real file rather than trusting the earlier
   documented default. Dark mode: `background: #854d0e; color: #fde68a;`. **Always check the
   actual main-page `.scss` file for a hub's true icon convention before assuming the documented
   generation-pattern table applies** — it can be stale or the hub can be an exception.
   `.js-page`'s wrapper rule is NOT global (confirmed absent from `src/styles.scss`, same
   situation as SQL/TypeScript/React) — every JS subtopic `.scss` must include the full
   `.js-page { max-width: 860px; margin: 0 auto; }` rule.
6. Live playground: uses the same `'typescript'` StackBlitz template as the TypeScript hub
   (plain browser JS/TS, no framework needed) — `index.html` + `index.ts` minimum file set,
   `openFile="index.ts"`. A subtopic needing to compare strict vs. sloppy mode used
   `new Function(...)` with an ESCAPED NESTED template literal (`\`...\``) inside the outer
   `content: \`...\`` field — the Function constructor's body genuinely runs in sloppy mode
   even inside a strict-mode ES module, making it a real, working way to demonstrate both
   modes side by side in one file without needing a second StackBlitz project.
7. **Multi-file ESM playgrounds**: `/javascript/modules`'s subtopics (live bindings, module
   singletons, circular imports) needed genuinely SEPARATE files importing each other to
   demonstrate cross-module behavior — a single `index.ts` can't show this. `PlaygroundFile`
   supports adding extra `.ts` files (e.g. `counter.ts`, `store.ts`, `a.ts`/`b.ts`) alongside
   `index.html`/`index.ts` in the same `liveDemoFiles` array; StackBlitz's `'typescript'`
   template resolves the relative imports between them (`./counter.js` from `index.ts`, using
   the `.js` extension per ESM's own resolution convention even though the source is `.ts`)
   with no extra config needed. Confirmed working end-to-end in a live pilot.
8. **`/javascript/bundlers` drops the live playground entirely** — the FIRST plain-JS-hub
   topic (not React/Next.js/Native) to need this. Tree-shaking, `sideEffects` config, and
   `dependencies`/`devDependencies` are all build-time/npm-install-time concepts with no
   runtime behavior a browser JS console can demonstrate — there's no bundler process or
   `npm ci` step inside a StackBlitz `'typescript'` template. Same fallback as the
   non-Angular hubs and React's nextjs/native: drop `LivePlaygroundComponent`/`PlaygroundFile`,
   use `<section class="js-section"><h2>Code Examples</h2><app-code-block [tabs]="codeTabs" />
   </section>` instead, no `import { CodeBlockComponent, CodeTab } from
   '.../shared/code-block/code-block'` component swapped in for the live-playground imports.
   Check any future JS-hub topic for this same "is this actually runtime-observable in a
   browser?" question before assuming every JS/TS topic gets a live playground by default.

### React hub subtopic wiring — first JS-framework hub; a real StackBlitz template gap

Confirmed via direct file inspection and a live browser pilot before the first subtopic set
(`/react/basics`, 2026-07-08):
1. **`app.ts`'s flat `SUBTOPICS` map had a real bare-key collision**: React's first topic
   slug, `basics`, was already taken by `/csharp/basics`. Hub-prefixed to `'react-basics'`,
   per the established pattern — the three nav-accordion helper calls in `app.html`
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) all use `'react-basics'` too, not
   the bare slug. Always grep the bare slug (unquoted AND quoted) before adding a new hub's
   first SUBTOPICS entry — this is now the THIRD hub in a row (TS, and now React) whose first
   topic slug happened to be `basics`, already taken by C#.
2. Progress/search keys are `react-` PREFIXED (`react-basics`), confirmed via existing nav
   markup. `SIDEBAR_MAP` keys are FULL-PATH PREFIXED (`'react/basics'`, confirmed the base
   entry already existed) — subtopic composite keys follow suit: `'react/basics/<slug>'`.
   Breadcrumb `REACT_LABELS` uses bare keys (`'basics'`) with bare composite subtopic keys
   (`'basics/<slug>'`), same generic pattern every hub shares.
3. Theme: `$accent: #0ea5e9`, `$tint: #f0f9ff`, `.react-page`/`.react-icon`/`.react-section`
   CSS classes, icon content `⚛` at `font-size: 1.8rem` (not text — see the icon pattern
   rules above), `tech="react"` in `app-page-meta`. **`.react-page`'s wrapper rule is NOT
   global** (confirmed absent from `src/styles.scss`, same situation as SQL/TypeScript) —
   every React subtopic `.scss` must include the full `.react-page { max-width: 860px;
   margin: 0 auto; }` rule, not just `.subtopic-page`'s padding.
4. **React runs natively in the browser, so its subtopics use `app-live-playground` fully
   — but with a StackBlitz template neither Angular's nor TypeScript's own subtopic recipes
   cover.** `PROJECT_TEMPLATES` (from `@stackblitz/sdk`'s own type definitions,
   `node_modules/@stackblitz/sdk/types/constants.d.ts`) is a fixed union: `"angular-cli" |
   "create-react-app" | "html" | "javascript" | "node" | "polymer" | "typescript" | "vue"`
   — there is no `"react-ts"` or similar; **`"create-react-app"` is the correct template**
   for a plain-JS React demo. Confirmed working end-to-end in a live pilot (StackBlitz editor
   loaded with the correct file tree, no import-error banner) with this minimum file set in
   `liveDemoFiles`:
   ```
   package.json      — { dependencies: { react, react-dom, react-scripts }, scripts: { start } }
   public/index.html — <div id="root"></div>
   src/index.js       — createRoot(document.getElementById('root')).render(<App />)
   src/App.js         — the actual demo component
   ```
   Unlike the TypeScript-hub `'typescript'` template (which only strictly needed
   `index.html` + `index.ts`), the `create-react-app` template needs the FULL CRA-shaped
   file set including an explicit `package.json` — omitting it was not tested but is not
   worth risking given how cheap it is to include. `openFile` should point at `src/App.js`
   (the file readers actually care about), not `src/index.js` or `public/index.html`.
5. React demo files are `.js`, not `.ts`/`.tsx` — the main React hub's own topic-page code
   examples use `language: 'typescript'` (TSX) for the static `<app-code-block>` tabs, but
   the LIVE playground demos use plain JS to avoid needing TypeScript-specific CRA
   dependencies (`@types/react`, a `tsconfig.json`, etc.) that were never verified to work
   with this template. If a future React subtopic genuinely needs TypeScript in the live
   demo, verify a `.tsx` + `tsconfig.json` file set in this same template works before
   assuming it does — this was not tested in the pilot.
6. React subtopics can lean on ACTUAL RUNTIME behavior in a way most TypeScript-hub
   subtopics couldn't (those were largely static compile-error demonstrations) — e.g. a
   render-count `useRef` counter displayed in the UI, or typing into an input and clicking a
   button to observe a real DOM consequence. Prefer this where the main page's own claim is
   about runtime behavior (batching, reconciliation, memoization) rather than type-checking.
7. **Real npm packages (not stubs) work fine in the `create-react-app` template — just add
   them directly to the `liveDemoFiles` `package.json`'s own `dependencies` field.** Confirmed
   with `react-hook-form`, `@hookform/resolvers`, and `zod` (`/react/forms`, 2026-07-08) — no
   separate `[dependencies]` Angular-input mechanism needed, since a full `package.json` is
   already hand-written for every React subtopic (unlike Angular's `angular-cli` template,
   which auto-generates one). This is the OPPOSITE of the TypeScript hub's own established
   practice (declare-stub interfaces to avoid needing real `@types/react`/`zod` packages) —
   the difference is that TypeScript-hub subtopics only need to typecheck, while React-hub
   subtopics need to actually RUN the real library's behavior (e.g. Zod's real coercion
   rules, RHF's real re-render timing) to make a runtime claim demonstrable at all.
8. **Windows MAX_PATH risk is proportionally higher for the React hub** — its longer topic
   folder names (`hooks-advanced`, `context`, `state-management`) combined with descriptive
   subtopic slugs push paths close to 260 chars more often than shorter hub names did. From
   `/react/hooks-core` onward, default to a SHORT folder/file name (~30-45 chars) chosen
   BEFORE writing files, rather than the full descriptive slug — keep the full descriptive
   slug only in the route `path:` and every other wiring touchpoint, per the general MAX_PATH
   fix already documented above. Computing the exact planned path length with a quick shell
   check before `mkdir`/`Write` (not just before `git add`) avoids a rename cycle after the
   fact.
9. **StackBlitz's WebContainer npm install can transiently fail with "Can't find package"
   for a correctly-declared dependency, unrelated to the code.** Confirmed on `/react/router`'s
   `errorElement` subtopic (`react-router-dom` in `package.json`, 2026-07-09): the embed loaded
   the correct file tree and editor content, but the in-browser npm install step failed once
   with "Can't find package: 'react-router-dom'" and a "Retry Installer" button — a real
   StackBlitz-side transient (network/registry hiccup inside the WebContainer sandbox), not a
   version-pin or config problem, since the identical `package.json` shape (deps as direct
   entries, no separate `[dependencies]` input) had already worked for `react-hook-form`,
   `zod`, `zustand`, `@reduxjs/toolkit`, and `jotai` in prior subtopics with no issue. A second
   load attempt showed the same transient state; the underlying page (breadcrumb, sidebar,
   nav accordion, build) all verified correct independent of the sandbox demo itself. **Do not
   treat one StackBlitz install failure as a signal the `package.json`/dependency choice is
   wrong** — verify the static page and build first (those are deterministic), and treat the
   live sandbox as best-effort verification, retrying once before moving on. Also noted:
   `preview_screenshot` can time out while the WebContainer is actively installing packages
   (heavy CPU load in the iframe) — this resolves once the install finishes or the embed is
   collapsed again; it is a tooling/resource artifact, not a page bug.
10. **`/react/nextjs` is the first React-hub topic to drop the live playground entirely,
    falling back to a plain `<app-code-block>` "See it run" section** — confirmed via direct
    review before writing (2026-07-09): Next.js's core App Router APIs (Server Components,
    Server Actions, `revalidatePath`, file-based routing) require an actual Next.js server
    process. None of the StackBlitz project templates the shared `LivePlaygroundComponent`
    supports (`angular-cli`, `create-react-app`, `typescript`) can run one — `create-react-app`
    compiles a client-only SPA with no server runtime at all. Rather than fake the behavior
    with a client-only approximation (misleading) or risk an unverified `'node'`-template
    Next-dev-server embed (untested, high risk of a silently broken iframe), these subtopics
    follow the SAME "no live playground, plain code-block" pattern already established for
    non-browser-runtime hubs (C#/SQL/Python) — see that section above for the exact markup
    (`<section class="react-section"><h2>Code Examples</h2><app-code-block [tabs]="codeTabs" />
    </section>`, no `LivePlaygroundComponent`/`PlaygroundFile` import at all). The `TryIt`
    exercises for these subtopics also shift from "click a button and observe" to "predict the
    outcome, then read the explained reasoning" — appropriate since there's no runnable demo to
    click through. **Check any other planned React subtopic topic for this same server-only
    constraint before assuming `create-react-app` + real npm deps (the normal React-hub
    pattern) will work** — the deciding question is whether the page's core claims are about
    something that runs in a plain client-side React app, or something that only exists because
    an actual Next.js (or similar SSR framework) server process is involved.

### HTML hub subtopic wiring — first non-JS-family hub with its own live playground pattern

Confirmed via direct file inspection before the first subtopic set (`/html/document-structure`,
2026-07-10):
1. Progress/search keys are `html-` PREFIXED (`html-document-structure`), confirmed via existing
   nav markup. `SIDEBAR_MAP` keys are FULL-PATH PREFIXED (`'html/document-structure'`) — matching
   ASP.NET/TypeScript/React, not C#'s bare-key convention. **No base sidebar entry existed for
   `document-structure` before this** (same gap pattern as the JavaScript hub's first topic) —
   added one alongside the 3 composite subtopic entries.
2. Breadcrumb `HTML_LABELS` map uses bare keys (`'document-structure'`), composite subtopic keys
   are bare too (`'document-structure/<slug>'`) — the same generic pattern every hub shares.
3. **`.html-page`'s wrapper rule IS global** in `src/styles.scss` (confirmed: `.html-page {
   max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem 4rem; box-sizing: border-box; }`) —
   unlike SQL/TypeScript/React/JavaScript, so subtopic `.scss` files do NOT strictly need to
   redefine it, but included it anyway (harmless, matches the main topic page's own `.scss`
   pattern of redundantly re-declaring the global rule). Padding value is `2rem 1.5rem 4rem`
   (note: `1.5rem` horizontal, not JS hub's `1.25rem`) — confirmed from the real main-page `.scss`.
4. **Icon is LIGHT TINT** (`background: $tint; color: $accent;`), confirmed from the real
   `document-structure.scss` — matches the documented default table for this hub, unlike the
   JavaScript hub which turned out to be an exception. Icon content is the literal text `</>`.
5. `tech="javascript"` in `app-page-meta` (HTML hub shares the JS hub's external run-it links —
   PlayCode/CodePen — since there's no dedicated HTML-only playground service worth linking).
6. **Live playground uses the `'typescript'` StackBlitz template, but the DEMO'S OWN `index.html`
   IS the document under test** — a genuinely different pattern from every JS/TS-family subtopic
   before it. Where JS/TS subtopics always used a fixed, generic `index.html` shell plus a
   separate `index.ts` doing the actual demonstrated logic, HTML-hub subtopics whose claim is
   about HTML PARSING ITSELF (missing DOCTYPE, duplicate `<head>`, script loading order) instead
   write the INTERESTING markup directly into `index.html` (omitting the DOCTYPE entirely, adding
   a genuine second `<head>`/`<body>` pair, using real `<script defer>`/`<script async>` tags),
   with `index.ts` only doing the OBSERVATION (`document.compatMode`, `document.head.contains()`,
   `performance.now()` timestamps) rather than the demonstration itself. `openFile` in these cases
   points at `index.html` (not `index.ts`), since that's the file whose content the reader actually
   needs to see. Confirmed working end-to-end in a live pilot — StackBlitz's `'typescript'`
   template serves arbitrary plain `.js` files referenced by classic (non-module) `<script src>`
   tags without issue, alongside its usual ESM `.ts` module resolution.
7. No `SUBTOPICS` map bare-key collision for `document-structure` (checked, confirmed collision-free)
   — but this hub is entering a `SUBTOPICS` map already shared by 8+ other hubs, so the standard
   grep-before-adding discipline still applies to every future HTML-hub topic.

### Blazor hub subtopic wiring — first pilot; confirms the C#-hub "no live playground" pattern extends here, plus two new gotchas

Confirmed via a dedicated Explore-agent investigation before writing (`/blazor/fundamentals`,
2026-07-12) — do this same check before any other new hub's first subtopic set:
1. **`BLAZOR_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching every other
   hub's own dedicated labels map — composite subtopic keys there are bare too
   (`'fundamentals/<slug>'`).
2. **Progress/search keys are `blazor-` PREFIXED** (`blazor-fundamentals`), confirmed via
   existing nav markup. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'blazor/fundamentals'`,
   confirmed the base entry already existed) — subtopic composite keys follow suit:
   `'blazor/fundamentals/<slug>'`.
3. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic. Hub-prefixed to `'blazor-fundamentals'`,
   with the same `// NOTE:` comment pattern already used for the `html-fundamentals`/
   `css-fundamentals` collisions — the three nav-accordion helper calls in `app.html`
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) all use `'blazor-fundamentals'` too,
   not the bare slug.
4. **Blazor/.NET has no in-browser runtime — every subtopic dropped the live playground**,
   using `<app-code-block>` instead, matching the established non-Angular-hub pattern (C#, SQL,
   Python, Go). Content is grounded in documented .NET/Blazor framework behavior (expanding each
   of the main page's own mistake entries into its underlying mechanism), not empirical browser
   verification — there is no .NET runtime available to test claims against in this browser,
   unlike JS/TS/CSS/HTML hubs where `javascript_tool` can verify claims directly.
5. **A NEW variant of the raw-HTML-tag-as-text gotcha, specific to C#/Blazor generic syntax**:
   a C# generic type expression written as plain prose inside an `[innerHTML]`-bound field
   (e.g. `AddScoped<AuditLogBuffer>()` inside `exercise.prompt`) gets parsed by the browser as a
   literal `<AuditLogBuffer>` HTML tag — the same failure mode as mentioning a literal `<script>`
   tag in prose, just triggered by C# generic angle-bracket syntax (`SomeType<T>`) instead of an
   actual HTML tag name. Caught via `get_page_text` showing a sentence truncated mid-word exactly
   where the generic began — not caught by the build. **Fix: entity-escape any `SomeType<T>`
   generic syntax written as prose inside an `[innerHTML]`-bound field** (`exercise.prompt`/
   `.hint`, `misconceptions.thought`/`.reality`) — `AddScoped&lt;AuditLogBuffer&gt;()`. This is a
   standing rule for all future C#/Blazor (or any generics-heavy language) subtopic content, in
   addition to the pre-existing literal-tag-name rule. Code inside `codeTabs`/`solution` fields
   (plain interpolation, not `[innerHTML]`) is unaffected — generics there render as literal text
   correctly, confirmed by the same batch's `codeTabs` entries using `AddSingleton<T>()`,
   `List<T>()` etc. freely with no issue.
6. **A genuine build failure from a straight apostrophe inside a component's own single-quoted
   TS string field** (not a `.html` bound attribute) — `'...the scenario .NET 8's per-component...'`
   prematurely closed the string at the apostrophe in "8's", producing a cascade of unrelated
   parser errors (`TS2322`, `TS18004`, `TS1005`) far from the actual break, the same confusing
   error-shape pattern already documented for the backtick-in-template-literal and
   apostrophe-in-`.html`-bound-attribute gotchas. **Confirms the general rule extends to EVERY
   file type and EVERY single-quoted string field, not just the previously-documented `.html`
   `[prev]`/`[next]` attribute case** — any delimiter character (`'`, `` ` ``) appearing literally
   inside a string that uses that same delimiter breaks the string, regardless of whether it's a
   `.ts` field or a `.html` attribute. Fixed with `\'`. Before trusting a build that touches new
   prose content, grep for a bare `'` immediately preceded by a digit or letter in a
   possessive/contraction pattern across the WHOLE file (not just `.html` bound attributes) —
   the existing "grep before building" discipline was previously scoped too narrowly.
7. **VERIFY C# LANGUAGE/FRAMEWORK CLAIMS BEFORE WRITING, THE SAME AS EMPIRICAL JS/browser CLAIMS**
   — a real, confirmed inaccuracy was found and fixed on an ALREADY-PUBLISHED C# hub main page
   (`/blazor/data-binding`, 2026-07-12) during subtopic authoring: the page's "loop variable
   capture" mistake entry, matching quiz question, and code sample all described the classic
   `foreach` closure bug (every lambda sees the LAST loop value) as still a current Blazor
   problem — this was fixed at the C# LANGUAGE level for `foreach` specifically at C# 5.0
   (2012, per-iteration variable capture), and current Razor `@foreach` codegen matches that
   same semantics, confirmed via two research-agent verification passes before publishing
   anything. The genuinely still-current gotcha in the same area is `@key` and Blazor's
   diffing-by-position state misattribution when a list reorders — the main page's mistake
   entry, quiz, and code sample were all corrected to this instead. **Since there is no C#/.NET
   runtime available in this browser to empirically test claims against** (unlike JS/TS/CSS/HTML
   hubs where `javascript_tool` can verify directly), C#/Blazor/.NET topics need the equivalent
   discipline applied via targeted research-agent fact-checks BEFORE writing subtopic content
   that states a "still current" bug/behavior — especially for anything with a specific language
   version history, since docs/blog-post inertia repeats stale advice long after a language-level
   fix lands.
8. **A bare directive name used as the page's own SUBJECT (not just prose mentioning it) is a
   much higher-density source of the bare-`@word`-as-text gotcha than usual** — this batch's
   subtopic pages were literally ABOUT `@key` and `@bind:format`, so the directive name appeared
   bare in h1 titles and page-subtitles repeatedly, not just in one or two prose asides. The
   standard sweep caught most instances but missed one in a "Where this fits" paragraph on the
   first pass — for any subtopic whose OWN TITLE contains a bare `@directive`, run the sweep a
   second time on the fully-assembled batch (not just per-file while writing) before considering
   it clean.
9. **JS Interop topics are the one Blazor subtopic category where claims ARE empirically
   browser-verifiable** — since Blazor's JS interop crosses into real JavaScript APIs, claims
   about that JS-side behavior (e.g. `JSON.stringify()` throwing on circular references, dynamic
   `import()` never touching `window`) can and should be verified via `javascript_tool` in this
   browser before writing, exactly like JS/TS/CSS/HTML hub content — confirmed working on
   `/blazor/js-interop`, 2026-07-12. This is narrower than "all Blazor topics are unverifiable" —
   check whether a specific claim is about the JS SIDE of an interop boundary (testable here) or
   the C# SIDE (not testable without a .NET runtime) before defaulting to the no-verification
   pattern used for pure C#/.NET topics.
10. **A grep-based apostrophe sweep can produce a false negative** — on the same `/blazor/js-interop`
    batch, an initial sweep pass reported a file clean, but the build then failed on an unescaped
    apostrophe in "the first's function" inside a `solution` field. The exact cause of the missed
    match was not conclusively identified (a subtle shell-escaping interaction with the grep
    pattern used), but the practical lesson is: treat a clean grep sweep as a strong signal, not
    a guarantee — if the build still fails with the classic cascade of unrelated parser errors
    (`TS2322`, `TS18004`, `TS1005`, "Unexpected '.'" etc.) after a sweep reported clean, immediately
    suspect a missed apostrophe/backtick and re-run the sweep on the specific error line before
    assuming a different root cause.
10. **For claims about a specific framework MECHANISM (not just "is this still a bug"), verify
    against actual source code, not just doc prose — but treat a source-code-only finding as
    weaker than an official-docs-confirmed one, and don't publish the difference as fact.**
    Before writing `/blazor/error-handling`'s subtopics, a research agent read
    `ErrorBoundaryBase.cs` directly (dotnet/aspnetcore) to confirm `Recover()` never disposes or
    recreates the child component instance — only doable by reading the actual method body, since
    Microsoft Learn's prose never states this explicitly. A SEPARATE claim from the same research
    pass (that `OnAfterRenderAsync` exceptions ARE caught by ErrorBoundary, based on
    `NotifyRenderCompleted`/`HandleExceptionViaErrorBoundary` in `Renderer.cs`) came back
    source-code-corroborated but NOT confirmed by any official doc text — a follow-up research
    pass explicitly grepped the Learn docs and found zero mentions of `OnAfterRender` anywhere
    near "error boundary". Rather than publish a surprising, doc-uncorroborated claim resting
    solely on internal implementation detail (which can change across .NET versions without a
    doc update), that subtopic angle was dropped and replaced with the doc-confirmed
    Dispose/DisposeAsync-is-fatal angle instead — the same risky-claim self-correction discipline
    already used for the earlier `%2F` URL-routing claim, just triggered by a source-vs-docs
    confidence gap instead of a security-sensitivity judgment call.
11. **Backticks used as markdown-style inline-code emphasis inside a SINGLE-quoted TS string
    field (`theory.points`, `exercise.prompt`/`.hint`/`.solution`, `misconceptions.thought`/
    `.reality`) are technically SAFE to build** (backticks don't conflict with a `'...'`
    delimiter — this is the same rule already documented for the `solution`/`content`-field
    backtick-collision gotcha, just the safe side of it), **but is a house-style inconsistency
    every prior Blazor subtopic avoids** — confirmed by grepping prior batches, which uniformly
    write inline code mentions in these fields as plain text (`OwningComponentBase`, `AppDbContext`)
    with no backtick or `<code>` wrapping at all. Caught during the `/blazor/error-handling`
    sweep (backtick-parity check flagged an unexpectedly high count in one file) and removed for
    consistency — a build-passing sweep result doesn't mean the content matches house style, so a
    parity check surfacing an outlier count is worth a manual look even when it isn't a build error.

### Node.js hub subtopic wiring — first pilot, confirms conventions and settles the live-playground question

Confirmed via a dedicated Explore-agent investigation before writing (`/node/architecture`,
2026-07-14) — do this same check before any other new hub's first subtopic set:
1. **`NODE_LABELS` breadcrumb map uses bare keys** (`'architecture'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are
   bare too (`'architecture/<slug>'`).
2. **Progress/search keys are `node-` PREFIXED** (`node-architecture`), confirmed via existing
   nav markup. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'node/architecture'`, confirmed
   the base entry already existed) — subtopic composite keys follow suit:
   `'node/architecture/<slug>'`.
3. **No `SUBTOPICS` map bare-key collision** for `architecture` (checked, confirmed
   collision-free) — but this hub is entering a `SUBTOPICS` map already shared by 10+ other
   hubs, so the standard grep-before-adding discipline still applies to every future
   Node.js-hub topic.
4. **Nav accordion is INLINE in `app.html`**, not extracted into a separate `NodeNavComponent`
   the way Go/Redis/GraphQL/Messaging/Testing/DSA/AI hubs are — confirmed by finding the
   existing `@if (currentSection() === 'node')` block directly in `app.html`. Add the
   chevron+accordion pattern directly there, copying from an inline hub like Blazor's, not
   from a `*-nav.ts` component file.
5. **`.node-page` wrapper rule is NOT global** (confirmed absent from `src/styles.scss`, same
   situation as SQL/TypeScript/React/JavaScript/CSS) — every Node.js subtopic `.scss` must
   include the full `.node-page { max-width: 860px; margin: 0 auto; }` rule. Padding matches
   the main page's own `.scss`: `2rem 1.25rem 4rem`.
6. **Live playground: settled on NO live playground for this hub, matching the non-Angular-hub
   pattern (C#, SQL, Blazor)** — despite Node.js code being JavaScript/TypeScript syntactically,
   it is fundamentally SERVER-SIDE (event loop internals, libuv thread pool, `fs`/`dns`/`crypto`
   module behavior, Express servers) with no meaningful client-browser execution model.
   StackBlitz's SDK does expose a `'node'` project template in its `PROJECT_TEMPLATES` union
   (confirmed via the same source already cited for React's `create-react-app` discovery), but
   grepping the entire codebase found **zero prior usage anywhere** — genuinely untested. Rather
   than gamble the whole hub's first pilot on an unverified template, defaulted to the safe,
   proven `<app-code-block>` pattern (`tech="javascript"` in `page-meta` auto-renders
   PlayCode/CodePen run-it links, same as the JS/HTML/CSS hubs' external-link convention) — no
   `LivePlaygroundComponent`/`PlaygroundFile` import at all. If a future Node.js subtopic's core
   claim is genuinely observable via a runnable Node sandbox and worth the risk, verify the
   `'node'` template actually works in a live pilot page BEFORE committing to it hub-wide, rather
   than assuming it works from the SDK type union alone.
7. **No .NET-style runtime is available to empirically test Node.js/libuv internals claims
   either** — same verification discipline as C#/Blazor applies: research claims against
   official Node.js docs (nodejs.org) and libuv's own docs/source before writing subtopic
   content that states specific internal behavior (event loop phase mechanics, thread pool
   timing, per-function I/O routing) rather than assuming a plausible-sounding claim is
   correct. All three pilot subtopics (recursive `process.nextTick()` starvation,
   `UV_THREADPOOL_SIZE` initialization timing, `dns.lookup()` vs `dns.resolve()` thread-pool
   routing) were verified this way — one claim (`UV_THREADPOOL_SIZE` takes effect "before Node
   starts") needed a precision correction to "before the first thread-pool-requiring call,"
   since libuv creates the pool lazily on first use, not unconditionally at process boot.
8. **The two established apostrophe-escaping rules are file-type-specific, not interchangeable
   — mixing them up is a real, easy mistake.** During `/node/core-modules`, a `[prev]`/`[next]`
   label string in a `.html` file was written with a backslash-escaped apostrophe (`exec()\'s
   Default...`) — the rule that correctly applies to single-quoted `.ts` string fields — instead
   of the typographic `’` (U+2019) the `.html` bound-attribute case actually requires. Caught by
   manual review before the sweep, not by the sweep itself (the sweep's `[prev]`/`[next]`
   backslash-pattern check only looks for `\\'`, and a *correctly*-escaped `\'` doesn't trigger
   it — it's a valid escape, just for the wrong file type). Since Node.js subtopic content is
   plain JavaScript/TypeScript with no Razor `@`-directive risk at all, apostrophe-escaping is
   proportionally a LARGER share of the total gotcha surface for this hub than for Blazor/C# —
   worth double-checking which delimiter rule applies (`.ts` field → `\'`; `.html` bound
   attribute → `’`) rather than defaulting to whichever one was used most recently.
9. **A NEW variant of the delimiter-collision gotcha: bare straight-quote marks used as inline
   emphasis inside an already single-quoted `.ts` string field breaks the build the same way a
   stray apostrophe does — but this one isn't a possessive/contraction, so the "grep for a bare
   `'` after a letter" sweep pattern doesn't reliably catch it.** During `/node/logging`, a
   `theory.points` entry wrote `...illustration: 'headers.authorization' as a redact path...`
   — using bare `'` marks purely for emphasis (quoting a code term), not as an apostrophe — inside
   a field already delimited by `'...'`. The first `'` prematurely closed the string; everything
   after became loose, invalid syntax. Caught by manual review before the sweep (the string
   visibly "looked wrong" reading it back), not by the standard apostrophe grep, since the
   character immediately before the quote was a space/colon, not a letter. **Fix: never use bare
   quote marks for inline emphasis inside a single-quoted TS field — drop the quotes and rely on
   surrounding prose, or use backticks (safe inside a `'...'`-delimited string) instead.** Add a
   second sweep pattern going forward: grep for `: '` or ` '` followed later by another bare `'`
   mid-string (not just letter-adjacent) when a file discusses code identifiers/paths in prose.
10. **Grepping only the QUOTED form of a `SUBTOPICS` map key before adding a new entry misses a
    collision if the existing key was written unquoted.** JS/TS object literals allow bare
    identifier keys (`testing: [...]`) alongside quoted ones (`'testing': [...]`) — both compile
    to the exact same property, but they don't look alike in a grep for `'testing':`. Hit for real
    on `/node/testing`: Angular's own `testing` topic had been keyed as a bare, unquoted `testing:`
    (not `'testing':`) elsewhere in the same `SUBTOPICS` map; the standard quoted-form grep before
    adding `'testing':` for the Node.js hub came back clean, and the collision only surfaced as a
    `TS1117: An object literal cannot have multiple properties with the same name` build error.
    **Fix: grep for BOTH forms of a candidate key before adding — `'<slug>':` AND `\b<slug>:`
    (bare identifier followed by a colon)** — not just the quoted form this file's own established
    collision-checking guidance has focused on until now. Resolved the same way as every other
    collision: hub-prefixed the new entry (`node-testing`), left Angular's pre-existing bare
    `testing` key untouched, and updated only the Node.js hub's own three nav-accordion helper
    calls in `app.html` to the prefixed key.

### Python hub subtopic wiring — first pilot, confirms conventions and catches a stale CLAUDE.md note

Confirmed via a dedicated Explore-agent investigation before writing (`/python/fundamentals`,
2026-07-16) — do this same check before any other new hub's first subtopic set:
1. **`PYTHON_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are bare
   too (`'fundamentals/<slug>'`).
2. **Progress/search keys are `py-` PREFIXED** (`py-fundamentals`), confirmed via existing nav
   markup. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'python/fundamentals'`, confirmed the
   base entry already existed) — subtopic composite keys follow suit:
   `'python/fundamentals/<subtopic-slug>'`.
3. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked BOTH quoted and unquoted forms,
   per the collision-detection gap this same file documents from the `/node/testing` batch).
   Hub-prefixed to `'python-fundamentals'`, with the same `// NOTE:` comment pattern used for
   every other resolved collision — the three nav-accordion helper calls in `app.html`
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) all use `'python-fundamentals'` too,
   not the bare slug.
4. **Nav accordion is INLINE in `app.html`**, not extracted into a separate `PythonNavComponent` —
   confirmed by finding the existing `@if (currentSection() === 'python')` block directly in
   `app.html`, same pattern as Node.js/Blazor.
5. **CORRECTED A STALE NOTE IN THIS FILE'S OWN "Current state" SECTION**: the Python hub's page
   wrapper/section classes were previously documented here as `.python-page`/`.python-section` —
   this was WRONG. Direct inspection of the real `fundamentals.html`/`.scss` confirms the actual
   classes are **`.py-page`/`.py-icon`/`.py-section`** (the icon class was already correctly
   documented; only the wrapper and section classes were stale). **`.py-page`'s wrapper rule is
   NOT global** (absent from `src/styles.scss`) — every Python subtopic `.scss` must include the
   full `.py-page { max-width: 860px; margin: 0 auto; }` rule, padding `2rem 1.25rem 4rem`.
   **Lesson: a hub's own "Current state" summary in this file can itself be stale — verify
   against the real component files before trusting a documented class name, the same
   verify-before-recommend discipline that applies to any other kind of memory/documentation.**
6. **Icon is LIGHT TINT** (`background: $tint; color: $accent;`), content `🐍` at
   `font-size: 1.8rem` — confirmed matching the documented default and the real `.scss`.
   `$accent: #3776ab`, `$tint: #eff8ff`.
7. `tech="javascript"` in `app-page-meta` — confirmed via the real main page (not a copy-paste
   bug despite initially looking like one; `'python'` IS a valid value in `PageMetaComponent`'s
   own type union, but the template has no branch for it, so every one of the hub's 21 existing
   topic pages consistently uses `tech="javascript"` instead, matching the CSS/HTML hubs' own
   "share the JS playground" convention) — subtopic pages should match this existing, consistent
   hub-wide choice, not "fix" it to `tech="python"` unilaterally.
8. **No in-browser Python runtime** — every subtopic uses `<app-code-block>`, matching the
   established C#/SQL/Blazor/Node.js pattern; no `LivePlaygroundComponent`/`PlaygroundFile`
   import.
9. **A genuine rendering bug, distinct from every previously-documented gotcha**: writing a
   literal `\n` (backslash-n) inside a plain single-quoted `.ts` string field (a `TryItExercise
   .solution`) to represent "insert a line break here" in the rendered prose does NOT work the
   way a template literal's `\n` would — a bare `\\n` (double-backslash-n, needed to survive the
   JS string literal's own escaping) renders as the LITERAL two characters `\n` visible to the
   reader, not an actual line break, since `solution` binds via plain interpolation (no HTML
   parsing to convert anything). Caught by direct browser inspection after the build (the build
   itself does not catch this — it's valid TS, just semantically wrong output). **Fix: never try
   to force a line break inside a single-quoted prose field this way — rephrase with punctuation
   (a comma, an em dash, "then") instead of relying on an embedded newline escape.**
10. **Confirms the standard bare-`@word`-in-`.html`-bare-text gotcha applies to Python content too**,
    despite Python having no Razor-style `@` syntax of its own to worry about — the trigger is
    Angular's own template compiler, not anything about the hub's source language. Hit for real on
    `/python/functions-closures`'s wraps-on-a-partial subtopic: a `page-subtitle` sentence mentioning
    `@wraps` as plain prose (describing the `@functools.wraps` decorator by its short name) was parsed
    by Angular as the start of a control-flow block. Fixed with the standard `&#64;wraps` entity
    escape. **Any hub whose subject matter involves decorator syntax (`@something`) needs the same
    `.html`-bare-text sweep as the Blazor/ASP.NET hubs' own `@if`/`@page` Razor-syntax gotcha, for
    the same underlying reason (Angular's compiler, not the source language, is what's parsing it).**

### CSS hub subtopic wiring — first pilot, confirms most conventions match the HTML/TS/React pattern

Confirmed via direct file inspection before the first subtopic set (`/css/box-model`, 2026-07-11):
1. **`.css-page`'s wrapper rule is NOT global** (confirmed absent from `src/styles.scss`, same
   situation as SQL/TypeScript/React/JavaScript) — every CSS subtopic `.scss` must include the
   full `.css-page { max-width: 860px; margin: 0 auto; }` rule, with padding on `.subtopic-page`
   instead (`2rem 1.25rem 4rem` — note `1.25rem` horizontal, matching the main topic page's own
   `.scss`, NOT the HTML hub's `1.5rem`).
2. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'css/box-model'`, confirmed the base entry
   already existed) — subtopic composite keys follow suit: `'css/box-model/<slug>'`.
3. **Breadcrumb uses its own dedicated `CSS_LABELS` map with bare keys** (`'box-model'`) — no
   cross-hub collision risk here at all, since every hub has its own separate labels object
   (unlike `app.ts`'s single flat `SUBTOPICS` map shared across all hubs) — confirmed via grep
   showing only one `'box-model'` key in the whole file.
4. Progress/search keys are `css-` prefixed (`css-box-model`), confirmed via existing nav markup.
5. Theme: `$accent: #264de4`, `$tint: #eff6ff`, `.css-page`/`.css-icon`/`.css-section` CSS classes,
   icon content the literal text `CSS` (light tint, matching the documented default), `tech="javascript"`
   in `app-page-meta` (CSS pages share the JS/TS playground and run-it links).
6. **Live playground uses the same `'typescript'` StackBlitz template as JS/TS/HTML subtopics**
   (CSS runs natively in the browser) — `index.html` with an inline `<style>` block for the CSS
   under test, plus `index.ts` doing the measurement/observation (e.g. `getBoundingClientRect()`),
   `openFile="index.ts"`. Confirmed working end-to-end in the pilot, including StackBlitz loading
   correctly in both light and dark mode.
7. **Accuracy discipline carried over from a same-day HTML-hub fix**: before writing any subtopic
   demo whose claim depends on live-measured behavior (not just documented facts), verify the
   exact claim empirically via `javascript_tool` in the actual browser session first — do not
   assume a plausible-sounding claim is correct. This directly followed catching and fixing a real
   published inaccuracy in `/html/aria-roles/div-role-button-lacks-keyboard-activation` (its demo
   claimed a synthetic/script-dispatched `Enter` keydown triggers a real `<button>`'s native click
   activation — false: browsers only run default actions for TRUSTED events, and every
   script-dispatched event has `isTrusted: false`, so the real button would show 0 clicks too,
   contradicting the page's own claim). All three CSS Box Model claims (margin collapse uses the
   larger value not the sum, outline never affects layout, parent-child collapse moves the
   parent's own box) were confirmed via real `getBoundingClientRect()` measurements in-browser
   before being written up — CSS layout computation has no analogous trusted-event gating, but
   verifying first rather than assuming is now the standing practice for any live-behavior claim,
   regardless of how confident the reasoning feels.
8. No `SUBTOPICS` map bare-key collision for `box-model` (checked, confirmed collision-free).
9. **The preview browser tab used for verification is backgrounded (`document.hidden === true`,
   `document.hasFocus() === false`), which freezes real-time CSS transition/animation playback
   AND `requestAnimationFrame` entirely** — confirmed via a real investigation during the CSS
   Transitions batch (`/css/transitions`, 2026-07-11): a plain `transition: opacity 0.2s linear`
   triggered via `el.style.opacity = '0'` stayed at its ORIGINAL value even 3 full seconds later
   (`getComputedStyle` never progressed), and a nested `requestAnimationFrame` callback simply
   never fired (a `javascript_tool` call hung to its 30s timeout). This is the same root cause as
   the earlier CSS Animations batch's "`animationend` never fires" discovery — not two separate
   bugs, one shared cause. **Fix — use `setTimeout`, never `requestAnimationFrame`, for any real
   real-time wait in a verification script**, and for verifying transition/animation VALUES at a
   specific point, retrieve the live `Animation`/`CSSTransition` object via
   `element.getAnimations()` (reading it inside a `setTimeout` callback, not synchronously right
   after triggering — the object only registers a tick later) and set its `currentTime` directly
   — this bypasses the frozen real-time clock entirely and was reused successfully for CSS
   Transitions in this batch, exactly as it was for `@keyframes` Animations in the prior batch.
   `getAnimations()` checked synchronously (0ms after triggering) or via a forced-reflow
   (`void el.offsetWidth`) still returned an empty array in every case tried — only a genuine
   `setTimeout`-deferred check (even a very short one, 20–50ms) reliably returns the live
   animation object.
10. **`/css/tailwind` is the first CSS-hub topic to drop the live playground entirely** — same
    reasoning already established for `/javascript/bundlers` and `/react/nextjs`: Tailwind's JIT
    engine is a build-time static-text scanner (it reads source files as plain text, never
    executes JavaScript), so none of its actual gotchas — a dynamic class string being invisible
    to the scanner, a missing file extension in `content` — have any runtime behavior a browser
    JS console can demonstrate. Used plain `<app-code-block>` instead, no
    `LivePlaygroundComponent`/`PlaygroundFile` import. Also confirmed a real `SUBTOPICS` map
    bare-key collision here (`tailwind` already claimed by the Angular hub's own
    `/angular/tailwind` topic) — hub-prefixed to `css-tailwind`, matching the
    `aspnet-routing`/`css-animations` precedent; verified via browser that the Angular hub's own
    nav toggle and subtopics were unaffected by the fix.
11. **New verification technique: SVG `foreignObject` + canvas rasterization for genuine pixel-level
    proof of visual CSS effects** — discovered during the CSS Filters batch (`/css/css-filters`,
    2026-07-12) when `getComputedStyle()`/`elementFromPoint()` couldn't verify claims about
    `backdrop-filter` and `mix-blend-mode`, since those are pure rendering/compositing effects with
    no CSSOM-exposed result. The technique: serialize a small HTML string into an SVG
    `<foreignObject>`, load it into an `Image` via a `data:image/svg+xml` URL, `drawImage()` it onto
    a `<canvas>`, then read the actual rendered pixel color with `ctx.getImageData(x, y, 1,
    1).data`. This produced exact, reproducible pixel values (e.g. confirming `backdrop-filter:
    blur(8px)` renders pure white `[255,255,255,255]` behind an opaque background but a red-tinted
    blend behind a 20%-transparent one) — genuine proof, not inference from spec text. Reused
    successfully for a second claim in the same batch (`mix-blend-mode: multiply` producing exactly
    black `(0,0,0)` over a green background vs. exactly red `(255,0,0)` once isolated over a white
    one — the precise multiply color math, not just "it looks different"). This is now the
    established fallback whenever a CSS claim is about actual paint/compositing output that
    `getComputedStyle()` cannot expose. **Gotcha found in the same batch**: an early attempt to
    distinguish `filter: drop-shadow()` from `box-shadow` using `clip-path` to create a
    transparent region failed — `clip-path` clips `box-shadow` identically to how it clips
    `drop-shadow`, so both produced the same (unhelpful) result; abandoned that specific comparison
    rather than force a misleading test. **A second, separate gotcha in the same batch**: testing
    whether `filter`/`transform` creates a stacking context by hit-testing with
    `document.elementFromPoint()` requires the elements under test to use `position: relative` (or
    similar), never `position: fixed` — `position: fixed` unconditionally creates its OWN stacking
    context regardless of `filter`/`transform`, which silently confounded the first attempt (both
    the "with" and "without" cases showed the same trapped-child result until this was caught and
    fixed by switching to `position: relative` on a `position: fixed` OUTER wrapper only).

### Go hub subtopic wiring — first `*NavComponent`-based hub to get Phase 10 subtopics; a real structural fix required

Confirmed via a dedicated Explore-agent investigation before writing (`/go/fundamentals`,
2026-07-17) — do this same check before any other `*NavComponent`-based hub's first
subtopic set (Redis, GraphQL, Messaging, Testing, DSA, AI, DevOps, Containers, AWS, Azure,
Linux, Terraform, Service Mesh, Sysdesign, Arch Patterns, Design Patterns, Security, API
Design, Observability, Mongo — every hub whose nav is extracted into its own component
rather than inline in `app.html`):

1. **`GO_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are
   bare too (`'fundamentals/<subtopic-slug>'`).
2. **Progress/search keys are `go-` PREFIXED** (`go-fundamentals`). **`SIDEBAR_MAP` keys
   are FULL-PATH PREFIXED** (`'go/fundamentals'`, confirmed the base entry already
   existed) — subtopic composite keys follow suit: `'go/fundamentals/<subtopic-slug>'`.
3. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked both quoted and
   unquoted forms). Hub-prefixed to `'go-fundamentals'`, same `// NOTE:` comment pattern
   as every other resolved collision.
4. **THE STRUCTURAL DISCOVERY — Go's own nav is NOT inline in `app.html` at all.** Unlike
   every hub whose Phase 10 subtopics had been built before this one, Go's left-nav is a
   dedicated standalone component, `GoNavComponent` at `shared/go-nav/go-nav.ts` (built
   earlier specifically "to prevent TS2563 in app.ts" per this file's own "Current state"
   notes) — confirmed by finding **no** `@if (currentSection() === 'go')` block anywhere in
   `app.html`, and confirmed `GoNavComponent` had **zero** subtopics-accordion support:
   no `subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics` methods, no accordion markup,
   nothing. Adding subtopic support meant building this from scratch for the component,
   not copying an existing inline block the way every previous hub's pilot did.
5. **The naive fix — importing `SUBTOPICS` from `app.ts` into `go-nav.ts` — creates a
   circular import** and must not be done: `app.ts` already imports `GoNavComponent`
   (`import { GoNavComponent } from './components/shared/go-nav/go-nav'`), so
   `go-nav.ts` importing anything back from `'../../../app'` forms a cycle. **The actual
   fix**: extracted the ENTIRE `SUBTOPICS: Record<string, SubtopicNavEntry[]>` map (at the
   time, ~2100 lines covering every hub's subtopics so far) and the `SubtopicNavEntry`
   interface OUT of `app.ts` into a new standalone file, **`src/app/data/subtopics.ts`**,
   with both `export`ed. `app.ts` now does
   `import { SUBTOPICS, SubtopicNavEntry } from './data/subtopics'` instead of declaring
   the map locally — its own `subtopicsOf()`/`isSubtopicsExpanded()`/`toggleSubtopics()`/
   `autoExpandForCurrentUrl()` methods are otherwise byte-identical, just reading from the
   imported binding instead of a local `const`. This is now the **shared, canonical
   location** for the subtopics map — every future hub's own `SUBTOPICS` entries (whether
   consumed by inline `app.html` markup or a `*NavComponent`) get added to
   `src/app/data/subtopics.ts`, not `app.ts`.
6. **`GoNavComponent` needed its own LOCAL copy of the accordion-state pattern**, since it
   is a separate component instance with no access to `AppComponent`'s own private state —
   added directly to the component class: a private `expandedTopics = signal<Set<string>>
   (new Set())`, the same three methods (`subtopicsOf`, `isSubtopicsExpanded`,
   `toggleSubtopics`) reading/writing that LOCAL signal (not `AppComponent`'s), and the
   identical router-subscription-based `autoExpandForCurrentUrl()` logic in the
   constructor (`inject(Router)`, subscribe to `NavigationEnd`, call once eagerly too for
   the initial render). The template markup itself (chevron toggle button + nested
   `<div class="nav-subtopics">` list) is otherwise the exact same block copied from any
   inline-`app.html` hub, just referencing the component's own local methods instead of
   `AppComponent`'s.
7. **No `.go-page` wrapper-global gotcha** — confirmed already documented and current:
   `.go-page` is defined in the topic's OWN component `.scss` (not globally in
   `src/styles.scss`), so every subtopic `.scss` needs the standard
   `.go-page { max-width: 860px; margin: 0 auto; }` redeclaration, same as every other
   non-global hub.
8. **A raw Go backtick inside a code sample remains the standing hazard this file already
   documented in the Go hub's own main "Current state" line** ("Go backticks in code
   examples must use string concatenation — they terminate TS template literals") — this
   pilot batch's own Go code samples happened to need zero raw backticks (no Go raw-string
   literals were used), so the hazard didn't surface here, but the discipline still applies
   to any future Go subtopic whose sample code needs one.
9. **Theme, icon, `tech=` attribute**: unchanged from the hub's own established values —
   `$accent: #00add8`, `$tint: #e8f8fd`, `.go-page`/`.go-icon`/`.go-section` CSS classes,
   icon content the literal text `Go`, `tech="javascript"` in `app-page-meta` (Go pages
   share the JS/TS playground and run-it links, same as CSS/HTML/Node.js/Python).

### DevOps hub subtopic wiring — first pilot; the first CONCEPTUAL (non-API-driven) hub, plus
another `*NavComponent` missing the subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/devops/culture`, 2026-07-18) — do this
same check before any other new hub's first subtopic set:

1. **`DevopsNavComponent` (`shared/devops-nav/devops-nav.ts`) had ZERO subtopics-accordion
   support** — no `expandedTopics` signal, no `subtopicsOf`/`isSubtopicsExpanded`/
   `toggleSubtopics` methods, no router-subscription auto-expand — the exact same structural gap
   `GoNavComponent` had before its own pilot (see the Go hub section above). Fixed identically:
   added `signal`, `Router`, `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS` (from
   `data/subtopics.ts`) to the imports, then the same three methods and constructor-level router
   subscription, byte-for-byte the same pattern as `GoNavComponent`'s own. **Any future
   `*NavComponent`-based hub's first pilot must check for this same gap before assuming the
   component already supports subtopics** — it is not safe to assume a `*NavComponent` hub has
   this wiring just because `GoNavComponent` does; each one needs its own confirmed check.
2. **Progress/search keys are `devops-` PREFIXED** (`devops-culture`), confirmed via existing
   nav markup. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'devops/culture'`, confirmed the
   base entry already existed, with its own `DEVOPS_DEFAULT` constant) — subtopic composite keys
   follow suit: `'devops/culture/<slug>'`.
3. **No `SUBTOPICS` map bare-key collision for `culture`** (checked both quoted and unquoted
   forms, confirmed collision-free) — added as a bare key. **A real process mistake caught and
   corrected before the build**: the nav wiring was initially written using a hub-prefixed
   `'devops-culture'` key by habit (carried over from several recent Go-hub collisions in a row),
   BEFORE the actual collision check was run — then corrected to the bare `'culture'` key once
   the check came back clean. **The collision check must happen BEFORE choosing bare vs.
   prefixed, not be treated as a formality after already assuming a prefix is needed** — recent
   back-to-back collisions on other hubs made prefixing feel like the default, but it is not;
   confirm first.
4. `DEVOPS_LABELS` breadcrumb map uses bare keys (`'culture'`), matching the generic pattern
   every hub's own dedicated labels map shares — composite subtopic keys there are bare too
   (`'culture/<slug>'`).
5. **Theme**: `.devops-page`/`.devops-icon`/`.devops-section` CSS classes, confirmed NOT global
   (absent from `src/styles.scss`) — every subtopic `.scss` needs the full `.devops-page {
   max-width: 860px; margin: 0 auto; }` wrapper rule. `$accent: #ee5d25`, `$tint: #fff7ed`, icon
   content `⚙️`, `tech="javascript"` in `app-page-meta` (DevOps pages share the JS/TS playground
   and run-it links, same as CSS/HTML/Node.js/Python/Go).
6. **No live playground** — DevOps culture content has no runtime to demonstrate at all (it is a
   methodology/culture topic, not code), following the same `<app-code-block>`-only pattern as
   the non-Angular hubs (C#/SQL/Blazor/Go), using illustrative bash/YAML checklists and templates
   as `codeTabs` content instead of running code — matching the main page's own code tab style
   exactly (the main topic page itself already uses bash/YAML/TypeScript code tabs for templates
   and conceptual models, not runnable demos).
7. **THE FIRST CONCEPTUAL, NON-API-DRIVEN HUB — the research-verification approach itself had to
   change.** Every hub before this one (even the "no runtime available" ones like C#/Blazor/
   Node.js) verified claims against API docs, language specs, or framework documentation — a
   fundamentally different research task from DevOps culture's actual subject matter (CALMS,
   DORA metrics, Project Aristotle, blameless postmortems), which has no API surface at all.
   Sources shifted accordingly: DORA's own current methodology guide (dora.dev), Google's own
   re:Work research page for Project Aristotle, and Google's own SRE book chapter for blameless
   postmortem culture — authoritative PRIMARY research/methodology sources instead of API docs,
   but the same "verify before publishing, drop the angle if it won't verify cleanly" discipline
   applied identically. **`WebFetch` repeatedly 404'd or was blocked (403) on plausible-looking
   URLs for this batch** (an outdated `rework.withgoogle.com` path, `codeascraft.com` blocking
   the fetch entirely) — `WebSearch` was needed first to find the actual correct, current URLs
   before `WebFetch` could pull exact quotes. **For any future conceptual/methodology hub topic
   (SRE practices, incident response, platform engineering, etc.), expect to need `WebSearch` to
   locate the right primary source BEFORE `WebFetch` can quote it** — guessing at a plausible
   direct URL (as worked reliably for `pkg.go.dev` throughout the entire Go hub) is much less
   reliable for general web research sources than it is for structured API documentation sites.
8. **A genuine, worth-knowing finding from this batch**: DORA's own current metrics guide has
   evolved past the "Four Key Metrics" framing still extremely common in DevOps educational
   content (including this hub's own main page) — it is now a five-metric model, with MTTR
   renamed to "Failed deployment recovery time" and a new "Deployment Rework Rate" metric added.
   Worth checking whether other DevOps-hub topics (or any other hub's own DORA mentions) still
   reference the old four-metric framing as if it were current and unchanged.
9. **Escalated the typographic-quote rule from single apostrophes to scare-quote double-quotes**:
   a `[prev]`/`[next]` label needing literal double-quote punctuation around a word (e.g. "The
   SRE Book's Own Definition Sharpens "Blameless"") used curly `"`/`"` marks (U+201C/U+201D)
   rather than straight ASCII `"` — the same underlying reasoning as the established `'`
   (U+2019) apostrophe rule (a delimiter character must not appear literally inside a
   same-delimiter-quoted string), just applied to double quotes instead of single ones. Since
   the outer Angular attribute is itself double-quoted (`[next]="..."`), a literal straight `"`
   inside the label text would have closed the outer attribute prematurely — the curly-quote
   substitution avoids this the same way `’` avoids the single-quote collision.

### Containers/K8s hub subtopic wiring — first pilot; another `*NavComponent` missing the
subtopics-accordion structural fix, plus a real SUBTOPICS collision

Confirmed via direct file inspection before the pilot (`/containers/fundamentals`, 2026-07-21) —
do this same check before any other new hub's first subtopic set:

1. **`ContainersNavComponent` (`shared/containers-nav/containers-nav.ts`) had ZERO
   subtopics-accordion support** — the same structural gap already hit and fixed on
   `GoNavComponent` and `DevopsNavComponent` before their own pilots. Fixed identically: added
   `signal`, `Router`, `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS` (from
   `data/subtopics.ts`) to the imports, then the same three methods
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) and constructor-level router
   subscription, byte-for-byte the same pattern as the other two. **This is now the THIRD
   `*NavComponent`-based hub in a row missing this wiring at pilot time — do not assume any
   `*NavComponent` hub has it; confirm per hub, every time.**
2. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked both quoted and unquoted
   forms, per the standing collision-detection discipline). Hub-prefixed to `k8s-fundamentals`
   — matching this hub's own established progress/search key prefix (`k8s-`, confirmed via the
   pre-existing `p.isDone('k8s-fundamentals')` nav markup) — with the usual `// NOTE:` comment.
   All three `ContainersNavComponent` accordion helper calls
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) use the prefixed `'k8s-fundamentals'`
   key consistently.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'containers/fundamentals'`, confirmed the
   base entry — and its own `K8S_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'containers/fundamentals/<slug>'`.
4. **`CONTAINERS_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the
   generic pattern every hub's own dedicated labels map shares — composite subtopic keys there
   are bare too (`'fundamentals/<slug>'`), since each hub's own labels map has no cross-hub
   collision risk regardless of what the shared `SUBTOPICS` map needed to do.
5. **No live playground** — Docker/Kubernetes content has no in-browser runtime, following the
   same `<app-code-block>`-only pattern as every other non-JS-runtime hub (C#/SQL/Blazor/Go/
   DevOps/Node.js's server-only topics) — every code tab across all three subtopics uses plain
   bash command transcripts, matching the main page's own `codeTabs` style exactly.
6. Theme: `.k8s-page`/`.k8s-icon`/`.k8s-section` CSS classes, confirmed NOT global (absent from
   `src/styles.scss`) — every subtopic `.scss` needs the full `.k8s-page { max-width: 860px;
   margin: 0 auto; }` wrapper rule. `$accent: #326ce5`, `$tint: #eff6ff`, icon content `⎈`,
   `tech="javascript"` in `app-page-meta` (Containers pages share the JS/TS playground and
   run-it links, same as CSS/HTML/Node.js/Python/Go/DevOps).

### AWS hub subtopic wiring — first pilot; the 4th `*NavComponent` in a row missing the
subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/aws/fundamentals`, 2026-07-21) — do this
same check before any other new hub's first subtopic set:

1. **`AwsNavComponent` (`shared/aws-nav/aws-nav.ts`) had ZERO subtopics-accordion support** —
   same structural gap already hit and fixed on `GoNavComponent`, `DevopsNavComponent`, and
   `ContainersNavComponent` before their own pilots. Fixed identically: added `signal`, `Router`,
   `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS` (from `../../../data/subtopics`) to the
   imports, then the same three methods (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`)
   and constructor-level router subscription, byte-for-byte the same pattern as the other three.
   **This is now the FOURTH `*NavComponent`-based hub in a row missing this wiring at pilot
   time — never assume any `*NavComponent` hub has it; confirm per hub, every time.**
2. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked both quoted and unquoted forms,
   per the standing collision-detection discipline). Hub-prefixed to `aws-fundamentals` —
   matching this hub's own established progress/search key prefix (`aws-`) — with the usual
   `// NOTE:` comment. All three `AwsNavComponent` accordion helper calls
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) use the prefixed `'aws-fundamentals'`
   key consistently.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'aws/fundamentals'`, confirmed the base
   entry — and its own `AWS_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'aws/fundamentals/<slug>'`.
4. **`AWS_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are bare
   too (`'fundamentals/<slug>'`).
5. **No live playground** — AWS CLI/SDK/IAM content has no in-browser runtime, following the
   same `<app-code-block>`-only pattern as every other non-JS-runtime hub (C#/SQL/Blazor/Go/
   DevOps/Node.js/Containers) — every code tab across all three subtopics uses plain bash/AWS CLI
   command transcripts, matching the main page's own `codeTabs` style exactly.
6. Theme: `.aws-page`/`.aws-icon`/`.aws-section` CSS classes, confirmed NOT global (absent from
   `src/styles.scss`) — every subtopic `.scss` needs the full `.aws-page { max-width: 860px;
   margin: 0 auto; }` wrapper rule. `$accent: #ff9900`, `$tint: #fff7ed`, icon content `AWS`,
   `tech="javascript"` in `app-page-meta` (AWS pages share the JS/TS playground and run-it links,
   same as CSS/HTML/Node.js/Python/Go/DevOps/Containers).
7. **A genuine main-page inaccuracy found and fixed during pilot authoring**: `fundamentals.ts`'s
   own "AWS CLI & SDK" theory bullet listed the CLI/SDK credential provider chain as "env vars →
   ~/.aws/credentials → instance profile → ECS task role" — the last two links reversed relative
   to AWS's own documented standardized credential provider chain, which checks container
   credentials (ECS task role) BEFORE the EC2 instance profile, not after. Corrected via the same
   "verify against official docs, fix the main page directly" precedent already established
   across the Containers/K8s hub (3 similar fixes) and other hubs before it.
8. **The apostrophe-after-letter pre-build sweep must cover `.ts` files' own single-quoted
   fields too, not just `.html` bound attributes.** A real build failure on the `/aws/ec2` batch
   (io1 Multi-Attach subtopic): one bare, unescaped apostrophe in "the main page's own" inside an
   `exercise.prompt` field — a LATER apostrophe in the same field ("subtopic's theory") was
   correctly escaped, so this was an isolated single miss, not a systemic one. The sweep run
   before that build only checked the three `.html` files' `[prev]`/`[next]` bound attributes,
   never the `.ts` files' own single-quoted `prompt:`/`hint:`/`solution:`/`thought:`/`reality:`/
   `points:` field bodies. **Fix, now standing practice**: run the apostrophe-after-letter grep
   against `.ts` files too, targeting those specific single-quoted field bodies — backtick-
   delimited `code:` fields are unaffected (backticks tolerate bare apostrophes fine) and don't
   need this check.

### Azure hub subtopic wiring — first pilot; the 5th `*NavComponent` in a row missing the
subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/azure/fundamentals`, 2026-07-22) — do
this same check before any other new hub's first subtopic set:

1. **`AzureNavComponent` (`shared/azure-nav/azure-nav.ts`) had ZERO subtopics-accordion
   support** — the same structural gap already hit and fixed on `GoNavComponent`,
   `DevopsNavComponent`, `ContainersNavComponent`, and `AwsNavComponent` before their own pilots.
   Fixed identically: added `signal`, `Router`, `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS`
   (from `../../../data/subtopics`) to the imports, then the same three methods
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) and constructor-level router
   subscription, byte-for-byte the same pattern as the other four. **This is now the FIFTH
   `*NavComponent`-based hub in a row missing this wiring at pilot time — never assume any
   `*NavComponent` hub has it; confirm per hub, every time.**
2. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked both quoted and unquoted forms,
   per the standing collision-detection discipline). Hub-prefixed to `azure-fundamentals` —
   matching this hub's own established progress/search key prefix (`azure-`) — with the usual
   `// NOTE:` comment. All three `AzureNavComponent` accordion helper calls
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) use the prefixed `'azure-fundamentals'`
   key consistently.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'azure/fundamentals'`, confirmed the base
   entry — and its own `AZURE_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'azure/fundamentals/<slug>'`.
4. **`AZURE_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are bare
   too (`'fundamentals/<slug>'`).
5. **No live playground** — Azure CLI/ARM content has no in-browser runtime, following the same
   `<app-code-block>`-only pattern as every other non-JS-runtime hub (C#/SQL/Blazor/Go/DevOps/
   Node.js/Containers/AWS) — every code tab across all three subtopics uses plain `az` CLI command
   transcripts, matching the main page's own `codeTabs` style exactly.
6. Theme: `.azure-page`/`.azure-icon`/`.azure-section` CSS classes, confirmed NOT global (absent
   from `src/styles.scss`) — every subtopic `.scss` needs the full `.azure-page { max-width:
   860px; margin: 0 auto; }` wrapper rule. `$accent: #0089d6`, `$tint: #e8f4fd`, icon content
   `Az`, `tech="javascript"` in `app-page-meta` (Azure pages share the JS/TS playground and run-it
   links, same as every other non-JS-runtime hub).
7. No genuine main-page inaccuracy found in this pilot batch — all three subtopic angles
   EXPANDED on main-page content that was accurate but incomplete (a single lock example, a
   one-sentence mention of a CLI command, a flat "spread across 3 AZs" theory bullet) rather than
   correcting anything wrong.
8. **A new class of false-positive gotcha, distinct from every prior source-code bug: the local
   `ng serve` dev server's incremental/esbuild watcher can leave a lazy component chunk STALE
   after a genuine source fix, even across a hard browser reload.** Hit for real on the
   `/azure/load-balancer` batch: a `[prev]` route was found wrong (short physical-folder-name
   string instead of the real registered long-form route), fixed via Edit, confirmed correct on
   disk — but the live preview kept rendering the OLD wrong href even after
   `window.location.reload(true)`. Root cause, confirmed via `preview_logs` (search for
   `"Application bundle generation complete"`): several file-watcher-triggered rebuilds in a row
   only relisted `main.js` in their "Lazy chunk files" summary, never the specific subtopic's own
   chunk — meaning that chunk's last actual recompile predated the fix, so the browser was
   correctly serving byte-for-byte what the dev server had (a stale chunk), not a caching problem
   on the browser side at all. **Fix: force a fresh save of the affected file** (a trivial
   whitespace edit, save, then revert, save again — two real file-write events) — confirmed via
   `preview_logs` that this produces a NEW chunk hash/size for that exact component, and the next
   browser reload then renders correctly. **Diagnostic habit worth keeping**: when a browser
   check contradicts a source file you just verified correct via `Read`/`grep`, check
   `preview_logs` for `"Application bundle generation complete"` and see whether the specific
   component's own chunk name appears in the MOST RECENT build's file list before assuming the
   source fix itself is wrong — the manual production build (`npx ng build
   --configuration=production`) is unaffected by this and remains the authoritative correctness
   check; this gotcha is specific to the live `ng serve` preview process used for interactive
   browser verification only.
   **Confirmed recurring on a completely different hub** (`/linux/bash-advanced`'s three brand-new
   Phase 10 subtopics, 2026-07-24) — this time manifesting as a full silent redirect to `/` (the
   app's own `{ path: '**', redirectTo: '' }` wildcard route swallowing the unmatched route with
   ZERO console error) rather than stale/wrong content, on BOTH a hard navigation AND a client-side
   routerLink click — `preview_logs` confirmed the dev server had genuinely never compiled lazy
   chunks for the three new components at all (grepping the logs for the component name came back
   with zero matches), even though the production build passed and `app.routes.ts` was syntactically
   correct. Same fix worked: force a fresh file-write on `app.routes.ts` itself (append a blank line,
   then trim it back out), confirmed via `preview_logs` that the next rebuild's own "Lazy chunk
   files" list now named all three new components, and the routes resolved correctly afterward. Not
   Azure-specific — treat this as a standing risk on any brand-new lazy route added during an active
   `ng serve` session, not a one-off.
   **Recurred a THIRD time** (`/linux/environment-variables`'s own Phase 10 batch, 2026-07-24), this
   time as a genuine NG2008 "Could not find template file" compiler ERROR in `preview_logs` for one
   specific new subtopic — confirmed via a direct filesystem check (`ls` on the actual folder) that
   the file genuinely existed on disk before assuming it was a real authoring mistake. Same fix
   (fresh file-write on `app.routes.ts`) resolved it, but a NEW nuance surfaced this time: after the
   fix, a repeated `preview_logs` search for the component name STILL returned the old NG2008 error
   lines — the log buffer had not evicted the stale entries. Direct navigation to the actual route
   confirmed it resolved correctly regardless. **Lesson: after applying this fix, verify via a live
   `navigate` + `location.href` check, not by re-running the same `preview_logs` search and expecting
   the error to disappear from the buffer** — a persisting log hit does not necessarily mean the
   underlying problem persists.
9. **A distinct false alarm that looks identical to the chunk-staleness gotcha above but has a
   completely different cause: `QnaBlockComponent` (and similarly-structured accordion
   components) render as a NESTED, collapsed-by-default accordion — a question list collapsed
   under a "N questions" count, then each individual question collapsed under its own toggle.**
   Hit for real verifying a corrected QnA answer on `/azure/monitor` (the Basic Logs cost fix,
   2026-07-22): a `document.body.textContent.includes(...)` check for the corrected text came back
   empty, indistinguishable at first from a stale dev-server chunk — the standard fix (force a
   fresh file save via a whitespace edit-and-revert) was tried and DID produce a fresh chunk
   rebuild, but the search still failed afterward, which is what revealed this was a different
   problem. The answer text is genuinely absent from the DOM until BOTH accordion levels are
   clicked open — not a rendering bug, not staleness, just standard collapsed-by-default UI.
   **Fix: before concluding a live-preview text check has failed, click through every accordion
   level first** (`document.querySelector('.qna-toggle').click()` to expand the question list,
   then locate and click the specific question's own row element to expand its answer) — only
   treat a text-search failure as a real bug (stale chunk or otherwise) once the relevant content
   has actually been expanded into the DOM. `CommonMistakesComponent` uses the same
   collapsed-by-default pattern (shows only a count badge, e.g. "⚠️Common Mistakes4›") and needs
   the same click-through treatment if verifying corrected mistake content by text search.

### Linux hub subtopic wiring — first pilot; the 6th `*NavComponent` in a row missing the
subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/linux/fundamentals`, 2026-07-23) — do
this same check before any other new hub's first subtopic set:

1. **`LinuxNavComponent` (`shared/linux-nav/linux-nav.ts`) had ZERO subtopics-accordion
   support** — the same structural gap already hit and fixed on `GoNavComponent`,
   `DevopsNavComponent`, `ContainersNavComponent`, `AwsNavComponent`, and `AzureNavComponent`
   before their own pilots. Fixed identically: added `signal`, `Router`, `NavigationEnd`,
   `filter` (rxjs), and `SUBTOPICS` (from `../../../data/subtopics`) to the imports, then the
   same three methods (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) and
   constructor-level router subscription, matching `AzureNavComponent`'s own implementation
   exactly. **This is now the SIXTH `*NavComponent`-based hub in a row missing this wiring at
   pilot time — never assume any `*NavComponent` hub has it; confirm per hub, every time.**
2. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked both quoted and unquoted
   forms, per the standing collision-detection discipline). Hub-prefixed to
   `linux-fundamentals` — matching this hub's own established progress/search key prefix
   (`linux-`) — with the usual `// NOTE:` comment. All three `LinuxNavComponent` accordion
   helper calls (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) use the prefixed
   `'linux-fundamentals'` key consistently.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'linux/fundamentals'`, confirmed the base
   entry — and its own `LINUX_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'linux/fundamentals/<slug>'`.
4. **`LINUX_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are
   bare too (`'fundamentals/<slug>'`).
5. **`.linux-page`'s wrapper rule IS global**, confirmed present in `src/styles.scss`
   (`max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 4rem;` — padding already baked
   in) — matching the HTML hub's own pattern, unlike most other recent hubs (SQL/TypeScript/
   React/JavaScript/CSS/Go/DevOps/Containers/AWS/Azure/Node), which all needed the wrapper
   rule manually redeclared per subtopic. Redeclaring it anyway in each subtopic `.scss` is
   harmless and was done for consistency with the majority pattern.
6. **No live playground** — Linux/bash content has no in-browser runtime, following the same
   `<app-code-block>`-only pattern as every other non-JS-runtime hub (C#/SQL/Blazor/Go/DevOps/
   Node.js/Containers/AWS/Azure) — every code tab across all three subtopics uses plain bash
   command transcripts, matching the main page's own `codeTabs` style exactly.
7. Theme: `.linux-page`/`.linux-icon`/`.linux-section` CSS classes. `$accent: #fcc624`,
   `$tint: #fef9e7`, icon content `🐧` at `font-size: 1.8rem` (light tint fill, confirmed via
   the real `styles.scss`), `tech="javascript"` in `app-page-meta` (Linux pages share the JS/TS
   playground and run-it links, same as every other non-JS-runtime hub).
8. **freedesktop.org's own systemd man pages 403'd on `WebFetch`** (`systemd.special.html`,
   `journald.conf.html`) — `man7.org`'s mirror of the same man pages worked for `journald.conf`
   and `sysctl`, and a `WebSearch` sweep of secondary sources (Oracle docs, RHEL/tecmint guides)
   sufficiently corroborated the systemd-targets-to-runlevels mapping where the primary source
   was unreachable. **For any future Linux-hub topic needing systemd/kernel primary-source
   verification, try `man7.org` before `freedesktop.org` — the latter has now blocked `WebFetch`
   on more than one occasion.**
9. **Verified the accordion's actual click behavior in-browser, not just the toggle count** —
   explicitly clicked `.nav-subtopics-toggle` twice (open then close) and confirmed the DOM
   state changed each time, and separately navigated directly to a subtopic URL to confirm
   auto-expand fired without a manual click — both real, executed checks rather than an
   assumption that copying `AzureNavComponent`'s pattern was sufficient on its own.

### Terraform hub subtopic wiring — first pilot; the 7th `*NavComponent` in a row missing the
subtopics-accordion structural fix, plus a copy-fidelity lesson on `autoExpandForCurrentUrl()`

Confirmed via direct file inspection before the pilot (`/terraform/fundamentals`, 2026-07-25) — do
this same check before any other new hub's first subtopic set:

1. **`TerraformNavComponent` (`shared/terraform-nav/terraform-nav.ts`) had ZERO subtopics-accordion
   support** — the same structural gap already hit and fixed on `GoNavComponent`,
   `DevopsNavComponent`, `ContainersNavComponent`, `AwsNavComponent`, `AzureNavComponent`, and
   `LinuxNavComponent` before their own pilots. **This is now the SEVENTH `*NavComponent`-based hub
   in a row missing this wiring at pilot time — never assume any `*NavComponent` hub has it; confirm
   per hub, every time.**
2. **A genuine copy-fidelity mistake caught before building, not after**: the first draft of
   `autoExpandForCurrentUrl()` was written from memory as a substring-match heuristic (checking
   whether the current URL `.includes()` a topic slug) instead of reading an existing working
   implementation first. Directly reading `azure-nav.ts`'s own `autoExpandForCurrentUrl()` revealed
   the actual established pattern is an EXACT match: iterate `Object.entries(SUBTOPICS)` and check
   whether any subtopic's own `route` field equals the current URL exactly
   (`subs.some(s => s.route === url)`) — not a substring/prefix heuristic at all. The invented
   version would have been more fragile (prone to false-positive expansion on unrelated routes
   sharing a substring) even though it might have happened to work for this specific pilot's slugs.
   **Lesson: when replicating a structural fix across a 7th+ hub, read the most recent prior
   implementation directly rather than reconstructing it from the pattern description in this
   file — a description can omit details (like "exact match, not substring") that only show up in
   the actual code.**
3. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the JavaScript
   hub's own `/javascript/fundamentals` topic (checked both quoted and unquoted forms, per the
   standing collision-detection discipline). Hub-prefixed to `tf-fundamentals` — matching this hub's
   own established progress/search key prefix (`tf-`) — with the usual `// NOTE:` comment. All three
   `TerraformNavComponent` accordion helper calls (`subtopicsOf`/`isSubtopicsExpanded`/
   `toggleSubtopics`) use the prefixed `'tf-fundamentals'` key consistently.
4. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'terraform/fundamentals'`, confirmed the base
   entry — and its own `TERRAFORM_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'terraform/fundamentals/<slug>'`.
5. **`TERRAFORM_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are bare too
   (`'fundamentals/<slug>'`).
6. **No live playground** — Terraform/HCL content has no in-browser runtime, following the same
   `<app-code-block>`-only pattern as every other non-JS-runtime hub (C#/SQL/Blazor/Go/DevOps/
   Node.js/Containers/AWS/Azure/Linux) — every code tab across all three subtopics uses plain HCL
   configuration snippets with `language: 'bash'` (matching the main page's own `codeTabs` style,
   which also uses `'bash'` for HCL — there is no dedicated `'hcl'` CodeTab language in this
   codebase).
7. Theme: `.tf-page`/`.tf-icon`/`.tf-section` CSS classes, confirmed NOT global (absent from
   `src/styles.scss`) — every subtopic `.scss` needs the full `.tf-page { max-width: 860px; margin:
   0 auto; }` wrapper rule. `$accent: #7b42bc`, `$tint: #f5f3ff`, icon content `TF`,
   `tech="javascript"` in `app-page-meta` (Terraform pages share the JS/TS playground and run-it
   links, same as every other non-JS-runtime hub).
8. All three technical claims (for_each's map/set type requirement and what `toset()` gives up;
   `depends_on` needed for IAM-propagation-style invisible dependencies; `moved` blocks vs
   `terraform state mv` for renames) were verified via WebSearch against HashiCorp's own developer
   docs and corroborating secondary sources before writing, per the standing "verify before
   publishing" discipline for hubs with no in-browser runtime to test claims against directly.
9. Browser verification confirmed the shared nav component change compiled correctly on the FIRST
   attempt (no stale-chunk incident) — `terraform-nav.ts` was genuinely modified this batch (real
   content change, not a no-op touch), unlike the Linux hub's own final `/linux/vim` batch where a
   stale TEMPLATE compilation required a forced fresh file-write to resolve. Worth noting as a
   contrast: a genuine file edit reliably triggers a correct recompile: the prior incident was
   specifically about a component whose TEMPLATE went stale despite the underlying file being
   untouched by that particular batch.
10. **A real over-escaped-double-quote bug caught during the `/terraform/data-sources` batch's own
    gotcha sweep, before it reached the build.** The standing rule ("backslash-escape a literal `"`
    only inside a backtick-delimited `code:`/`content:` field, never inside a plain single-quoted
    `'...'` field, since `"` needs no escaping there at all") had two real violations in the same
    file: one in a `theory.points` entry quoting the main page's own QnA text, and one in an
    `exercise.solution` field containing a nested backtick-wrapped JSON code span. Both used `\"`
    where plain `"` was correct, which would have rendered a visible stray backslash in the actual
    page text (not a build error — the sweep, not the build, is what has to catch this). Fixed by
    removing the unnecessary escaping; also rephrased the first instance to avoid an awkward
    nested-quote read in prose. Confirms this specific mistake (conflating the single-quoted-field
    rule with the backtick-field rule) is a standing risk worth a dedicated look on any subtopic
    batch whose prose quotes something containing its own double quotes.
11. **The `/terraform/cicd` batch is the first time the site's initial bundle crossed the hard
    `maximumError` budget in `angular.json`** — the production build failed outright (exit code 1)
    with `bundle initial exceeded maximum budget. Budget 5.00 MB was not met by 603.25 kB with a
    total of 5.60 MB`, distinct from the long-standing, genuinely harmless `maximumWarning: 2.5MB`
    overage this file has documented as safe to ignore since early in the project. This is
    cumulative site growth across dozens of hubs reaching a real ceiling, not something 9 small
    subtopic files caused on their own. **Fix: bump `maximumError` in `angular.json`'s
    `budgets` array** (raised `5MB` → `8MB` this time, with headroom for further hub batches before
    hitting it again) — this is a legitimate, expected maintenance edit as the site keeps growing,
    not a workaround for a real problem. Worth checking this budget again periodically as more hubs
    reach Phase 10 completion, rather than being surprised by a build failure mid-batch.
12. **The `/terraform/refactoring` batch hit a real, build-breaking NG5002 error the standing
    gotcha sweep did not catch** — bare `{}` characters in plain prose `.html` text (a page-subtitle
    and a "Where this fits" paragraph, both naming `moved {}`/`removed {}` syntax directly), across
    two of the three subtopic files. This is the pre-existing, already-documented single-brace-in-
    prose gotcha (see the general single-`{`-in-prose entry earlier in this file, from the
    TypeScript hub's `EventHandlers<T>` incident) — but it had never come up in the Terraform hub
    before this batch, since no prior Terraform subtopic's prose needed to name a brace-delimited
    HCL block syntax directly. The sweep's bare-`@word` grep does not catch this — it is a
    completely separate trigger character. **Fix: the standard `&#123;`/`&#125;` HTML-entity
    escape**, confirmed via a browser re-check that the escaped braces render as literal `{}`
    characters (not raw entity codes) once fixed. **New standing sweep addition for any future
    Terraform (or any HCL-block-syntax-naming) subtopic batch**: grep every new `.html` file for a
    bare `{` in plain text content (not inside a bound attribute expression) whenever the subtopic's
    own subject matter involves naming a brace-delimited block type by its literal syntax (`moved
    {}`, `removed {}`, `lifecycle {}`, etc.) — this is a real, recurring risk category for this hub
    specifically, distinct from the `@word` sweep already run on every batch.

### Service Mesh hub subtopic wiring — first pilot; the 9th `*NavComponent` in a row missing the
subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/service-mesh/fundamentals`, 2026-07-28) —
do this same check before any other new hub's first subtopic set:

1. **`MeshNavComponent` (`shared/mesh-nav/mesh-nav.ts`) had ZERO subtopics-accordion support** —
   the same structural gap already hit and fixed on `GoNavComponent`, `DevopsNavComponent`,
   `ContainersNavComponent`, `AwsNavComponent`, `AzureNavComponent`, `LinuxNavComponent`, and
   `TerraformNavComponent` before their own pilots. Fixed identically: added `signal`, `Router`,
   `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS` (from `../../../data/subtopics`) to the
   imports, then the same three methods (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`)
   and constructor-level router subscription, copied directly from `TerraformNavComponent`'s own
   implementation (read directly, not reconstructed from memory, per the copy-fidelity lesson from
   the Terraform hub's own pilot). **This is now the NINTH `*NavComponent`-based hub in a row
   missing this wiring at pilot time — never assume any `*NavComponent` hub has it; confirm per
   hub, every time.** Unlike several prior hubs, the toggle worked correctly on the FIRST browser
   check this time — no stale-chunk dev-server incident.
2. **Real `SUBTOPICS` map bare-key collision**: `fundamentals` was already claimed by the
   JavaScript hub's own `/javascript/fundamentals` topic (checked both quoted and unquoted forms,
   per the standing collision-detection discipline). Hub-prefixed to `mesh-fundamentals` —
   matching this hub's own established progress/search key prefix (`mesh-`) — with the usual
   `// NOTE:` comment. All three `MeshNavComponent` accordion helper calls
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) use the prefixed `'mesh-fundamentals'`
   key consistently.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'service-mesh/fundamentals'`, confirmed the
   base entry — and its own `MESH_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'service-mesh/fundamentals/<slug>'`.
4. **`MESH_LABELS` breadcrumb map uses bare keys** (`'fundamentals'`), matching the generic pattern
   every hub's own dedicated labels map shares — composite subtopic keys there are bare too
   (`'fundamentals/<slug>'`).
5. **No live playground** — Istio/Envoy/Kubernetes YAML content has no in-browser runtime,
   following the same `<app-code-block>`-only pattern as every other non-JS-runtime hub (C#/SQL/
   Blazor/Go/DevOps/Node.js/Containers/AWS/Azure/Linux/Terraform) — every code tab across all three
   subtopics uses plain `kubectl`/Istio-CRD YAML transcripts, matching the main page's own
   `codeTabs` style exactly.
6. Theme: `.mesh-page`/`.mesh-icon`/`.mesh-section` CSS classes, confirmed NOT global (absent from
   `src/styles.scss`) — every subtopic `.scss` needs the full `.mesh-page { max-width: 860px;
   margin: 0 auto; }` wrapper rule; confirmed in-browser via `getComputedStyle` that the 860px cap
   is actually applied on a live subtopic page, not full-bleed. `$accent: #466bb0`,
   `$tint: #eef2fb`, icon content `🕸️`, `tech="javascript"` in `app-page-meta` (Service Mesh pages
   share the JS/TS playground and run-it links, same as every other non-JS-runtime hub).
7. **A real style-consistency issue caught by the gotcha sweep, not a build error**: one subtopic
   file mixed backtick-wrapped inline code (`` `kubectl` ``/`` `istioctl` ``) with `<code>` tags in
   the SAME `[innerHTML]`-bound `theory.points` sentence — since `points` renders via `[innerHTML]`,
   the backticks render as literal backtick characters rather than styled code, producing visibly
   inconsistent formatting within one sentence. Fixed by converting the backtick-wrapped mentions to
   `<code>` tags, matching the identical fix already made once in the Terraform hub's own `cicd`
   batch (see gotcha item there) — confirms this specific mixing mistake recurs across hubs and is
   worth a dedicated look (comparing backtick usage against `<code>` usage within the same sentence)
   on any future subtopic batch, not just a one-off.
8. **The `/service-mesh/linkerd` batch found and fixed a genuine main-page inaccuracy**: the
   original "Traffic Split (Canary)" `codeTab` and the Challenge's own `starterCode`/`solution`
   ALL set `spec.service: myapp` (or `checkout`) and ALSO listed the identical name as one of
   `spec.backends` — a self-referential TrafficSplit. Verified directly against the SMI
   TrafficSplit specification's own text, which explicitly names and prohibits this exact pattern
   ("TrafficSplits cannot be self-referential"), reasoning that a backend sharing the apex's name
   becomes an ambiguous superset of multiple pod versions, making routing hard to reason about.
   Fixed by renaming the stable backend to `myapp-stable`/`checkout-stable` in every occurrence
   (codeTab, Challenge starterCode, Challenge solution, plus the Challenge's own hints/description
   text) — confirmed via grep that no `service: myapp`/`service: checkout` self-reference remained
   anywhere in the file before building. This follows the same "verify claims, fix real
   inaccuracies found during subtopic authoring" precedent established across many prior hubs
   (Blazor, Containers/K8s, AWS, Azure) — always check a main page's own code samples against the
   authoritative spec for the technology being demonstrated, not just prose claims.
9. **The `/service-mesh/resilience` batch found and fixed THREE separate genuine main-page
   inaccuracies, including one caught purely by cross-referencing a sibling page's own already-
   verified content**: (a) a theory bullet claiming fault injection and retries combine on the same
   route ("the retry fires against the fault-injected route... test retry end-to-end") directly
   CONTRADICTED the already-published, already-verified Traffic Management subtopic fact that Istio
   silently disables retries/timeout on any route with fault injection configured — caught while
   reading this page during normal batch prep, not by any tool; (b) outlier detection ejection
   duration was called "exponential" while the page's own accompanying formula
   (`baseEjectionTime × ejection count`) is actually LINEAR — verified via WebFetch against Envoy's
   own outlier-detection docs ("multiplied by the number of times the host has been ejected in a
   row"); (c) a QnA claimed `minHealthPercent` defaults to 50%, verified via WebFetch against
   Istio's own DestinationRule reference docs to actually default to 0% (disabled, "not typically
   applicable in k8s environments with few pods per service") — fixed to state the correct default
   AND the more precise "outlier detection disabled entirely, ALL hosts restored to rotation"
   behavior (not merely "stops ejecting new hosts"). **Lesson for any hub with 5+ completed
   topics**: cross-reference a NEW main page's claims against ALREADY-VERIFIED facts from sibling
   pages in the same hub, not just against external docs — internal contradictions are a real,
   catchable signal of a stale/wrong claim, and are cheaper to catch (compare against something you
   already verified this session) than an external doc lookup.
10. **A new confirmed variant of the stale-dev-server-artifact family, this time triggered by
    writing a subtopic's `.ts`/`.html`/`.scss` files across MULTIPLE separate tool calls rather
    than all at once**: the file-watcher's very first "Could not find template file" NG2008 error
    for the batch's third subtopic was expected (the `.ts` was written before its `.html`
    existed) — but the SAME error kept reappearing on every subsequent rebuild for several
    minutes after both files were confirmed present and correct on disk (`ls` directly confirmed
    it), even after a fresh `mesh-nav.ts` file-write (a real, substantive edit made earlier in
    this same batch) triggered its own successful rebuild. The fix that actually worked was a
    fresh save specifically on the AFFECTED SUBTOPIC's OWN `.ts` file (append a newline, then
    trim it back out) — not the shared nav component, not the routes file, not the data file —
    confirming the specific stale artifact is scoped to whichever file the watcher's cached
    dependency graph considers the "owner" of the broken resolution, which is not always the
    most recently-touched file in the batch. **Lesson: when this family of gotcha recurs, try a
    fresh write on the SPECIFIC file named in the error message first**, before touching
    `app.routes.ts` or a shared nav component — it is the more targeted and more reliable fix.
11. **The `/service-mesh/load-balancing` batch found and fixed TWO more genuine main-page
    inaccuracies, both involving a main page describing Envoy/Istio internals in slightly wrong
    terms rather than being simply incomplete**: (a) the main page's theory AND its QnA both
    stated active health checks are "configured via DestinationRule's `trafficPolicy.healthCheck`"
    — verified directly against Istio's own DestinationRule API reference that `TrafficPolicy` has
    exactly 8 fields (`loadBalancer`, `connectionPool`, `outlierDetection`, `tls`,
    `portLevelSettings`, `tunnel`, `proxyProtocol`, `retryBudget`) and `healthCheck` is not one of
    them — active health checks are reachable ONLY via an EnvoyFilter patching the generated
    cluster's own `health_checks` field, with no Istio API wrapper at all; (b) the quiz explanation
    for `warmupDurationSecs` claimed new pods ramp "from ~0% to their fair share" — verified via
    WebFetch against Envoy's own `SlowStartConfig` proto spec that `min_weight_percent` defaults to
    10%, not 0%, so a new pod receives real traffic from the very first moment it's eligible.
    **Also confirmed a genuine collision** (`load-balancing` was already claimed by the AWS hub's
    own topic) resolved by hub-prefixing to `mesh-load-balancing` — consistent with the
    established pattern of checking both quoted and unquoted key forms before adding any new
    hub-topic entry to the shared `SUBTOPICS` map. **Lesson for future WebFetch verification passes
    on Istio/Envoy API surface claims**: when a main page names a specific nested field path
    (`trafficPolicy.healthCheck`), verify the EXACT field list of the parent message via the
    official API reference rather than just checking whether the general FEATURE (active health
    checking) exists somewhere in Envoy — a real capability can still be mis-attributed to the
    wrong config surface, which is a distinct and easy-to-miss category of inaccuracy from "this
    feature doesn't exist at all."
12. **The `/service-mesh/mtls` batch found and fixed a genuine SELF-CONTRADICTING inaccuracy
    within the same main page** — one code example ("Custom CA via cert-manager") correctly used
    `secretName: cacerts`, while a separate theory bullet ("Emergency cert rotation") named a
    DIFFERENT secret, `istio-ca-secret`, and the quickRef list also used `istio-ca-secret`.
    Verified via WebFetch/WebSearch against Istio's own tracked GitHub issue (#45685, closed via
    PR #45291) that these were historically two SEPARATE secret names (`cacerts` for a
    user-plugged custom CA, `istio-ca-secret` for Istiod's own auto-generated self-signed CA)
    that were deliberately unified into a single `cacerts` secret for both cases — confirming the
    main page's own inconsistency was a real, dateable drift (one spot updated to the modern name,
    another left on the old one), not two different facts for two different scenarios. Fixed all
    three occurrences (quickRef, theory bullet, and tightened the wording to explain the historical
    unification rather than just silently swapping the name). **A second correction, more about
    PRECISION than pure inaccuracy**: the main page's "Kubernetes probes bypass Istio's mTLS
    because they come from the kubelet (not through Envoy)" phrasing was misleading — verified via
    WebFetch against Istio's own app-health-check docs that probes would actually BE intercepted by
    Envoy's iptables rules just like any other inbound traffic; what actually keeps them out is the
    sidecar injector actively REWRITING the probe definition in the pod spec to target istio-agent's
    dedicated status port (15020), which is deliberately excluded from interception — tightened the
    theory bullet, the matching `mistakes` entry, and the quiz explanation to state the actual
    mechanism instead of the vaguer "come from the kubelet" framing. **A third, purely-additive
    subtopic** closed a real gap rather than a page error: the main page's "create in istio-system
    namespace with no selector" guidance for a mesh-wide PeerAuthentication omits that the resource
    must ALSO be named exactly `default` — verified via WebSearch against Istio's own Authentication
    Policy docs; a differently-named policy meeting the other two conditions applies with no error
    but is silently never picked up as the mesh baseline. Confirmed `mtls` collision-free in the
    SUBTOPICS map (checked both quoted and unquoted forms) — left as a bare key. No stale-dev-server
    incident this batch — the toggle count updated correctly (8→9) on the first browser check.
13. **The `/service-mesh/authorization` batch found and fixed a genuine, high-value inaccuracy
    where the main page's OWN "mistakes" block had DENY and ALLOW's empty-`rules` semantics
    completely backwards** — it claimed an ALLOW policy with empty rules "does not deny all
    traffic... is effectively meaningless" and recommended DENY with an explicit universal-match
    rule as the correct deny-all pattern instead. Verified directly against Istio's own
    AuthorizationPolicy reference: empty/unset rules under DENY "the match will never occur" (NO
    effect, denies nothing), while empty/unset rules under ALLOW "is equivalent to setting a
    default of deny for the target workloads" (the correct, documented deny-all idiom) — the
    main page had these two exactly backwards, and this DIRECTLY CONTRADICTED the same page's own
    QnA elsewhere ("Create a mesh-wide ALLOW policy... with... empty rules — this results in
    default-deny"), which was already correct. Rewrote the mistakes entry to describe the
    genuinely confusing, correctly-documented behavior instead. **A second, richer verification
    surfaced a THIRD distinct state worth its own subtopic**: `rules: []` (empty array, never
    matches) versus `rules: [{}]` (one empty rule object, "always matched" per Istio's own docs)
    are OPPOSITE behaviors that look nearly identical in YAML — a real, documented trap distinct
    from the DENY/ALLOW asymmetry itself. **A third subtopic contrasts directly against the mTLS
    batch's own PeerAuthentication-naming-requirement subtopic**: verified via WebFetch that
    AuthorizationPolicy has NO equivalent "must be named default" rule for its mesh-wide scope —
    multiple differently-named mesh-wide AuthorizationPolicy resources all apply cumulatively,
    the opposite risk profile from PeerAuthentication (where a misnamed policy is silently
    ignored, here the risk is forgetting about old policies that are STILL silently active).
    **A fourth verified fact closed a real quickRef gap**: AuthorizationPolicy's `action` field
    has a documented FOURTH value, CUSTOM (delegates to an external extension provider), evaluated
    even BEFORE DENY — full precedence is CUSTOM → DENY → ALLOW, one stage more than the main
    page's three-action (ALLOW/DENY/AUDIT) description. Confirmed `authorization` collision-free
    in the SUBTOPICS map. No stale-dev-server incident — toggle count updated correctly (9→10) on
    the first browser check. **This batch is a strong example of the "verify claims against a
    sibling subtopic already written this same hub" technique** (established in the `resilience`
    batch) extending naturally to cross-TOPIC contrasts within a hub, not just within-page
    self-consistency checks — the PeerAuthentication-naming subtopic from the PRIOR batch (`mtls`)
    directly informed the shape of this batch's naming-contrast subtopic.
14. **The `/service-mesh/metrics` batch found and fixed a genuine, fully-verified inaccuracy where
    EVERY ONE of the main page's four Grafana dashboard ID-to-name pairings was wrong** — the page
    claimed "7636 (mesh), 7630 (service), 7645 (workload), 7639 (performance)." Verified directly
    against grafana.com's own dashboard listings (fetched by exact ID/title for each), the correct
    mapping is 7639=Mesh, 7636=Service, 7630=Workload, 7645=Control Plane, 11829=Performance — a
    consistent off-by-one-style shift across all four, not an isolated typo. Fixed the main page to
    list the correct mapping, including the fifth (Control Plane) dashboard the original never
    mentioned at all. **Lesson reinforced**: a SPECIFIC numeric identifier in prose (a dashboard ID,
    a port number) reads as more authoritative than a general claim, which paradoxically makes it
    LESS likely to be double-checked before use — precision is not correctness, and specific
    identifiers deserve their own dedicated verification pass against a primary source. **A second
    fix, more about precision than pure inaccuracy**: the main page described the Telemetry API's
    scope hierarchy as "additive and composable" — verified via WebFetch against Istio's own
    Telemetry task guide that a narrower-scoped resource actually "completely overrides" (not
    merges with) whichever specific field it touches from a broader scope, confirmed by Istio's own
    worked example where a namespace-level custom-tags config causes a mesh-level tag to vanish
    entirely rather than persist alongside the new one. Tightened the main page's phrasing
    accordingly. **A third, purely gap-closing subtopic**: verified via Istio's own FAQ that
    in-proxy telemetry (the current architecture, since Mixer's removal) has "no mechanism for
    configuring custom buckets for histogram metrics" — a real precision ceiling for
    `histogram_quantile()`-based SLO math the main page discusses extensively (burn-rate multipliers,
    99.9% targets) without ever mentioning. Confirmed `metrics` collision-free in the SUBTOPICS map.
    No stale-dev-server incident this batch (a fresh `ng serve` cold-start simply needed its normal
    initial compile time, confirmed via a `curl`-polling background Bash task rather than fixed
    `sleep` calls) — toggle count updated correctly (10→11) on the first browser check once the
    server was actually ready.
15. **The `/service-mesh/tracing` batch found and fixed THREE separate issues on the main page,
    including this hub's first FABRICATED CITATION**: (a) the QnA's "Prometheus Exemplars (RFC
    4652)" attribution — RFC 4652 is a real, existing IETF document, but about a completely
    unrelated topic; verified via WebSearch that Exemplars are actually specified by the
    OpenMetrics spec, not any IETF RFC at all. This is a genuinely different failure mode from
    every prior inaccuracy in this hub (wrong field, wrong default, backwards semantics) — the
    described BEHAVIOR was accurate, only the claimed SOURCE was fabricated, which means
    verifying "does this sound plausible" isn't enough; a citation needs its own dedicated check
    of whether the cited source actually exists and says what it's claimed to. (b) "Istio 1.16+
    supports OpenTelemetry as a first-class tracing provider" — verified by checking whether the
    OpenTelemetry tracing-provider task page exists in Istio's own archived docs for each
    version: 404 at v1.16, v1.18, v1.20, and v1.21, first appearing at v1.22 — corrected the
    main page's version claim accordingly. **New verification technique documented**: checking
    whether `istio.io/vX.YY/docs/...` resolves for a specific archived version is a fast, direct
    way to bound when a documented feature was introduced, more reliable than trusting a
    remembered/assumed version number. (c) The main page's own "Enable Tracing" code example
    configured BOTH `meshConfig.defaultConfig.tracing.sampling` AND the Telemetry API's
    `randomSamplingPercentage` simultaneously without ever stating which wins if they disagree —
    verified via WebSearch that the Telemetry API always takes precedence, a real gap since the
    main page's own example never surfaces this ambiguity (the two values happened to match in
    the example, hiding the issue). Confirmed `tracing` collision-free in the SUBTOPICS map. No
    stale-dev-server incident — toggle count updated correctly (11→12) on the first browser
    check. Verifying the QnA fix required actually clicking into the specific collapsed QnA
    question (not just the outer accordion toggle) before its text appeared in the DOM for a
    `get_page_text`/text-search check — the outer "Interview Q&A" toggle alone only reveals the
    question LIST, not each answer's own body text.
16. **The `/service-mesh/kiali` batch found and fixed THREE separate issues, including a
    self-contradicting error code cited two different wrong ways on the same page**: (a) the
    main page's blanket claim "It does NOT directly query Envoy — it reads from Prometheus" was
    an overgeneralization contradicted by the SAME page's own QnA describing the "Envoy config
    viewer" — verified via WebSearch that this specific feature queries Istiod's own debug
    endpoint (`/debug/config_dump?proxyID=...`, port 15014) directly, with zero Prometheus
    involvement; scoped the main-page claim to the service graph specifically. (b) The quiz
    answered "KIA0201" for a VirtualService referencing a non-existent subset, while the
    mistakes block showed KIA0201 with a DIFFERENT message text ("VirtualService has no route
    for host") — verified via WebFetch against Kiali's own validation docs that NEITHER
    description was correct: real KIA0201 means "more than one DestinationRule for the same
    host/subset combination" (a duplicate-DestinationRule warning), and the actual "subset not
    found" check is a different code entirely, KIA1107. This is the FIRST inaccuracy in this hub
    where the main page contradicted ITSELF on the same fact in two different sections, not just
    stated one wrong thing consistently. (c) The theory bullet claimed traffic-animation dot
    "speed" is "proportional to RPS" — verified via WebSearch against Kiali's own documented
    graph semantics that speed actually represents RESPONSE TIME (faster = quicker responses),
    while DENSITY (how tightly packed the dots are) is what represents RPS — the two signals
    were conflated. Confirmed `kiali` collision-free in the SUBTOPICS map. No stale-dev-server
    incident — toggle count updated correctly (12→13) on the first browser check.
17. **The `/service-mesh/gateway-api` batch found and fixed this hub's most-REPEATED single
    inaccuracy — wrong in three separate sections of the same page**: the theory, the mistakes
    block, and the quiz all described HTTPRoute conflict resolution as "creation timestamp —
    older routes win," treated as the PRIMARY rule. Verified directly against the Gateway API
    spec's own documented precedence: match SPECIFICITY is checked first — method match, then
    largest number of header matches, then largest number of query param matches, then path
    specificity (exact beats prefix, longer prefix beats shorter) — and creation timestamp is
    only the tiebreaker when two rules are tied on EVERY specificity dimension, with alphabetical
    `{namespace}/{name}` order as the final tiebreaker after that. The mistakes-block example was
    especially wrong: it showed a MORE SPECIFIC route (`/api/v2`) LOSING to a LESS SPECIFIC one
    (`/api`) purely because the less-specific route was created first — backwards from the real
    spec. Fixed the theory bullet, the mistakes-block wrong/right/explanation, the quiz
    question/options/explanation, AND the revision summary's mustKnow bullet — four separate
    edits for one inaccuracy, the most main-page touchpoints any single correction in this hub
    has needed so far. **Two additional gap-closing subtopics, both confirmed-correct rather than
    corrections**: (a) verified Istio's GAMMA (mesh HTTPRoute) support version claim ("1.16+") was
    actually ACCURATE this time (unlike the earlier OpenTelemetry version claim in the `tracing`
    batch) — not every version claim worth checking turns out wrong, the discipline is to verify,
    not to assume every claim is broken; (b) ReferenceGrant recently graduated from `v1beta1` to a
    stable `v1` (confirmed via a Kubernetes blog post dated within the last few months) while
    GatewayClass/Gateway/HTTPRoute graduated earlier — the main page's `v1beta1` ReferenceGrant
    examples still work (identical schema) but are worth noting as dated; (c) the main page's
    HTTPRoute-status debugging guidance never mentioned the GATEWAY resource's own separate
    `Programmed` status condition, checking which FIRST is more efficient than debugging routes
    one at a time when multiple routes sharing one Gateway fail simultaneously. **A real
    apostrophe-escaping mistake caught and self-corrected during this batch**: an `[next]` label
    in one subtopic's own `.html` file was initially written with a backslash-escaped apostrophe
    (`Gateway\'s`) — the `.ts`-field convention — instead of the typographic curly quote (`'`)
    the `.html` bound-attribute case actually requires; caught by direct review before the build,
    consistent with this being a recurring, easy-to-make mixup documented earlier in this file
    for other hubs (Node.js, Linux) too. Confirmed `gateway-api` collision-free in the SUBTOPICS
    map. No stale-dev-server incident — toggle count updated correctly (13→14) on the first
    browser check.
18. **The `/service-mesh/ingress-gateway` batch found and fixed another genuine, repeated
    overgeneralization — "TLS secrets MUST be in istio-system"** stated as an absolute rule
    across the theory, mistakes block, and quiz. Verified via a GitHub issue quoting real Istio
    behavior ("when one configures a gateway in namespace ns1, credentialName should reference a
    secret in that same namespace ns1") that the actual constraint is namespace-RELATIVE — the
    secret must match the GATEWAY WORKLOAD's own namespace, which only equals `istio-system`
    because that's where the DEFAULT `istio-ingressgateway` happens to run. This directly
    contradicted the SAME page's own "Dedicated Gateway per team" theory bullet, which describes
    exactly the scenario (a gateway deployed in a non-default namespace) where the absolute
    framing breaks. Fixed all four touchpoints (theory, mistakes block, quiz, mustKnow). **Two
    further subtopics were mechanism deep-dives, not main-page corrections** — verified via
    WebSearch/WebFetch and written as gap-closing elaborations: (a) SNI-based Envoy filter-chain
    matching is the actual mechanism behind "gateway presents the correct cert per hostname,"
    something the main page states as an outcome without ever explaining; (b) `REGISTRY_ONLY`
    egress blocking works via a dedicated `BlackHoleCluster` Envoy cluster returning a local 502
    from the CALLING service's own sidecar (confirmed via WebSearch quoting Istio's own blog on
    monitoring blocked/passthrough traffic) — contrasted with the default `ALLOW_ANY` mode's
    `PassthroughCluster`. **Hit the documented Windows MAX_PATH `git add` failure for real** on
    the third subtopic's ~95-character slug (`registry-only-blocks-traffic-via-a-...`) — applied
    the established fix exactly: renamed only the physical folder/file to a short name
    (`registry-only-blackhole-502`), updated the component's own `templateUrl`/`styleUrl` and
    `app.routes.ts`'s import path, while leaving the route's own `path:` (URL segment) and every
    other wiring touchpoint (SUBTOPICS map, breadcrumb, sidebar, search index, nav labels) on the
    original, fully descriptive slug — confirmed the route still resolves correctly by direct
    navigation before committing. Confirmed `ingress-gateway` collision-free in the SUBTOPICS map.
    No stale-dev-server incident — toggle count updated correctly (14→15) on the first browser
    check (after the rename, a full rebuild + fresh navigate confirmed the renamed component's
    route still resolves).
19. **The `/service-mesh/performance` batch found and fixed THREE genuine issues, including this
    hub's second fabricated-mechanism claim and a purely self-contained numeric contradiction**:
    (a) `useRemoteAddress: true` was listed as an "HTTP/2 multiplexing" performance lever —
    verified via WebSearch against Envoy's own HTTP connection manager docs that this field
    controls whether Envoy trusts the raw connection address or the X-Forwarded-For header for
    CLIENT IDENTITY, entirely unrelated to HTTP/2 or connection overhead, with Envoy's own
    guidance recommending OPPOSITE values for edge vs. internal proxies — the exact opposite of
    treating it as a uniform performance knob; (b) "fresh Envoy instances spend 30-60s warming
    up JIT-compiled filters" — verified via WebSearch that Envoy's standard (non-WASM) filter
    chain is natively-compiled C++ with no runtime JIT step at all; only the OPTIONAL WASM
    extensibility mechanism (V8/Wasmtime) involves anything JIT-like, and most sidecars never
    load one — corrected to the real, verifiable warmup causes (cold connection pools, DNS
    caches, incomplete xDS propagation); (c) the theory bullet's own memory formula ("~1MB per
    1000 services") predicted a negligible ~0.5MB effect for the page's own 500-service worked
    example, while the mistakes block AND QnA both independently stated ~500-550MB for that
    SAME scenario — a ~1000x self-contradiction requiring ZERO external research to catch, only
    arithmetic cross-checking the page's own formula against its own worked examples. Reconciled
    to the internally-consistent ~1MB-PER-service coefficient (matching the more specific,
    twice-repeated figures), which also retroactively makes the page's own Sidecar-CRD-scoping
    recommendation numerically well-motivated instead of contradicting its own math. **Real
    `SUBTOPICS` collision hit and resolved**: bare `performance` was already claimed by the
    Node.js hub's own topic — hub-prefixed to `mesh-performance`, matching the existing
    `mesh-performance` progress/search key already used by this hub's own main page (confirmed
    via `route.startsWith('mesh-')` in `search.ts`'s `url()` already handling the composite
    subtopic keys correctly with no special-casing needed, unlike the `k8s-architecture` case).
    No stale-dev-server incident — toggle count updated correctly (15→16) on the first browser
    check.

### Architecture Patterns hub subtopic wiring — first pilot; the 11th `*NavComponent` in a row
missing the subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/arch-patterns/monolith-vs-modular`,
2026-07-30) — do this same check before any other new hub's first subtopic set:

1. **`ArchNavComponent` (`shared/arch-nav/arch-nav.ts`) had ZERO subtopics-accordion support** —
   the same structural gap already hit and fixed on every `*NavComponent`-based hub's own pilot
   before it (Go, DevOps, Containers, AWS, Azure, Linux, Terraform, Service Mesh, System Design —
   confirmed this makes 11 in a row, since System Design was the 10th). Fixed identically: added
   `signal`, `Router`, `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS` (from
   `../../../data/subtopics`) to the imports, then the same three methods
   (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) and constructor-level router
   subscription, copied directly from `TerraformNavComponent`'s own implementation (read
   directly, not reconstructed from memory, per the established copy-fidelity discipline). Worked
   correctly on the first browser check — no stale-chunk incident.
2. **No `SUBTOPICS` map bare-key collision for `monolith-vs-modular`** (checked both quoted and
   unquoted forms, confirmed collision-free) — left as a bare key.
3. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'arch-patterns/monolith-vs-modular'`,
   confirmed the base entry — and its own `ARCH_DEFAULT` constant — already existed) — subtopic
   composite keys follow suit: `'arch-patterns/monolith-vs-modular/<slug>'`.
4. **`ARCH_LABELS` breadcrumb map uses bare keys** (`'monolith-vs-modular'`), matching the generic
   pattern every hub's own dedicated labels map shares — composite subtopic keys there are bare
   too (`'monolith-vs-modular/<slug>'`).
5. **`.arch-page` wrapper rule is NOT global** (confirmed absent from `src/styles.scss`) — every
   subtopic `.scss` needs the full `.arch-page { max-width: 860px; margin: 0 auto; }` rule.
6. **No live playground** — architecture-pattern content (module structure, DDD concepts, code
   organization) has no in-browser runtime, following the same `<app-code-block>`-only pattern as
   every other non-JS-runtime hub — every code tab across all three subtopics uses plain
   TypeScript/bash illustrative snippets, matching the main page's own `codeTabs` style exactly.
   `$accent: #7c3aed`, `$tint: #f5f3ff`, icon `🏛️`, `tech="javascript"`.
7. **Corrected a stale nav-groups line in this file's own "Current state" section** — Architecture
   Patterns' nav groups were previously documented as "Foundations, Service Patterns, Data
   Patterns, Deployment, Reference," which does not match the real `arch-nav.ts` (actual groups:
   Architectural Styles, Microservices, Messaging, Domain-Driven Design, Integration, Reference)
   — the same "verify a hub's own documented summary against the real component file" discipline
   already applied to the Python hub's CSS-class staleness earlier in this file.
8. **The `monolith-vs-modular` batch found and fixed TWO genuine main-page issues, both
   self-contained (zero external research needed)**: the theory section's own "Rule of thumb: you
   need at least a team of 10-15 engineers... before microservices pay off" contradicted the
   quiz explanation's original "choose a modular monolith when the team is small (fewer than 20
   engineers)" — for a team of 17, the page gave opposite advice depending on which section was
   read; corrected the quiz explanation to reference the theory section's own 10-15 figure
   directly rather than maintain a second, independently-chosen number. The Challenge solution's
   SharedKernel exports a `ProductId` value object specifically for cross-module type safety, but
   the one actual cross-module method (`getProductPrice`) originally took a bare `string`
   instead — undercutting the entire point of a typed SharedKernel at the one boundary that
   needed it; fixed the signature to `getProductPrice(productId: ProductId): Promise<Money>`. A
   third, gap-closing subtopic named a real tradeoff the main page never states despite covering
   almost every other angle: a modular monolith provides logical isolation (module boundaries)
   but not operational isolation (process-level fault containment) — a crash or memory leak in
   one module can take every other module down too, unlike true microservices. **Real gotcha
   caught during the gotcha sweep, not the build**: generic syntax like `Promise<Money>` written
   as plain prose inside `[innerHTML]`-bound `theory.points`/`exercise.prompt` fields would have
   been silently parsed as an HTML tag and vanished — fixed by wrapping in
   `<code>...&lt;...&gt;</code>` before the build ever ran, confirmed via `document.body.innerText`
   checks after publishing. Build passed clean. Browser-verified: nav accordion opens with all 3
   labels on the first check; both main-page fixes confirmed rendering — the team-size fix
   required clicking through all 6 quiz questions one at a time (`Next →` after each answer) since
   this quiz shows one question at a time rather than a flat list, and the SharedKernel fix
   required Reveal Solution + all matching "▼ View Code" toggles; 860px wrapper confirmed via
   `getComputedStyle`.

**The `layered-architecture` batch found and fixed TWO more genuine issues, both self-contained
(zero external research needed)**: the page's own QnA claimed "layered architecture often allows
Infrastructure to be the bottom layer that Domain depends on" — directly contradicted by THREE
other independent sections of the same page, all describing the opposite dependency direction
for what the QnA called the identical pattern: the Quick Reference ("Domain Layer... zero
external deps"; "Infrastructure Layer... implements domain interfaces"), the mistakes block
(explicitly forbids "Domain layer importing infrastructure," with the fix being "Domain defines
interface; Infrastructure implements it"), and quiz Q1's own explanation ("Infrastructure
implements Domain interfaces (dependency inversion)"). Rather than pick a side abstractly, fixed
the 3-to-1 outlier (the QnA) to reconcile with the majority, while preserving the QnA's still-
valid point about what actually distinguishes Clean Architecture (enforcement rigor, not mere
presence of dependency inversion — since the page's own recommended layered-architecture
practice already uses it). The Challenge solution's `PlaceOrderHandler` called
`this.repo.save(order)` but declared no constructor and no `repo` field anywhere in the class —
a genuine compile error in TypeScript strict mode, inconsistent with the page's own EARLIER,
correct "Application Layer Handler" theory example, which correctly declares
`constructor(private orders: IOrderRepository, ...)`; fixed by adding the matching constructor
parameter property. A third, gap-closing subtopic explained WHY the page's own "loose layering
may skip a layer for read-only queries" guidance specifically names reads as safe — a skipped
layer's only job on a write path is enforcing invariants over a state change (demonstrated via
the page's own `Order.confirm()` example), and a read changes no state, so there's no invariant
to bypass — connecting this to CQRS, which the page's own QnA already names as a related pattern.
**Self-caught and fixed an over-escaped `\'` inside a backtick-delimited `code:` field before the
build** (two instances — backticks never need apostrophe-escaping; the correct form is a bare `'`
or a double-quoted string, not `\'`, which renders a visible stray backslash). No `SUBTOPICS`
collision for `layered-architecture` (checked both forms, confirmed collision-free, left bare).
Build passed clean. Browser-verified: nav accordion opens with all 3 labels on the first check;
both main-page fixes confirmed rendering — the QnA fix needed the QnA section's outer toggle plus
the specific question's own row click, and the Challenge fix needed Reveal Solution + all
matching "▼ View Code" toggles; 860px wrapper confirmed via `getComputedStyle`.

**The `clean-architecture` batch found and fixed TWO more genuine issues, both self-contained
(zero external research needed), plus a real cross-hub SUBTOPICS collision risk caught before it
could cause a leak**: the Quick Revision's own `mustKnow` list stated "Entities → Use Cases →
Interface Adapters → Frameworks (outer to inner)" — but Entities is the page's own documented
INNERMOST ring and Frameworks the OUTERMOST, so the sequence as written is actually inner-to-outer,
directly contradicting its own parenthetical label; quiz Q1's own explanation lists the identical
four rings in the reverse order ("Frameworks → Adapters → Use Cases → Entities"), which correctly
reads as outer-to-inner, confirming which section's label needed fixing. Corrected to
"(inner to outer)". The "Infrastructure Adapter" code sample's `OrdersController` built its HTTP
response inline (`Response.json({ orderId: result.orderId }, ...)`) instead of delegating to a
presenter — despite the page's OWN "Ring Structure" file listing explicitly naming
`OrderPresenter.ts` as a separate file, the theory section explicitly splitting controller and
presenter responsibilities, and the mistakes block's own "right" example showing
`OrderPresenter.toDto(result)` as the correct pattern for this exact scenario — the controller was
quietly committing a milder version of the anti-pattern the page's own mistakes block warns
against. Added a real `OrderPresenter` class and wired the controller to use it. A third,
gap-closing subtopic elaborated on the OutputPort pattern the page's own QnA names ("communicate
results via an OutputPort interface or return value") but never shows in code — demonstrating how
one Use Case can serve an HTTP controller, a GraphQL resolver, and a CLI command with zero
duplicated mapping logic, directly extending the presenter fix from subtopic 2. **A genuinely new
kind of gotcha for this file**: `clean-architecture` is NOT collision-free in the way the standard
sweep checks — `app.routes.ts` already had TWO separate `'clean-architecture'` routes (one under
`architecture/design-patterns/clean-architecture`, one under `architecture/arch-patterns/
clean-architecture`), confirmed by grepping the route path before editing. `subtopics.ts` itself
had no existing `'clean-architecture'` entry (so the standard "checked both forms, collision-free"
sweep would have said "left bare"), but a bare key here would have been picked up by the SAME
shared flat `SUBTOPICS` map the moment the Design Patterns hub's own `DpNavComponent` ever adds
its own accordion support and calls `subtopicsOf('clean-architecture')` for ITS topic — leaking
these Architecture-Patterns subtopics onto the wrong hub's page. Confirmed `DpNavComponent`
currently has no `subtopicsOf()` call at all (no active leak today), but hub-prefixed the entry to
`arch-clean-architecture` anyway as a proactive fix, since the risk was directly confirmed rather
than merely hypothetical — a stronger signal than the general "some future hub might pick this
slug" case the standard collision sweep is scoped for. Browser-verified the Design Patterns hub's
own `/design-patterns/clean-architecture` page renders normally with no leaked subtopic content.
**New standing check to add whenever a topic slug is shared across two DIFFERENT hubs (found via
duplicate route paths in `app.routes.ts`, not just duplicate keys in `subtopics.ts`)**: hub-prefix
the `SUBTOPICS` entry preemptively rather than trusting a clean `subtopics.ts` sweep alone, since
that sweep only catches collisions that already exist, not ones a sibling hub's own future Phase
10 pilot would introduce. Build passed clean. Browser-verified: nav accordion opens with all 3
labels; both main-page fixes confirmed rendering (the Infrastructure Adapter fix needed clicking
the Code Examples section's own "▼ View Code" toggle FIRST to reveal the tab buttons, then the
specific "Infrastructure Adapter" tab); 860px wrapper confirmed via `getComputedStyle`.

**The `hexagonal-architecture` batch found and fixed THREE more genuine issues**: the Challenge's
starterCode and solution both used `INotificationGateway` (via `implements`) and
`SendNotificationUseCase` (via `new`) throughout, but neither type was ever declared anywhere in
the Challenge — a genuine TypeScript compile error, the same category of bug already found once
on the sibling Layered Architecture topic's own Challenge solution (an undeclared `this.repo`
field), confirming this is worth a standing check on every Challenge solution in this hub: does
every referenced type name have a matching declaration in the same Challenge? Fixed by declaring
both, matching the main page's own established `PlaceOrderUseCase implements PlaceOrderPort`
pattern. The theory's hexagon-shape explanation ("drawn as a hexagon to emphasise equal treatment
of all sides — no 'top' or 'bottom'") was verified via WebSearch against Cockburn's own account to
capture only ONE of his two stated reasons — the other being pure drawing mechanics (a hexagon is
the simplest non-rectangular polygon with enough room per side to sketch multiple ports without
crowding); this wasn't a factual error so much as an incomplete one, fixed by adding the second
half. The Challenge's own hints explicitly named a production `SmtpGateway` in a composition-root
example, but the solution only ever built and used `InMemoryNotificationGateway` — directly
violating the page's own "every secondary port needs at least two adapters: real + in-memory" rule
stated in both `revision.mustKnow` and the QnA, and the exact anti-pattern the mistakes block's own
"Having only one adapter per port" entry warns against ("you have not implemented ports & adapters
— just an interface"). Fixed by adding a real `SmtpNotificationGateway` and wiring it at a separate
production composition root alongside the existing test-focused one. **A second real cross-hub
collision check performed this batch**: confirmed via a direct grep of `app.routes.ts` (not just
`subtopics.ts`) that no OTHER hub shares the `hexagonal-architecture` route slug, so the
`SUBTOPICS` entry was left bare — following the standing check established on the prior
`clean-architecture` batch (grep route paths directly, don't rely on a clean `subtopics.ts` sweep
alone). No `SUBTOPICS` collision for `hexagonal-architecture`. Build passed clean. Browser-verified:
nav accordion opens with all 3 labels on the first check; all three main-page fixes confirmed
rendering (the Challenge fixes needed Reveal Solution + all matching "▼ View Code" toggles); 860px
wrapper confirmed via `getComputedStyle`.

**The `vertical-slice` batch found and fixed ONE genuine issue via external verification, plus
two gap-closing additions** — this was the cleanest-authored main page in the hub so far, with no
self-contained internal contradictions found on a careful read (unlike every prior batch this
hub): the QnA's "MediatR (Jimmy Bogard) is the de facto standard" claim, stated with zero
qualification, was verified via WebSearch to have gone stale — MediatR launched a commercial
edition on July 2, 2025 under Bogard's new company, Lucky Penny Software, in a dual-license model
(free for individuals and companies under $5M USD annual revenue, paid above that). This is a
distinct FAILURE MODE from every prior "self-contained contradiction" finding in this hub — a
"standard tool" recommendation going stale over time even though the underlying pattern/library
technically still works the same way, worth watching for on any technology-recommendation page.
Corrected the QnA and added a gap-closing subtopic explaining the genuine TECHNICAL difference
(not just licensing) between MediatR's original reflection-based runtime dispatch and newer
source-generator-based alternatives (Mediator, Wolverine) that gained traction as a result — a
real architectural distinction in HOW the same conceptual pattern gets implemented. A third,
purely gap-closing subtopic named the "Rule of Three" as a concrete decision heuristic for when
cross-slice duplication should finally be extracted into a shared abstraction, extending the
page's own "some duplication is an accepted tradeoff" theory bullet with an actionable trigger it
never stated. **Self-caught and fixed the SAME over-escaping mistake as the `layered-architecture`
batch** (a `\\'` instead of `\'` inside a nested single-quoted string within a backtick-delimited
`code:` field) — worth treating as a standing, easy-to-repeat mistake specific to this codebase's
nested-template-literal convention, not a one-off. No `SUBTOPICS` collision for `vertical-slice`
(checked `app.routes.ts` directly, confirmed no other hub shares this slug). Build passed clean.
Browser-verified: nav accordion opens with all 3 labels on the first check; the QnA fix confirmed
rendering (needed the QnA section's outer toggle plus the specific question's own row click);
generic syntax (`IRequestHandler<TRequest, TResponse>`) in `[innerHTML]`-bound fields correctly
entity-escaped and confirmed rendering as literal text, not silently vanishing; 860px wrapper
confirmed via `getComputedStyle`.

**The `service-oriented` batch found and fixed TWO more genuine issues, one of them a new failure
mode for this hub — a fabricated citation, not a wrong fact or a self-contradiction**: the QnA's
question title asked "What does 'smart pipes, dumb endpoints' mean?" — the two halves of the
phrase reversed from the actual coined term. Verified via WebSearch that Fowler & Lewis's 2014
microservices article coined "smart endpoints, dumb pipes" specifically; the reversed order isn't
just a typo, it reads as a coherent (if unintended) description of the OPPOSITE architecture —
SOA's ESB-centric model, which the page's own theory section describes elsewhere. Confirmed via a
self-contained cross-check requiring zero research: the QnA's OWN answer body and the page's
theory section BOTH already used the correct order; only the question title had it backwards.
Fixed the question title to match. Separately, the theory section's own "'Microservices = SOA
done right' — Sam Newman, author of Building Microservices" line attributed a specific quote to a
named, real author — verified via two separate WebSearch passes that "SOA done right" is a
widely-repeated industry characterization (discussed at a SATURN 2015 workshop and in many
articles since) with no source tying the specific phrasing to Sam Newman. This is a genuinely
different failure category from every prior fix in this hub: not a wrong FACT and not an internal
contradiction, but a false claim about WHO said something — the underlying sentiment is
reasonable, but the citation isn't. Reworded to state it as an industry characterization rather
than a named quote. A third, gap-closing subtopic named the Tolerant Reader pattern (Postel's
Robustness Principle, later applied to API consumers by Martin Fowler) — the page's own
"Versioning service contracts too frequently" mistake-fix recommends additive-only producer
changes without ever naming the consumer-side half of the deal that actually makes additive
changes non-breaking in practice (a strict/brittle consumer, like a WSDL-bound SOAP client or a
JSON Schema validator with `additionalProperties: false`, can still break on a purely additive
change). Confirmed `service-oriented` collision-free via the standing `app.routes.ts` grep, left
bare. **Weighed, then deferred to, this file's own documented precedent on a `[prev]`/`[next]`
label**: reasoned through whether `&quot;`-entity-escaping a literal double quote inside a
`[prev]`/`[next]` bound-attribute label might actually be safe (HTML tokenizes outer attribute
boundaries on raw, undecoded quote characters, so entity decoding happening later seemed like it
should sidestep the collision) — but this file's own earlier, explicitly-tested finding states
plainly that no safe entity-escape exists for this specific case and the fix is to rephrase.
Deferred to that documented, presumably-tested precedent rather than gambling production content
on untested reasoning, and reworded the label to drop quote marks entirely instead. Build passed clean. Browser-verified: nav accordion opens
with all 3 labels (confirmed via direct DOM inspection after a same-tick query returned an empty
array — Angular's change detection hadn't flushed synchronously after the click, a timing
artifact, not a bug, confirmed correct on the next separate check); both main-page fixes confirmed
rendering (the QnA fix needed the section's outer toggle plus the specific question's own row
click); breadcrumb showed all 4 levels; sidebar showed tailored (not DEFAULT) content; 860px
wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10: 6 of 22 topics
complete.**

**The `microservices-principles` batch found and fixed ONE self-contained issue, plus two
gap-closing additions**: the "Decentralised Data" code example annotated a variable as
`product: ProductDto` and a helper function returned `Promise<ProductDto | null>` — but
`ProductDto` was never actually declared anywhere in that sample or elsewhere on the page. A
purely self-contained catch requiring no external research: the sample reads clearly (a human
infers the DTO shape from context) but would fail to compile the moment it's pasted into a real
project. Fixed by declaring the interface at the top of the sample. A gap-closing subtopic
quantified the "creates chatty network calls" consequence the mistakes block states but never
explains mechanically — per-hop network/serialization overhead is a FIXED cost paid on every
call regardless of how little work it does, and for a sequential chain these costs add up
linearly (a worked example: 6 sequential 15ms-overhead calls add ~90ms of pure tax before any
useful work happens), reframing the "nanoservices" mistake as really a bounded-context mistake
(a cohesive operation split across an unnecessary boundary) rather than simply "too many
services." A second gap-closing subtopic made "consumer-driven contract testing" concrete — the
theory section names it as what makes independent deployability safe without ever showing what
it actually checks or when it runs; the subtopic explains the Pact-style pattern (consumers
publish contracts, providers replay them in CI before every deploy) and explicitly ties it back
to the Service-Oriented Architecture topic's own Tolerant Reader subtopic as the same underlying
discipline at three different layers (producer policy, consumer coding practice, CI-enforced
verification). Verified via WebSearch that both the Werner Vogels "you build it, you run it"
quote (2006 ACM Queue interview) and the "two-pizza team, 6-10 people" figure are both accurate
and well-attributed — checked as candidates but found no issue, confirming not every
attribution-shaped claim on this hub is wrong. **A NEW variant of the generic-syntax-in-innerHTML
gotcha, distinct from every prior instance in this file**: wrapping a generic type mention in
markdown-style BACKTICKS inside an `[innerHTML]`-bound field (`` `Promise<ProductDto | null>` ``
in a `theory.points` entry and an `exercise.prompt`) does NOT protect it — the browser's HTML
parser still sees the raw `<`/`>` characters and misparses them as a tag start regardless of
surrounding backtick characters, since backticks have no special meaning to HTML. Caught via the
standing pre-build sweep (grepping for backtick-wrapped identifiers, not just bare `<word`
patterns) before this ever reached the build. **Fix: the same `<code>&lt;...&gt;</code>`
entity-escape already established for BARE generic mentions applies equally to backtick-wrapped
ones** — the backtick wrapping was cosmetic and never provided real protection; converted all
markdown-backtick inline-code mentions in the affected fields to real `<code>` tags for both
correctness and house-style consistency. Confirmed `microservices-principles` collision-free via
the standing `app.routes.ts` grep, left bare. Build passed clean. Browser-verified: nav accordion
opens with all 3 labels; the `ProductDto` fix confirmed rendering inside real `<code>` elements
(not vanished) after clicking the specific "Decentralised Data" tab button; breadcrumb showed all
4 levels; 860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10:
7 of 22 topics complete.**

**The `service-communication` batch found and fixed ONE overprecise numeric claim, verified via
WebSearch, plus two gap-closing subtopics**: the page stated Protobuf binary encoding is "~7×
smaller than JSON" in both the theory section and a code comment. Verified via WebSearch across
several independent benchmarks that the commonly cited figure is 3-5× smaller (uncompressed),
with one source describing "~56% smaller" (roughly 2.3×) as typical — the specific "~7×" figure
only appeared at the extreme edge of one small-message benchmark (protobuf reaching ~16% of
gzipped JSON size), not as a general rule. This is a distinct failure mode from a wrong fact or a
self-contradiction: the DIRECTION of the claim (Protobuf is smaller) was never in question, only
the specific multiplier was overprecise — a pattern this file has now seen several times (CDN
capacity figures, Grafana dashboard IDs): a specific-sounding number reads as more authoritative,
which paradoxically makes it less likely to get double-checked. Corrected to "commonly 3–5×
smaller... more for integer/enum-heavy payloads, less for string-heavy ones," trading a false
precision for an accurate, more useful range. A gap-closing subtopic explained the mechanism
behind the "Not handling message broker unavailability" mistake block's one-line "Use Outbox
Pattern" fix — why the write has to be atomic (writing the event to an outbox TABLE in the SAME
transaction as the business data, since a DB commit and a broker publish can't be one atomic
operation across two different systems) and how a separate relay process actually moves rows to
the broker, explicitly noting the pattern only guarantees at-least-once delivery (tying it back
to this same page's OWN consumer-idempotency mistake block as a complementary, not optional,
companion). A second gap-closing subtopic explained why the page's "REST for browser clients"
recommendation isn't just convention — verified via WebSearch that browsers have never
implemented the Fetch API's own `trailers` property (where gRPC sends its final call status),
and don't expose raw HTTP/2 framing at all, making direct gRPC calls from browser JavaScript a
genuine platform limitation, not a preference; gRPC-Web works around this via a translating
proxy at the cost of giving up client-streaming and full bidirectional streaming. **A NEW variant
of the backtick-vs-`<code>` style-consistency issue**: two backtick-wrapped mentions with no
angle brackets (safe from the vanishing-HTML-tag bug, just a style question) were converted to
`<code>` tags anyway for consistency with the rest of the same file, following the established
"don't mix backticks and `<code>` in the same sentence/field" convention from prior hubs.
Confirmed `service-communication` collision-free via the standing `app.routes.ts` grep, left
bare. Build passed clean. Browser-verified: nav accordion opens with all 3 labels; both main-page
fixes (theory bullet and code comment) confirmed rendering; breadcrumb showed all 4 levels; 860px
wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10: 8 of 22 topics
complete.**

**The `api-gateway-pattern` batch found and fixed ONE self-contained internal contradiction, plus
two gap-closing subtopics**: the page's own "Gateway Aggregation and Composition Patterns" theory
bullet states the fail-entire-request-vs-degrade-gracefully choice "should be explicit rather than
accidental" — but the "Request Aggregation" code example directly below it used `Promise.all([...])`
to fan out the three service calls, which fails the ENTIRE aggregation the instant any single call
rejects, discarding whatever the other calls returned even if they succeeded. The code silently
made exactly the choice the theory says should be explicit, without ever acknowledging it — a
purely self-contained catch (no external research needed, `Promise.all`'s fail-fast behavior is
basic, well-documented JS semantics) found by checking a theory bullet against its own adjacent
code example rather than reading either in isolation. Fixed by adding a comment naming the
tradeoff explicitly. A gap-closing subtopic named and explained the classic FIXED WINDOW rate
limiter algorithm the "Auth + Rate Limiting Middleware" codeTab actually implements (never named
on the page) and its well-known boundary-burst flaw — a client can get roughly double the stated
limit in a short span straddling the reset boundary, a real gap the page's own QnA gestures at
(mentioning both "sliding window" and "fixed window" without ever explaining what actually
differs between them). A second gap-closing subtopic made concrete what the QnA's "requiring
network policy enforcement" one-liner actually means — the forwarded `X-User-Id` header is just a
claim with nothing stopping a bypassed or compromised caller from forging it, and mTLS (not a
network policy alone) is the mechanism that actually verifies caller identity, explicitly tying
back to this hub's own Sidecar & Service Mesh topic. **A deliberately NOT-taken finding, worth
recording as a judgment call**: the YARP config codeTab is labeled `language: 'typescript'` for
what's actually a raw `appsettings.json` file — considered "fixing" this to match the Azure hub's
own established "never json/bicep, use bash instead" convention, but reasoned through the actual
rendering impact first: TypeScript's highlight.js grammar handles JSON-shaped content (quoted
keys, colons, brackets) reasonably well since JSON overlaps heavily with JS object literal syntax,
while `'bash'` grammar would likely render WORSE on a pure JSON blob (treating it as shell syntax).
Left unchanged rather than blindly applying a precedent from a different hub's content shape
without confirming it would actually improve anything — a real example of NOT treating every
established pattern as automatically transferable. Confirmed `api-gateway-pattern`
collision-free via the standing `app.routes.ts` grep, left bare. Build passed clean.
Browser-verified: nav accordion opens with all 3 labels; the Promise.all fix confirmed rendering
after clicking the specific "Request Aggregation" tab button; breadcrumb showed all 4 levels;
860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10: 9 of 22
topics complete.**

**The `service-discovery` batch found and fixed ONE self-contained code bug, plus two gap-closing
subtopics**: the Challenge's own reference solution for `InMemoryRegistry.register()` appended
every registration unconditionally, with no check for whether an instance with the same `id`
was already present. A service re-registering with the same id (a normal reconnect scenario, not
an edge case) silently created a duplicate entry — and since `setHealth(id, ...)` only updates
the FIRST matching entry via `.find()`, a stale duplicate could keep reporting healthy after the
real instance was marked down, inflating `getHealthy()`'s count. A purely self-contained catch,
found by tracing what happens when `register()` is called twice with the same id and checking
whether the class's OTHER methods still behave correctly afterward. Fixed with an upsert (filter
out the existing id before appending). A gap-closing subtopic found a real gap between the
mistakes block's promised fix ("refresh in the background") and what the accompanying codeTab
actually implements (cache-aside with TTL deletion — the cache entry is deleted, not proactively
refreshed, so the next caller after expiry pays the full synchronous lookup latency, and under
concurrent load multiple callers can independently trigger redundant lookups in the same brief
window). A second gap-closing subtopic, verified via targeted research into kube-proxy's own
documented behavior (a real GitHub issue confirming iptables-mode kube-proxy doesn't reset
already-established connections when a backend pod is removed), explained a genuine edge case
in the page's "Kubernetes Service discovery is fully transparent" framing — a long-lived
keep-alive HTTP connection stays pinned via Linux conntrack to its original backend pod even
after that pod is deleted and removed from the Service's routing rules, since kube-proxy's rule
updates only affect NEW connections. Confirmed `service-discovery` collision-free via the
standing `app.routes.ts` grep, left bare. Build passed clean. Browser-verified: nav accordion
opens with all 3 labels; the register() fix confirmed rendering after Reveal Solution + View
Code; breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`.
**Architecture Patterns hub Phase 10: 10 of 22 topics complete.**

**The `circuit-breaker` batch found and fixed TWO genuine issues, one self-contained and one
requiring external verification that overturned an initial wrong assumption, plus a gap-closing
subtopic**: the "Manual Circuit Breaker" codeTab's constructor accepted a `halfOpenMaxCalls:
number = 3` parameter that was never referenced anywhere in the class body — `onSuccess()`
unconditionally closed the circuit on the FIRST successful half-open call regardless of the value
passed, a purely self-contained catch (grep the class for the parameter name; it only appears in
the constructor). Removed the misleading dead parameter, with a note that the page's own Challenge
directly below correctly implements the fuller multi-trial version. Separately, the "Polly (.NET)"
codeTab added `AddRetry` before `AddCircuitBreaker` — my own first read assumed this made
CircuitBreaker the outer wrapper (later-added = outer), but a targeted WebSearch against Polly v8's
own documented pipeline semantics confirmed the OPPOSITE: the first-added strategy is outermost.
This meant the codeTab actually made Retry outer and CircuitBreaker inner — directly contradicting
the page's own theory bullet stating "a well-designed resilience strategy applies the circuit
breaker at the OUTER boundary... wrapping the entire retry logic." Swapped the builder order and
corrected the "Retrying when the circuit is open" mistake explanation, which had described the
backwards ordering as the recommended pattern. **Worth noting for future Polly/pipeline-ordering
claims**: my own initial intuition about which order produces which wrapping was wrong and only
caught by actually searching rather than trusting the assumption — a good reminder that "outer vs.
inner" builder semantics vary by library and are worth verifying, not inferring. A gap-closing
subtopic made the Bulkhead pattern concrete with a semaphore-based `Bulkhead` class — every OTHER
resilience pattern on the page (circuit breaker, retry, fallback) gets a full codeTab, but Bulkhead
was one abstract QnA sentence — and explained why it catches a failure mode circuit breaker alone
misses (a dependency that's merely slow, not yet failing, never trips a failure-rate-based circuit
breaker but can still exhaust concurrency). Confirmed `circuit-breaker` collision-free via the
standing `app.routes.ts` grep, left bare. Build passed clean. Browser-verified: nav accordion opens
with all 3 labels; both main-page fixes confirmed rendering after clicking the specific "Manual
Circuit Breaker" and "Polly (.NET)" tab buttons; breadcrumb showed all 4 levels; 860px wrapper
confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10: 11 of 22 topics complete.**

**The `sidecar-service-mesh` batch found and fixed THREE genuine issues, one a self-contained
internal contradiction, one a cross-hub duplicate of an already-verified stale fact, and one a
verified API-semantics correction**: the page stated THREE different sidecar latency overhead
figures in three different sections — "~10ms" in the theory, "~10-30ms" in the mistakes block,
"1-5ms" in the quiz explanation — for the exact same underlying fact. Verified via WebSearch
against Istio's own published benchmark trend (1.1: ~8ms, 1.6: ~3.12ms, 1.16: ~2.65ms at p90 —
overhead has been actively optimized down release over release) that modern figures land closest
to the quiz's "1-5ms," not the higher, likely-stale numbers elsewhere on the page. Reconciled all
three to a consistent, version-aware claim. Separately, the QnA's "GA in Istio 1.22+" claim for
Ambient Mesh is the EXACT same claim this session's own Service Mesh hub already researched and
corrected (verified against Istio's own GA announcement: the real release is 1.24, November 2024
— 1.22 was still Beta) — this page had independently repeated the stale figure, confirming that a
fact fixed once in a project doesn't automatically get fixed everywhere it recurs; recognizing the
duplicate was itself the finding, reusing the prior research rather than re-deriving it. Third,
verified via Istio's own documented VirtualService `HTTPRetry` spec, the Challenge solution's
comment "Total max latency: 2 × 2s = 4s" undercounted by one try — Istio's `attempts` field counts
RETRIES after the initial request, so `attempts: 2` means 3 total tries and a real worst case of
6s, not 4s. Fixed the comment and added the general `(attempts + 1) × perTryTimeout` formula.
**Also noteworthy**: an earlier assumption I made about Polly's own strategy-wrapping order (from
the `circuit-breaker` batch) was double-checked against this unrelated Istio API and found to be a
genuinely separate, unrelated semantics question — worth remembering that "does X count the
original + N more, or just N total" is a recurring category of API ambiguity across different
libraries, each needing its own verification rather than assuming a pattern learned on one API
transfers to another. Confirmed `sidecar-service-mesh` collision-free via the standing
`app.routes.ts` grep, left bare. Build passed clean. Browser-verified: nav accordion opens with
all 3 labels; all three main-page fixes confirmed rendering (the QnA fix needed the QnA section's
outer toggle plus the specific question's own row click; the Challenge fix needed Reveal Solution
+ View Code); breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`.
**Architecture Patterns hub Phase 10: 12 of 22 topics complete.**

**The `event-driven` batch — the hub's first Messaging-group topic — found and fixed TWO genuine
issues in the same Challenge reference solution, both self-contained, plus a gap-closing
subtopic**: the in-memory broker stub's `publish()` was written as
`async (e) => { for (const s of subscribers) await s(e); }` — awaiting each subscriber in turn
before returning. This directly contradicted the page's own repeated principle ("The producer
publishes and moves on"; the quiz's own explanation: "the publisher fires an event without
waiting for any response") — the stub secretly made `placeOrder()` block until every consumer,
including the Loyalty Service, had fully finished processing. A purely self-contained catch: no
external research needed, just tracing what `await` inside the loop actually does to the caller.
Fixed by firing subscribers without awaiting them (catching errors so one failing consumer can't
crash the demo). Separately, the same solution's DB save line was present but fully commented out
(`// await orderRepo.save(order); // DB first`) — directly contradicting the Challenge's own
hint #2, "Publish AFTER DB save — not before," and the page's own "Publishing events before the
DB transaction commits" mistake block. The solution never actually demonstrated the ordering it
was teaching, just described it in a dead comment. Fixed by adding a minimal, self-contained
`orderRepo` stub (matching the existing `broker` stub's style) and un-commenting the save call. A
gap-closing subtopic made the theory's abstract "fat events risk stale data" claim concrete with
a worked shipping-address scenario (where staleness genuinely bites) contrasted against a
loyalty-tier scenario (where embedding stale-ish data is actually fine) — illustrating the
tradeoff is real and situational, not a rule to always avoid fat events. Confirmed `event-driven`
collision-free via the standing `app.routes.ts` grep (also checked `subtopics.ts` directly, no
match), left bare. Build passed clean. Browser-verified: nav accordion opens with all 3 labels;
both main-page fixes confirmed rendering; breadcrumb showed all 4 levels; 860px wrapper confirmed
via `getComputedStyle`. **Architecture Patterns hub Phase 10: 13 of 22 topics complete.**

**The `cqrs-event-sourcing` batch found and fixed the hub's largest single reference-integrity
gap so far — SIX undefined members, not one — plus two gap-closing subtopics**: the "Snapshots"
codeTab called `order.rehydrate(e)`, `Order.restoreFromSnapshot(snapshot.state)`,
`order.uncommittedEvents`, `order.version`, `order.clearEvents()`, and `order.toSnapshot()` — none
of which exist on the `Order` class defined in the page's own earlier "CQRS — Commands & Queries"
codeTab (which only has `create`, `addLine`, `confirm`, and private `apply`/`when`). A purely
self-contained catch: each codeTab reads fluently in isolation, and the gap only surfaces when
checking a class's declared members across every codeTab that uses it, the same discipline already
applied to single undefined-type Challenge bugs elsewhere in this hub, just scaled to six members
on one class. Fixed by adding the missing methods inline in the Snapshots codeTab as an explicit
extension, distinguishing `apply()` (writes, records as uncommitted) from the new `rehydrate()`
(replay during load, should not re-mark already-persisted events as uncommitted). A gap-closing
subtopic made the QnA's one-sentence "optimistic updates... roll back" mention concrete with a
client-ID-based reconcile/rollback pattern (the stable ID is what lets the eventual authoritative
read-model data replace, not duplicate, the optimistic placeholder). A second gap-closing subtopic
showed what an upcaster chain actually looks like — incremental v1→v2→v3 steps applied at the read
boundary, so downstream consumers (projections, replay logic) only ever see the latest event
shape — connecting back to the Service Communication topic's own additive-vs-breaking-change
distinction, just applied to stored historical events instead of live API responses. Confirmed
`cqrs-event-sourcing` collision-free via the standing `app.routes.ts` grep (also checked
`subtopics.ts` directly, no match), left bare. Build passed clean. Browser-verified: nav accordion
opens with all 3 labels; the Snapshots fix confirmed rendering after clicking the specific
"Snapshots" tab button; breadcrumb showed all 4 levels; 860px wrapper confirmed via
`getComputedStyle`. **Architecture Patterns hub Phase 10: 14 of 22 topics complete.**

**The `saga-choreography` batch found and fixed TWO genuine issues, both self-contained
completeness gaps, plus a gap-closing subtopic**: the "Choreography Pattern" codeTab's Inventory
Service publishes either `stock.reserved` or `stock.reservation.failed`, but nothing anywhere in
the codeTab subscribes to the failure event — unlike `payment.failed`, which correctly has a
compensating subscriber. A saga hitting the stock-failure path would stall silently with the
order left in limbo forever, exactly the failure mode the page's own "Debugging and
Observability" theory section warns about. A purely self-contained catch: checking whether every
event a choreography example PUBLISHES also has a SUBSCRIBER somewhere in the same example.
Fixed by adding the missing subscriber, bringing both failure paths to parity. Separately, the
"Durable Saga with State Persistence" codeTab — introduced as the production version — had zero
try/catch or compensation logic at all, a regression from the simpler "Orchestration Pattern"
codeTab directly above it on the same page, which DID have proper compensation. Fixed by adding a
catch block that reuses the same `completedSteps` record already used for resume to drive
compensation, checkpointing a `'compensating'`/`'failed'` state so a crash mid-compensation can
also resume. A gap-closing subtopic made the QnA's "semantic lock counter-measure" concrete with
a `pending`-flag pattern, highlighting a real correctness trap: the lock must be released on BOTH
the success and compensation paths, or a cleanly-compensated saga leaves its resource stuck
forever even though the underlying data is consistent again. Confirmed `saga-choreography`
collision-free via the standing `app.routes.ts` grep (also checked `subtopics.ts` directly, no
match), left bare. Renamed a nav-template loop variable (`scSubs` → `sagaSubs`) to avoid reusing
the same local name already used in the Service Communication block earlier in the same
`ArchNavComponent` template. Build passed clean. Browser-verified: nav accordion opens with all 3
labels; both main-page fixes confirmed rendering after clicking the specific "Choreography
Pattern" and "Durable Saga with State Persistence" tab buttons; breadcrumb showed all 4 levels;
860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10: 15 of 22
topics complete.**

**The `inbox-outbox` batch — completing the hub's Messaging nav group — found and fixed TWO
genuine issues, one a subtle transaction-boundary bug and one an invalid SQL statement, plus a
gap-closing subtopic**: the "Relay Process" codeTab's `SELECT ... FOR UPDATE SKIP LOCKED` ran as
a standalone query, with the subsequent `broker.publish()` and `UPDATE outbox SET published_at`
calls also standalone — NOT wrapped in one shared transaction. Since a PostgreSQL row lock only
lasts as long as the transaction that acquired it, the lock released the instant the SELECT's own
(auto-committed) transaction ended, well before publish ever ran — meaning a second concurrent
relay worker could pick up the identical unpublished row moments later, reproducing the exact
double-publish race the page's OWN "Running multiple relay workers without row-level locking"
mistake block explicitly warns against, in the very codeTab whose comment claims to prevent it.
Fixed by wrapping the whole select-publish-update sequence in `db.transaction()`, the same
pattern the page's own "Outbox Pattern" codeTab already uses. Separately, the "Inbox Pattern"
codeTab's loyalty-points upsert read `ON CONFLICT DO UPDATE ...` — PostgreSQL requires an
explicit conflict target before `DO UPDATE`, making this invalid syntax, not abbreviated
shorthand. Fixed to `ON CONFLICT (customer_id) DO UPDATE SET points = loyalty_points.points +
EXCLUDED.points`, also correcting a second, subtler issue: a naive fix using only
`EXCLUDED.points` would have compiled and run but silently overwritten the customer's entire
existing point balance instead of accumulating onto it. A gap-closing subtopic made the Inbox
table's own cleanup job concrete — the Outbox side gets a full mistake block with a wrong/right
example, the Inbox side gets one sentence — and explained why an overly-aggressive retention
window is a genuine correctness bug for the Inbox specifically (unlike the Outbox, where early
cleanup has no correctness consequence): deleting a row before the broker's worst-case
redelivery window has passed lets a legitimate late redelivery slip through as if it were brand
new. Confirmed `inbox-outbox` collision-free via the standing `app.routes.ts` grep (also checked
`subtopics.ts` directly, no match), left bare. Build passed clean. Browser-verified: nav
accordion opens with all 3 labels; both main-page fixes confirmed rendering after clicking the
specific "Relay Process" and "Inbox Pattern (Consumer)" tab buttons; breadcrumb showed all 4
levels; 860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10:
16 of 22 topics complete — Messaging nav group fully done.**

**The `ddd-core` batch — starting the hub's Domain-Driven Design nav group — was the cleanest
main page found so far in terms of cross-tab reference bugs (unlike CQRS's six undefined
methods, DDD Core's own three codeTabs are each genuinely self-contained), but found ONE
well-reasoned, self-contained gap in application logic, plus two gap-closing subtopics**: the
"Domain Service" codeTab's `TransferFundsService.transfer()` calls `from.debit(amount)` and
`to.credit(amount)` (each aggregate correctly validating its own invariant), then saves BOTH
aggregates via two separate, unhandled `accountRepo.save()` calls. Tracing what happens if the
SECOND save fails after the first already committed: money is silently debited from one account
and never credited to the other — a real, silent fund-loss bug in an operation literally named
"TransferFunds," requiring no external research to spot. Verifying the RIGHT fix did need
checking DDD convention: classic DDD (Evans, Vernon) recommends one transaction per aggregate as
a design rule, so wrapping both saves in one shared DB transaction — the natural first
instinct — is actually the wrong fix; a domain service spanning multiple aggregates without a
shared transaction is a small-scale saga in substance and needs the same compensating-action
discipline as this hub's own Saga & Choreography topic covers at larger scale. Fixed by adding a
compensating credit-back if the second save throws. Two gap-closing subtopics made the Factory
and Repository patterns concrete — both are precisely described in the page's own quiz/QnA text
but never shown in a single codeTab anywhere on the page, unlike every other pattern the page
covers. **Also caught and self-fixed a real build error mid-batch**: the main page's own edit
initially used raw, unescaped backticks and `${...}` inside a nested string within the outer
`code:` template literal (the exact "backtick terminates the outer template literal" gotcha this
file has documented many times for OTHER hubs' authoring) — the build failed with the classic
unrelated-error cascade (`TS1128`, `Unexpected "]"` at a completely different line); fixed by
switching to plain string concatenation instead of a nested template literal, sidestepping the
escaping question entirely. Confirmed `ddd-core` collision-free via the standing `app.routes.ts`
grep (also checked `subtopics.ts` directly, no match), left bare. A separate real catch during
the pre-build sweep: an `exercise.prompt` field (bound via `[innerHTML]`) contained a bare
`Promise<BankAccount[]>` generic mention that would have silently vanished as a misparsed HTML
tag — wrapped in `<code>&lt;...&gt;</code>` before the build ever ran. Build passed clean.
Browser-verified: nav accordion opens with all 3 labels; the TransferFunds fix confirmed
rendering after clicking the specific "Domain Service" tab button; the generic-syntax fix
confirmed rendering inside a real `<code>` element, not vanished; breadcrumb showed all 4 levels;
860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub Phase 10: 17 of 22
topics complete.**

**The `bounded-contexts` batch — the 2nd topic in the Domain-Driven Design nav group — found and
fixed a genuine internal inconsistency spanning TWO of the page's own codeTabs, verified against an
external DDD reference rather than assumed**: the "Context Map Integration" codeTab shows Orders
building a `CatalogContextAdapter` that explicitly translates Catalog's model into Orders' own
`ProductSnapshot` ("Orders does NOT use CatalogContext.Product directly") — a textbook
Anti-Corruption Layer. The separate "Event Storming Output" codeTab, describing the SAME
Order-to-Catalog dependency, originally labeled it "Customer/Supplier" instead — a different
pattern, with no explanation for why both apply. The same codeTab also labeled Order-to-Shipping
and Order-to-Notification as ad-hoc "Event-driven," a name that never appeared anywhere in the
page's own QnA, which is written as an exhaustive-sounding list of the canonical context-map
patterns (Partnership, Shared Kernel, Customer-Supplier, Conformist, ACL, Open Host Service,
Published Language, Separate Ways). WebSearch confirmed Event Publisher is a real, named UPSTREAM
pattern in the modern DDD context-mapping vocabulary (the ddd-crew/context-mapping reference and
the Context Mapper tool group it alongside Open Host Service as one of exactly two upstream-side
patterns) — the page's own vocabulary was simply incomplete. Fixed by renaming "Event-driven" to
"Event Publisher" throughout, adding it to the quickRef/theory/QnA's canonical list, and
reconciling the ACL-vs-Customer/Supplier mislabeling by establishing the general lesson: ACL is a
TRANSLATION MECHANISM the downstream builds unilaterally (needs no upstream cooperation), while
Customer/Supplier is a PLANNING RELATIONSHIP requiring separate evidence the upstream actually
accommodates the downstream in its own roadmap — a relationship can be one, the other, both, or
neither, and "uses events"/"has an ACL" alone never proves the relationship-level pattern. The
Challenge's own Scheduling→Billing example was tightened to actually justify its "Customer/Supplier"
label with real accommodation evidence (an insurancePreAuthId field Billing requested and Scheduling
added) rather than merely describing the publish/subscribe mechanism as if that were sufficient on
its own. Three subtopics: two fix-adjacent (ACL vs. Customer/Supplier for Order-Catalog; Event
Publisher's mechanism-vs-relationship distinction, generalizing the same lesson to events) and one
gap-closing (Published Language — named once in the QnA and never shown in code; demonstrated as
what replaces N bespoke per-consumer ACLs with one shared, upstream-independent schema). No
`SUBTOPICS` collision for `bounded-contexts` (checked both `subtopics.ts` forms and grepped
`app.routes.ts` directly, confirmed collision-free, left bare). Hit the by-now-familiar stale
`ng serve` artifact (the watcher errored on the route file before catching up to the newly-written
subtopic files) — resolved with the standard fresh-file-write fix on `app.routes.ts`; the
production build, run separately and afterward, was clean throughout. Build passed clean.
Browser-verified: nav accordion opens with all 3 labels; the main-page codeTab fix confirmed
rendering after clicking the "Event Storming Output" tab button; breadcrumb showed all 4 levels on
a subtopic page; sidebar showed tailored (not DEFAULT) content with composite-key `related`/`tip`/
`gotchas` entries; 860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub
Phase 10: 18 of 22 topics complete.**

**The `aggregates-domain-events` batch — the 3rd and final topic in the Domain-Driven Design nav
group — found and fixed a genuine compile error plus a genuine durability bug, both self-contained
(zero external research needed, just careful cross-checking of the page's own codeTabs against
their own constructors and against the page's own theory text)**: the "Saving & Publishing Events"
codeTab's `PlaceOrderHandler` class declared a constructor with exactly two dependencies
(`orders: IOrderRepository`, `events: IDomainEventPublisher`), but its own `handle()` method called
`this.catalogService.getPrice(line.productId)` — a field never declared anywhere on the class. In
real TypeScript strict mode this is `TS2339: Property 'catalogService' does not exist`, the same
class of bug this batch of Architecture Patterns topics has hit repeatedly (CQRS's Snapshots
codeTab, earlier this hub). Fixed by adding `catalogService: ICatalogService` as a third
constructor parameter. Separately, this page's own theory section states outright that "the outbox
pattern is the standard mechanism for reliably publishing domain events alongside a database
transaction, avoiding the dual-write problem where the aggregate's state change and its
corresponding event publish could otherwise fall out of sync" — yet the SAME page's own
"Saving & Publishing Events" codeTab does exactly the two-separate-operations thing that warning
describes (`await this.orders.save(order)` then a SEPARATE `await this.events.publishAll(...)`),
labeling it "RIGHT" with no acknowledgment of the gap: if `publishAll()` throws after `save()`
already committed (a broker hiccup, a network blip — both common, expected production conditions),
the order is permanently placed but its event is lost forever, since it only ever existed in
process memory. Fixed with an explicit risk comment on the codeTab (not a full rewrite — the
"publish after commit, never before" ordering lesson the codeTab teaches is still correct and
worth keeping intact) pointing to a subtopic for the durable fix. Subtopics: two fix-adjacent (the
missing `catalogService` field; tracing exactly where and how the event gets lost in the
save-then-publish sequence) and one gap-closing that applies this hub's OWN already-completed
Inbox & Outbox Pattern topic directly to this handler — rewriting `PlaceOrderHandler` around a
single transaction that inserts both the order row and an outbox row, removing the direct broker
call from the request path entirely and handing that responsibility to the same relay process
already described in that sibling topic. No `SUBTOPICS` collision for `aggregates-domain-events`
(checked both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free,
left bare). Build passed clean. Browser-verified: nav accordion opens with all 3 labels; both
main-page fixes confirmed rendering after clicking the relevant codeTab tab buttons; breadcrumb
showed all 4 levels; sidebar showed tailored composite-key content, including cross-references to
the sibling Inbox/Outbox topic; 860px wrapper confirmed via `getComputedStyle`. This completes the
Domain-Driven Design nav group entirely (ddd-core, bounded-contexts, aggregates-domain-events all
have subtopics). **Architecture Patterns hub Phase 10: 19 of 22 topics complete — only the
Integration group (anti-corruption-layer, strangler-fig, backend-for-frontend) remains.**

**The `anti-corruption-layer` batch — the 1st topic in the Integration nav group — found and fixed
a genuine compile error plus a genuine gap, both self-contained (zero external research needed)**:
the "ACL: Legacy ERP Integration" codeTab's `LegacyErpAdapter` class declared exactly one member (a
`STATUS_MAP` property initializer, no constructor at all), but its own `getOrder()` method called
`this.erpClient.fetchOrder(orderId)` — a field never declared anywhere on the class, the same
TS2339-under-strict-mode category of bug this batch of Architecture Patterns topics has now hit
repeatedly (CQRS's Snapshots codeTab, `PlaceOrderHandler`'s missing `catalogService`). Fixed by
adding a constructor declaring `erpClient`, matching the pattern `StripePaymentAdapter` already
uses elsewhere on the same page. Separately, the page's own revision `mustKnow` list AND its QnA
both state directly that "the Domain defines the interface (IPaymentGateway); the ACL implementation
in Infrastructure wraps the external client" — a real dependency-inversion claim — but every codeTab
on the page defines `StripePaymentAdapter` as a bare class with no `implements` clause, and
`IPaymentGateway` never appears in any codeTab at all; the structure the page describes in prose was
never actually demonstrated in code. Subtopics: one fix-adjacent (the missing `erpClient` field) and
two gap-closing (making the `IPaymentGateway` interface concrete with an `implements` clause and a
swappable `FakePaymentGateway` test double; and making concrete a risk the QnA names in one sentence
and never shows happening — a split call/translate ACL design leaving a raw "just call Stripe
directly" shortcut for domain code to reach for under time pressure, which the full-round-trip
design makes structurally impossible). No `SUBTOPICS` collision for `anti-corruption-layer` (checked
both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left
bare). Hit a transient esbuild panic (`panic: runtime error: index out of range [-1]`) on the first
production build attempt — unrelated to any content change, resolved cleanly on an immediate retry
with zero files touched, consistent with the flaky-esbuild-artifact category already documented
once before in this file. Also hit a fuller version of the stale-`ng serve`-artifact family this
session: the dev server process itself had gone stale/unreachable (`preview_list` returned no
running servers) after the extended session, requiring a full `preview_start` restart rather than
just a forced file-write — confirmed via direct filesystem checks (`ls` on the new subtopic folders,
grepping the fixed line in `ddd-core.ts`) that the source was correct throughout, independent of
what the dev-server's log buffer was still showing from far earlier in the session. Build passed
clean (both the standalone production build and the fresh dev-server compile). Browser-verified: no
console errors; nav accordion opens with all 3 labels; the main-page codeTab fix confirmed rendering
after clicking the "ACL: Legacy ERP Integration" tab button; breadcrumb showed all 4 levels; sidebar
showed tailored composite-key content; 860px wrapper confirmed via `getComputedStyle`; full page
text swept for vanished/misparsed content, none found. **Architecture Patterns hub Phase 10: 20 of
22 topics complete — only `strangler-fig` and `backend-for-frontend` remain.**

**The `strangler-fig` batch — the 2nd topic in the Integration nav group — found and fixed TWO
more genuine bugs, both self-contained (zero external research needed)**: the "Facade with Feature
Flags" codeTab shows `OrderServiceFacade` with three methods at three different migration states —
`placeOrder()` checks a `'new-order-placement'` feature flag and can go either way, `getOrder()` is
hard-coded to always call the new system ("already fully migrated"), and `cancelOrder()` is
hard-coded to always call legacy ("not yet migrated"). A trailing comment describing a day-by-day
rollout ramp (0% → 100% over 21 days) originally ended with "Day 21: 100% → retire legacy **cancel**
code" — but `cancelOrder()` has no feature-flag check anywhere in its body, so there is no mechanism
in the code for it to ramp at all. The ramp actually belongs to `placeOrder()`'s own flag; fixed the
comment to name the feature that is genuinely shown ramping, rather than adding an unnecessary
feature-flag mechanism to `cancelOrder()` just to match a comment. Separately, the "Parallel Run for
Validation" codeTab's own comment states the intent plainly — "IDs differ (expected) — compare
status and total" — but the code nested the actual status/total comparison INSIDE an
`if (legacyResult.value.orderId !== newResult.value.orderId)` block, meaning the one check a
parallel run exists to perform only ran when the two systems' IDs happened to differ; on the rare
occasion the IDs matched (a coincidence, a shared sequence, a test fixture), the entire discrepancy
check — including a genuine status/total mismatch — would be silently skipped. Fixed by un-nesting
the comparison so it runs unconditionally once both results are fulfilled, matching what the
comment already claimed was happening. Subtopics: two fix-adjacent (the mismatched rollout comment;
the inverted nested-if logic bug) and one gap-closing (the page's own mistakes block names
"split-brain" in a single code comment and moves on — traced one customer's order history through
the facade, request by request, to show concretely how a customer's data ends up silently split
across both systems with zero errors thrown anywhere in the sequence). No `SUBTOPICS` collision for
`strangler-fig` (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed
collision-free, left bare). This batch also confirmed the FULLER stale-dev-server-process incident
from the previous (`anti-corruption-layer`) batch was a one-off, isolated event — this batch's dev
server picked up the file-watcher changes normally with no restart needed, and a same-tick DOM
query staleness (querying immediately after a tab-click in the same script execution returned an
empty string) resolved on a simple re-query in a separate `javascript_tool` call, the same
established pattern documented repeatedly earlier in this file. Build passed clean (both the
standalone production build and the dev-server compile). Browser-verified: no console errors; both
main-page codeTab fixes confirmed rendering after clicking their respective tab buttons; nav
accordion opens with all 3 labels; breadcrumb showed all 4 levels; sidebar showed tailored
composite-key content; 860px wrapper confirmed via `getComputedStyle`. **Architecture Patterns hub
Phase 10: 21 of 22 topics complete — only `backend-for-frontend` remains to finish the hub.**

**The `backend-for-frontend` batch — the 3rd and final topic in the Integration nav group, and the
last topic in the entire hub — was the cleanest page found in the last several batches: a careful
pass through all 3 codeTabs (Mobile BFF, Web BFF, Third-Party BFF), the Challenge, and cross-checks
against the theory/mistakes/QnA text found no undeclared-field bug, no internal contradiction, and
no misleading comment.** All three subtopics are gap-closing instead: (1) the page's own QnA
discusses GraphQL-as-BFF's N+1 query problem and DataLoader batching at real length ("a GraphQL
resolver layer can silently accumulate N+1 query problems... unless carefully batched with tools
like DataLoader"), but every codeTab on the page is a REST handler — none demonstrates a GraphQL
resolver at all. Wrote the naive N+1-prone resolver (a `reviews` field resolver called once per
product in a list) alongside the DataLoader-batched fix, and explained why REST BFFs have a fixed
per-request call count while GraphQL resolvers scale with query shape. (2) The Challenge's own
reference solution computes `hasBreakingNews` via a hardcoded one-hour threshold directly inside
the BFF handler — examined against the page's own "no business logic in the BFF" mistake block
(whose stated reasoning is about WHERE a rule lives, not how consequential it is) and proposed a
concrete test: could the rule change independently of the client UI? The one-hour threshold passes
that test as a business rule that does not belong hardcoded in the BFF, while `thumbnailUrl:
a.images[0]?.url ?? null` on the same line fails it (a genuine, UI-only shaping decision) — showing
the same Challenge solution contains one example of each side of the line. (3) The Third-Party BFF
codeTab's own trailing comment names a v1→v2 migration ("When breaking changes are needed: create
/api/v2/products/:id... Partner BFF team owns the versioning contract independently of services")
and never shows it — wrote the v2 endpoint alongside the untouched v1, both calling the same
underlying `catalogService`/`inventoryService`, and traced why changing `priceUsd: number` to a
structured `price: { amount, currency }` is a genuinely breaking change (a type change any existing
v1 partner parsing a bare number cannot absorb) rather than something patchable into v1 directly.
**Caught and fixed a real gotcha before it could break sibling pages**: this subtopic's own working
title contained a straight apostrophe ("GraphQL BFF's N+1 Problem") — since every subtopic's title
gets reused verbatim as a `[prev]`/`[next]` label on its sibling pages (a single-quoted JS object
literal wrapped in a double-quoted Angular attribute), a straight apostrophe there would have broken
the build the moment a sibling page referenced it. Fixed by using the established typographic curly
quote (`’`, U+2019) convention throughout the title, in all six wiring touchpoints, consistently —
caught proactively while authoring the first subtopic file, before any sibling reference could
trigger the actual build failure. No `SUBTOPICS` collision for `backend-for-frontend` (checked both
`subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare).
Also confirmed this topic sits at the END of its own nav-group in `arch-nav.ts` (the Integration
group's last link, directly before the Reference group's own `<div>` opens) — the accordion markup
was added after the existing `<a>`, not before a following sibling, matching the same structural
note this file has documented once before for a different hub's own final-topic-in-group batch.
Build passed clean (both the standalone production build and the dev-server compile, picked up the
file-watcher changes normally with no restart needed). Browser-verified: no console errors; nav
accordion opens with all 3 labels (confirmed 22 total toggles site-wide in this hub, one per topic
— every topic in the hub now has subtopics); the curly-quote title renders correctly in the nav
accordion, the sidebar's Related Topics, and the breadcrumb; breadcrumb showed all 4 levels; sidebar
showed tailored composite-key content; 860px wrapper confirmed via `getComputedStyle`; full page
text swept for vanished/misparsed content on a subtopic page, none found. **This completes the
Architecture Patterns hub's entire Phase 10 rollout — all 22 topics now have deep-dive subtopic
pages, 66 subtopic pages total across the hub, finished 2026-08-04.**

### Design Patterns hub subtopic wiring — first pilot; the 12th `*NavComponent` in a row missing
the subtopics-accordion structural fix

Confirmed via direct file inspection before the pilot (`/design-patterns/singleton`, 2026-08-04) —
do this same check before any other new hub's first subtopic set:

1. **`DpNavComponent` (`shared/dp-nav/dp-nav.ts`) had ZERO subtopics-accordion support** — the
   same structural gap already hit and fixed on every `*NavComponent`-based hub's own pilot before
   it (Go, DevOps, Containers, AWS, Azure, Linux, Terraform, Service Mesh, System Design,
   Architecture Patterns — this is the 12th in a row). Fixed identically: added `signal`, `Router`,
   `NavigationEnd`, `filter` (rxjs), and `SUBTOPICS` (from `../../../data/subtopics`) to the
   imports, then the same three methods (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) and
   constructor-level router subscription, copied directly from `ArchNavComponent`'s own
   implementation (read directly, not reconstructed from memory, per the established copy-fidelity
   discipline). Worked correctly on the first browser check — no stale-chunk incident.
2. **No `SUBTOPICS` map bare-key collision for `singleton`** (checked both quoted and unquoted
   forms in `subtopics.ts`, and grepped `app.routes.ts` directly, confirmed collision-free) — left
   as a bare key.
3. **`DP_LABELS` breadcrumb map uses bare keys** (`'singleton'`), matching the generic pattern
   every hub's own dedicated labels map shares — composite subtopic keys there are bare too
   (`'singleton/<slug>'`).
4. **`SIDEBAR_MAP` keys are FULL-PATH PREFIXED** (`'design-patterns/singleton'`, confirmed the
   base entry — and its own `DP_DEFAULT` constant — already existed) — subtopic composite keys
   follow suit: `'design-patterns/singleton/<slug>'`.
5. **This hub's `singleton.ts` uses a DIFFERENT authoring pattern than every prior hub covered by
   Phase 10 so far** — `quickRef`/`theory`/`codeTabs`/`mistakes`/`challenge`/`quiz`/`qna`/
   `revision` are declared as top-level `const` values OUTSIDE the `@Component` class, then simply
   assigned to class properties inside it (`quickRef = quickRef;` etc.), rather than being declared
   directly as class properties the way every Architecture Patterns file does. This is a
   Design-Patterns-hub-wide convention (not specific to Singleton) — subtopic files themselves are
   NOT affected, since Phase 10 subtopic pages always declare their own `theory`/`codeTabs`/etc.
   directly as class properties regardless of which convention the PARENT topic page uses.
6. **`.dp-page` wrapper rule is NOT global** (confirmed absent from `src/styles.scss`) — every
   subtopic `.scss` needs the full `.dp-page { max-width: 860px; margin: 0 auto; }` rule.
   `$accent: #0369a1`, `$tint: #e0f2fe`, `.dp-icon`, icon content `DP`, `tech="javascript"` in
   `app-page-meta` (Design Patterns pages share the JS/TS playground and run-it links, same as
   every other non-JS-runtime hub). No live playground — Singleton's own codeTabs are `language:
   'csharp'` even though the hub's own documented `Challenge.language` convention is
   `'typescript'` — the MAIN page itself mixes both (C# codeTabs, TypeScript Challenge), and
   subtopic codeTabs followed the main page's own C#-for-illustration choice since the content is
   specifically about C# language semantics (access modifiers, `volatile`, static initialization).
7. **The `singleton` batch found and fixed a genuine C# language-semantics inaccuracy, repeated in
   TWO places on the same page (the mistakes block AND the quiz), verified via WebSearch rather
   than assumed**: both originally claimed a subclass could bypass a **private** Singleton
   constructor via `base()`, creating additional instances, and that `sealed` exists to prevent
   this. Verified against actual C# access-modifier semantics (confirmed via web search results
   citing standard C# constructor-accessibility behavior) that this does not compile at all — a
   class with ONLY a private constructor and no public/protected constructor cannot be inherited
   from outside the declaring class; the derived class has no accessible base constructor to call.
   Corrected both the mistakes-block `wrong`/`right`/`explanation` and the quiz question's own
   option text/explanation to state what `sealed` actually guards against: a FUTURE edit widening
   the constructor from `private` to `protected` (which would silently reopen subclassing on an
   unsealed class), and a class NESTED inside the Singleton itself (nested types in C# DO have
   access to their enclosing type's private members, including a private constructor — a genuine,
   narrower edge case a private constructor alone does not block). Subtopics: one fix-adjacent
   (tracing exactly why the original bypass claim does not compile, with a working nested-class
   counterexample) and two gap-closing (double-checked locking — named in the theory and sketched
   inline in the QnA, but the QnA's own inline sketch omits the `volatile` field it separately says
   is required, and neither mention is a complete, compilable codeTab; and Monostate — an entire
   theory section describing it, zero code anywhere on the page). **Real gotcha caught during the
   pre-build sweep, not the build**: the double-checked-locking subtopic's own `misconceptions`
   entries mentioned `Lazy<T>` as plain prose inside `[innerHTML]`-bound `thought`/`reality`
   fields — silently misparsed as an HTML tag and vanishing — fixed by wrapping in
   `<code>Lazy&lt;T&gt;</code>`, while the SAME `Lazy<T>` mention inside `exercise.solution` (plain
   interpolation) needed no escaping at all, confirming the established per-field-binding-type rule
   still applies exactly as documented for every prior hub. Build passed clean. Browser-verified:
   no console errors; the mistakes-block fix required expanding the "Common Mistakes" accordion
   (confirmed via direct `.cm-toggle` click, not a broader button-text match, which unreliably
   toggled state across separate `javascript_tool` calls) — an isolated click quirk specific to
   this component, not a build or content issue, resolved by targeting the toggle's own CSS class
   directly; the quiz fix required advancing to question 2 via the quiz's own one-question-at-a-time
   flow and selecting an answer to reveal the explanation text; nav accordion opens with 1 toggle
   (this hub's first and only Phase 10 topic so far); breadcrumb showed all 4 levels; sidebar showed
   tailored composite-key content; 860px wrapper confirmed via `getComputedStyle`; the `Lazy<T>`
   misconceptions fix confirmed rendering as literal text (not vanished, not raw entity codes) in
   the final browser check. **Design Patterns hub Phase 10: 1 of 36 topics complete.**
8. **The `factory-method` batch found and fixed TWO more self-contained bugs in the "DI Approach"
   codeTab**: a switch case returning `new PushNotification()` — a class never declared in ANY
   codeTab on the page, even though the theory section's own prose already named it correctly
   among the three concrete products ("EmailNotification, SmsNotification, PushNotification") —
   confirming once again that a correct prose description elsewhere on a page says nothing about
   whether the code itself actually compiles. Fixed by adding the missing class. Separately, the
   same codeTab's default switch arm used JavaScript/TypeScript backtick template-literal syntax
   (`` `Unknown channel: {channel}` ``) where valid C# requires `$"Unknown channel: {channel}"` —
   backticks are not valid C# string syntax at all; this codeTab would not compile as written. A
   third subtopic named a real, unstated tension: the page's own mistake #1 ("Switching on enum
   instead of using subclasses") explicitly calls out type-switching as an OCP violation, but the
   "DI Approach" codeTab's own `Create(string channel)` method does the exact same switch-on-a-key
   shape internally — DI solves testability/inheritance-avoidance, not Open/Closed compliance,
   which only the classic subclass-based pattern actually preserves. **A genuine refinement to the
   brace-escaping gotcha's scope, caught and corrected mid-batch**: while drafting the `backticks
   Are Not C#` subtopic, bare `{channel}`/`{expression}` text was initially (over-cautiously)
   escaped as `&#123;`/`&#125;` inside `theory.points`/`exercise.prompt`/`.hint`/
   `misconceptions.thought` fields, on the assumption these were subject to the same bare-`{`-in-
   prose gotcha this file has documented for STATIC `.html` template text (the TypeScript hub's
   `EventHandlers<T>`/`on${string}` incident). Direct inspection of `theory-block.ts` confirmed
   `points` binds via `[innerHTML]="p"` — but critically, the ACTUAL RISK MECHANISM for that
   binding is the BROWSER'S runtime HTML parser processing the STRING VALUE at `[innerHTML]`-set
   time, not Angular's AOT TEMPLATE COMPILER parsing the `.html` FILE'S OWN STATIC SOURCE TEXT at
   BUILD time — and a `{`/`}` character has zero special meaning to a browser's HTML parser (unlike
   `<`/`>`, which start/end real tags). The bare-`{`-in-prose gotcha's own established fix guidance
   already said as much ("Grep for a bare `{` in prose text (**not inside a bound attribute
   expression**)") — the risk zone is specifically STATIC TEXT NODES directly inside a `.html`
   file's own markup (a `<p>` or `<h1>`'s literal content), which the AOT compiler statically
   parses, NOT TS STRING VALUES assigned to component properties and bound via property/innerHTML
   binding at runtime, regardless of which binding mechanism is used. **This means: `theory.points`
   / `misconceptions.thought`/`.reality` / `exercise.prompt`/`.hint` — every `[innerHTML]`-bound TS
   string FIELD — is safe from the bare-single-brace gotcha entirely; only literal HTML TAG NAMES
   (`<span>`, generic syntax `<T>`, etc.) are actually at risk in those fields, per the
   already-separately-documented tag-vanishing gotcha, which IS a real browser-HTML-parsing
   concern.** The entity-escaping applied before this was re-derived stayed in place (harmless —
   entities still decode to the correct literal characters) rather than being reverted, but no
   further brace-escaping was applied to TS string fields for the rest of this batch — confirmed
   correct by checking that a plain, UNESCAPED `Console.WriteLine($"Push → {recipient}:
   {message}");` inside a `codeTabs.code` field (which renders via `hljs.highlight()` → `[innerHTML]`,
   the exact same runtime-browser-parsing mechanism) rendered perfectly in the browser with no
   escaping at all — matching how dozens of prior C# codeTabs across this entire project have
   already used bare `{variable}` interpolation successfully without incident. A genuine authoring
   mistake was also caught and fixed in the SAME batch: an early draft of the `does-the-channel-
   switch-really-decouple-which-factory` subtopic's own codeTab literally wrote out Angular's
   `{{ '{' }}`-style DOUBLE-BRACE-escape-for-STATIC-TEMPLATE-TEXT trick (`{'{'}channel{'}'}`) AS
   PLAIN CHARACTERS inside a TS backtick string — which is the WRONG fix for the WRONG mechanism
   (that trick only applies to literal `{{ }}` interpolation syntax appearing directly in `.html`
   template markup, never inside a TS string value) — caught before the build via a direct content
   re-read, corrected back to plain `{channel}`. No `SUBTOPICS` collision for `factory-method`
   (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed
   collision-free, left bare). Build passed clean. Browser-verified: no console errors; both
   main-page codeTab fixes confirmed rendering (the `PushNotification` fix on the "Classic Pattern"
   tab, the `$"..."` interpolation fix on the "DI Approach" tab); nav accordion opens with 2 toggles
   total (`singleton` + `factory-method`); breadcrumb showed all 4 levels; sidebar showed tailored
   composite-key content; 860px wrapper confirmed via `getComputedStyle`; a subtopic page's full
   text swept and confirmed every `{channel}`/`{expression}`/`${i}`/`${e}` mention rendered as
   correct, literal text with nothing vanished. **Design Patterns hub Phase 10: 2 of 36 topics
   complete.**
9. **The `abstract-factory` batch was the cleanest page found in this hub so far** — a careful
   pass through both codeTabs (Classic Pattern, ADO.NET Example), the Challenge, and cross-checks
   against theory/mistakes/QnA found no undeclared class, no invalid syntax, no internal
   contradiction. All three subtopics are gap-closing, each writing out something the page names
   in prose but never shows in code: (1) mistake #1's own "right" side is two lines of pure
   comments naming two mitigations ("version the factory interface or use extension methods") for
   the trade-off of adding a new product type — wrote out the first one concretely
   (`IUiFactoryV2 : IUiFactory`, existing concrete factories completely untouched); (2) the QnA
   describes selecting a concrete factory from configuration "not hardcoded in client code" via "a
   factory registry or... dependency injection," contrasted against the main page's own
   composition-root example, which hardcodes `new WindowsUiFactory()` directly — wrote the actual
   registry (`Dictionary<string, Func<IUiFactory>>`, self-registering factories, a lookup that
   never needs editing for new themes) and explicitly connected it back to this hub's own Factory
   Method topic's OCP discussion; (3) the QnA's own list of real-world examples names "Test doubles
   in testing frameworks: a TestFactory creates mock or stub implementations" in one sentence — used
   the main page's OWN Challenge (`DatabaseClient` depending only on `IDbFactory`) as the subject,
   adding a third, purpose-built `FakeDbFactory` alongside the page's existing `SqliteFactory`/
   `InMemoryFactory`, with fields recording exactly how the client used it (`lastSql`, `openCalled`,
   `closeCalled`). No `SUBTOPICS` collision for `abstract-factory` (checked both `subtopics.ts`
   forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare). Build passed
   clean. Browser-verified: no console errors; nav accordion opens with 3 toggles total (`singleton`
   + `factory-method` + `abstract-factory`); breadcrumb showed all 4 levels; sidebar showed tailored
   composite-key content; 860px wrapper confirmed via `getComputedStyle`; full page text swept for
   vanished/misparsed content on a subtopic page containing generic syntax (`Dictionary<string,
   Func<IUiFactory>>`), none found. **Design Patterns hub Phase 10: 3 of 36 topics complete.**
10. **The `builder` batch found and fixed TWO more genuine bugs**: the "Director Pattern"
    codeTab's `BuildPasswordResetEmail` method used backtick template-literal syntax — the SAME
    category of bug already found on this hub's Factory Method topic, confirming it is worth
    specifically checking for on any C#-labeled codeTab in this hub, not assuming one prior fix
    means the pattern is fully caught. This instance was trickier than the earlier one: the string
    being interpolated already contained its own embedded double quotes (an HTML `href="..."`
    attribute), so the fix could not be a simple backtick-to-double-quote swap — it needed either
    escaped quotes (`$"...\"...\"..."`) or a verbatim interpolated string (`$@"...""...""..."`).
    **A genuine mistake was made and caught during THIS SAME fix**: the first attempt used a
    single-escaped `\"` inside the codeTab's own outer TS backtick template literal — but `\"` is a
    universal ECMAScript escape sequence (SingleEscapeCharacter) that resolves to a bare `"`
    regardless of which quote character delimits the containing string, meaning TypeScript's own
    parser silently consumed the backslash before the string value was ever set, leaving the
    DISPLAYED C# code sample with no backslash at all — reproducing the exact "embedded quote
    prematurely ends the string" problem the fix was supposed to solve, just one level removed.
    Caught via direct browser inspection of the rendered code sample (the backslash was visibly
    missing from the displayed text) rather than assumed correct from the build passing (a build
    failure would never have caught this, since the resulting string was still syntactically valid
    TypeScript — just not the intended DISPLAY content). Fixed by doubling the backslash (`\\"`),
    which is what actually survives TypeScript's own escape processing to leave a literal `\"` in
    the rendered output. Separately, the "Forgetting to return `this` in fluent methods" mistake's
    own wrong example declared `HttpRequestBuilder` as its return type (matching the "right"
    example's signature) but had no `return` statement at all — a straight C# compile error
    (CS0161: not all code paths return a value) at the method's OWN definition, unrelated to what
    its own comment ("// void — breaks chaining") claimed to illustrate; a method that fails to
    compile can never reach a runtime state where "chaining breaks." Fixed by changing the declared
    return type to `void`, which genuinely compiles and genuinely reproduces the named mistake — and
    crucially, moves the resulting compile error to the CALL SITE in a chain, which is the more
    realistic place a developer would actually encounter and diagnose this mistake in real code.
    Subtopics: two fix-adjacent (the backtick bug, including both correct fixes shown side by side;
    the compile-error-vs-design-smell distinction, tracing exactly where each version's error
    appears) and one gap-closing (the QnA describes a `UserBuilder` "Test Data Builder" with
    sensible defaults in precise prose, never shown in code — wrote it out and demonstrated why a
    new required field only costs ONE change to the builder's own default, not an edit to every
    test that constructs that type). No `SUBTOPICS` collision for `builder` (checked both
    `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left
    bare). Build passed clean (both the buggy first attempt — which still compiled, since it was
    valid TypeScript — and the corrected version, confirmed via direct browser rendering, not the
    build result). Browser-verified: no console errors; both main-page fixes confirmed rendering,
    including the corrected `\"` escaping visible in the actual displayed code sample; nav
    accordion opens with 4 toggles total; breadcrumb showed all 4 levels; sidebar showed tailored
    composite-key content; 860px wrapper confirmed via `getComputedStyle`; a subtopic page's own
    FIX 1 and FIX 2 codeTab variants (escaped-quote and verbatim-string versions) both confirmed
    rendering with correct, distinct escaping. **Design Patterns hub Phase 10: 4 of 36 topics
    complete.**
11. **The `prototype` batch found no undeclared-class or syntax bug, but a genuine, self-contained
    internal tension between two different sections of the same page**: mistake #3 ("Using
    Prototype when construction is cheap") originally read as "use a record `with` expression
    INSTEAD OF Prototype" for simple objects, while the quiz, on an unrelated question, explicitly
    calls `with` expressions "the prototype pattern made idiomatic" — the two readings cannot both
    be literally true at once. Resolved by tightening mistake #3's own explanation: `with` genuinely
    IS Prototype (copy an existing instance, override specific fields — Prototype's own definition),
    just implemented as a built-in language feature instead of a hand-written `Clone()` method; the
    actual point mistake #3 makes is narrower than "avoid Prototype" — it is "avoid building
    unnecessary explicit Prototype INFRASTRUCTURE (an interface, a hand-rolled method) for something
    records already give you for free." Two further subtopics are gap-closing: the theory names
    "concrete type not known at compile time" as a Prototype use case, but both codeTabs use a
    single, statically-known type throughout (`EmailTemplate`, `NotificationConfig`) — wrote the
    genuinely polymorphic version via a shared `IShape` interface, where client code clones through
    the interface with zero branches on concrete type. Separately, the theory states "for immutable
    sub-objects, shallow copy is safe" in one line, then only ever shows the DANGEROUS half (a
    shared mutable `List&lt;string&gt;`) — built the missing safe contrast with an immutable
    `Address` record, showing that reference-sharing alone is never the danger; mutability through
    that shared reference is. **A genuine mistake was caught and fixed while writing this exact
    subtopic**: an early draft used HTML entities (`&lt;`/`&gt;`) inside an `exercise.solution`
    field describing `List&lt;string&gt;` — but `solution` binds via PLAIN interpolation (confirmed
    against the already-established per-field-binding rule: `heading`/`solution` → raw characters,
    no entities; `points`/`thought`/`reality`/`prompt`/`hint` → entities/`<code>` wrapping for tag
    and generic mentions), which never decodes HTML entities at all — the entities would have
    rendered as the literal, raw text `List&lt;string&gt;` to the reader instead of `List<string>`.
    Caught via a proactive re-check of every subtopic file created THIS SESSION for the same
    mistake (grepped every `solution:` field across all Phase 10 subtopics for `&lt;`/`&gt;`/`&#`
    on the same line) rather than assuming it was isolated — confirmed genuinely isolated to this
    one instance, then fixed to raw `List<string>`. No `SUBTOPICS` collision for `prototype`
    (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed
    collision-free, left bare). Build passed clean. Browser-verified: no console errors; the
    main-page mistake-block clarification confirmed rendering; nav accordion opens with 5 toggles
    total; breadcrumb showed all 4 levels; sidebar showed tailored composite-key content; 860px
    wrapper confirmed via `getComputedStyle`; the corrected `exercise.solution` field confirmed
    rendering `List<string>` as literal text (not vanished, not showing raw entity codes), and the
    SAME string mentioned via `theory.points`' `&lt;`/`&gt;`-escaped `<code>` wrapping confirmed
    rendering identically correctly — verifying both binding-type rules side by side on the same
    live page. **Design Patterns hub Phase 10: 5 of 36 topics complete.**
12. **The `object-pool` batch found no undeclared-class bug, but a genuine, self-contained
    inaccuracy in the main page's own theory prose, plus a real concurrency race identified purely
    by reading — no external research needed to spot either**: the "Acquire / Release Lifecycle"
    theory bullet claimed Acquire() "creates a new one (up to max)," but the codeTab's actual
    `Acquire()` is `_pool.TryTake(out var item) ? item : _factory();` — no maxSize check anywhere
    on that path at all; maxSize is only ever consulted in Release(), where it bounds how many
    RETURNED instances are retained for reuse, not how many can be concurrently created and in use.
    Verified this also matches the real `Microsoft.Extensions.ObjectPool`'s own documented
    behavior (`Get()` never blocks or refuses to create) before tightening the theory bullet's
    wording to state the true, narrower guarantee. Separately, the same codeTab's `Release()` —
    `if (_pool.Count < _maxSize) _pool.Add(item);` — is a textbook check-then-act (TOCTOU) race:
    two threads can both read Count below maxSize before either one calls Add(), and the pool ends
    up holding more than maxSize idle instances. Verified via WebSearch against the real
    `DefaultObjectPool<T>` source (dotnet/aspnetcore) that Microsoft's own implementation sidesteps
    this exact race entirely by never tracking a Count at all — a fixed-size array of slots, each
    claimed via a single atomic `Interlocked.CompareExchange`, with excess Return() calls simply
    dropping the object for the GC to reclaim instead of racing on a counter. Three subtopics: (1)
    **The Count-Check Race Condition** — the TOCTOU race itself, its real-world severity (soft
    overshoot, not corruption), and the verified lock-free slot design .NET's own source actually
    uses instead; (2) **Implementing Idle-Object Eviction** — the theory promises "pool may shrink
    idle objects after a timeout" but NEITHER codeTab shows this; built the missing
    `TimestampedObjectPool<T>` with a background Timer sweep, plus the easy-to-miss correctness
    point that evicting an item from the pool's own collection and disposing its underlying
    resource are two separate steps that must happen together for disposable pooled items; (3)
    **ConcurrentBag vs. ConcurrentQueue for Pool Storage** — reconciles the main codeTab's own
    choice of `ConcurrentBag<T>` against the SAME page's own QnA, which recommends
    `ConcurrentQueue<T>` + `SemaphoreSlim` for a thread-safe pool instead; verified via WebSearch
    that ConcurrentBag is specifically documented as optimized for same-thread produce/consume
    (thread-local lists, no locking on the fast path) and explicitly weak at the
    dedicated-producer/dedicated-consumer pattern that async/await routinely creates (a
    continuation resuming on a different thread-pool thread than the one that awaited) — ties back
    into subtopic 1 by showing a `BoundedObjectPool<T>` that uses `SemaphoreSlim.WaitAsync()` to
    give Acquire() an actual hard concurrency cap, the capability a bare Count check can never
    provide. Applied the same backtick-vs-`<code>` house-style discipline established in prior
    batches — inline code mentions inside `[innerHTML]`-bound `theory.points`/`misconceptions`
    fields use `<code>&lt;tag&gt;</code>`, never backtick-wrapped markdown-style spans. No
    `SUBTOPICS` collision for `object-pool` (checked both `subtopics.ts` forms and grepped
    `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified: no console errors; the main-page theory-bullet fix confirmed rendering; nav
    accordion opens with 6 toggles total; breadcrumb showed all 4 levels on every subtopic; sidebar
    showed tailored composite-key content (confirmed via direct text search); 860px wrapper
    confirmed via `getComputedStyle`. **Design Patterns hub Phase 10: 6 of 36 topics complete.**
13. **The `adapter` batch — the first topic in the Structural nav group — found and fixed FOUR
    genuine issues, all self-contained (zero external research needed)**: the "Object Adapter"
    codeTab's `LegacyPaymentGateway.ProcessPayment` was written as
    `Console.WriteLine(...) is null || true` — a real, reproducible CS0023 compile error, since
    `Console.WriteLine` returns `void` and C# rejects comparing a void expression to `null` at all;
    fixed by expanding to a normal two-statement method body. The "Logging Adapter" codeTab's
    `IsEnabled()`/`Log()` switches only explicitly handled 4 of .NET's 7 `LogLevel` values (Debug,
    Information, Warning, Error), silently routing BOTH `Trace` and `Critical` — the two opposite
    ends of the severity scale — into the same fallback bucket as `LogLevel.None` (logging
    disabled); the practical consequence was that a `LogCritical(...)` call would still write output,
    but demoted to Serilog's Information level, meaning a Fatal-level alert rule would never fire for
    it. Fixed by adding the two missing mappings (`Trace` → `Verbose`, `Critical` → `Fatal`) to both
    switches. Separately, a ".NET Examples" theory bullet grouped
    `IEnumerable<T> adapters for IQueryable<T>, IObservable<T>` as if both needed adapting — but
    `IQueryable<T>` is declared `IQueryable<T> : IEnumerable<T>, ...`, extending `IEnumerable<T>`
    directly through ordinary interface inheritance, so it needs no adapter at all; only
    `IObservable<T>` (push-based, no inheritance relationship with `IEnumerable<T>`) is the genuine
    Adapter case, bridged in real Rx.NET via `ToEnumerable()`/`ToObservable()`. Fixed the theory
    bullet to state this distinction directly. A fourth, pre-existing latent bug was caught during
    the same sweep: two OTHER theory bullets (`Common Scenarios`) used bare `ILogger<T>` and
    `IEnumerable<T>` inside `[innerHTML]`-bound `theory.points` with no entity-escaping — silently
    vanishing as misparsed HTML tags — fixed alongside the others. Three subtopics: (1)
    **The ProcessPayment One-Liner Doesn't Compile** — traces the CS0023 failure precisely, why
    `|| true` cannot rescue a compile-time failure (short-circuiting is a runtime concept); (2)
    **The Missing LogLevel Mappings** — the complete, correct 6-level .NET-to-Serilog mapping,
    and why `LogLevel.None` is the only value that genuinely has no Serilog counterpart; (3)
    **IObservable vs. IQueryable: Which One Really Needs an Adapter** — builds the real
    push-to-pull `ObservableToEnumerableAdapter<T>` (via a `BlockingCollection<T>` buffer) that
    Rx.NET's own `ToEnumerable()` uses internally. **A real, newly-introduced backtick-vs-`<code>`
    house-style slip was caught and fixed mid-authoring**: an early draft of subtopic 1 used
    markdown-style backtick-wrapped inline code (`` `is null` ``, `` `||` ``, etc.) inside the
    `[innerHTML]`-bound `misconceptions.thought`/`.reality` fields AND inside the plain-interpolation
    `exercise.solution` field — the `misconceptions` instances were converted to `<code>` tags (per
    house style), while the `solution` field's backticks were simply removed entirely (plain
    interpolation never renders backticks as styled code, and per the established `solution`-field
    convention it should carry no markup or entities at all — raw text only). No `SUBTOPICS`
    collision for `adapter` (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly,
    confirmed collision-free, left bare). Build passed clean. Browser-verified: no console errors;
    all four main-page fixes confirmed rendering (including the entity-escaped generics displaying as
    literal text, not vanished); nav accordion opens with 7 toggles total; breadcrumb showed all 4
    levels on every subtopic; sidebar showed tailored composite-key content; 860px wrapper confirmed
    via `getComputedStyle`. **Design Patterns hub Phase 10: 7 of 36 topics complete.**
14. **The `bridge` batch found no undeclared-class or compile-error bug — both codeTabs (Shape/
    Renderer, Notification) were clean — but found one genuine, externally-verified inaccuracy in
    the main page's own QnA, plus two gap-closing subtopics**: the QnA's "Is ILogger&lt;T&gt; in
    .NET an example of Bridge?" answer hedged with "Partially... this is Bridge in spirit" without
    ever stating WHY only partially. Verified via WebSearch against Microsoft.Extensions.Logging's
    actual `Logger` class internals that `ILoggerFactory.CreateLogger()` builds a
    `LoggerInformation[]` array with one entry PER registered `ILoggerProvider`, and
    `Logger.Log()` loops over EVERY entry on each call — a genuine BROADCAST to N implementors
    simultaneously, structurally different from the main page's own Shape/Renderer and Notification
    examples, where an abstraction always holds exactly ONE implementor at a time. Tightened the QnA
    to state the precise mechanical reason. Three subtopics: (1) **Does ILogger Really Fit the
    Bridge Shape?** — the verified one-to-many vs. one-to-one distinction, with a
    `BroadcastLogger` sketch contrasted directly against the main page's own single-implementor
    `Circle`; (2) **Bridge vs. Strategy: Which Side Actually Grows?** — makes the main page's own
    QnA distinction ("both context and strategy are typically concrete classes" vs. "both
    abstraction and implementation are hierarchies") concrete by extending BOTH sides of the
    Shape/Renderer hierarchy (a new Triangle abstraction AND a new SvgRenderer implementor) and
    contrasting it with a Strategy example where the context class never grows; (3) **Bridge
    Wrapping an Adapter: A ConcreteImplementor for a Legacy System** — the main page's own QnA
    states this combination is common but never shows it; built a `LegacyFaxAdapter`
    ConcreteImplementor wrapping a fictional legacy fax API, connecting back to the Adapter topic's
    own `LegacyPaymentGateway` naming convention for cross-topic continuity. **Hit a NEW variant of
    the stale-dev-server-artifact family, distinct from every prior instance in this file**: a
    forced fresh file-write on `bridge.ts` (the standard fix) did NOT resolve the staleness this
    time — `ng.getComponent()` on the live component instance kept returning the OLD `qna[0].a`
    value even after the file-watcher logged a fresh "Application bundle generation complete" and
    "Page reload sent to client(s)." This codebase runs Angular 22's newer esbuild+Vite dev server,
    which apparently can retain a stale transformed-module cache in a way the file-watcher's own
    rebuild log doesn't surface as an error. **The fix that actually worked this time: a full
    `preview_stop` + `preview_start` (killing and restarting the entire dev server process)**, not
    just touching the source file — confirmed via `ng.getComponent()` returning the corrected QnA
    text immediately after the fresh server finished its cold-start compile. Diagnostic technique
    worth keeping: `window.ng.getComponent(element)` on a live component instance is a more
    reliable staleness check than text-searching rendered DOM, since it reads the actual bound data
    the running JS module holds, ruling out both HTML-caching and Angular change-detection timing as
    confounds. No `SUBTOPICS` collision for `bridge` (checked both `subtopics.ts` forms and grepped
    `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean (both the
    standalone production build, run before the stale-server incident, and the final browser
    verification after the restart). Browser-verified: no console errors; the QnA fix confirmed via
    `ng.getComponent()` directly; the `SvgRenderer` codeTab's double-escaped `\"` rendered correctly
    as a literal escaped quote in the displayed C# sample; nav accordion opens with 8 toggles total;
    breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`. **Design
    Patterns hub Phase 10: 8 of 36 topics complete.**
15. **The `composite` batch — the cleanest page found so far in this hub, no undeclared-class or
    compile-error bug in either codeTab — found one genuine, externally-verified inaccuracy in the
    main page's own theory, plus two gap-closing subtopics**: the ".NET Examples" bullet claimed
    "FileInfo and DirectoryInfo — both inherit FileSystemInfo" as a Composite example. Verified via
    WebSearch that `FileSystemInfo` declares no recursive size/traversal operation at all, and
    `DirectoryInfo` has no built-in method to recursively sum a subtree's size —
    `GetFiles()`/`GetDirectories()` return flat arrays the CALLER must manually recurse over. This
    means the shared base class only reuses METADATA (Name, Exists, Attributes), not Composite's
    defining trait (a shared operation a container recursively delegates to its children). Tightened
    the theory bullet to state this precisely. Three subtopics: (1) **Does System.IO's
    FileSystemInfo Really Give You Composite?** — the verified finding, plus a genuine
    `RealFolderComposite`/`RealFileLeaf` wrapper showing what it actually takes to get Composite
    behavior over the real BCL file-system types; (2) **What the Transparency Design Actually
    Looks Like** — the main page's own theory/quiz/QnA all discuss the Transparency-vs-Safety
    design tension (Add/Remove on the shared Component interface vs. Composite-only) but every
    codeTab only ever shows Safety; built the Transparency version (Add/Remove on
    `ITransparentFileSystemItem`, with a leaf throwing `NotSupportedException`) side by side with
    the downcast the quiz's own explanation mentions but the main page never actually writes out;
    (3) **Composite Plus Visitor, Made Concrete** — the QnA calls this "a very common combination"
    in one sentence and moves on; added a one-time `Accept(IFileSystemVisitor)` method to the main
    page's own `IFileSystemItem`/`FileItem`/`Folder` classes, then wrote two independent visitors
    (`LargeFileCounterVisitor`, `FlattenPathsVisitor`) demonstrating new operations arriving with
    zero changes to the node hierarchy — a genuine double-dispatch mechanism deliberately introduced
    early to set up the still-unbuilt Visitor topic later in the Behavioral group. A real, correctly
    -escaped double-backslash verbatim-string path (`@"C:\Projects\DevHub\src"`) was used in subtopic
    1's codeTab, confirmed rendering with single backslashes in the browser — matching the
    established "double backslash in source produces single backslash in displayed C# code" rule.
    No `SUBTOPICS` collision for `composite` (checked both `subtopics.ts` forms and grepped
    `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified via `window.ng.getComponent()` (the reliable staleness check established in
    the Bridge batch) that the theory-bullet fix was actually live before checking the DOM; no
    console errors; nav accordion opens with 9 toggles total; breadcrumb showed all 4 levels; 860px
    wrapper confirmed via `getComputedStyle`. **Design Patterns hub Phase 10: 9 of 36 topics
    complete.**
16. **The `decorator` batch found no undeclared-class or compile-error bug in either codeTab, but
    found one genuine, externally-verified inaccuracy in the main page's own QnA, plus two
    gap-closing subtopics**: the QnA's "Are C# [attributes] the Decorator pattern?" answer lumped
    Castle DynamicProxy and PostSharp together as both using "attribute-style syntax to generate
    Decorator proxies." Verified via WebSearch that they use fundamentally different mechanisms —
    Castle DynamicProxy generates a genuine runtime proxy CLASS that wraps the target (real
    Decorator-shaped composition), while PostSharp weaves aspect code directly into the compiled IL
    at BUILD time, with no wrapper object created at all (a compile-time postcompiler, not runtime
    object composition). Rewrote the QnA to distinguish the two precisely. Three subtopics: (1)
    **Castle DynamicProxy vs. PostSharp: Which One Is Actually Decorator?** — sketches both
    mechanisms side by side, and why only the DynamicProxy approach inherits Decorator's own known
    limitations (virtual-only interception, object identity); (2) **When Decorator Breaks Object
    Identity** — the QnA names "identity checks fail" as a limitation in one sentence, never
    demonstrated; built a reference-keyed `TrustedServiceRegistry` that silently fails once the
    main page's own DI registration wraps `OrderService`, plus the stable-ID fix; (3) **Removing
    One Decorator from the Middle of the Stack** — the QnA's "reconstructing the stack" cost, made
    concrete against the main page's own hand-nested DI registration lambda, contrasted with a
    list-based reconfigurable alternative and an honest note that the added indirection is not
    worth it for a 2-layer stack. **Self-caught and fixed a real, genuine bug during the pre-build
    sweep, not the build**: subtopic 3's `exercise.solution` field (plain interpolation, per the
    established rule) originally used `&lt;`/`&gt;` HTML entities around
    `List<Func<IOrderService, IOrderService>>` — since `solution` never decodes entities, this would
    have rendered the literal raw entity-code text to the reader instead of the actual generic
    syntax; fixed to raw characters before the build ever ran, confirmed via browser text-search
    after publishing that no stray `&lt;`/`&gt;` text remained and the corrected generic rendered
    correctly. No `SUBTOPICS` collision for `decorator` (checked both `subtopics.ts` forms and
    grepped `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified via `window.ng.getComponent()` that the QnA fix was live before checking the
    DOM; no console errors; nav accordion opens with 10 toggles total; breadcrumb showed all 4
    levels; 860px wrapper confirmed via `getComputedStyle`; the corrected generic syntax confirmed
    rendering as literal text after expanding the Try It exercise's "Show solution" toggle.
    **Design Patterns hub Phase 10: 10 of 36 topics complete.**
17. **The `facade` batch found and fixed a genuine, self-contained orchestration bug in the main
    page's own "Order Checkout Facade" codeTab — two distinct ways it could leak reserved
    inventory, both requiring only careful reading, no external research**: the original
    `CheckoutAsync` reserved inventory item-by-item in a loop, and if a LATER item in the cart
    failed its stock check, returned `Failure` immediately with no code releasing the items
    already successfully reserved earlier in that same loop. Separately, the "charge payment, then
    commit inventory" sequence had no exception handling at all — if `payment.Charge(...)` had
    thrown (a realistic outcome for any real payment gateway), every reserved item would leak
    indefinitely, since the method would exit via the exception before ever reaching
    `inventory.Commit(...)`. Fixed by tracking successfully-reserved items for mid-loop rollback,
    and wrapping the charge-through-commit sequence in a try/catch that releases every reservation
    on any failure, added a `Release()` method to `InventoryService`. Three subtopics: (1) **The
    Missing Rollback on Partial Checkout Failure** — traces both failure paths precisely, and
    argues (against the main page's own "no business logic in Facade" mistake block) that
    undoing the Facade's own prior steps is orchestration staying correct, not business logic;
    (2) **Facade vs. Mediator, Made Concrete** — the main page states this distinction twice in
    prose (theory AND quick reference) but never in code; built the SAME checkout subsystem two
    ways — coordination living outside the subsystem classes (Facade) vs. subsystem classes
    reporting events to a shared coordinator (Mediator); (3) **The API Gateway: A Network-Boundary
    Facade** — the QnA calls API Gateway "an architectural Facade" in one sentence; built the same
    shape at a network boundary, showing the genuinely new failure mode (a timeout means the
    gateway cannot tell whether the backend call completed or not) that an in-process Facade never
    has to reason about, tying back to subtopic 1's rollback discipline. No `SUBTOPICS` collision
    for `facade` (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed
    collision-free, left bare). A nested-quote `exercise.prompt` field in subtopic 3 (a sentence
    quoting two DIFFERENT phrases each wrapped in escaped single quotes, inside an outer
    single-quoted TS string, inside double-quoted prose) was double-checked via `tsc --noEmit`
    before the full build, then confirmed via direct browser text-search after publishing that no
    stray `\'` characters leaked into the rendered page. Build passed clean. Browser-verified via
    `window.ng.getComponent()` that the main-page rollback/catch fix was live before checking the
    DOM; no console errors; nav accordion opens with 11 toggles total; breadcrumb showed all 4
    levels; 860px wrapper confirmed via `getComputedStyle`. **Design Patterns hub Phase 10: 11 of
    36 topics complete.**
18. **The `flyweight` batch found and fixed a genuine, externally-verified inaccuracy in the main
    page's own theory, plus two gap-closing subtopics identified by careful reading alone**: the
    ".NET Examples" bullet claimed "boxed integers -128 to 127 are cached in Java/.NET-like
    runtimes." Verified via WebSearch that this is TRUE for Java (`Integer.valueOf()`'s JLS-
    mandated cache) but FALSE for .NET — the CLR's `box` IL instruction always allocates a fresh
    heap object, with no equivalent cache anywhere in the runtime. Corrected the bullet to state
    this is Java-specific and explicitly NOT a .NET Flyweight example. Three subtopics: (1) **Why
    .NET Has No Small-Integer Boxing Cache** — the verified finding, with a direct
    `ReferenceEquals` proof-by-code and the JLS-vs-CLR reasoning for why the two runtimes diverge;
    (2) **The Race in ParticleFactory.Get() Under Concurrent Access** — the main page's own QnA
    mentions thread-safety in one sentence ("use ConcurrentDictionary"), but the shown
    `ParticleFactory` uses a plain `Dictionary<string, ParticleType>`; traced the check-then-act
    race precisely (two threads can both miss the cache and create separate instances, defeating
    sharing entirely) and built the `ConcurrentDictionary.GetOrAdd()` fix, including the real
    subtlety that the factory delegate can still run more than once under contention even though
    only one value is ever stored; (3) **When Flyweight Identity Silently Merges Logically
    Distinct Objects** — the theory's own "object identity is not important" caveat describes the
    FLYWEIGHT, not the object referencing it; built a concrete bug where tracking "selected
    particles" via `HashSet<ParticleType>` instead of `HashSet<Particle>` silently selects every
    particle sharing a type once any one of them is selected. No `SUBTOPICS` collision for
    `flyweight` (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed
    collision-free, left bare). Build passed clean. Browser-verified via `window.ng.getComponent()`
    that the main-page theory fix was live before checking the DOM; no console errors; nav
    accordion opens with 12 toggles total; breadcrumb showed all 4 levels; 860px wrapper confirmed
    via `getComputedStyle`; generic syntax (`HashSet<ParticleType>`) confirmed rendering as literal
    text with no vanished tags or stray entity codes. **Design Patterns hub Phase 10: 12 of 36
    topics complete — only `proxy` remains to finish the Structural nav group.**
19. **The `proxy` batch — the final topic in the Structural nav group — found and fixed THREE
    genuine issues, all requiring only careful reading of the page's own content or one targeted
    external verification, plus a real cross-hub `SUBTOPICS` collision**: the QnA on "How does
    Proxy interact with dependency injection?" used `LoggingOrderProxy` as its illustrative class
    name — directly contradicting this SAME page's own theory bullet ("Decorator: same interface;
    purpose is ADDING BEHAVIOUR (logging, retry, validation)"), and nearly matching the
    `LoggingOrderService` class this hub's own Decorator topic already uses as ITS canonical
    Decorator example. Renamed to `CachingOrderProxy` and added a note distinguishing logging as
    the Decorator counterpart. Separately, the theory's "Four main proxy types: Virtual, Caching,
    Protection, and Remote" was left unreconciled against the quiz and QnA, which both separately
    discuss "Smart Reference Proxy" as if it were a valid but uncounted fifth type. Verified via
    WebSearch that GoF's own canonical four types are actually Remote, Virtual, Protection, and
    SMART REFERENCE — this page substitutes the more commonly-used Caching Proxy for Smart
    Reference without ever saying so; rewrote the Smart Reference QnA answer to state this
    explicitly. Three subtopics: (1) **LoggingOrderProxy Isn't a Proxy — It's a Decorator** — the
    naming-contradiction fix, with a "sorts concerns by the page's own WHETHER/WHEN-to-forward
    rule" codeTab contrasting genuine Proxy examples (auth, caching — both can skip the real call)
    against a genuine Decorator (logging — always forwards); (2) **GetOrCreateAsync Silently
    Caches null** — verified via WebSearch that `IMemoryCache.GetOrCreateAsync` caches whatever the
    factory returns BY DEFAULT, including `null` (the opposite of the common assumption that null
    results are skipped) — the main page's own `CachingProductRepository.GetByIdAsync` is exposed
    to exactly this: a lookup for a nonexistent product ID caches "not found" for the full 5-minute
    TTL, so a product created moments later stays invisible until the cache entry expires; showed
    both the `entry.Dispose()` opt-out fix and a deliberate short-TTL negative-caching alternative;
    (3) **Smart Reference: GoF's Actual Fourth Proxy Type** — the verified GoF-canon finding, with
    a genuine reference-counting `SmartReferenceProxy<T>` (lease-based acquire/release, releasing
    the real disposable resource only once every lease is returned) contrasted against the main
    page's own `LazyImageProxy` to show exactly what Smart Reference adds beyond Virtual Proxy
    alone. **A real `SUBTOPICS` map collision, different in kind from prior ones**: bare `proxy`
    was already claimed by the JavaScript hub's own native-Proxy-object topic
    (`/javascript/proxy`) — hub-prefixed to `dp-proxy` (matching this hub's own established
    `dp-` search/progress prefix already used for every other DP hub topic), with all three
    `DpNavComponent` accordion helper calls updated to the prefixed key. Confirmed via direct
    browser navigation that `/javascript/proxy` renders completely unaffected by the fix. Build
    passed clean (no duplicate-key error, confirming the collision was genuinely resolved).
    Browser-verified via `window.ng.getComponent()` that both main-page fixes were live before
    checking the DOM; no console errors; nav accordion opens with 13 toggles total; breadcrumb
    showed all 4 levels on every subtopic; 860px wrapper confirmed via `getComputedStyle`; generic
    syntax (`SmartReferenceProxy<T>`) confirmed rendering as literal text with no vanished tags.
    **Design Patterns hub Phase 10: 13 of 36 topics complete — Structural nav group fully done.**
20. **The `chain-of-responsibility` batch — the first topic in the Behavioral nav group — found and
    fixed a genuine, security-relevant C# operator-precedence bug in the main page's own "Auth
    middleware" codeTab, requiring only careful application of C# precedence rules, no external
    research**: the check `if (!context.User.Identity?.IsAuthenticated ?? false)` was intended to
    mean "if NOT authenticated, reject" but unary `!` binds TIGHTER than binary `??` in C#, so it
    actually parses as `(!context.User.Identity?.IsAuthenticated) ?? false`. Traced all three cases:
    when `Identity` is null (a plain anonymous request — the single most common case this check
    exists to catch), `!null` is null, `null ?? false` is `false`, so the 401 short-circuit is
    SKIPPED and the anonymous request is let through as if authenticated — the exact opposite of
    the intended behavior. The other two cases (genuinely authenticated, explicitly
    `IsAuthenticated = false`) both happen to work correctly, which is exactly why this class of bug
    survives casual testing. Fixed to `if (context.User.Identity?.IsAuthenticated != true)`, a
    single unambiguous comparison with no precedence trap. Three subtopics: (1) **The Auth
    Middleware's Operator-Precedence Bug** — traces every case through the buggy expression, and a
    Try It exercise asking for the PARENTHESIZED (not `!= true`) fix to test precise understanding
    of where the missing parens belong; (2) **The Pass-Through-With-Side-Effect Handler, Made
    Concrete** — the QnA names this "logging and metrics always call next() after recording" variant
    but the main page's own `ApprovalHandler` chain never demonstrates it; built an
    `AuditLogHandler` link that always forwards, and reasoned through why placing it INSIDE the
    chain (vs. an outer Decorator) allows fine-grained placement at a specific point in the
    sequence; (3) **Making "No Handler Accepted This" a Real Signal** — the main page's own
    `DirectorApprover` handles the fallthrough case with a bare `Console.WriteLine`, which is not
    silent but is not actionable either; built a real `ApprovalResult`/`ApprovalOutcome` type the
    caller can branch on, reasoning through why a thrown exception would be the WRONG fix here
    (reaching the chain's end is an expected business outcome, not an error). **A real, newly-
    introduced apostrophe-escaping mistake was caught and self-fixed mid-authoring**: an early draft
    of subtopic 2's `.html` file used backslash-escaped apostrophes (`\'`) inside the `[prev]`/
    `[next]` bound-attribute labels — the `.ts`-field convention — instead of the required
    typographic curly quote (`'`) for `.html` bound attributes; caught and fixed before the build,
    also escalating to curly double-quotes (`"..."`) for a scare-quoted label, per the DevOps hub's
    own established precedent for that specific case. No `SUBTOPICS` collision for
    `chain-of-responsibility` (checked both `subtopics.ts` forms and grepped `app.routes.ts`
    directly, confirmed collision-free, left bare). Build passed clean. Browser-verified via
    `window.ng.getComponent()` that the main-page fix was live before checking the DOM; no console
    errors; nav accordion opens with 14 toggles total; breadcrumb showed all 4 levels on every
    subtopic; 860px wrapper confirmed via `getComputedStyle`. **Design Patterns hub Phase 10: 14 of
    36 topics complete.**
21. **The `command` batch — the second topic in the Behavioral nav group — found and fixed a
    genuine, self-contained bug in the main page's own `CommandHistory` class, findable purely by
    tracing two methods against each other, no external research needed**: the main page's own
    mistake block ("Forgetting to clear the redo stack on new Execute()") correctly teaches that
    `Execute(ICommand cmd)` must call `_redoStack.Clear()` — but the SAME `CommandHistory` class's
    own `Redo()` method originally routed through that SAME `Execute()` internally, meaning redoing
    ONE command silently wiped out every OTHER command still waiting in the redo stack. Traced a
    concrete sequence (Execute A/B/C, Undo twice, Redo once) showing the exact moment C's redo entry
    gets destroyed even though redoing B never should have invalidated it. Fixed `Redo()` to
    re-execute and push to history directly, bypassing the redo-clearing side effect that only makes
    sense for genuinely new commands. Three subtopics: (1) **Redo() Silently Wipes the Rest of the
    Redo Stack** — the traced bug and fix, with a Try It exercise walking the FIXED version through
    the same sequence to confirm the remaining redo entry survives; (2) **A Real MacroCommand,
    Undone in Reverse Order** — the theory and QnA both name macro commands and their reverse-order
    undo requirement, but neither codeTab shows one; built a genuine Composite-plus-Command
    `MacroCommand`, reasoning through why forward-order undo can corrupt state when sub-commands
    depend on each other; (3) **When a Lambda Command Stops Being Enough** — the QnA names the exact
    boundary (undo state, meaningful logging, serialization) where a bare `Action` breaks down as a
    Command, but never demonstrates it failing; tested each requirement one at a time against a
    plain delegate. **A real, newly-introduced backtick-vs-`<code>` house-style slip was caught and
    fixed mid-authoring**: subtopic 1's `exercise.hint` field used a markdown-style backtick around
    `_redoStack` inside an `[innerHTML]`-bound field — converted to `<code>` per house style before
    the build ran. No `SUBTOPICS` collision for `command` (checked both `subtopics.ts` forms and
    grepped `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified via `window.ng.getComponent()` that the main-page fix was live before checking
    the DOM; no console errors; nav accordion opens with 15 toggles total; breadcrumb showed all 4
    levels on every subtopic; 860px wrapper confirmed via `getComputedStyle`. **Design Patterns hub
    Phase 10: 15 of 36 topics complete.**
22. **The `iterator` batch was the cleanest page found in a while — no self-contained bug or
    internal contradiction in either main codeTab — so all three subtopics are gap-closing/verified
    rather than main-page fixes, following the same "clean main page" precedent as Abstract
    Factory's own batch**: (1) **The Recursive-Yield Tree Traversal Is Secretly O(n²)** — verified
    via WebSearch against Eric Lippert's own "Recursive Iterator Performance" analysis that the main
    page's own `InOrderFrom` (a recursive method re-wrapping `foreach (var v in
    InOrderFrom(node.Left)) yield return v;` at every level) adds one layer of enumerator nesting per
    recursion level — O(n log n) for a balanced tree, genuinely O(n²) for a degenerate one. Since the
    main page's own `BinaryTree<T>` has no self-balancing logic, inserting already-sorted input (a
    completely realistic case, not contrived) produces exactly that degenerate shape; built the
    explicit-stack fix that keeps `yield return`'s ergonomics while doing O(n) total work regardless
    of tree shape; (2) **Merging Two External Iterators, Made Concrete** — the QnA names "external
    iterators allow merging two iterators" in one sentence, never shown; built a hand-rolled
    `MergeSorted` using explicit `MoveNext()` control over two enumerators at once, and reasoned
    through why `List<T>.ForEach()` (an internal iterator) genuinely cannot express the same
    operation; (3) **What Happens When Range's step Is Negative** — the Challenge's own `Range`
    constructor accepts any numeric `step` with no restriction, but `next()` hardcodes an
    ascending-only `current <= end` check; traced two genuinely different failure modes for a
    negative step depending on the relative position of start and end — a silent empty iteration
    for one input shape, an actual infinite loop for another — and fixed the check to depend on the
    sign of step. No `SUBTOPICS` collision for `iterator` (checked both `subtopics.ts` forms and
    grepped `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified: no console errors; nav accordion opens with 16 toggles total; breadcrumb showed
    all 4 levels on every subtopic; 860px wrapper confirmed via `getComputedStyle`; a
    `document.body.innerText` check on subtopic 3 initially came back falsely negative for text
    inside a `<pre><code>` block — confirmed via the more precise
    `codeEl.textContent` check that the content was actually rendering correctly, a tooling
    false-alarm rather than a real bug, worth remembering the next time an `innerText`-based
    verification check on preformatted code content comes back unexpectedly empty. **Design
    Patterns hub Phase 10: 16 of 36 topics complete.**
23. **The `mediator` batch — the third topic in the Behavioral nav group — found and fixed a real
    but easy-to-miss gap in the main page's own QnA, verified via WebSearch rather than assumed**:
    the "What are the trade-offs of using MediatR in a C# project?" QnA discussed indirection,
    assembly-scanning registration, and over-engineering risk, but never mentioned that MediatR
    shipped a dual RPL-1.5/commercial license from creator Jimmy Bogard's new company, Lucky Penny
    Software, starting v13 (July 2, 2025) — free for individuals and companies under $5M USD annual
    revenue, paid above that; v12.x and every earlier release stay on the original Apache 2.0
    license and were never retroactively relicensed. For a page whose own theory section calls
    MediatR "the de facto .NET Mediator for CQRS," omitting the one genuinely new trade-off
    introduced in 2025 from a QnA specifically ABOUT trade-offs was a real content gap, not just an
    opportunity for elaboration. Fixed the QnA to state the license model and threshold directly.
    Three subtopics: (1) **MediatR's 2025 Commercial License Change** — the license mechanics
    themselves (what changed, the exact revenue threshold, why 12.x sidesteps the question
    entirely), plus a brief mention of martinothamar/Mediator (a fully open-source,
    source-generator-based alternative with a near-identical API) for teams that want to avoid the
    question altogether; (2) **Publish() Stops on the First Handler Exception** — verified via
    WebSearch against MediatR's own `ForeachAwaitPublisher` source that the DEFAULT notification
    publisher awaits handlers sequentially in registration order, and a thrown exception stops every
    handler registered after it from running at all — extending the main page's own
    `EmailNotificationHandler`/`AnalyticsHandler` example, which registers two genuinely independent
    side effects with zero indication of this failure mode; showed the `TaskWhenAllPublisher`
    registration fix (`cfg.NotificationPublisher = new TaskWhenAllPublisher()`), verified via the
    exact real configuration API rather than guessed; (3) **Pipeline Behavior Execution Order** —
    verified via WebSearch that MediatR's `IPipelineBehavior` wrapping order is determined purely by
    DI registration order (first registered = outermost layer, onion-style), extending mistake #4
    on the main page, which tells the reader to register `IPipelineBehavior<,>` implementations for
    validation/logging/transactions but only ever registers ONE and never demonstrates what order
    two or more actually run in; built a concrete `LoggingBehavior`+`ValidationBehavior` chain and
    traced the exact console output for both a valid and an invalid request under two different
    registration orders. **A real, newly-introduced apostrophe-escaping mistake was caught and
    self-fixed mid-authoring**: an early draft of subtopic 2's `.html` file used a straight
    apostrophe inside a `[prev]` bound-attribute label (`'MediatR's 2025...'`) — the SAME
    delimiter-collision mistake this file has documented many times before — caught immediately
    (before ever reaching the build) and fixed to the typographic curly quote (`'`), the established
    `.html` bound-attribute convention. No `SUBTOPICS` collision for `mediator` (checked both
    `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare).
    Build passed clean. Browser-verified: no console errors; nav accordion opens with 17 toggles
    total; all 3 subtopic links render correctly including the typographic curly-quote possessive
    ("MediatR's 2025..."); breadcrumb showed all 4 levels (Home icon -> Design Patterns -> Mediator
    -> subtopic) via direct `innerHTML` inspection, not just a flat text-content check; the QnA fix
    confirmed rendering after expanding both the QnA section's own outer toggle and the specific
    Q6 row; both subtopic 2 and 3's codeTab fixes confirmed after expanding their own collapsed
    "View Code" toggles; 860px wrapper confirmed via `getComputedStyle`. One tooling gotcha
    reconfirmed: clicking a `.nav-subtopics-toggle` located via `element.parentElement.querySelector`
    can silently return the WRONG topic's toggle if the parent is a shared container with multiple
    toggles inside it — querying `medLink.querySelector(...)` (the toggle is a CHILD of the topic's
    own `<a>`, not a sibling) is the reliable selector. **Design Patterns hub Phase 10: 17 of 36
    topics complete.**
24. **The `memento` batch — the fourth topic in the Behavioral nav group — found and fixed a real,
    verified bug in the main page's own "Game Save System" codeTab, using a well-documented .NET
    gotcha rather than a guess**: `Player.CreateSave()` wrote `Inventory.AsReadOnly()`, believing it
    produced an independent snapshot of the inventory list. Verified via WebSearch against
    Microsoft's own documented behavior that `List<T>.AsReadOnly()` returns a
    `ReadOnlyCollection<T>` that WRAPS the original list — a live view, not a copy — so any later
    mutation of `Player.Inventory` silently leaks into the already-"saved" `GameSave`. This
    directly violates the SAME page's own "Deep-copying mutable state in the Memento" mistake block
    one section earlier, which explicitly teaches to copy mutable collections (`[..Inventory]`)
    rather than share a reference — the Game Save codeTab committed exactly the mistake its own
    neighboring mistake block warns against, just disguised behind a method name that sounds
    defensive. Fixed to `[..Inventory]`, matching the Text Editor codeTab's own established fix
    pattern for the identical mistake. Three subtopics: (1) **AsReadOnly() Is a View, Not a Copy**
    — traces the bug with a concrete before/after (2 items leak into an already-taken save vs. 1
    item correctly frozen), and a Try It contrasting `AsReadOnly()` against `ToArray()` (which DOES
    copy) to test precise understanding of the distinction; (2) **A Real Nested-Class Memento** —
    one of the main page's own quiz explanations describes the classic narrow/wide-interface
    nested-class Memento implementation in prose, but neither codeTab's fully-public records
    actually build one; built a private nested `Memento` class exposed only through an empty
    public `IMemento` marker interface, making Caretaker opacity a COMPILE-TIME guarantee (a
    Caretaker holding only `IMemento` has no legal way to cast down to the private concrete type)
    instead of a convention a fully-public record only asks nicely for; (3) **Delta Mementos:
    Storing Only What Changed** — the main page's own QnA recommends "incremental snapshots (delta
    mementos)" for large state but shows no code; built a `FieldChange`-based delta Memento
    contrasted against a full-snapshot `DocumentSnapshot` approach, and a Try It exercise tracing
    the real trade-off: a single user-facing "undo" spanning multiple field changes needs ALL the
    resulting deltas collected and undone together, not just the last one. **A real, newly-
    introduced mistake was self-caught and fixed BEFORE the build**: all three subtopics'
    `exercise.solution` fields (plain-interpolation, per the established per-field-binding rule)
    initially wrapped generic syntax and identifiers in `<code>` tags and HTML entities — the
    `[innerHTML]`-bound-field treatment — which would have rendered as literal raw entity-code
    text since `solution` never decodes HTML. Caught during the standard pre-build sweep (grepping
    for `<code>`/`&lt;` inside `solution:` fields specifically, per the precedent this file has
    documented for the Decorator and Prototype batches) and fixed to plain, unescaped text in all
    three files before ever reaching the build — confirmed via a direct browser check afterward
    that `List<T>.ToArray()` renders as correct literal text with no stray entity codes. No
    `SUBTOPICS` collision for `memento` (checked both `subtopics.ts` forms and grepped
    `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified: no console errors; nav accordion opens with 18 toggles total; all 3 subtopic
    links render correctly; breadcrumb showed all 4 levels; the main-page fix confirmed rendering
    after switching the code-block's own tab selector to "Game Save System" specifically (the
    default-selected tab was "Text Editor," which never contained the fix); the corrected
    `solution` fields confirmed rendering as literal text after expanding each Try It's own
    collapsed "Show solution" toggle; 860px wrapper confirmed via `getComputedStyle`. **Design
    Patterns hub Phase 10: 18 of 36 topics complete.**
25. **The `observer` batch — the fifth topic in the Behavioral nav group — found and fixed a real,
    CURRENTLY-LIVE rendering bug on the main page itself, empirically confirmed in the browser
    before ever touching the source**: three `theory.points` entries and two `qna.a` answers wrote
    `IObservable<T>`, `IObserver<T>`, and `WeakReference<T>` as BARE generic syntax inside
    `[innerHTML]`-bound fields — the browser silently misparses the `<T>` as an unknown custom
    element, dropping it from the rendered text entirely. Confirmed via a direct in-browser check
    (`target.querySelectorAll('li')` under the "IObservable<T> / IObserver<T>: Reactive Observer"
    theory heading) that the LIVE, production-serving page was rendering "IObservable: the Subject
    — has Subscribe(IObserver)." instead of the correct "IObservable\<T\>: the Subject — has
    Subscribe(IObserver\<T\>)." — this had been silently wrong on a PUBLISHED main topic page the
    whole time, not something introduced this session. Before fixing, checked every OTHER shared
    component's binding mechanism this page's fields flow through (`QuickRefComponent`,
    `QuizBlockComponent`, `RevisionCardComponent`, `CommonMistakesComponent`) to find exactly which
    fields were actually at risk: `quick-ref.name`/`desc`, `quiz.q`/`options`/`explanation`, and
    `mistakes.wrong`/`right`/`explanation` all bind via plain `{{ }}` interpolation (confirmed safe,
    matching the empirical `document.body.textContent.includes('IObservable<T>')` check on Quick
    Ref returning true) — only `theory.points`, `qna.a`, and `revision.interviewFocus` bind via
    `[innerHTML]` and needed the fix. Fixed all 6 affected occurrences
    (`theory.points` x3, `qna.a` x2, `revision.interviewFocus` x1) by wrapping in
    `<code>&lt;...&gt;</code>`, confirmed via a fresh browser check afterward that all three theory
    bullets and both QnA answers render the full generic syntax correctly. **A second, separate,
    lighter main-page tightening**: the thread-safety QnA recommended manual locking for concurrent
    observer registration without distinguishing WHICH of the page's own two Subject
    implementations actually needs it — verified via WebSearch/WebFetch against Microsoft's own
    compiler-team blog ("Events get a little overhaul in C# 4, Part I: Locks") that field-like C#
    events have generated LOCK-FREE, compare-and-swap add/remove accessors since C# 4 (2010) — a
    dateable compiler change, not an inherent property of delegates, and a genuine correction to
    the common assumption that this was "always true." Tightened the QnA to state this applies to
    the page's own `StockMarket` (a hand-rolled `List<IStockObserver>`, which DOES need manual
    synchronization) but not `OrderService.OrderPlaced` (a genuine field-like event, which doesn't).
    Three subtopics: (1) **Field-Like Events Are Already Thread-Safe** — traces the C# 4 change with
    a decompiled-accessor sketch, and a Try It testing precisely which of the QnA's own advice
    applies to which of the page's two Subject patterns; (2) **A Real IObservable\<T\> Implementation**
    — the quick ref and theory both name it at length, neither codeTab builds one; implemented the
    actual OnNext/OnError/OnCompleted grammar (including the "late subscriber to an already-completed
    stream still gets OnCompleted" contract) with zero Rx.NET dependency; (3) **What a
    WeakReference-Based Observer Looks Like** — two separate QnAs discuss this technique in prose at
    length, neither shows code; built the concrete `WeakReference<T>`-based Subject and demonstrated
    the exact non-deterministic trade-off the main page's own QnA names, using a forced
    `GC.Collect()` specifically to make an otherwise-nondeterministic outcome reproducible for the
    demonstration. **A real, newly-introduced mistake was self-caught and fixed mid-authoring, the
    SAME mistake as the immediately-prior Memento batch**: subtopic 2's own `exercise.solution` field
    initially wrapped identifiers in `<code>` tags (the `[innerHTML]`-field treatment) despite
    `solution` using plain interpolation — caught during the pre-build sweep and fixed to raw text
    before the build ever ran, confirming this specific mistake is worth a dedicated standing check
    on every future batch, not a one-off. No `SUBTOPICS` collision for `observer` (checked both
    `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare).
    Build passed clean. Browser-verified: no console errors; nav accordion opens with 19 toggles
    total; all 3 subtopic links render correctly including the raw `<T>` in "A Real IObservable<T>
    Implementation" (confirmed safe via checking every consuming component's binding mechanism —
    `SubtopicNavEntry.label` in `dp-nav.ts`, `DP_LABELS` in `breadcrumb.ts`, and `related.label`/
    `tip`/`gotchas` in `page-sidebar.ts` all bind via plain `{{ }}` interpolation, confirmed by
    reading each template directly rather than assuming); both main-page fixes (the theory-section
    generic-escaping fix and the thread-safety QnA tightening) confirmed rendering correctly;
    breadcrumb showed all 4 levels with the raw `<T>` intact; 860px wrapper confirmed via
    `getComputedStyle`. **Design Patterns hub Phase 10: 19 of 36 topics complete.**
26. **The `state` batch — the sixth and final topic in the Behavioral nav group — was the cleanest
    page found in a while: a careful read of both codeTabs, all four mistakes, the Challenge, and
    every QnA found no compile error, no internal contradiction, and no factual inaccuracy.** All
    three subtopics build real code for something the main page's own QnA answers describe in prose
    but never demonstrate: (1) **Singleton States: Making Them Actually Stateless** — the page's own
    "Should states be singletons?" QnA says stateless states are safe to share as
    `static readonly` instances, and EVERY ONE of the page's own five concrete states
    (`DraftState`/`SubmittedState`/`PaidState`/`ShippedState`/`CancelledState`) has zero instance
    fields — provably eligible — yet the codeTab allocates a fresh instance on every single
    transition regardless; converted them to shared singletons and used a Try It to test the
    boundary condition (a hypothetical `SubmittedAt` field that would make the optimization unsafe,
    tying back to the page's own THIRD mistake block about keeping domain data on the Context); (2)
    **A Data-Driven State Transition Table** — the QnA names an entire alternative approach
    ("state-event-action-nextState tuples in a data structure") and exactly when to prefer it, with
    zero code anywhere on the page; built a `Dictionary<(OrderState, OrderEvent), OrderState>`
    version of the same Order lifecycle and a Try It on the real trade-off (per-transition side
    effects don't fit a pure lookup as naturally as per-state classes do); (3) **Reconstructing
    State From Persisted Data** — the QnA sketches "switch-on-load" in one line with no working
    version; built the full save/load round trip against the page's own `Order.Status` derivation,
    making explicit the ONE real design decision the one-line sketch skips entirely — what happens
    on an unrecognized/corrupted stored value (chose to throw rather than silently default, since a
    corrupted status string should surface as an error, not quietly reset the order's lifecycle). **A
    real, newly-introduced mistake was self-caught and fixed mid-authoring, the THIRD time this
    exact mistake has recurred across three consecutive batches (Memento, Observer, now State)**:
    subtopic 1's own `exercise.solution` field again wrapped identifiers in `<code>` tags despite
    `solution` using plain interpolation — caught during the pre-build sweep and fixed before the
    build ever ran; worth treating this specific mistake as a STANDING per-batch check from here on,
    not just a lesson noted after the fact, since noting it twice already did not prevent a third
    occurrence. **A real `SUBTOPICS` collision, this time against a DIFFERENT hub than usual**: bare
    `state` was already claimed by the Terraform hub's own `/terraform/state` topic (not one of the
    more commonly-colliding hubs like JavaScript/C#/SQL) — hub-prefixed to `dp-state`, matching the
    Design Patterns hub's own existing `dp-` progress/search key prefix, with the usual `// NOTE:`
    comment; all three `DpNavComponent` accordion helper calls
    (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) use the prefixed `'dp-state'` key
    consistently; confirmed via direct navigation that `/terraform/state` itself renders correctly,
    completely unaffected by the fix. The collision was caught by the standard pre-add grep this
    time (checked before ever adding the entry), avoiding a repeat of the build-time duplicate-key
    failure this file has documented for several earlier hubs' own first collisions. Build passed
    clean. Browser-verified: no console errors; nav accordion opens with 20 toggles
    total; all 3 subtopic links render correctly; breadcrumb showed all 4 levels; 860px wrapper
    confirmed via `getComputedStyle`. **Correction to an inaccurate claim made in this same entry
    when first written**: this was originally logged as completing the Behavioral nav group — a
    mistake, caught immediately afterward by directly reading `dp-nav.ts`'s own Behavioral group
    block, which lists 11 topics (Chain of Responsibility, Command, Iterator, Mediator, Memento,
    Observer, State, Strategy, Template Method, Visitor, Null Object), not 7 — Strategy, Template
    Method, Visitor, and Null Object still remain. **Design Patterns hub Phase 10: 20 of 36 topics
    complete.**
27. **The `strategy` batch — the eighth of eleven Behavioral topics — found and fixed a genuine,
    self-contained bug in the main page's own `SelectStrategy`, findable purely by reading the code
    (no external research needed)**: a three-armed pattern match on `(customer.IsPremium,
    order.Total)` had its second and third arms — `(false, > 100m)` and `(false, _)` — BOTH
    returning `new StandardShipping()`, the exact same result. The `order.Total > 100m` condition
    could never change the outcome for a non-premium customer regardless of order size — a $50 order
    and a $500 order got identical shipping. Fixed the over-$100 arm to return `FreeShipping()`
    instead, matching the common "free shipping over $100" e-commerce threshold the three-armed
    match visibly implied but never actually delivered. Three subtopics: (1) **The Identical-
    Branches Bug in SelectStrategy** — traces the exact bug and fix, with a Try It on the precise
    `> 100m` vs `>= 100m` boundary (an order of exactly $100 does NOT qualify under the fix); (2)
    **Keyed DI Strategy Selection** — TWO separate QnAs name real .NET techniques for resolving a
    strategy at runtime through DI (`.NET 8 Keyed Services` via `AddKeyedScoped`/
    `GetKeyedService<T>`, and the older `IEnumerable<T>`-plus-selector approach) with zero working
    code for either; built both side by side; (3) **Why Strategies Must Be Reentrant** — the page's
    own QnA warns against mutable per-call state on a shared strategy instance ("would make them
    non-reentrant... use local variables... not instance fields") but never demonstrates the actual
    failure; built a concrete non-reentrant vs. reentrant discount strategy and a Try It establishing
    that the failure mode is a silently wrong result, not a crash. **A real mistake was self-caught
    and fixed in ALL THREE subtopics' `exercise.solution` fields before the build — this exact
    mistake (wrapping identifiers in `<code>`/entities inside a plain-interpolation `solution` field)
    has now recurred across FOUR consecutive batches (Memento, Observer, State, Strategy)**, despite
    being explicitly logged as a standing per-batch check after the State batch — worth escalating
    from "check for it" to "assume it happened and grep every new `solution:` field for `<code>` or
    `&lt;`/`&gt;` before ever attempting the build," since noting the pattern three times running did
    not prevent a fourth occurrence. No `SUBTOPICS` collision for `strategy` (checked both
    `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare).
    Build passed clean. Browser-verified: no console errors; nav accordion opens with 21 toggles
    total; all 3 subtopic links render correctly; the main-page fix confirmed rendering after
    switching to the "Shipping Strategy" code tab and counting three `FreeShipping()` occurrences (a
    plain substring search for the fix's own inline comment initially came back empty — the code
    itself was still correct, this was a text-matching miss, not a rendering bug, confirmed by
    reading the actual rendered code content directly instead of guessing at exact wording); all
    three corrected `solution` fields confirmed rendering as literal text with no stray entity
    codes; breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`. **Design
    Patterns hub Phase 10: 21 of 36 topics complete.**
28. **The `template-method` batch — the ninth of eleven Behavioral topics — found and fixed THREE
    genuine, verified compile errors in the main page's own C# codeTabs, the most in any single
    batch this hub, all findable via a well-known language/framework rule rather than a guess**: (1)
    the "Report Generator" codeTab's own template method was declared `public sealed void
    GenerateReport(ReportRequest request)` — C# only allows `sealed` on a method that is ALSO
    `override` (CS0238: "cannot be sealed because it is not an override"), and this method,
    declared directly on the base class itself, overrides nothing. Fixed to a plain non-virtual
    method — already un-overridable by any subclass without needing the keyword at all. (2) Mistake
    #1's own "right" example repeated the IDENTICAL bug (`public sealed void
    GenerateReport(ReportRequest r)`), clearly copy-modeled on the main codeTab's own (also-broken)
    version — fixed the same way, with the explanation text updated to note the actual C# rule. (3)
    The "Data Migration Hook" codeTab's `AuditController : ControllerBase` overrode
    `OnActionExecuting` — verified via WebSearch that `ControllerBase` (the lean, API-only base
    class) does NOT implement `IActionFilter` at all; only `Controller` (which itself inherits from
    `ControllerBase`, adding view support) declares `OnActionExecuting`/`OnActionExecuted` as
    virtual no-op hooks (CS0115: "no suitable method found to override"). Fixed to inherit from
    `Controller` instead — confirmed consistent with the main page's OWN theory section, which
    already correctly says "ASP.NET Core **Controller**: OnActionExecuting/OnActionExecuted hooks."
    Three subtopics: (1) **Why sealed Requires override in C#** — the general language rule behind
    both sealed bugs, with a worked example of where `sealed` DOES apply correctly (an intermediate
    class stopping a further override chain); (2) **ControllerBase vs Controller for Action Filter
    Hooks** — the ASP.NET Core-specific bug, PLUS a second, genuinely different fix for a team that
    wants to stay on the lighter `ControllerBase` (implementing `IActionFilter` directly, ideally
    extracted into a standalone class registered globally via `options.Filters.Add<T>()` rather than
    switching every controller's base class); (3) **Converting Template Method to Strategy,
    Concretely** — the main page's own QnA lays out a step-by-step Template-Method-to-Strategy
    conversion recipe using a DIFFERENT example than its own codeTab and never applies it to its own
    `ReportGenerator`/`SalesReportGenerator` — did exactly that, turning five overridden
    methods into five small interfaces composed via constructor injection, with a Try It on the
    concrete capability gained (freely mixing a `SalesDataFetcher` with an unrelated formatter,
    impossible under the original inheritance-based version). **Escalating on the standing
    `solution`-field mistake from the Strategy batch's own entry**: grepped every new
    `exercise.solution` field for `<code>`/HTML entities in ALL THREE subtopics BEFORE ever writing
    the build command this time (not just before committing) — caught and fixed it in TWO of the
    three subtopics this way, confirming the mandatory-pre-build-grep escalation was the right call;
    the third subtopic's `solution` field was clean on the first pass. No `SUBTOPICS` collision for
    `template-method` (checked both `subtopics.ts` forms and grepped `app.routes.ts` directly,
    confirmed collision-free, left bare). Build passed clean. Browser-verified: no console errors;
    nav accordion opens with 22 toggles total; all 3 subtopic links render correctly; all THREE
    main-page fixes confirmed rendering (the two codeTab fixes required switching the code-block's
    own tab selector to each specific tab — "Report Generator" is the default, "Data Migration Hook"
    needed an explicit click — and the mistake-block fix required expanding the Common Mistakes
    accordion); all three `solution` fields confirmed rendering as literal text with no stray
    entity codes; breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`.
    **Design Patterns hub Phase 10: 22 of 36 topics complete.**
29. **The `visitor` batch — the tenth of eleven Behavioral topics — was the cleanest page found in
    this stretch: no compile error or self-contradiction in either codeTab. All three subtopics
    build actual code for something the page's own quiz/QnA/revision describe in prose but never
    demonstrate.** (1) **The Non-Virtual Accept() Failure, Demonstrated** — one of the page's own
    quiz questions describes exactly how double dispatch breaks if `Accept()` isn't itself
    overridden per element type (the second dispatch resolves against the base-class compile-time
    type, silently calling the wrong `Visit` overload), but both codeTabs use an interface for
    elements, which makes that specific failure structurally impossible — built the broken
    abstract-base-class version that actually triggers it, traced exactly why, and the fix
    (`Accept()` made abstract and overridden per concrete class); (2) **Simulating Double Dispatch
    With dynamic** — the QnA names C#'s `dynamic` keyword as an Accept/Visit alternative "at a
    performance cost" with zero code showing what it looks like or what the cost actually is —
    built the `dynamic`-based `TotalCalculator` (no `Accept()`/interface needed on elements at all)
    and traced the real trade-off precisely: an unmatched-overload mistake moves from a compile
    error (classic Accept/Visit) to a `RuntimeBinderException` (dynamic); (3) **Visitor + Composite:
    A Recursive Order Group** — the page's own revision calls this pairing "very common" but never
    builds it against the page's own `IOrderElement`/`ProductItem`/`DiscountItem`/`ShippingItem`
    hierarchy every other codeTab already uses — built a `SplitShipmentGroup` composite whose
    `Accept()` visits itself then recurses into children, reusing every element type already on the
    page, with a Try It establishing that visiting the STRUCTURE and visiting the LEAVES are
    independent capabilities a well-built composite needs to support both of. Grepped every new
    `exercise.solution` field for `<code>`/HTML entities before ever writing the build command, per
    the mandatory-pre-build-grep escalation from the Template Method batch — all three were clean on
    the first pass. No `SUBTOPICS` collision for `visitor` (checked both `subtopics.ts` forms and
    grepped `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean.
    Browser-verified: no console errors; nav accordion opens with 23 toggles total; all 3 subtopic
    links render correctly; all three `solution` fields confirmed rendering as literal text with no
    stray entity codes; breadcrumb showed all 4 levels; 860px wrapper confirmed via
    `getComputedStyle`. **A real session interruption occurred immediately after this feature
    commit**: a subsequent `git commit` for the docs-update batch failed with "cannot lock ref
    'HEAD': unable to resolve reference 'refs/heads/development': reference broken" —
    `.git/refs/heads/development` had been silently truncated to empty content sometime after the
    feature commit succeeded (likely an interrupted write during a context-reset event mid-session,
    unrelated to the commit itself). **Diagnosed and repaired without any data loss, using the
    reflog as the recovery source**: `git cat-file`/`git show --stat` confirmed the commit object
    the reflog's last entry pointed to (`1c78b995...`) was fully intact and contained exactly the
    intended Visitor batch file list; `git fetch origin development` then confirmed the SAME commit
    was ALREADY the tip of `origin/development` — the earlier push had actually succeeded before the
    ref corruption happened, so nothing needed re-pushing. Fixed by removing the empty ref file
    (`rm .git/refs/heads/development`, since `git update-ref` itself refuses to write over a ref it
    cannot first resolve, even to overwrite it) and recreating it with `git update-ref
    refs/heads/development <sha>` pointing at the verified commit — confirmed via a clean `git fsck
    --full` (only pre-existing harmless dangling objects remained, no ref errors) and `git status`
    showing a clean working tree matching the commit exactly. **General lesson for any future ref
    corruption**: never assume a failed git command means lost work — check `.git/logs/HEAD` (the
    reflog) first, since it records commit SHAs independently of whether the branch ref itself
    updated successfully, verify the target commit object directly with `git cat-file`/`git show`
    before touching anything, and check `git fetch` against the remote before assuming a re-push is
    needed. **Design Patterns hub Phase 10: 23 of 36 topics complete.**
30. **The `null-object` batch — the ELEVENTH and final Behavioral topic — found and fixed a genuine,
    self-contained compile error, plain enough to catch on a careful read alone (no external research
    needed)**: the main page's own "Null Discount & Collection" codeTab's `ProductRepository` class
    declared NO constructor and NO field, yet its own `GetRecommendations` method referenced
    `_db.GetRecs(userId)` — a straightforward CS0103 "the name `_db` does not exist in the current
    context" error. Every OTHER class in the exact same codeTab (`PercentageDiscount`, `Checkout`)
    already uses primary-constructor dependency injection; `ProductRepository` alone was written
    without one, likely because the snippet's focus was the `?? Array.Empty<Product>()` line
    specifically. Fixed with `ProductRepository(IProductDb db)`, matching the codeTab's own
    established style exactly. Three subtopics: (1) **The Undeclared _db Field in
    ProductRepository** — traces the bug and shows a second, equally valid fix (an ordinary
    constructor assigning to an explicit `_db` field) via a Try It; (2) **Nested Null Objects for
    Object-Returning Methods** — the main page's own QnA on return values lists SIX patterns for
    what a Null Object should return per type, but only the FIRST (`Array.Empty<Product>()`) is ever
    shown; built the most structurally interesting of the remaining five — "return another Null
    Object for object return types" — as a full, recursive `NullCustomerRepository`/`NullCustomer`
    example, where `NullCustomer.Orders` itself returns an empty collection rather than null,
    keeping the "always safe" guarantee intact at every level a caller might navigate to; (3) **When
    a Null Object Violates Liskov Substitution** — the QnA states plainly that "a Null Object that
    throws `NotImplementedException` on some methods violates LSP and is worse than a null check,"
    but never shows one actually doing this; built both a `BrokenNullPaymentGateway` (two of three
    methods are genuine no-ops, the third throws) and a correct `NullPaymentGateway`, tracing exactly
    why the broken version's failure is HARDER to find than an ordinary null-dereference — it
    compiles fine, passes every test that never happens to call the one broken method, and only fails
    the first time some unrelated code path, written months later by someone who has never seen the
    class, finally reaches it. No `SUBTOPICS` collision for `null-object` (checked both
    `subtopics.ts` forms, confirmed collision-free, left bare). Grepped every new `exercise.solution`
    field for `<code>`/HTML entities before ever running the build — caught and fixed it in the
    FIRST subtopic (a fifth recurrence of this exact mistake across five consecutive batches: Memento,
    Observer, State, Strategy, now Null Object), the other two were clean on the first pass. Build
    passed clean. Browser-verified: no console errors; nav accordion opens with 24 toggles total; all
    3 subtopic links render correctly; the main-page fix confirmed rendering after switching the
    code-block's own tab selector to "Null Discount & Collection" specifically; the corrected
    `solution` field confirmed rendering as literal text with no stray entity codes; breadcrumb
    showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`. **This completes the entire
    Behavioral nav group** (Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer,
    State, Strategy, Template Method, Visitor, Null Object — all 11 of 11 topics now have subtopics).
    **Design Patterns hub Phase 10: 24 of 36 topics complete — only the Enterprise group (8 topics:
    Repository, Unit of Work, CQRS, Event Sourcing, Saga, Outbox, Specification, Clean Architecture)
    and the Principles group (4 topics: SOLID, GRASP, DRY/KISS/YAGNI, Dependency Inversion) remain.**
31. **The `repository` batch — the first topic in the Enterprise nav group — found no compile error
    in either codeTab, but a genuine, confirmed content gap requiring only careful reading to catch
    (no external research needed)**: the main page's own "Specification + Repository" codeTab
    defines `EfSpecificationEvaluator.Apply()` and an `IOrderRepository.FindAsync(ISpecification<Order>,
    ...)` interface method, plus a usage line calling `orderRepo.FindAsync(spec)` — but no repository
    CLASS anywhere on the page actually implements `FindAsync` by calling the evaluator.
    `EfSpecificationEvaluator.Apply` is defined but never called by anything shown; each of the three
    pieces (interface, evaluator, usage) is individually correct, but the page never assembles them.
    Three subtopics: (1) **Connecting EfSpecificationEvaluator to a Real Repository** — builds the
    missing `OrderRepository.FindAsync` implementation wiring `db.Orders` through the evaluator, with
    a Try It on the real performance consequence of materializing the source with `ToList()` before
    applying the specification (correct results, dramatically worse performance — every filter/sort/
    page operation moves from SQL into application memory); (2) **Generic RepositoryBase as an
    Internal Implementation Detail** — the main page's own fourth QnA draws a precise distinction
    (generic-repository criticism applies to a PUBLICLY exposed `IRepository<T>`, not to a generic
    base class used purely as internal, `protected` boilerplate-avoidance) but only ever shows the BAD
    version in its own mistake block — built the good one, with `protected` CRUD helpers on
    `RepositoryBase<T>` that a caller holding only `IOrderRepository` has no way to reach; (3) **The
    N+1 Lazy-Loading Pitfall, Demonstrated** — the QnA names this pitfall and its `Include()` fix in
    one sentence of prose, never shown with an actual query count — built the exact same
    `GetPendingOrdersAsync` method both ways (51 queries vs. 1) and a Try It on why fixing ONE
    navigation property's N+1 doesn't fix a second, un-Included one. Grepped every new
    `exercise.solution` field for `<code>`/HTML entities before ever running the build — caught and
    fixed it in the SECOND subtopic (a sixth recurrence of this exact mistake across six consecutive
    batches: Memento, Observer, State, Strategy, Null Object, now Repository), the other two were
    clean on the first pass. No `SUBTOPICS` collision for `repository` (checked both `subtopics.ts`
    forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare). Build passed
    clean. Browser-verified: no console errors; nav accordion opens with 25 toggles total; all 3
    subtopic links render correctly; all three `solution` fields confirmed rendering as literal text
    with no stray entity codes; breadcrumb showed all 4 levels; 860px wrapper confirmed via
    `getComputedStyle`. **Design Patterns hub Phase 10: 25 of 36 topics complete.**
32. **The `unit-of-work` batch — the second Enterprise-group topic — found and fixed a genuine
    structural compile error, findable purely by reading the code carefully (no external research
    needed)**: the main page's own "EF Core DbContext as UoW" codeTab closed `OrderService`'s class
    body one method too early — `TransferFundsAsync` landed OUTSIDE any class entirely, an illegal
    method declaration at namespace scope. Every brace in the file was still perfectly balanced (a
    misplaced brace, not a missing one), which is exactly why this category of mistake is easy to
    miss on a quick visual scan or bracket-matching check. Compounding it, the orphaned method's own
    body referenced `db` — only ever in scope as `OrderService`'s own primary-constructor parameter
    — a second, `_db`-shaped CS0103-style failure matching the exact pattern already found once
    before in this hub's own Null Object topic. Fixed by moving `TransferFundsAsync` back inside
    `OrderService` as a second method. Three subtopics: (1) **The Orphaned TransferFundsAsync
    Method** — traces both the structural (method outside any class) and reference (`db` out of
    scope) problems, with a Try It on an equally valid alternative fix (a brand-new
    `AccountService(ShopDbContext db)` class, since transferring funds is arguably a different domain
    concern than order processing anyway); (2) **Handling Optimistic Concurrency Conflicts** — the
    page's own QnA describes the ENTIRE mechanism precisely (a `[Timestamp]`/RowVersion column,
    `DbUpdateConcurrencyException`, reload-and-merge/client-wins/database-wins resolution) but shows
    none of it in any codeTab; built a real `TryDecrementStockAsync` that hits the conflict and
    resolves it via `entry.GetDatabaseValuesAsync()` + `entry.OriginalValues.SetValues()`, with a Try
    It tracing exactly why skipping that `SetValues()` call makes a retry fail with the identical
    exception every time; (3) **A Manual Unit of Work Without Entity Framework** — every codeTab on
    the page assumes EF Core; the QnA sketches a Dapper/raw-SQL version in prose only ("useful with
    Dapper or raw SQL") — built a working `SqlUnitOfWork` sharing one `SqlConnection`/`SqlTransaction`
    across repositories by hand, with an async factory method (since opening a connection and
    beginning a transaction are both async operations a constructor cannot await). Grepped every new
    `exercise.solution` field for `<code>`/HTML entities before ever running the build — all three
    were clean on the first pass this time. No `SUBTOPICS` collision for `unit-of-work` (checked both
    `subtopics.ts` forms and grepped `app.routes.ts` directly, confirmed collision-free, left bare).
    Build passed clean — confirming the main-page fix itself compiles. Browser-verified: no console
    errors; nav accordion opens with 26 toggles total; all 3 subtopic links render correctly; the
    main-page fix confirmed rendering after expanding the "EF Core DbContext as UoW" tab — verified
    precisely by checking `TransferFundsAsync`'s own indentation level and brace nesting in the
    rendered text, not just a substring match, to be certain it now sits genuinely inside
    `OrderService`; breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`.
    **Design Patterns hub Phase 10: 26 of 36 topics complete.**
33. **The `cqrs` batch found and fixed a genuine, reproducible C# compile error in the main page's
    own "Commands & Queries (MediatR)" codeTab**: the <code>Cancel</code> controller action was
    written as <code>public async Task&lt;IActionResult&gt; Cancel(...) =&gt;</code> immediately
    followed by a <code>{ ... }</code> block — combining expression-bodied member syntax
    (<code>=&gt;</code>, which requires exactly one expression) with a multi-statement block body,
    which C# does not allow at all. A purely self-contained catch: no external research needed,
    just recognizing that <code>Cancel</code> genuinely needs two statements (send the command,
    then return a DIFFERENT result than the mediator's own return value) where <code>Place</code>
    and <code>Get</code> on the SAME controller correctly stay as one-line <code>=&gt;</code>
    expression bodies. Fixed by dropping the stray <code>=&gt;</code>. Three subtopics: (1)
    **fix-adjacent** — traces the exact error precisely and contrasts it against the other two,
    correctly-written actions on the same controller; (2) **gap-closing** — the theory's own
    "CQRS Spectrum" bullet names "read model projection... synchronised by events" as a real point
    on the spectrum, but every codeTab reads directly from the same write-side table; built the
    missing piece with MediatR's separate <code>INotificationHandler&lt;T&gt;</code>/
    <code>Publish()</code> mechanism (distinct from the request/response
    <code>IRequestHandler&lt;T&gt;</code>/<code>Send()</code> commands and queries already use),
    keeping a denormalized <code>OrderSummary</code> read row in sync with an <code>OrderPlaced</code>
    domain event; (3) **gap-closing** — the QnA's own eventual-consistency mitigation list names
    "read from the write model immediately after their command" for the issuing user in prose only;
    built a version-stamped query handler that falls back to the write model ONLY for the one actor
    whose own write hasn't synced to the projection yet, leaving every other concurrent read on the
    fast projection path unchanged. **A real, self-caught build error during this exact batch,
    distinct from the standing `solution`-field mistake**: the first subtopic's own page-subtitle
    wrote a literal, unescaped <code>{ }</code> directly in the `.html` file's own prose text node —
    the same bare-single-brace-in-static-template-text gotcha this file has documented for other
    hubs (the TypeScript hub's `EventHandlers<T>` incident) — caught by the build itself
    (`NG5002: Unexpected character "EOF"...`), fixed with the standard `&#123;`/`&#125;`
    HTML-entity escape; confirmed this is unrelated to the `[innerHTML]`-bound-field braces rule
    (which needs NO escaping at all) since this was bare prose text directly in the `.html` file,
    not a TS string field. All three `exercise.solution` fields swept and confirmed clean on the
    first pass — the recurring `<code>`/entity-in-`solution` mistake did not recur this batch. No
    `SUBTOPICS` collision for `cqrs` (checked both `subtopics.ts` forms and grepped
    `app.routes.ts` directly, confirmed collision-free, left bare). Build passed clean after the
    brace-escape fix. Browser-verified: no console errors; nav accordion opens with 27 toggles
    total; all 3 subtopic links render correctly including the curly-quote possessive
    ("Endpoint's") in the nav accordion, breadcrumb, and sidebar; the main-page fix confirmed
    rendering (`Cancel` now has no `=>` while `Place`/`Get` still correctly do) after expanding the
    default "Commands & Queries (MediatR)" code tab; the escaped `{ }` in the subtitle confirmed
    rendering as literal text, not raw entity codes; a subtopic's own `solution` field confirmed
    rendering as literal plain text with the embedded `$"order:{e.OrderId}"` C# interpolation intact;
    breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`.
    **Design Patterns hub Phase 10: 27 of 36 topics complete.**
34. **The `event-sourcing` batch found and fixed a genuine, self-contained bug in the main page's
    own `OrderSummaryProjection`**: <code>HandleAsync(OrderPlaced e, ...)</code> called
    <code>db.OrderSummaries.AddAsync(...)</code> but never followed it with
    <code>SaveChangesAsync()</code> — <code>AddAsync</code> only queues the entity into EF Core's
    change tracker, it never writes to the database on its own. The sibling method on the SAME
    class, <code>HandleAsync(OrderCancelled e, ...)</code>, correctly ends with
    <code>SaveChangesAsync(ct)</code> — a purely self-contained catch found by comparing the two
    handler methods against each other, no external research needed. Every <code>OrderPlaced</code>
    event processed by this projection was silently never creating its read-model row. Fixed by
    adding the missing <code>SaveChangesAsync()</code> call. Three subtopics: (1) **fix-adjacent** —
    traces the exact gap and why <code>async</code>/<code>await</code> on <code>AddAsync</code>
    doesn't mean a database write happened; (2) **gap-closing** — the main page has an entire
    "Snapshots" theory section and a dedicated quiz question, but every codeTab always replays the
    FULL event stream; built a snapshot-aware <code>OrderRepository.GetByIdAsync</code> that seeds
    from the latest snapshot and replays only newer events, plus the matching
    <code>Order.FromSnapshot</code>/<code>ToSnapshot</code>/<code>ApplyRange</code> additions
    (caught and fixed a real access-modifier mistake of my own mid-authoring — <code>FromSnapshot</code>
    needed to be <code>public static</code>, not <code>private</code>, since a different class calls
    it); (3) **gap-closing** — the mistakes block, a quiz question, and a QnA answer all describe
    event upcasting in prose only; built an actual <code>OrderPlacedV1</code> → <code>OrderPlacedV2</code>
    upcaster function wired into <code>EventStore.Deserialise</code>'s own switch expression, with a
    Try It extending it to a genuine v1→v2→v3 chain. No `SUBTOPICS` collision for `event-sourcing`
    (checked both `subtopics.ts` forms — the only near-match was the unrelated `cqrs-event-sourcing`
    key from the Architecture Patterns hub — and grepped `app.routes.ts` directly, confirmed
    collision-free, left bare). All three `exercise.solution` fields swept and confirmed clean on the
    first pass. Build passed clean. Browser-verified: no console errors; nav accordion opens with 28
    toggles total; all 3 subtopic links render correctly; the main-page fix confirmed rendering after
    switching the code-block's own tab selector to "Event Store + Projection" specifically (the
    default-selected tab is "Event-Sourced Aggregate," which never contained the fix); a subtopic's
    own `solution` field confirmed rendering as literal plain text; breadcrumb showed all 4 levels;
    860px wrapper confirmed via `getComputedStyle`.
    **Design Patterns hub Phase 10: 28 of 36 topics complete.**
35. **The `saga` batch found and fixed a genuine cross-service data-contract bug in the main
    page's own "Choreography Saga" codeTab**: <code>InventoryReservedConsumer.Consume()</code>
    read <code>ctx.Message.Amount</code>, but <code>InventoryReservedEvent</code> was only ever
    CONSTRUCTED, one method above in <code>OrderPlacedConsumer</code>, as
    <code>new InventoryReservedEvent(ctx.Message.OrderId, reservationId)</code> — no
    <code>Amount</code> anywhere. The order total WAS available (right there in the same method's
    own <code>ctx.Message.Total</code>, from <code>OrderPlacedEvent</code>) but never got forwarded
    into the NEXT event Inventory Service publishes. A purely self-contained catch: no external
    research needed, just tracing which fields an event was actually constructed with versus what a
    downstream consumer reads off it — the same undeclared-field category of bug this hub has hit
    many times, just crossing a service boundary (a published event) instead of a single class this
    time. Fixed by threading <code>Total</code> through <code>InventoryReservedEvent</code>'s
    constructor and renaming the read-side reference to match. Three subtopics: (1)
    **fix-adjacent** — traces the missing-field bug precisely and explains why choreography's own
    "looser coupling, harder to trace" trade-off (already named in the main page's own theory) makes
    this specific kind of gap easy to miss; (2) **gap-closing** — the mistakes block names "pivot
    transactions" (irreversible steps like sending an email) in exactly one sentence with zero
    working example; built a <code>SagaStep</code> array with an explicit
    <code>IsCompensatable</code> flag and a <code>ValidatePivotOrdering()</code> check enforcing
    that every compensatable step comes before every non-compensatable one; (3) **gap-closing** — a
    quiz question defines commutative compensation precisely ("decrement inventory by X... vs. set
    inventory to exactly Y") but no codeTab builds either version; contrasted a read-then-set
    compensation (loses a concurrent change) against a pure decrement (survives any interleaving),
    with a Try It tracing the exact lost-update sequence for the non-commutative version. No
    `SUBTOPICS` collision for `saga` (checked both `subtopics.ts` forms and grepped
    `app.routes.ts` directly, confirmed collision-free, left bare). All three `exercise.solution`
    fields swept and confirmed clean on the first pass. Build passed clean. Browser-verified: no
    console errors; nav accordion opens with 29 toggles total; all 3 subtopic links render
    correctly; the main-page fix confirmed rendering after expanding the "Choreography Saga" tab
    specifically (the default-selected tab is "Orchestration Saga (MassTransit)," which never
    contained the bug); a subtopic's own `solution` field confirmed rendering as literal plain text;
    breadcrumb showed all 4 levels; 860px wrapper confirmed via `getComputedStyle`.
    **Design Patterns hub Phase 10: 29 of 36 topics complete.**

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
- **Go hub**: 21 trackable topic pages + 2 reference pages (23 cards total). Feature-complete.
  Teal theme `$accent: #00add8`, tint `#e8f8fd`, dark `#67e8f9`. Search prefix `go-`. Route: `/go`.
  CSS classes: `.go-page`, `.go-icon`, `.go-section`. Icon content: `Go`. `tech="javascript"`.
  Nav groups: Foundations, Concurrency, HTTP & APIs, Data & Storage, Tooling, Patterns, Reference.
  All 23 cards `available: true` in `backend/go/home/home.ts`. Progress: `goTotal=21` in progress.service.ts.
  Go pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language must be `'typescript'` — never `'go'`. `{}` in HTML must be escaped as `&#123;&#125;`.
  Go backticks in code examples must use string concatenation — they terminate TS template literals.
  GoNavComponent at `shared/go-nav/go-nav.ts` extracts Go navigation (prevents TS2563 in app.ts).
  Phase 10: 1 of 21 topics have subtopics (`/go/fundamentals`, pilot batch, 2026-07-17) — see
  "Go hub subtopic wiring" section above for the `SUBTOPICS` circular-import fix
  (`src/app/data/subtopics.ts`) every future `*NavComponent`-based hub's own pilot needs too.
- **Python hub**: 21 trackable topic pages + 2 reference pages (23 cards total). Feature-complete.
  Blue theme `$accent: #3776ab`, tint `#eff8ff`. Search prefix `py-`. Route: `/python`.
  CSS classes: `.py-page`, `.py-icon`, `.py-section` (corrected 2026-07-16 — previously misdocumented as
  `.python-page`/`.python-section`; confirmed against the real `fundamentals.html`/`.scss`). Icon content: `🐍` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, OOP & Patterns, Data & Types, Async, Web & APIs, Data Science, Tooling, Reference.
  All 23 cards `available: true` in `backend/python/home/home.ts`. Progress: `pyTotal=21` in progress.service.ts.
  Python pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`.
- **Node.js hub**: 23 trackable topic pages + 2 reference pages (25 cards total). Feature-complete.
  Green theme `$accent: #339933`, tint `#f0fdf4`. Search prefix `node-`. Route: `/node`.
  CSS classes: `.node-page`, `.node-icon`, `.node-section`. Icon content: `⬡` (`&#x2B21;`) at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, HTTP & APIs, Async & Streams, Database, Auth & Security, Performance, Tooling, Reference.
  All 25 cards `available: true` in `backend/nodejs/home/home.ts`. Progress: `nodeTotal=23` in progress.service.ts.
  Node.js pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`.
- **DevOps hub**: 21 trackable topic pages + 1 cheatsheet reference (22 cards total). Feature-complete.
  Orange theme `$accent: #ee5d25`, tint `#fff7ed`, dark `#fb923c`. Search prefix `devops-`. Route: `/devops`.
  CSS classes: `.devops-page`, `.devops-icon`, `.devops-section`. Icon content: `⚙️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, CI/CD, Source Control, Containers, IaC, Monitoring, Security, Reference.
  All 22 cards `available: true` in `cloud/devops/home/home.ts`. Progress: `devopsTotal=21` in progress.service.ts.
  DevOps pages use `app-common-mistakes` AND `app-revision-card`. Reference page (cheatsheet) has no PageComplete.
  Challenge.language: `'typescript'` or `'bash'`.
- **AWS hub**: 21 trackable topic pages + 1 cheatsheet reference (22 cards total). Feature-complete.
  Orange theme `$accent: #ff9900`, `$tint: #fff7ed`, dark `#fb923c`. Search prefix `aws-`. Route: `/aws`.
  CSS classes: `.aws-page`, `.aws-icon`, `.aws-section`. Icon content: `AWS`. `tech="javascript"`.
  Nav groups: Foundations, Compute, Networking, Storage, IAM, Databases, Serverless, Operations, Reference.
  All 22 cards `available: true` in `cloud/aws/home/home.ts`. Progress: `awsTotal=21` in progress.service.ts.
  AWS pages use `app-common-mistakes` AND `app-revision-card`. Reference page (cheatsheet) has no PageComplete.
  Challenge.language: `'typescript'`. AwsNavComponent at `shared/aws-nav/aws-nav.ts`.
  Phase 10: **COMPLETE — 21 of 21 topics have subtopics** (`/aws/fundamentals`, `/aws/ec2`,
  `/aws/ecs-eks`, `/aws/vpc`, `/aws/route53-cloudfront`, `/aws/s3`, `/aws/ebs-efs`, `/aws/iam`,
  `/aws/iam-roles`, `/aws/rds-aurora`, `/aws/dynamodb`, `/aws/lambda`, `/aws/api-gateway`,
  `/aws/cloudwatch`, `/aws/cloudformation-cdk`, `/aws/security`, `/aws/sqs-sns`,
  `/aws/eventbridge`, `/aws/step-functions`, `/aws/load-balancing`, `/aws/cost-optimization`,
  finished 2026-07-22) — see "AWS hub subtopic wiring" section above for the `AwsNavComponent`
  accordion structural fix and the `aws-fundamentals`/`aws-security` SUBTOPICS-map collision
  resolutions (`aws-security` collided with the SQL hub's own bare `security` topic key).
- **Azure hub**: 22 trackable topic pages + 1 cheatsheet reference (23 cards total). Feature-complete.
  Blue theme `$accent: #0089d6`, tint `#e8f4fd`, dark `#60b9f8`. Search prefix `azure-`. Route: `/azure`.
  CSS classes: `.azure-page`, `.azure-icon`, `.azure-section`. Icon content: `Az`. `tech="javascript"`.
  Nav groups: Foundations, Compute, Networking, Storage, Identity, Databases, App Services, Reference.
  All 23 cards `available: true` in `cloud/azure/home/home.ts`. Progress: `azureTotal=22` in progress.service.ts.
  Azure pages use `app-common-mistakes` AND `app-revision-card`. Cheatsheet reference has no PageComplete.
  Challenge.language: `'typescript'`. CodeTab.language: never `'json'` or `'bicep'` — use `'bash'` instead.
  AzureNavComponent at `shared/azure-nav/azure-nav.ts`.
  Phase 10: **COMPLETE — 22 of 22 topics have subtopics** (`/azure/fundamentals`, `/azure/arm`,
  `/azure/virtual-machines`, `/azure/app-service`, `/azure/functions`, `/azure/aks`,
  `/azure/virtual-network`, `/azure/load-balancer`, `/azure/storage`, `/azure/entra-id`,
  `/azure/rbac`, `/azure/sql-cosmos`, `/azure/monitor`, `/azure/devops-pipelines`,
  `/azure/cost-management`, `/azure/security-defender`, `/azure/key-vault`,
  `/azure/service-bus`, `/azure/container-apps`, `/azure/redis`, `/azure/api-management`,
  `/azure/bicep`, finished 2026-07-23, 66 subtopic pages total) — see
  "Azure hub subtopic wiring" section above for the `AzureNavComponent` accordion structural fix
  and the `azure-fundamentals` SUBTOPICS-map collision resolution (collided with the JavaScript
  hub's own bare `fundamentals` topic key). **Real gap caught on the `/azure/arm` batch**: adding
  a NEW topic's nav-link toggle to `AzureNavComponent` is a per-topic edit, not something the
  accordion structural fix from the pilot batch covers automatically — the ARM toggle was
  initially left unwired and only caught by a post-build browser check showing 1 open toggle
  instead of the expected 2. Verified the toggle COUNT on the topic overview page (not just that
  each subtopic page's own toggle opens) for every Azure-hub batch through to completion.
- **Linux hub**: 19 trackable topic pages + 2 reference pages (21 cards total). Feature-complete.
  Yellow theme `$accent: #fcc624`, tint `#fef9e7`, dark `#fde68a`. Search prefix `linux-`. Route: `/linux`.
  CSS classes: `.linux-page`, `.linux-icon`, `.linux-section`. Icon content: `🐧` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, File System, Processes, Networking, Shell Scripting, Package & Services, Performance, Reference.
  All 21 cards `available: true` in `cloud/linux/home/home.ts`. Progress: `linuxTotal=19` in progress.service.ts.
  Linux pages use `app-common-mistakes` AND `app-revision-card`. Reference pages (security-hardening, cron) have no PageComplete.
  Challenge.language: `'typescript'`. `${VAR}` bash variables in template literals must be escaped as `\${VAR}`.
  LinuxNavComponent at `shared/linux-nav/linux-nav.ts`.
  Phase 10: **COMPLETE — 19 of 19 topics have subtopics** (`/linux/fundamentals`,
  `/linux/file-system`, `/linux/essential-commands`, `/linux/file-permissions`,
  `/linux/users-groups`, `/linux/process-management`, `/linux/system-monitoring`,
  `/linux/networking`, `/linux/firewall`, `/linux/ssh`, `/linux/bash-scripting`,
  `/linux/bash-advanced`, `/linux/package-management`, `/linux/systemd`, `/linux/disk-storage`,
  `/linux/environment-variables`, `/linux/log-analysis`, `/linux/performance-tuning`,
  `/linux/vim`, finished 2026-07-25, 57 subtopic pages total) — see "Linux hub subtopic wiring"
  section above for the `LinuxNavComponent` accordion structural fix and the `linux-fundamentals`
  SUBTOPICS-map collision resolution (collided with the JavaScript hub's own bare `fundamentals`
  topic key). **A new stale-template variant surfaced on the final `/linux/vim` batch**: after a
  full dev-server restart with a confirmed-correct rebuild (verified via raw bundle-content
  inspection), the nav toggle button still failed to render — `ng.getComponent()` calling
  `subtopicsOf('vim')` directly on the live component returned correct data, proving the stale
  artifact was the compiled TEMPLATE itself, not the data or the lazy route chunk (every prior
  incident in this family was route-chunk staleness). Fix: force a fresh file-write directly on
  the always-eager shared nav component file itself (`linux-nav.ts`), not just `subtopics.ts`/
  `app.routes.ts` as in prior incidents — confirmed via `preview_logs` a genuine new `main.js`
  rebuild, then the toggle rendered correctly. Worth trying this specific variant (touch the
  shared nav component, not the data file) if a future hub's toggle button silently fails to
  render despite everything else checking out.
  **New gotcha found on the `/linux/process-management` batch**: a single-quoted `.ts` string
  field never needs its double quotes escaped — writing `\"$PID\"` where plain `"$PID"` is
  correct produces a stray literal backslash in the rendered text. Caught by re-reading the file,
  not by the standard apostrophe sweep. Worth a manual check on any future subtopic whose prose
  quotes a shell command containing `"..."`.
  **A second, related self-caught mistake on the very next batch (`/linux/system-monitoring`)**:
  a `[next]` label used backslash-escaping (`\'s`) for a possessive apostrophe inside an `.html`
  bound attribute — the SAME mistake already documented earlier in this session's Bicep batch as
  requiring the typographic curly quote (`’`) instead. Recurring across two different hubs
  confirms this is a genuine standing risk, not a one-off — the standard apostrophe sweep alone
  doesn't reliably catch it, since a correctly-BACKSLASH-escaped apostrophe is syntactically
  valid and produces no build error, it just renders wrong. **Always run a dedicated check
  specifically for `\'` inside `[prev]=`/`[next]=` attribute values** (distinct from the general
  apostrophe-after-letter sweep) before considering any subtopic batch's `.html` files clean.
- **Redis hub**: 21 trackable topic pages + 2 reference pages (23 cards total). Feature-complete.
  Red theme `$accent: #dc382d`, `$tint: #fff0ef`, dark `#f87171`, dark bg `#3d0a0a`. Search prefix `redis-`. Route: `/redis`.
  CSS classes: `.redis-page`, `.redis-icon`, `.redis-section`. Icon content: `R`. `tech="javascript"`.
  Nav groups: Foundations, Data Structures, Commands, Persistence, Pub/Sub & Streams, Caching, Cluster & HA, Ecosystem, Reference.
  All 23 cards `available: true` in `data/redis/home/home.ts`. Progress: `redisTotal=21` in progress.service.ts.
  Redis pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. RedisNavComponent at `shared/redis-nav/redis-nav.ts`.
- **GraphQL hub**: 20 trackable topic pages + 2 reference pages (22 cards total). Feature-complete.
  Pink theme `$accent: #e535ab`, `$tint: #fdf2f9`, dark `#f472b6`, dark bg `#3d0a26`. Search prefix `gql-`. Route: `/graphql`.
  CSS classes: `.gql-page`, `.gql-icon`, `.gql-section`. Icon content: `◈` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Operations, Server, Client, Advanced, Reference.
  All 22 cards `available: true` in `data/graphql/home/home.ts`. Progress: `gqlTotal=20` in progress.service.ts.
  GraphQL pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. GqlNavComponent at `shared/gql-nav/gql-nav.ts`.
- **Messaging/Kafka hub**: 20 trackable topic pages + 2 reference pages (22 cards total). Feature-complete.
  Burnt-orange theme `$accent: #9a3412`, `$tint: #fff7ed`, dark `#fdba74`, dark bg `#2d1a0e`. Search prefix `kafka-`. Route: `/messaging`.
  CSS classes: `.kafka-page`, `.kafka-icon`, `.kafka-section`. Icon content: `⇄` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, RabbitMQ, Kafka, Patterns, Cloud Messaging, Reliability, Reference.
  All 22 cards `available: true` in `data/messaging/home/home.ts`. Progress: `kafkaTotal=20` in progress.service.ts.
  Messaging pages use `app-common-mistakes` AND `app-revision-card`. Reference pages (monitoring, messaging-security) have no PageComplete.
  Challenge.language: `'typescript'`. MessagingNavComponent at `shared/messaging-nav/messaging-nav.ts`.
- **Testing hub**: 19 trackable topic pages + 3 reference pages (22 cards total). Feature-complete.
  Indigo theme `$accent: #6366f1`, `$tint: #eef2ff`, dark `#a5b4fc`, dark bg `#1e1b4b`. Search prefix `test-`. Route: `/testing-hub`.
  CSS classes: `.test-page`, `.test-icon`, `.test-section`. Icon content: `✓` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Test Types, Framework-Specific, Advanced, Reference.
  All 22 cards `available: true` in `fundamentals/testing/home/home.ts`. Progress: `testTotal=19` in progress.service.ts.
  Testing pages use `app-common-mistakes` AND `app-revision-card`. Reference pages (cheatsheet, performance-testing, mutation-testing) have no PageComplete.
  Challenge.language: `'typescript'`. TestingNavComponent at `shared/testing-nav/testing-nav.ts`.
- **DSA hub**: 21 trackable topic pages + 1 home (22 cards total). Feature-complete.
  Amber theme `$accent: #92400e`, `$tint: #fffbeb`, dark `#fcd34d`, dark bg `#1c1007`. Search prefix `dsa-`. Route: `/dsa`.
  CSS classes: `.dsa-page`, `.dsa-icon`, `.dsa-section`. Icon content: `DSA` text. `tech="javascript"`.
  Nav groups: Foundations, Linear DS, Trees, Graphs, Algorithms, Advanced, Dynamic Programming.
  All 22 cards `available: true` in `fundamentals/dsa/home/home.ts`. Progress: `dsaTotal=21` in progress.service.ts.
  DSA pages use `app-common-mistakes` AND `app-revision-card`. Challenge.language: `'typescript'`.
  DsaNavComponent at `shared/dsa-nav/dsa-nav.ts`.
- **AI/ML hub**: 19 trackable topic pages + 3 reference pages (22 cards total). Feature-complete.
  Violet theme `$accent: #7c3aed`, `$tint: #f5f3ff`, dark `#a78bfa`, dark bg `#1e1b4b`. Search prefix `ai-`. Route: `/ai`.
  CSS classes: `.ai-page`, `.ai-icon`, `.ai-section`. Icon content: `🤖` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Machine Learning, Deep Learning, LLMs, Prompt Eng. & Agents, MLOps, Reference.
  All 22 cards `available: true` in `fundamentals/ai/home/home.ts`. Progress: `aiTotal=19` in progress.service.ts.
  AI pages use `app-common-mistakes` AND `app-revision-card`. Reference pages (interview-prep, responsible-ai, ai-dotnet) have no PageComplete.
  Challenge.language: `'typescript'`. AiNavComponent at `shared/ai-nav/ai-nav.ts`.
- **Containers/K8s hub**: 22 trackable topic pages + 1 reference (23 cards total). Feature-complete.
  Blue theme `$accent: #326ce5`, `$tint: #eff6ff`, dark `#93c5fd`. Search prefix `k8s-`. Route: `/containers`.
  CSS classes: `.k8s-page`, `.k8s-icon`, `.k8s-section`. Icon content: `⎈` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Docker, Compose, Kubernetes Core, Workloads, Networking & Storage, Security, Reference.
  All 23 cards `available: true` in `cloud/containers/home/home.ts`. Progress: `k8sTotal=22` in progress.service.ts.
  Containers pages use `app-common-mistakes` AND `app-revision-card`. Reference page has no PageComplete.
  Challenge.language: `'typescript'`. ContainersNavComponent at `shared/containers-nav/containers-nav.ts`.
  Phase 10: **COMPLETE — 22 of 22 topics have subtopics** (66 subtopic pages total),
  finished 2026-07-21. See "Containers/K8s hub
  subtopic wiring" section above for the `ContainersNavComponent` accordion structural fix and
  the `k8s-fundamentals` SUBTOPICS-map collision resolution. Note: `search.ts`'s `url()` needed
  a special case for `k8s-architecture` specifically — its own bare topic slug happens to start
  with the hub's `k8s-` prefix, so the generic prefix-strip rule was wrongly producing
  `/containers/architecture` instead of `/containers/k8s-architecture`; check any future
  hub/topic slug that itself starts with its own hub's search-prefix string for the same risk.
  Three genuine main-page content inaccuracies were found and corrected during this hub's own
  subtopic authoring (RBAC's QnA on privilege escalation, StatefulSets' QnA on init-container
  network-namespace sharing, Resource-Limits' QnA on ResourceQuota admission behavior) — all
  confirmed against official Kubernetes docs before correction, per the established
  "fix genuine inaccuracies found during subtopic authoring" precedent. The
  `/containers/network-policies` batch also hit the documented Windows MAX_PATH gotcha for
  real (a 79-char subtopic slug + the `network-policies/subtopics/` nesting exceeded 260
  chars) — fixed per the established short-physical-folder recipe; the very next batch
  (`/containers/troubleshooting`) proactively kept all three slugs under ~55 chars from the
  start to avoid a repeat.
- **Terraform/IaC hub**: 21 trackable topic pages + 2 reference (23 cards total). Feature-complete.
  Purple theme `$accent: #7b42bc`, `$tint: #f5f3ff`. Search prefix `tf-`. Route: `/terraform`.
  CSS classes: `.tf-page`, `.tf-icon`, `.tf-section`. Icon content: `TF`. `tech="javascript"`.
  Nav groups: Foundations, Core Language, Modules, Remote State, CI/CD, Testing, Reference.
  All 23 cards `available: true` in `cloud/terraform/home/home.ts`. Progress: `tfTotal=21` in progress.service.ts.
  Terraform pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. TerraformNavComponent at `shared/terraform-nav/terraform-nav.ts`.
  Phase 10: **COMPLETE — 21 of 21 topics have subtopics** (`/terraform/fundamentals`,
  `/terraform/providers`, `/terraform/variables`, `/terraform/outputs`, `/terraform/resources`,
  `/terraform/data-sources`, `/terraform/expressions`, `/terraform/functions`, `/terraform/state`,
  `/terraform/remote-backends`, `/terraform/workspaces`, `/terraform/modules`,
  `/terraform/module-patterns`, `/terraform/provisioners`, `/terraform/import`, `/terraform/cicd`,
  `/terraform/testing`, `/terraform/security`, `/terraform/drift`, `/terraform/refactoring`,
  `/terraform/opentofu`, finished 2026-07-28, 63 subtopic pages total) — see "Terraform hub
  subtopic wiring" section below for the `TerraformNavComponent` accordion structural fix and the
  `tf-fundamentals` SUBTOPICS-map collision resolution (`providers`, `variables`, `outputs`,
  `resources`, `data-sources`, `expressions`, `state`, `remote-backends`, `workspaces`,
  `module-patterns`, `provisioners`, `import`, `cicd`, `drift`, `refactoring`, and `opentofu` were
  all collision-free, left as bare keys; `modules` collided with the TypeScript hub's own bare key
  — Go already uses `go-modules` — and was hub-prefixed to `tf-modules`; `functions` collided with
  the JavaScript hub's own bare key and was hub-prefixed to `tf-functions`; `testing` collided with
  Angular's own bare key — Go already uses `go-testing` — and was hub-prefixed to `tf-testing`;
  `security` collided with SQL's own bare key and was hub-prefixed to `tf-security`). **The
  `data-sources` batch caught a real over-escaped-double-quote bug** (`\"`
  inside a single-quoted TS field, not the backtick-delimited `code:` context where that escaping is
  correct) during the standing gotcha sweep, before it reached the build. **The `state` batch caught
  a stray invalid property accidentally left in a TheoryPoint object during authoring** (a leftover
  `protected: undefined,` line — not a documented recurring gotcha, just a real authoring slip caught
  by direct file re-read before the build, worth noting as a reminder to re-read generated theory
  arrays rather than trusting them purely by construction). **The `cicd` batch hit the site's
  initial bundle budget hard-error threshold for the first time** (`angular.json`'s
  `maximumError: "5MB"` — the total had grown to 5.60MB) — bumped to `8MB`; a real, expected
  consequence of cumulative site growth across many hubs, not a regression from this batch
  specifically, worth checking again periodically as more hubs finish Phase 10 — see "Terraform
  hub subtopic wiring" section below for all fixes.
- **Service Mesh hub**: 19 trackable topic pages + 2 reference (21 cards total). Feature-complete.
  Blue theme `$accent: #466bb0`, `$tint: #eef2fb`, dark `#93c5fd`. Search prefix `mesh-`. Route: `/service-mesh`.
  CSS classes: `.mesh-page`, `.mesh-icon`, `.mesh-section`. Icon content: `🕸️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Istio, Traffic, Security, Observability, Advanced, Reference.
  All 21 cards `available: true` in `cloud/service-mesh/home/home.ts`. Progress: `meshTotal=19` in progress.service.ts.
  Service Mesh pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. MeshNavComponent at `shared/mesh-nav/mesh-nav.ts`.
  Phase 10: **COMPLETE — 19 of 19 topics have subtopics** (`/service-mesh/fundamentals`,
  `/service-mesh/istio-architecture`, `/service-mesh/istio-install`, `/service-mesh/envoy`,
  `/service-mesh/linkerd`, `/service-mesh/traffic-management`, `/service-mesh/resilience`,
  `/service-mesh/load-balancing`, `/service-mesh/mtls`, `/service-mesh/authorization`,
  `/service-mesh/metrics`, `/service-mesh/tracing`, `/service-mesh/kiali`,
  `/service-mesh/gateway-api`, `/service-mesh/ingress-gateway`, `/service-mesh/performance`,
  `/service-mesh/ambient-mesh`, `/service-mesh/multi-cluster`, `/service-mesh/consul`,
  finished 2026-07-29, 57 subtopic pages total) — see
  "Service Mesh hub
  subtopic wiring" section below for the `MeshNavComponent` accordion structural fix and the
  `mesh-fundamentals` SUBTOPICS-map collision resolution (`istio-architecture`, `istio-install`,
  `envoy`, `linkerd`, `traffic-management`, `resilience`, `mtls`, `authorization`, `metrics`,
  `tracing`, `kiali`, `gateway-api`, `ingress-gateway`, `ambient-mesh`, `multi-cluster`, and
  `consul` were all collision-free, left as bare keys; `load-balancing` collided with the AWS
  hub's own topic and was hub-prefixed to
  `mesh-load-balancing`; `performance` collided with the Node.js hub's own topic and was
  hub-prefixed to `mesh-performance`). **The `linkerd` batch found and
  fixed a real inaccuracy on the main page itself** — a self-referential SMI TrafficSplit example
  (apex and one backend sharing the same service name), explicitly prohibited by the SMI spec.
  **The `resilience` batch found and fixed THREE more real inaccuracies** — a fault-injection/
  retries contradiction with the already-verified Traffic Management subtopic, mislabeled
  "exponential" ejection-duration growth (actually linear), and a wrong `minHealthPercent`
  default (claimed 50%, actually 0%). **The `load-balancing` batch found and fixed TWO more** —
  a non-existent `trafficPolicy.healthCheck` field, and a `warmupDurationSecs` quiz explanation
  claiming a "~0%" starting floor (actually 10%). **The `mtls` batch found and fixed a genuine
  self-contradicting inaccuracy** (the page used both `cacerts` and the outdated
  `istio-ca-secret` for the SAME CA secret in different spots) plus tightened an imprecise
  "probes bypass Envoy because they come from the kubelet" claim to state the actual
  rewrite-to-port-15020 mechanism. **The `authorization` batch found and fixed a genuine
  inaccuracy where the main page's own mistakes block had DENY/ALLOW's empty-rules semantics
  exactly backwards**, directly contradicting the same page's own (correct) QnA elsewhere. **The
  `metrics` batch found and fixed a genuine inaccuracy where all four Grafana dashboard IDs were
  mismatched with their actual names** (verified against grafana.com), plus tightened the
  Telemetry API's "additive and composable" scope-hierarchy phrasing to state its actual
  complete-field-replacement behavior. **The `tracing` batch found and fixed THREE issues,
  including this hub's first fabricated citation** — a "Prometheus Exemplars (RFC 4652)"
  attribution where RFC 4652 is real but entirely unrelated (the actual source is the OpenMetrics
  spec), an incorrect "Istio 1.16+" OpenTelemetry provider version claim (corrected to 1.22+,
  verified via archived-docs 404s), and a sampling-precedence ambiguity the main page's own
  example walked straight into. **The `kiali` batch found and fixed THREE more issues, including
  this hub's first self-contradicting error code** — an overgeneralized "reads from Prometheus"
  claim contradicted by the page's own Envoy Config Viewer description (actually queries Istiod's
  debug endpoint), a KIA0201 code cited with two different WRONG meanings in two different
  sections of the same page (the real code is KIA1107), and traffic-animation dot speed/density
  meanings swapped. **The `gateway-api` batch found and fixed this hub's most-repeated single
  inaccuracy** — "oldest route wins" stated as the primary HTTPRoute conflict-resolution rule
  across the theory, mistakes block, AND quiz, when the real precedence checks match specificity
  first and timestamp only as a last-resort tiebreaker. **The `ingress-gateway` batch found and
  fixed a genuine overgeneralization** — "TLS secrets MUST be in istio-system" stated as an
  absolute rule, when the real constraint tracks the Gateway workload's own namespace (only
  istio-system for the default gateway). **The `performance` batch found and fixed THREE more
  issues** — a field mixup (useRemoteAddress conflated with HTTP/2 performance), a fabricated
  mechanism ("JIT-compiled filters," which don't exist for standard Envoy sidecars), and a
  purely self-contained ~1000x numeric contradiction between the page's own formula and its own
  worked examples. **The `ambient-mesh` batch found and fixed EIGHT occurrences of three distinct
  inaccuracies, several missed on the first editing pass and only caught during browser
  verification** — a GA-version claim (Istio 1.22/May 2024 stated as "stable," when Istio's own
  GA blog post confirms 1.24/November 2024 — 1.22 was still Beta) repeated across the theory,
  `page-meta`'s `since=` attribute, a QnA answer, AND the revision `oneLiner` (the last three were
  missed by the initial edit pass and only caught by reading the FULL rendered page text after the
  first build, not by re-reading the source); eBPF framed as a co-equal default alongside iptables
  with a fabricated "kernels < 5.10" figure, when Istio's own ambient CNI docs state iptables+GENEVE
  is the sole default with no kernel floor and eBPF is a separate opt-in mode requiring kernel
  4.20+ (theory, the "choose sidecar" bullet, and a QnA answer); and HBONE identity wrongly
  attributed to an HTTP header rather than the underlying mTLS handshake itself (theory, the quiz
  explanation, AND a revision `mustKnow` bullet — again the last one only caught via full-page
  browser verification after the build). **Lesson reinforced**: a claim repeated in multiple
  page sections (theory prose, `page-meta` attributes, QnA, quiz explanations, revision
  summary bullets) needs a `grep` for ALL occurrences of the wrong fact/version string across the
  whole file, not just fixing the first instance found — this batch's initial edit pass missed 3
  of 8 total occurrences, all caught only by reading the complete rendered page text in the
  browser after building, not by re-reading the source file. **The `multi-cluster` batch found and
  fixed TWO more issues** — a fabricated "PILOT_PEERS"/`remotePilotAddress` mechanism for
  multi-primary config exchange that directly contradicted the page's OWN correct "Service
  discovery" bullet one line above it (verified via Istio's own multi-primary install docs that
  each Istiod independently watches the other cluster's API server, with no Istiod-to-Istiod
  protocol at all — `remotePilotAddress` is real but belongs to the different Primary-Remote
  topology instead), and an inflated "Kiali 1.73+" version gate for multi-cluster service graphs
  (verified via Kiali's own release blog that initial "Cluster Boxes" multi-cluster support shipped
  in v1.29/1.30, years earlier, and that Kiali has since moved past its 1.x line to a v2.x series
  entirely). **New style-consistency catch**: markdown-style backtick-wrapped inline code mentions
  inside `[innerHTML]`-bound fields (`theory.points`, `misconceptions.thought`/`.reality`,
  `try-it.prompt`/`.hint`) render as literal backtick characters, not styled `<code>` — found and
  converted 9 occurrences to `<code>` tags across 2 files post-build via direct browser
  inspection, while correctly leaving the `exercise.solution` field's own backticks alone (plain
  interpolation inside a pre/code block, where raw backticks are the established correct
  convention) — matches the identical mixing mistake already documented in the Terraform `cicd`
  and Service Mesh `linkerd` batches, confirming it recurs and is worth a dedicated backtick-vs-
  `<code>` check on any subtopic batch quoting a code identifier repeatedly. **The `consul` batch
  (the hub's 19th and FINAL topic) found and fixed THREE more issues, plus a genuine, previously
  undocumented [innerHTML]-parsing bug**: a self-contradiction on whether Consul uses SPIFFE
  identity (one theory bullet said "not SPIFFE SVIDs... a key difference from Istio," a LATER
  bullet on the same page said Consul certs are "SPIFFE-compatible in format" — verified via
  Consul's own built-in-CA docs that Consul's per-service mTLS certs genuinely use `spiffe://` URI
  SANs, so the format is the same and only the issuing CA differs); an imprecise "rotates at 60% of
  TTL" claim (verified via Consul's own leaf-certificate docs that the real behavior is a jittered
  60%-90% window, not a single fixed point); and a wrong cluster-peering DNS template
  `<svc>.svc.peer.consul` with no segment for the peer's own name at all (verified via Consul's own
  DNS reference: the real format is `<service>.service.<peer-name>.peer.<domain>`, confirmed via a
  concrete example `_redis._tcp.service.phx1.peer.consul`). **The new bug, distinct from every
  prior gotcha in this file**: writing angle-bracket PLACEHOLDER tokens like `<svc>` or
  `<peer-name>` (meant to represent "insert a real value here," not literal HTML) directly inside an
  `[innerHTML]`-bound field (`exercise.prompt`, `misconceptions.thought`/`.reality`) gets parsed by
  the browser as an actual (unknown) HTML element — the placeholder text silently vanishes from the
  rendered page instead of displaying as visible text. This is the SAME root mechanism as the
  established "literal HTML tag names disappear inside `[innerHTML]` fields" gotcha, but triggered
  by a PLACEHOLDER convention (angle-bracket "fill in this part" tokens borrowed from API-reference
  writing) rather than an actual HTML tag name — worth checking for on any subtopic whose prose
  describes a URL/config TEMPLATE using angle-bracket placeholders. Fixed with the same
  `&lt;`/`&gt;` entity-escape-plus-`<code>`-wrap treatment already established for literal tag
  names; the `exercise.solution` field (plain interpolation) needed NO escaping for the identical
  angle brackets, confirming the fix is per-field-binding-type, not per-content. **A related,
  inverse mistake caught in the SAME sweep**: `<code>` tags were mistakenly added inside a
  `solution` field (which uses plain interpolation, not `[innerHTML]`) — plain interpolation never
  parses tags at all, so the literal, un-rendered text "`<code>`...`</code>`" would have appeared
  as visible clutter; removed them, leaving raw text, per the established `solution`-field
  convention. **A session/tooling artifact hit during this batch's browser verification, worth
  documenting since it could recur**: the Browser pane's `computer` screenshot tool began failing
  ("Browser pane is not displayed, so the page is not compositing frames") partway through
  verification, and synthetic click dispatch (`element.click()` / manually-constructed
  `MouseEvent` dispatch) on the nested per-topic nav-accordion toggle buttons stopped reliably
  triggering their Angular `(click)` handler — confirmed this was NOT a regression from this
  batch's own code by reproducing the identical failure on an already-shipped, previously-verified
  toggle (`mtls`, `performance`) from an earlier batch. **Working fallback verification technique**:
  call the component method directly via Angular's own debug API —
  `window.ng.getComponent(document.querySelector('app-mesh-nav')).toggleSubtopics('consul',
  {stopPropagation(){}, preventDefault(){}})` — then re-check `isSubtopicsExpanded('consul')` and
  query `.nav-subtopic-link` elements; this confirmed the underlying signal/template logic was 100%
  correct even though the click SIMULATION itself couldn't be exercised in this session. Auto-
  expand-on-direct-navigation (landing directly on a subtopic URL, no click needed at all) also
  independently confirmed the same rendering path works correctly. — see "Service Mesh
  hub subtopic wiring" section below for details on all batches.
- **System Design hub**: 24 trackable topic pages + 2 reference (26 cards total). Feature-complete.
  Slate theme `$accent: #0f172a`, `$tint: #f1f5f9`, dark `#94a3b8`. Search prefix `sysdesign-`. Route: `/system-design`.
  CSS classes: `.sysdesign-page`, `.sysdesign-icon`, `.sysdesign-section`. Icon content: `🏗️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Scalability, Databases, Caching, Messaging, Real-World Systems, Reference.
  All 26 cards `available: true` in `architecture/system-design/home/home.ts`. Progress: `sysdesignTotal=24` in progress.service.ts.
  System Design pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. SysdesignNavComponent at `shared/sysdesign-nav/sysdesign-nav.ts`.
  Phase 10: **COMPLETE — 24 of 24 topics have subtopics** (`/system-design/framework`,
  `/system-design/capacity-estimation`, `/system-design/cap-theorem`, `/system-design/networking`,
  `/system-design/scaling`, `/system-design/load-balancing`, `/system-design/caching`,
  `/system-design/cdn`, `/system-design/sharding`, `/system-design/sql-vs-nosql`,
  `/system-design/replication`, `/system-design/indexes`,
  `/system-design/distributed-transactions`, `/system-design/high-availability`,
  `/system-design/fault-tolerance`, `/system-design/distributed-tracing`,
  `/system-design/disaster-recovery`, `/system-design/url-shortener`,
  `/system-design/social-feed`, `/system-design/chat-application`,
  `/system-design/search-engine`, `/system-design/payment-system`,
  `/system-design/video-streaming`, `/system-design/ai-ml-system-design`, finished 2026-07-29) —
  fixed `SysdesignNavComponent`'s missing subtopics-accordion structural gap (10th `*NavComponent`
  hub in a row missing it at pilot time; copied `MeshNavComponent`'s implementation exactly).
  `framework` and `capacity-estimation` SUBTOPICS keys both collision-free, left bare.
  `.sysdesign-page` wrapper NOT global —
  every subtopic `.scss` needs the full `.sysdesign-page { max-width: 860px; margin: 0 auto; }`
  rule. Sidebar keys full-path-prefixed (`system-design/framework`). No live playground (system
  design content has no in-browser runtime) — plain `<app-code-block>`. The `framework` pilot
  batch used a different verification style than most hubs: rather than "main page states X,
  verified wrong," two of the three subtopics were gap-closing additions (peak-vs-average QPS
  sizing, Little's Law for concurrency sizing) since the main page's own content was largely
  accurate methodology/interview-strategy material with few hard factual claims to check; the
  third subtopic DID correct a real, verifiable inaccuracy (a memorized "SSD random read = 0.1ms"
  figure, corrected to the canonical ~0.15ms per "Latency Numbers Every Programmer Should Know").
  **The `capacity-estimation` batch found and fixed THREE more real inaccuracies, including a
  self-contained one requiring zero external research** — the main page's own "Rules of thumb"
  claimed "SSD is 1,000× faster than spinning disk" immediately below its OWN latency table
  listing SSD random read at 100µs and HDD seek at 10ms, numbers which (even before any external
  fact-check) imply a 100× ratio, not 1,000× — corrected to the externally-verified ~65× using the
  canonical 150µs SSD figure; a Redis/Memcached same-DC GET listed at double the network round
  trip (1ms vs. the page's own 0.5ms network RTT figure), when cache-server command processing is
  actually sub-microsecond, verified via real-world Redis benchmarks showing GET latency tracks
  the network RTT itself; and a "storage scales ×1,024 at every step" claim stated as a universal
  rule, when vendors use decimal ×1,000 while only OS/software use binary ×1,024, a gap
  (well-documented, e.g. a "1TB" drive showing as "~931GB" in an OS) that grows from ~2.4% at KB
  scale to ~7.4% at GB/TB scale — exactly the range system design estimates operate in.
  **The `cap-theorem` batch found and fixed a genuine self-contained quiz-design flaw, tightened
  an incomplete consistency-model definition, and added a gap-closing history subtopic**: the
  page's own quorum quiz named W=2,R=2 as the sole correct answer to "which settings guarantee
  strong consistency" while one of its own "wrong" options, W=3,R=3, ALSO satisfies the page's own
  stated W+R>N formula (6>3) — fixed by swapping it for a genuinely-wrong option (W=1,R=2, sum 3);
  the one-line definition "sequential consistency: writes appear in order" omitted the exact
  property (ALL operations, ALL processes, ONE agreed-upon order) that distinguishes it from
  causal consistency directly above it on the same spectrum — tightened to the complete
  definition; and a gap-closing subtopic named Gilbert & Lynch's 2002 formal proof (with its
  specific asynchronous-network, atomic-consistency conditions), which the main page's "Brewer's
  theorem (2000)" attribution never mentioned at all.
  **The `networking` batch found and fixed one real inaccuracy plus two gap-closing additions**:
  the page's own quiz explanation cited a flat "DNS falls back to TCP for responses > 512 bytes"
  rule — the pre-EDNS0 (1987-era) limit — verified that modern DNS negotiates a much larger UDP
  buffer via EDNS0 (commonly ~1232 bytes since the 2020 DNS Flag Day), so DNSSEC-signed and
  multi-record responses routinely stay on UDP today; a gap-closing subtopic added TCP connection
  TEARDOWN (the main page covered only the 3-way SETUP handshake) — the 4-way close and the
  resulting TIME_WAIT state, which can genuinely exhaust a service's ~28,000 ephemeral ports under
  high connection churn if it isn't pooling connections; and a second gap-closing subtopic
  explained the cache-stampede (thundering herd) problem behind "stale-while-revalidate," which the
  page named as a bare Cache-Control directive with zero explanation of what it actually prevents.
  **Real SUBTOPICS collision**: bare `networking` already claimed by the Linux hub's own topic —
  hub-prefixed to `sysdesign-networking`, matching the hub's own existing progress/search key
  prefix (this key was ALREADY `sysdesign-`-prefixed for progress/search purposes before this
  batch, independent of the subtopics collision, so no separate mismatch to reconcile).
  **The `scaling` batch found and fixed one real inaccuracy plus two gap-closing additions**: the
  page cited a deprecated AWS instance (u-24tb1.metal, 448 vCPU/24TB) as the vertical-scaling
  ceiling — verified via AWS's own docs that this type is no longer available for new launches,
  the current largest is u7in-32tb.224xlarge (896 vCPU/32TiB); a gap-closing subtopic added
  Gustafson's Law as the counterpart to Amdahl's Law (fixed-problem-size pessimistic ceiling vs.
  problem-size-grows-with-resources, which is what most horizontal scaling for user/data growth
  actually is); and a second gap-closing subtopic added Firecracker microVM cold-start times
  (~125ms) as a third elastic-compute option the page's VM (2-5min) / container (30-60s)
  cold-start figures never mentioned. Hit and resolved a stale `ng serve` dev-server chunk for the
  main-page fix during browser verification (forced a fresh file-write to trigger recompilation —
  the production build itself was correct throughout, confirming this is a preview-tooling
  artifact, not a real defect).
  **The `load-balancing` batch found and fixed TWO more real inaccuracies, plus a gap-closing
  addition**: the page's QnA cited "typically 30-60 seconds" for connection draining while
  explicitly naming AWS ALB — verified via AWS's own docs that ALB's actual default deregistration
  delay is 300 seconds (5 minutes), with 30-60s being a common manually-tuned value, not the
  default; the page's SPOF mistake fix claimed a keepalived/VRRP secondary claims the VIP "in < 2
  seconds" — verified via VRRP's own failure-detection formula ((advert_int × 3) + skew_time) that
  the default 1-second advert_int produces a ~3-second window instead; and a gap-closing subtopic
  explains the theoretical result (Mitzenmacher) behind the page's one-line "power of two
  choices... near-optimal" claim — an exponential improvement in max load over pure random
  placement, with diminishing (constant-factor only) returns beyond 2 choices.
  **The `caching` batch found and fixed TWO more real inaccuracies, plus a gap-closing addition**:
  the page's Quick Reference called LRU "Default Redis eviction" — verified via Redis's own docs
  that the actual default `maxmemory-policy` is `noeviction` (rejects writes at the memory limit
  rather than evicting anything; `allkeys-lru` is a common recommended CHOICE, not the automatic
  default); a self-contained gap found by cross-checking the page's own two code samples — the
  cache-aside example's `updateUser()` only calls `redis.del()` (invalidating L2), while a
  separate multi-level-cache example introduces an L1 in-process `Map` with no invalidation path
  at all, silently relying on an unstated 30-second staleness window; and a gap-closing subtopic
  on the "Probabilistic Early Expiration" code, which names the real XFetch algorithm but omits
  its `delta` (recompute-cost) term, verified against the actual published formula.
  **The `cdn` batch found and fixed a genuine stale headline number, plus two gap-closing
  additions**: the page's DDoS QnA cited "Cloudflare: 100+ Tbps" — verified via Cloudflare's own
  2026 blog post that the network has since crossed 500 Tbps of provisioned external capacity
  (with the important caveat, also stated by Cloudflare itself, that this is provisioned capacity
  — the ceiling — not typical traffic served, which is only a fraction of the total); a gap-closing
  subtopic expanded the anycast quiz's true-but-incomplete "automatic failover" claim with the
  actual BGP convergence window (commonly 5-15s, up to 30-90s with default timers; ~100-150ms if
  BFD is explicitly configured) — a real, bounded outage window the quiz explanation never
  mentions; and a second gap-closing subtopic expanded the QnA's "vary by a user segment cookie"
  personalization advice with the well-documented cache-fragmentation trap of varying on the RAW
  Cookie header instead (which typically contains a unique session ID per user, driving effective
  cache hit rate toward zero) and the standard fix (normalize the signal to its own small, bounded
  header before varying on it). No `SUBTOPICS` collision for `cdn` (checked both forms,
  confirmed collision-free, left bare). Self-caught and fixed a literal-double-quote-inside-a-
  double-quoted-attribute mistake before build (the eyebrow `subtopicLabel` originally quoted
  "100+ Tbps" with straight double quotes, prematurely closing the outer attribute — the same
  no-safe-escape, rephrase-to-avoid-it family already documented for this exact collision type)
  and an over-escaped-backslash-apostrophe inside a backtick-delimited `code:` field (`\\'`
  rendered a visible stray backslash; removed the escaping — backticks never need it).
  **The `sharding` batch found and fixed a genuine misattributed-figures inaccuracy, plus two
  gap-closing additions**: the page's "Why shard?" opener stated "a single PostgreSQL instance
  tops out around 100k TPS and 64 TB" as if both were inherent PostgreSQL software limits —
  verified that 64 TB is specifically AWS RDS's managed-storage ceiling for PostgreSQL (self-
  hosted Postgres has no such cap; the real PG-specific limit is 32 TB per single TABLE, a
  different figure describing a different scope), and that single-node Postgres has been
  benchmarked past 3 million TPS on read-heavy, in-memory workloads — corrected the page to state
  each figure's real scope instead of presenting them as hard software ceilings; a gap-closing
  subtopic expanded the page's one-line "double-write to old + new shard" resharding description
  with the well-documented "dual-write problem" (a failure between two independent application
  writes leaves shards silently inconsistent) and verified that Vitess's own resharding tool
  (VReplication/VStreamer) actually uses binlog-based CDC, not naive application dual writes — a
  direct contrast with the very tool the page names elsewhere; and a second gap-closing subtopic
  quantified WHY virtual nodes are needed (a claim the page's Quick Reference names but never
  explains) — basic single-position consistent hashing measures ~30% load variance across nodes,
  which many virtual positions per physical node (a statistical averaging effect) reduce to under
  1%. No `SUBTOPICS` collision for `sharding` (checked both forms, confirmed collision-free, left
  bare). Build passed clean throughout.
  **The `sql-vs-nosql` batch found and fixed THREE precision issues, all verified against
  authoritative sources**: two of the page's own ACID quiz explanations defined "Isolation" in
  absolute terms ("transactions execute as if they were serial") — verified this describes the
  Serializable isolation level specifically, and that neither PostgreSQL (defaults to Read
  Committed) nor MySQL/InnoDB (defaults to Repeatable Read) runs at Serializable by default;
  the QnA's "MongoDB supports multi-document ACID transactions since v4.0" omitted that this
  applied to replica sets only — sharded-cluster transaction support did not ship until 4.2, a
  year later (verified against MongoDB's own release history); and the theory section's "DynamoDB
  automatically scales to any throughput" was tightened to match the SAME page's own more precise
  QnA, which already names the real per-partition ceiling (~10 GB, ~3,000 RCU / ~1,000 WCU per
  AWS's own documented constraints) that no amount of table-level provisioning raises for a single
  hot partition key. All three corrections were internal-consistency-style fixes (the page
  contradicted or under-qualified itself across different sections) combined with external
  verification, not corrections of an isolated wrong fact. No `SUBTOPICS` collision for
  `sql-vs-nosql` (checked both forms, confirmed collision-free, left bare). Build passed clean.
  **The `replication` batch found and fixed THREE precision issues, one of them a genuine
  self-contradiction requiring zero external research to catch**: the theory section's
  `synchronous_standby_names = 1` example directly contradicted the SAME page's own later, correct
  example (`synchronous_standby_names = 'replica1'` in the "Using async replication for financial
  data" mistake block) — verified against PostgreSQL's own docs that a bare number is not valid
  syntax at all (the setting takes a quoted name or FIRST/ANY num (...) forms) and fixed the theory
  bullet; the quorum formula's "W=2, R=2 → strongly consistent" was tightened to note the
  well-documented Kleppmann-style caveats (sloppy quorums, concurrent writes, racing reads can all
  break the overlap guarantee even when W+R>N holds numerically); and the "DynamoDB (by default
  eventual, tunable to quorum)" grouping alongside Cassandra/Riak was corrected — verified that
  DynamoDB offers only a binary eventually-vs-strongly-consistent READ choice with no numeric W/R
  parameter at all, a genuinely different (simpler) model from Cassandra's continuous tunable
  knob. No `SUBTOPICS` collision for `replication` (checked both forms, confirmed collision-free,
  left bare). Build passed clean.
  **The `indexes` batch found and fixed THREE precision issues, one requiring a real hub-prefixed
  SUBTOPICS collision resolution**: the "Missing index on foreign key columns" mistake said "MySQL
  warns about this" — verified via MySQL's own docs that InnoDB does not merely warn, it
  automatically CREATES the missing FK index; the index-bloat QnA's "REINDEX CONCURRENTLY rebuilds
  the index without locking the table" was tightened — verified against PostgreSQL's own docs that
  it takes a SHARE UPDATE EXCLUSIVE lock (not zero locking) that blocks other schema changes,
  though it correctly does not block reads/writes; and a gap-closing subtopic expanded the
  composite-index column-order rule ("equality first, range last") with the fuller, widely-used
  ESR (Equality, Sort, Range) rule, which gives pure ORDER BY columns their own middle slot the
  page's two-part phrasing never addressed. **Real SUBTOPICS collision**: bare `indexes` was
  already claimed by the SQL hub's own `/sql/indexes` topic — hub-prefixed to `sysdesign-indexes`,
  matching this hub's own existing progress/search key prefix (already `sysdesign-`-prefixed
  before this batch, so no separate mismatch to reconcile) — confirmed via browser check that
  `/sql/indexes` itself rendered unaffected. Build passed clean.
  **The `distributed-transactions` batch found and fixed THREE issues, including this hub's
  strongest self-contained catch yet**: the "Idempotency Key" code sample generated its key with
  `` `pay-${orderId}-${Date.now()}` `` — recomputed on every call, including every retry — while
  the SAME code sample's own walkthrough directly below it showed the identical literal key sent
  on both the original attempt and the retry, a self-contradiction requiring zero external
  research to spot; verified against Stripe's own documented idempotency-key practice (generate
  once, store, reuse for every retry — never regenerate) and fixed the code to use
  `crypto.randomUUID()` generated once, outside any retry loop; the "Kafka transactions: producer
  writes to topic + marks offset as committed" theory bullet was tightened — verified that
  offset-committing via `sendOffsetsToTransaction()` is specific to the consume-transform-produce
  (stream processing) pattern, not a feature of every Kafka transaction, and that the page's OWN
  outbox example (a plain producer with no input topic) never actually involved a consumer offset
  at all; and a gap-closing subtopic added nuance to the QnA's "TCC does not block if a coordinator
  fails because each participant can handle Cancel autonomously" claim — verified against Apache
  Seata's own documentation that a Transaction Manager still drives timeout-triggered Cancel calls,
  and that TCC has its own documented "suspended" edge case (a delayed Try arriving after Cancel
  already ran) that does not self-resolve automatically. No `SUBTOPICS` collision for
  `distributed-transactions` (checked both forms, confirmed collision-free, left bare). Self-caught
  and fixed a literal-double-quote-inside-a-double-quoted-attribute mistake before build (a `[next]`
  label used a straight apostrophe in "TCC's" inside a single-quoted string within a double-quoted
  bound attribute — fixed to the typographic curly quote, the same established rule applied
  throughout this hub) and an over-escaped `\\'` inside a backtick-delimited `code:` field (removed
  the unnecessary escaping). Hit one transient build error (`Expected "}" but found "Compile"` at
  an unrelated line in `subtopics.ts`) that did not reproduce on an immediate retry with zero
  content changes — treated as a flaky/transient esbuild artifact, not a real defect, since the
  file's actual content was independently verified clean via direct byte inspection around the
  reported line before retrying. Build passed clean on retry.
  **The `high-availability` batch found and fixed THREE issues, plus hit a real Windows MAX_PATH
  `git add` failure needing the established fix**: the "AWS RDS Multi-AZ: automatic failover in
  60-120 seconds" mistake fix remained accurate for the traditional Multi-AZ INSTANCE deployment,
  but a gap-closing subtopic added the newer Multi-AZ DB CLUSTER option AWS also offers — under
  35-second failover with readable standbys, verified against AWS's own docs; the error-budget
  QnA's "0.1% of requests... OR about 8.7 hours of downtime" was tightened — verified against
  Google's own SRE book that request-based and time-based availability are genuinely different
  measurement methodologies (the book explicitly prefers request-based) that only coincide under a
  simplifying assumption real systems with partial degradation routinely break; and the
  active-active quickRef/theory's "failover is instant" phrasing was tightened to name the real,
  configurable health-check detection window (interval × unhealthy-threshold, commonly 10-150s)
  that still has to elapse before a dead node stops receiving traffic. No `SUBTOPICS` collision for
  `high-availability` (checked both forms, confirmed collision-free, left bare). **Hit the
  documented Windows MAX_PATH `git add` gotcha for real** on the RDS subtopic's 72-character slug
  (appearing twice in the path, folder + filename) — fixed per the established recipe: renamed the
  physical folder/files to a short `rds-multi-az-db-clusters` name, updated only the component's
  own `templateUrl`/`styleUrl` and `app.routes.ts`'s `loadComponent` import path, while leaving the
  route's own `path:` (URL segment) and every other wiring touchpoint (SUBTOPICS map, breadcrumb,
  sidebar, search index) on the original, fully descriptive slug — confirmed via direct browser
  navigation that the long descriptive URL still resolves correctly after the rename. Also caught,
  before build, a bare single backslash-before-newline inside a multi-line bash `codeTabs` sample —
  a genuinely new gotcha, not previously documented in this file: a raw `\` immediately followed by
  a literal newline INSIDE a backtick template literal is parsed by JavaScript as a LineContinuation
  escape and silently vanishes (removing the intended line break entirely), unlike the codebase's
  established convention (confirmed correct via re-reading the pre-existing, human-authored CDN main
  page's own bash examples) of using an ESCAPED `\\` before the newline specifically so a literal
  single backslash character survives into the rendered output. **New standing sweep addition**: any
  future codeTabs bash/shell sample using trailing-backslash line continuation must use `\\`, not a
  bare `\`, before the newline — grep for a bare, non-escaped `\` at end-of-line in any new bash code
  sample before building. Build passed clean.
  **The `fault-tolerance` batch found and fixed THREE issues in the page's own Challenge
  solution, all requiring only internal cross-checks (no external research needed)**: the
  solution's `new TokenBucketLimiter(redis, 10, 20)` comment claimed "10/min per user," but
  TokenBucketLimiter's own constructor signature (defined earlier on the SAME page) names its
  second parameter `ratePerSec` — the value as written configured 600/min (10/sec sustained), a
  60x-too-permissive rate limit for a payment endpoint; fixed to `10 / 60` with an explanatory
  comment. The solution's fraud-check timeout used only a 1.25x p99 ratio (800ms p99, 1000ms
  timeout) while the page's own QnA states an explicit "2-3x p99" sizing rule — and the SAME
  solution's stripe.charge call, right next to it, correctly used a 2.5x ratio, making this a
  real internal inconsistency, not just an isolated choice; fixed the fraud-check timeout to
  2000ms (also 2.5x). A gap-closing subtopic corrected the theory bullet/code comment listing
  "PUT (with idempotency key)" as retry-safe — verified against RFC 7231 that PUT, DELETE, and
  GET are idempotent by the HTTP specification's own definition, requiring no idempotency-key
  workaround at all; that mechanism is specifically needed for POST, which the spec does not
  classify as idempotent. No `SUBTOPICS` collision for `fault-tolerance` (checked both forms,
  confirmed collision-free, left bare). Kept all three subtopic folder/file names short from the
  start (matching the route slug exactly) specifically to avoid a repeat of the High Availability
  batch's MAX_PATH `git add` failure — confirmed safe margin on the longest slug. Verifying the
  Challenge-solution fixes in the browser required a TWO-STEP accordion reveal not previously
  documented for this component: clicking "Reveal Solution" first, THEN a separate "View Code"
  toggle that appears only after the solution is revealed — a single click on either alone left
  the corrected code text absent from the DOM. Build passed clean.
  **The `distributed-tracing` batch found and fixed a genuine self-contradicting label, plus two
  gap-closing additions**: the "100% sampling in high-traffic production" mistake block's fixed
  code sample headed itself "// Tail-based sampling: keep 1% of normal + 100% of errors/slow" —
  directly contradicted by the very next line's own comment, "// 1% head sample." Verified against
  OpenTelemetry's own docs that ParentBasedSampler/TraceIdRatioBased is a canonical HEAD-based
  sampler (decides at trace start, no outcome visibility) — the actual tail-based half of the
  strategy is the Collector's separate tail_sampling processor, which the code sample only ever
  mentions in a trailing comment without configuring. Fixed the header comment to correctly
  describe the combined head (SDK) + tail (Collector) strategy. A gap-closing subtopic named
  Jaeger's native OTLP receiver (shipped in v1.35, May 2022) — the page's only Jaeger example
  routes through an OTel Collector, never mentioning that a single-backend setup can point its SDK
  directly at Jaeger's own OTLP endpoint instead. A second gap-closing subtopic added the TraceQL
  caveat to the page's accurate-but-incomplete "Tempo: no indexing" claim — verified that TraceQL
  enables real attribute-based search via bloom filters scanning object-storage blocks, not just
  exact trace-ID lookup, at the cost of slower per-query performance than an indexed backend. No
  `SUBTOPICS` collision for `distributed-tracing` (checked both forms, confirmed collision-free,
  left bare — note a DIFFERENT hub, Observability, has its own unrelated `distributed-tracing`
  ROUTE at a different parent path, which is not a SUBTOPICS-map collision). Build passed clean.
  Hit a cold dev-server start during verification (confirmed via `curl`-polling rather than a
  fixed sleep) — otherwise no incidents.
  **The `disaster-recovery` batch found and fixed a genuine self-contradicting claim, plus a
  cross-topic and a mechanism-explaining addition**: the theory section's "restore to any 5-min
  window" PITR claim directly contradicted the page's OWN Challenge solution, which describes
  restoring "to 30 seconds before the DELETE" and states "< 30 seconds (PITR granularity)" —
  verified against AWS's own docs that the real distinction is LatestRestorableTime (a ~5-minute
  RECENCY lag on how close to now you can restore) versus actual restore GRANULARITY (any second,
  via continuously archived transaction logs) — fixed both the theory bullet and the Challenge
  solution's own phrasing to state this correctly. A gap-closing subtopic cross-referenced this
  hub's own already-verified High Availability fact (RDS Multi-AZ DB Cluster's under-35-second
  failover) to this page's own AZ-failure Challenge scenario, which still assumed the traditional
  60-120s Multi-AZ instance figure. A second gap-closing subtopic explained WHY the page's two
  different cross-region RPO figures (Aurora Global's <1s vs. a plain read replica's <1min) differ
  by over 60x — verified via AWS's own docs that Aurora Global Database uses dedicated, storage-
  based replication infrastructure below the engine layer, fundamentally different from a plain
  replica's logical WAL replication, a mechanical reason the page states both figures but never
  explains. No `SUBTOPICS` collision for `disaster-recovery` (checked both forms, confirmed
  collision-free, left bare). Self-caught and fixed an over-escaped `\\'` inside a backtick-
  delimited `code:` field before build (removed the unnecessary escaping — backticks never need
  apostrophe-escaping). Build passed clean.
  **The `url-shortener` batch found and fixed THREE genuine issues, requiring only internal
  cross-checks and pure arithmetic — no external research needed**: the "Predictable sequential
  codes" mistake fix included a birthday-paradox collision formula and concluded "≈ negligible" —
  evaluated with the page's own stated numbers (n=100M, m=62^7), the formula's exponent is ~-1420,
  making the collision probability ~100%, the opposite conclusion; fixed the comment and reframed
  it as the reason the page's own retry-on-collision loop is essential, not optional. The extended
  quiz marked "auto-increment + Base62" as the single best short-code approach with an explanation
  that never mentioned enumeration risk — directly contradicting the page's own "Predictable
  sequential codes (security)" mistake block, which warns against exactly this technique for
  exactly that reason; reconciled with a counter-obfuscation (XOR mask) fix that keeps
  collision-freedom while closing the enumeration hole. The Challenge solution's own
  `totalClicksPerDay` formula divides by RETENTION_YEARS, but the comment directly below it
  ("50M × 100 / 365 = 13.7M") silently dropped that division term, and the following `readQps`
  line used the comment's mismatched 13.7M instead of what the formula actually evaluates to
  (~2.74M) — a ~5x error that propagated into the DB-read-replica estimate too; fixed the comment,
  `readQps`, the downstream DB-reads line, and the matching Challenge hint (which had made the
  same "spread over lifetime" mistake even more severely). No `SUBTOPICS` collision for
  `url-shortener` (checked both forms, confirmed collision-free, left bare). Build passed clean.
  **The `social-feed` batch found and fixed THREE more genuine issues, two via external
  verification and one purely self-contained**: the "Scale & Storage" Redis feed-memory estimate
  ("500M users × 1000 posts × 8 bytes = 4 TB") counted only the post_id payload, ignoring that
  Redis sorted sets store every member in BOTH a hash table and a skip list once past the
  128-entry listpack threshold — verified via WebSearch that the real per-entry cost at this list
  length (feeds trimmed to 1,000 entries, 8x past the threshold) is roughly 100-136+ bytes, not 8,
  making the real total ~65 TB, not 4 TB (~16x); the same code sample's read-QPS line used "500M
  active" users while the page's OWN Challenge description states "500M registered users, 100M
  daily active" — a self-contained 5x overcount caught by comparing the page's two population
  figures against each other, corrected the read-QPS estimate to use the 100M DAU figure
  (~5,800 reads/sec, not ~29,000); and the page's own "Feed Read" code sample JOINed against
  `users` (`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.author_id = u.id`)
  despite the SAME page repeatedly recommending denormalizing author data onto posts specifically
  to avoid this exact JOIN on the hot read path — fixed to a single-table SELECT reading the
  already-denormalized `author_username`/`author_avatar` columns. No `SUBTOPICS` collision for
  `social-feed` (checked both forms, confirmed collision-free, left bare). Build passed clean;
  browser-verified all three main-page fixes render correctly (had to click each `codeTabs`
  tab-selector button — `Scale & Storage`/`Feed Read` — since the code-block component's own tab
  switcher, not just a single collapsed "View Code" toggle, gates which tab's content is in the
  DOM) and the nav accordion opens correctly with all 3 subtopic labels.
  **The `chat-application` batch found and fixed THREE more genuine issues, one purely
  self-contained (a code-vs-requirement contradiction), one an internal cross-page-section
  contradiction, and one requiring external verification**: the "WebSocket Server" code sample
  used `connections.set(userId, ws)` — a single-value `Map<string, WebSocket>` keyed by user ID —
  while the page's own Challenge explicitly requires handling a user "on different device," which
  a one-connection-per-key Map cannot represent; a second device connecting silently overwrites
  the first device's entry (no error anywhere), and the first device's later close handler then
  deletes the SECOND device's still-open entry — fixed to `Map<string, Set<WebSocket>>` with
  subscribe-once-per-user/fan-out-to-all-devices semantics. The Challenge asked for "Exactly-once
  delivery" while the page's own Theory section states "At-least-once delivery... is the common
  default for chat systems... requires the client to deduplicate" — a self-contained
  cross-section contradiction (if dedup is needed, duplicates can occur, which is definitionally
  not exactly-once) — corrected the requirement to "Effectively-once delivery" (at-least-once +
  idempotency-key dedup), matching the page's own stated architecture. The E2E encryption hint
  described Signal Protocol as "A fetches B's public key → encrypts message locally → sends
  ciphertext" for every message — verified via WebSearch against Signal's own published
  specification that this is inaccurate: X3DH performs a ONE-TIME initial key agreement, then
  the Double Ratchet derives a NEW symmetric key for every subsequent message (never reusing a
  static public key), providing forward secrecy that repeated public-key encryption cannot.
  **Real gotcha caught during browser verification, not the build**: generic-syntax mentions like
  `Map<string, Set<WebSocket>>` written as plain prose inside `[innerHTML]`-bound `theory.points`/
  `misconceptions.thought` fields were silently parsed as (unknown) HTML tags and vanished from
  the rendered page — the build stayed green throughout since this is a runtime-only failure, not
  a compile error. Fixed by wrapping every such mention in `<code>&lt;...&gt;</code>` (the same
  established treatment already used for angle-bracket placeholders and C# generics in other
  hubs) — confirmed via `document.body.innerText` checks before and after the fix. No `SUBTOPICS`
  collision for `chat-application` (checked both forms, confirmed collision-free, left bare).
  Build passed clean (after one transient, unrelated `fonts.googleapis.com` network fetch failure
  on the first attempt — retried clean). Browser-verified: nav accordion opens with all 3 labels;
  all three main-page fixes confirmed rendering (the E2E fix required both "Reveal Solution" AND
  "View Code" clicks on the Challenge block, matching the established two-step Challenge-solution
  reveal pattern); 860px wrapper confirmed via `getComputedStyle`.
  **The `payment-system` batch found and fixed THREE more genuine issues, one a self-contained
  internal contradiction, one an external-verification database-locking gap, and one a
  same-page anti-pattern the page's own quiz warns about**: the Theory section's own $100
  payment example stated "Credit: merchant_wallet +$100, Credit: platform_fee +$0" while the
  SAME page's "Double-Entry Ledger" code sample, for the identical $100 scenario, shows a 97/3
  split (merchant +$97, platform +$3) — caught by comparing the page's own two worked examples
  against each other; the original $0 entry also directly violated the ledger schema's own
  `CONSTRAINT no_zero_amount CHECK (amount != 0)` shown in the same code sample, since the
  correct way to represent "no fee" is omitting the entry, not zeroing it — fixed the theory
  prose to the 97/3 split used everywhere else on the page. The transfer Challenge solution
  sorted account IDs (`[from, to].sort()`) with a comment claiming this "locks accounts in
  consistent order to prevent deadlock," then ran a bare `WHERE id IN (?, ?) FOR UPDATE` —
  verified via WebSearch/PostgreSQL mailing-list discussion that a bare `IN()` clause does NOT
  guarantee the database acquires row locks in the order the values were sorted in application
  code; the query planner is free to choose any scan order, and for a UUID column that's
  effectively arbitrary — added `ORDER BY id` to make lock-acquisition order actually
  deterministic. The SAME Challenge solution's idempotency check
  (`const existing = await db.query(...); if (existing) return existing;` followed by real work
  before an eventual INSERT) is the EXACT check-then-act race condition the page's own quiz
  question 4 explicitly names and warns against ("relies on a database uniqueness constraint...
  not a naive check-then-act pattern") — money itself was still protected (assuming
  `transfers.id` is a primary key, the losing INSERT fails and its transaction rolls back), but
  the losing concurrent request would see an uncaught error instead of the promised idempotent
  success response; added a try/catch that treats a unique-constraint violation as "lost the
  race" and re-fetches/returns the winner's result. No `SUBTOPICS` collision for
  `payment-system` (checked both forms, confirmed collision-free, left bare). Build passed
  clean. Browser-verified: nav accordion opens with all 3 labels; the theory fix confirmed
  rendering directly (not collapsed); both Challenge-solution fixes required Reveal Solution +
  clicking the SOLUTION's own separate "▼ View Code" toggle specifically — the Challenge block
  has TWO such toggles (one for the collapsed starterCode, one for the solution, both with
  identical button text), and a naive `find()` on button text hits the FIRST (starterCode's) one,
  not necessarily the solution's — querying and clicking ALL matching toggles is the reliable
  approach; 860px wrapper confirmed via `getComputedStyle`.
  **The `video-streaming` batch found and fixed THREE more genuine issues, the FINAL topic before
  this hub's Phase 10 rollout is complete**: the "CDN Cache Strategy" code sample cited
  "Cloudflare/Akamai: 200+ Tbps capacity across all PoPs" — this hub's OWN `/system-design/cdn`
  topic had already researched and corrected the identical fact to 500+ Tbps during its own
  Phase 10 authoring, caught by cross-referencing an already-verified fact from a sibling page
  rather than fresh WebSearch. The Challenge's own cost estimate multiplied three per-day
  quantities (`100M viewers × 2 hrs/day × 1.5 GB/hr`) and labeled the result "300 PB/month" —
  every input carries a `/day` unit, so the raw product is a per-DAY total with no ×30
  (days-in-month) step anywhere in the shown calculation; the accompanying `$3M/month` cost
  figure was internally consistent with the wrong "300 PB" number (which is exactly what made the
  mislabeled time period easy to miss), corrected to ~9,000 PB and ~$90M for an actual month. The
  SAME Challenge's compute formula used `× 4 resolutions` while its own resolution ladder one
  paragraph earlier lists SIX levels (`240p → 360p → 480p → 720p → 1080p → 4K`) — fixed the
  multiplier (90,000 vCPU-minutes/min, not 60,000) and scaled the downstream spot-fleet size and
  hourly-cost figures by the same 1.5× ratio to stay internally consistent. No `SUBTOPICS`
  collision for `video-streaming` (checked both forms, confirmed collision-free, left bare).
  Build passed clean. Browser-verified: nav accordion opens with all 3 labels; the CDN capacity
  fix confirmed after clicking the "CDN Cache Strategy" code-tab button directly (a broad
  `.code-tabs button` query returns a SINGLE button with all three tab labels concatenated —
  `find()` on exact trimmed text against `document.querySelectorAll('button')` is what actually
  finds the real, individually-clickable tab button, the same lesson already documented for this
  hub's own social-feed batch); both Challenge-solution fixes confirmed after Reveal Solution +
  the solution's own separate View Code toggle (this Challenge's `starterCode` had no separate
  toggle of its own, unlike the payment-system batch's two-identical-toggles case, so a single
  querySelectorAll match was sufficient here — still worth checking the actual count before
  assuming which pattern applies); 860px wrapper confirmed via `getComputedStyle`. **This leaves
  only `/system-design/ai-ml-system-design` as the 24th and final Phase 10 topic remaining.**
  **The `ai-ml-system-design` batch — the FINAL topic — found and fixed THREE more genuine
  issues, all self-contained (zero external research needed)**: the RAG pipeline's generation
  step called `openai.chat.completions.create({ model: 'claude-sonnet-4-6', ... })` — an
  Anthropic model identifier passed to the OpenAI SDK client, which would fail at runtime since
  OpenAI's API has no model by that name — corrected to a real OpenAI model (`gpt-4o`), with a
  gap-closing subtopic explaining the general "provider SDKs aren't interchangeable" lesson and
  contrasting it against the page's OWN correct example of a deliberate compatibility layer
  (vLLM's OpenAI-compatible proxy for an open-weight Llama model). The Challenge's own hint
  stated "LLM 2-4s" while the solution's actual figures give P50=1500ms — below the hint's 2s
  floor — and P99=3500ms — inside the range, which is exactly what made the mismatch easy to
  miss (only the lower bound disagreed); corrected the hint to derive its numbers directly from
  the solution ("LLM 1.5-3.5s (P50-P99)"). The theory section stated naive LLM serving as "~1
  request/sec" while the SAME page's own code sample states "~15 tokens/sec" for the identical
  no-batching baseline — reconciled via the page's own ~400-output-token figure (stated in the
  Challenge's latencyBudget): 15 tokens/sec ÷ 400 tokens/response ≈ 0.037 requests/sec, roughly
  27x lower than the theory section's original claim; corrected the theory to state throughput
  in tokens/sec, matching both the code sample and the rest of the page's own vLLM comparison
  chain (naive → continuous batching → prefix caching, all already in tokens/sec). No
  `SUBTOPICS` collision for `ai-ml-system-design` (checked both forms, confirmed collision-free,
  left bare). Build passed clean. Browser-verified: nav accordion opens with all 3 labels
  (this topic sits at the END of its own nav group, requiring the accordion markup to be added
  after the LAST `<a>` in the group rather than before a following sibling link, unlike every
  other topic in this batch's own Real-World Systems group); all three main-page fixes confirmed
  rendering (the RAG codeTab fix needed the individual "RAG Pipeline" tab button — re-queried
  after an initial stale reference, matching the established pattern; the Challenge hint fix
  needed the "Show hints" toggle, not Reveal Solution, since hints render in a separate
  always-visible-once-expanded list distinct from the solution block); 860px wrapper confirmed
  via `getComputedStyle`. **This completes the System Design hub's Phase 10 rollout — all 24
  topics now have deep-dive subtopic pages, 72 subtopic pages total across the hub.**
  **The `search-engine` batch found and fixed TWO more genuine issues, one purely self-contained
  arithmetic and one requiring external verification, plus a gap-closing addition**: the
  Challenge solution's own worked example stated "500M docs, 30 primary shards -- each ~33M
  docs" — 500,000,000 ÷ 30 = ~16.7M, not 33M; tracing the likely cause, the SAME example
  separately states the index totals 1 TB, and 1000 GB ÷ 30 = ~33 GB per shard (which even fits
  the page's own "10-50 GB per shard" recommendation elsewhere) — a storage-size figure that
  appears to have been mislabeled as a document count, sharing a leading digit with the correct
  answer purely by coincidence of these specific inputs; corrected to state both true figures
  separately. The QnA stated "By default, an index has 5 primary shards" — verified via
  WebSearch that this default changed to 1 in Elasticsearch 7.0 (2019), a classic
  documentation-drift trap where a years-true fact keeps circulating after the software changed;
  corrected, and a gap-closing subtopic added the Split API (verified via WebSearch) as a faster
  alternative to the page's own Reindex-based approach for increasing shard count specifically
  — reroutes existing shard data instead of a full document copy, with two real constraints
  (source must be read-only; target count must be a multiple of the source count) the page
  didn't cover. No `SUBTOPICS` collision for `search-engine` (checked both forms, confirmed
  collision-free, left bare). Build passed clean. Browser-verified: nav accordion opens with all
  3 labels; both main-page fixes confirmed rendering — the arithmetic fix needed "Reveal
  Solution" + "View Code" clicks on the Challenge block (the FIRST click landed on the
  starterCode's own collapsed "View Code" toggle, not the solution's — the solution's own
  separate "▼ View Code" toggle only appears after "Reveal Solution" is clicked, confirming the
  established two-step reveal pattern precisely), and the QnA fix needed the QnA section's outer
  toggle plus the specific question's own row click before its corrected text appeared in the
  DOM; 860px wrapper confirmed via `getComputedStyle`.
- **Architecture Patterns hub**: 22 trackable topic pages + 3 reference (25 cards total). Feature-complete.
  Violet theme `$accent: #7c3aed`, `$tint: #f5f3ff`, dark `#c4b5fd`. Search prefix `arch-`. Route: `/arch-patterns`.
  CSS classes: `.arch-page`, `.arch-icon`, `.arch-section`. Icon content: `🏛️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups (corrected 2026-07-30 — previously misdocumented as "Foundations, Service Patterns,
  Data Patterns, Deployment, Reference"; confirmed against the real `arch-nav.ts`): Architectural
  Styles, Microservices, Messaging, Domain-Driven Design, Integration, Reference.
  All 25 cards `available: true` in `architecture/arch-patterns/home/home.ts`. Progress: `archTotal=22` in progress.service.ts.
  Architecture Patterns pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. ArchNavComponent at `shared/arch-nav/arch-nav.ts`.
  Phase 10: **COMPLETE — 22 of 22 topics have subtopics** (`/arch-patterns/monolith-vs-modular`,
  `/arch-patterns/layered-architecture`, `/arch-patterns/clean-architecture`,
  `/arch-patterns/hexagonal-architecture`, `/arch-patterns/vertical-slice`,
  `/arch-patterns/service-oriented`, `/arch-patterns/microservices-principles`,
  `/arch-patterns/service-communication`, `/arch-patterns/api-gateway-pattern`,
  `/arch-patterns/service-discovery`, `/arch-patterns/circuit-breaker`,
  `/arch-patterns/sidecar-service-mesh`, `/arch-patterns/event-driven`,
  `/arch-patterns/cqrs-event-sourcing`, `/arch-patterns/saga-choreography`,
  `/arch-patterns/inbox-outbox`, `/arch-patterns/ddd-core`, `/arch-patterns/bounded-contexts`,
  `/arch-patterns/aggregates-domain-events`, `/arch-patterns/anti-corruption-layer`,
  `/arch-patterns/strangler-fig`, `/arch-patterns/backend-for-frontend`, finished 2026-08-04) —
  see
  "Architecture Patterns hub subtopic wiring" section below for the `ArchNavComponent` accordion
  structural fix (11th `*NavComponent`-based hub in a row missing it at pilot time), a real
  cross-hub `SUBTOPICS`-key collision risk with the Design Patterns hub's own identical
  `clean-architecture` slug, and the genuine main-page inaccuracies found and fixed across every
  batch so far. The `bounded-contexts` batch found and fixed an internal inconsistency where the
  page's own "Event Storming Output" codeTab labeled the Order-to-Catalog relationship as
  Customer/Supplier while a separate codeTab showed the identical relationship using an
  Anti-Corruption Layer, and labeled Order-to-Shipping/Notification with an ad-hoc "Event-driven"
  name absent from the page's own QnA list of canonical context-map patterns — verified via
  WebSearch and fixed by naming the real pattern (Event Publisher, a canonical upstream pattern
  per the ddd-crew/context-mapping reference, alongside Open Host Service) and reconciling ACL
  (a translation mechanism the downstream builds unilaterally) against Customer/Supplier (a
  planning relationship needing separate evidence the upstream accommodates the downstream). This
  completes the Domain-Driven Design nav group's 2nd of 2 topics that have subtopics so far — only
  `aggregates-domain-events` remains from that group, then the Integration group
  (`anti-corruption-layer`, `strangler-fig`, `backend-for-frontend`), before the hub reaches 22/22.
  The `aggregates-domain-events` batch that followed immediately after fixed a real compile error
  (the "Saving & Publishing Events" codeTab's `PlaceOrderHandler` constructor declared only
  `orders`/`events` but its own method body called `this.catalogService.getPrice(...)`, an
  undeclared field — TS2339 under strict mode) and traced a dual-write bug the page's own theory
  names but the codeTab doesn't defend against (`orders.save()` and `events.publishAll()` are two
  separate operations; a broker failure after a successful save silently loses the event forever)
  — fixed with an explicit risk comment and a subtopic applying this hub's own Inbox & Outbox topic
  to close the gap. This completes the Domain-Driven Design nav group entirely. The
  `anti-corruption-layer` batch that followed fixed another real compile error (the "ACL: Legacy
  ERP Integration" codeTab's `LegacyErpAdapter` declared one field but used a second, undeclared
  `erpClient` in a different method) plus a real gap (the page's own revision/QnA claim the ACL
  implements a Domain-defined `IPaymentGateway` interface, but no codeTab ever shows it). The
  `strangler-fig` batch that followed fixed two more self-contained bugs: a rollout-ramp comment
  naming the wrong migrated feature (it named `cancelOrder()`, which has no feature-flag mechanism
  at all, when the ramp actually describes `placeOrder()`'s own flag), and the Parallel Run
  codeTab's discrepancy check nested inside an ID-difference condition, silently skipping the
  status/total comparison whenever the two systems happened to produce the same order ID. The
  final batch, `backend-for-frontend`, was unusually clean (no self-contained bug or contradiction
  found) — its 3 subtopics are all gap-closing: a GraphQL BFF resolver demonstrating the N+1
  problem and DataLoader fix the page's own QnA discusses but never shows in code; an examination
  of whether the Challenge's own hardcoded `hasBreakingNews` threshold quietly violates the page's
  "no business logic in the BFF" mistake; and a v1/v2 versioning migration the Third-Party BFF
  codeTab's own trailing comment names but never demonstrates. **This completes the Architecture
  Patterns hub's entire Phase 10 rollout — all 22 topics now have deep-dive subtopic pages, 66
  subtopic pages total across the hub.**
- **Design Patterns hub**: 36 trackable topic pages + 3 reference (39 cards total). Feature-complete.
  Blue theme `$accent: #0369a1`, `$tint: #e0f2fe`, dark `#7dd3fc`. Search prefix `dp-`. Route: `/design-patterns`.
  CSS classes: `.dp-page`, `.dp-icon`, `.dp-section`. Icon content: `DP`. `tech="javascript"`.
  Nav groups: Creational, Structural, Behavioral, Enterprise, Principles, Reference.
  All 39 cards `available: true` in `architecture/design-patterns/home/home.ts`. Progress: `dpTotal=36` in progress.service.ts.
  Design Patterns pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. DpNavComponent at `shared/dp-nav/dp-nav.ts`.
  Phase 10: 29 of 36 topics have subtopics (`/design-patterns/singleton`,
  `/design-patterns/factory-method`, `/design-patterns/abstract-factory`,
  `/design-patterns/builder`, `/design-patterns/prototype`, `/design-patterns/object-pool`,
  `/design-patterns/adapter`, `/design-patterns/bridge`, `/design-patterns/composite`,
  `/design-patterns/decorator`, `/design-patterns/facade`, `/design-patterns/flyweight`,
  `/design-patterns/proxy`, `/design-patterns/chain-of-responsibility`, `/design-patterns/command`,
  `/design-patterns/iterator`, `/design-patterns/mediator`, `/design-patterns/memento`,
  `/design-patterns/observer`, `/design-patterns/state`, `/design-patterns/strategy`,
  `/design-patterns/template-method`, `/design-patterns/visitor`, `/design-patterns/null-object`,
  `/design-patterns/repository`, `/design-patterns/unit-of-work`, `/design-patterns/cqrs`,
  `/design-patterns/event-sourcing`, `/design-patterns/saga`,
  2026-08-04/2026-08-30, Structural + Behavioral nav groups complete; Enterprise in progress) — see
  "Design Patterns hub subtopic wiring" section above for the `DpNavComponent` accordion structural
  fix (12th `*NavComponent`-based hub in a row missing it at pilot time) and the genuine bugs found
  and fixed across both batches so far. The `factory-method` batch found and fixed two more
  self-contained bugs in the "DI Approach" codeTab: a switch case returning `new
  PushNotification()`, a class never declared anywhere on the page (even though the theory section
  already named it correctly), and an exception message using JavaScript template-literal syntax
  (backticks) instead of valid C# string interpolation (`$"..."`) — backticks aren't valid C#
  syntax at all. A third subtopic named a genuine, unstated tension: the page's own mistake #1
  calls out type-switching as an OCP violation, but the "DI Approach" codeTab's own
  `Create(channel)` method does the exact same thing internally — DI solves testability, not
  Open/Closed compliance, which the classic subclass-based pattern uniquely preserves.
- **Security & Auth hub**: 23 trackable topic pages + 2 reference (25 cards total). Feature-complete.
  Red theme `$accent: #dc2626`, `$tint: #fef2f2`, dark `#f87171`. Search prefix `sec-`. Route: `/security`.
  CSS classes: `.sec-page`, `.sec-icon`, `.sec-section`. Icon content: `🔒` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Authentication, Authorization, Cryptography, Application Security, Reference.
  All 25 cards `available: true` in `architecture/security/home/home.ts`. Progress: `secTotal=23` in progress.service.ts.
  Security pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. SecurityNavComponent at `shared/security-nav/security-nav.ts`.
- **API Design hub**: 19 trackable topic pages + 2 reference (21 cards total). Feature-complete.
  Cyan theme `$accent: #0891b2`, `$tint: #ecfeff`. Search prefix `api-`. Route: `/api-design`.
  CSS classes: `.api-page`, `.api-icon`, `.api-section`. Icon content: `🔌` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, REST, gRPC & GraphQL, Real-Time, Design & Governance, Reference.
  All 21 cards `available: true` in `architecture/api-design/home/home.ts`. Progress: `apiTotal=19` in progress.service.ts.
  API Design pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. ApiDesignNavComponent at `shared/api-design-nav/api-design-nav.ts`.
- **Observability & SRE hub**: 20 trackable topic pages + 2 reference (22 cards total). Feature-complete.
  Emerald theme `$accent: #059669`, `$tint: #ecfdf5`, dark `#34d399`. Search prefix `obs-`. Route: `/observability`.
  CSS classes: `.obs-page`, `.obs-icon`, `.obs-section`. Icon content: `📊` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Metrics, Logging, Tracing, SLO & Alerting, Incident Management, Reference.
  All 22 cards `available: true` in `architecture/observability/home/home.ts`. Progress: `obsTotal=20` in progress.service.ts.
  Observability pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. ObsNavComponent at `shared/obs-nav/obs-nav.ts`.
- **Hub home**: Angular, C#, ASP.NET Core, SQL, TypeScript, React, JavaScript, CSS, HTML, Blazor, Go, Node.js, Python, DevOps, AWS, Azure, Linux, Redis, GraphQL, Messaging, Testing, DSA, AI/ML, Containers/K8s, Terraform/IaC, Service Mesh, System Design, Architecture Patterns, Design Patterns, Security, API Design, Observability, Web Performance, and MongoDB are all `available: true`. Everything else "Soon".
- Progress totals: Angular 58, C# 50, ASP.NET Core 45, SQL 44, TypeScript 20, React 17, JavaScript 22, CSS 22, HTML 23, Web Performance 20, Blazor 20, Go 21, Node.js 23, Python 21, DevOps 21, AWS 21, Azure 22, Linux 19, Redis 21, GraphQL 20, Messaging 20, Testing 19, DSA 21, AI 19, Containers/K8s 22, Terraform 21, Service Mesh 19, System Design 24, Architecture Patterns 22, Design Patterns 36, Security 23, API Design 19, Observability 20, MongoDB 21 (`progress.service.ts`).
- Hero stat: "933+ Live Pages" (corrected 2026-07-01 — hub-home.ts's Angular card was showing `topics: 63` instead of the actual 68, undercounting the site total by 5).

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
