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
- **Azure hub**: 22 trackable topic pages + 1 cheatsheet reference (23 cards total). Feature-complete.
  Blue theme `$accent: #0089d6`, tint `#e8f4fd`, dark `#60b9f8`. Search prefix `azure-`. Route: `/azure`.
  CSS classes: `.azure-page`, `.azure-icon`, `.azure-section`. Icon content: `Az`. `tech="javascript"`.
  Nav groups: Foundations, Compute, Networking, Storage, Identity, Databases, App Services, Reference.
  All 23 cards `available: true` in `cloud/azure/home/home.ts`. Progress: `azureTotal=22` in progress.service.ts.
  Azure pages use `app-common-mistakes` AND `app-revision-card`. Cheatsheet reference has no PageComplete.
  Challenge.language: `'typescript'`. CodeTab.language: never `'json'` or `'bicep'` — use `'bash'` instead.
- **Linux hub**: 19 trackable topic pages + 2 reference pages (21 cards total). Feature-complete.
  Yellow theme `$accent: #fcc624`, tint `#fef9e7`, dark `#fde68a`. Search prefix `linux-`. Route: `/linux`.
  CSS classes: `.linux-page`, `.linux-icon`, `.linux-section`. Icon content: `🐧` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, File System, Processes, Networking, Shell Scripting, Package & Services, Performance, Reference.
  All 21 cards `available: true` in `cloud/linux/home/home.ts`. Progress: `linuxTotal=19` in progress.service.ts.
  Linux pages use `app-common-mistakes` AND `app-revision-card`. Reference pages (security-hardening, cron) have no PageComplete.
  Challenge.language: `'typescript'`. `${VAR}` bash variables in template literals must be escaped as `\${VAR}`.
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
  Phase 10: 18 of 22 topics have subtopics (`/containers/fundamentals`, `/containers/docker-cli`,
  `/containers/docker-images`, `/containers/dockerfile`, `/containers/multi-stage`,
  `/containers/compose`, `/containers/compose-profiles`, `/containers/k8s-architecture`,
  `/containers/kubectl`, `/containers/operators-crds`, `/containers/pods-deployments`,
  `/containers/services-ingress`, `/containers/configmaps-secrets`, `/containers/storage`,
  `/containers/helm`, `/containers/container-security`, `/containers/rbac`,
  `/containers/statefulsets`, 2026-07-21) — see "Containers/K8s hub
  subtopic wiring" section above for the `ContainersNavComponent` accordion structural fix and
  the `k8s-fundamentals` SUBTOPICS-map collision resolution. Note: `search.ts`'s `url()` needed
  a special case for `k8s-architecture` specifically — its own bare topic slug happens to start
  with the hub's `k8s-` prefix, so the generic prefix-strip rule was wrongly producing
  `/containers/architecture` instead of `/containers/k8s-architecture`; check any future
  hub/topic slug that itself starts with its own hub's search-prefix string for the same risk.
- **Terraform/IaC hub**: 21 trackable topic pages + 2 reference (23 cards total). Feature-complete.
  Purple theme `$accent: #7b42bc`, `$tint: #f5f3ff`. Search prefix `tf-`. Route: `/terraform`.
  CSS classes: `.tf-page`, `.tf-icon`, `.tf-section`. Icon content: `TF`. `tech="javascript"`.
  Nav groups: Foundations, Core Language, Modules, Remote State, CI/CD, Testing, Reference.
  All 23 cards `available: true` in `cloud/terraform/home/home.ts`. Progress: `tfTotal=21` in progress.service.ts.
  Terraform pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. TerraformNavComponent at `shared/terraform-nav/terraform-nav.ts`.
- **Service Mesh hub**: 19 trackable topic pages + 2 reference (21 cards total). Feature-complete.
  Blue theme `$accent: #466bb0`, `$tint: #eef2fb`, dark `#93c5fd`. Search prefix `mesh-`. Route: `/service-mesh`.
  CSS classes: `.mesh-page`, `.mesh-icon`, `.mesh-section`. Icon content: `🕸️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Istio, Traffic, Security, Observability, Advanced, Reference.
  All 21 cards `available: true` in `cloud/service-mesh/home/home.ts`. Progress: `meshTotal=19` in progress.service.ts.
  Service Mesh pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. MeshNavComponent at `shared/mesh-nav/mesh-nav.ts`.
- **System Design hub**: 24 trackable topic pages + 2 reference (26 cards total). Feature-complete.
  Slate theme `$accent: #0f172a`, `$tint: #f1f5f9`, dark `#94a3b8`. Search prefix `sysdesign-`. Route: `/system-design`.
  CSS classes: `.sysdesign-page`, `.sysdesign-icon`, `.sysdesign-section`. Icon content: `🏗️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Scalability, Databases, Caching, Messaging, Real-World Systems, Reference.
  All 26 cards `available: true` in `architecture/system-design/home/home.ts`. Progress: `sysdesignTotal=24` in progress.service.ts.
  System Design pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. SysdesignNavComponent at `shared/sysdesign-nav/sysdesign-nav.ts`.
- **Architecture Patterns hub**: 22 trackable topic pages + 3 reference (25 cards total). Feature-complete.
  Violet theme `$accent: #7c3aed`, `$tint: #f5f3ff`, dark `#c4b5fd`. Search prefix `arch-`. Route: `/arch-patterns`.
  CSS classes: `.arch-page`, `.arch-icon`, `.arch-section`. Icon content: `🏛️` at `font-size: 1.8rem`. `tech="javascript"`.
  Nav groups: Foundations, Service Patterns, Data Patterns, Deployment, Reference.
  All 25 cards `available: true` in `architecture/arch-patterns/home/home.ts`. Progress: `archTotal=22` in progress.service.ts.
  Architecture Patterns pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. ArchNavComponent at `shared/arch-nav/arch-nav.ts`.
- **Design Patterns hub**: 36 trackable topic pages + 3 reference (39 cards total). Feature-complete.
  Blue theme `$accent: #0369a1`, `$tint: #e0f2fe`, dark `#7dd3fc`. Search prefix `dp-`. Route: `/design-patterns`.
  CSS classes: `.dp-page`, `.dp-icon`, `.dp-section`. Icon content: `DP`. `tech="javascript"`.
  Nav groups: Creational, Structural, Behavioral, Enterprise, Principles, Reference.
  All 39 cards `available: true` in `architecture/design-patterns/home/home.ts`. Progress: `dpTotal=36` in progress.service.ts.
  Design Patterns pages use `app-common-mistakes` AND `app-revision-card`. Reference pages have no PageComplete.
  Challenge.language: `'typescript'`. DpNavComponent at `shared/dp-nav/dp-nav.ts`.
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
