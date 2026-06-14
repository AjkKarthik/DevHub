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

**6. After every page, update the DevHub home.**
When a topic page is completed and a hub card is flipped to `available: true`,
also update `hub-home/hub-home.ts`:
- Increment the relevant tech card `topics:` count
- Update the hero stat ("100+ Live Pages" → actual count)
- Update the What's New bar if the hub milestone is notable
Do this in the same session, before the build step. Never skip it.

**7. Each topic page must serve double duty: deep learning + interview prep.**
Every page contains a `<app-revision-card>` at the bottom (after Q&A, before Page Complete).
The revision card condenses the whole page into:
- `oneLiner`: what the topic IS in 1–2 sentences
- `mustKnow`: 5–7 core concepts (the things you'd write on a whiteboard)
- `interviewFocus`: 3–5 interview-specific talking points or trap questions
Learners read the full page once; they re-read the revision card before interviews.

**8. Existing live pages need the same research treatment as new pages.**
Phase 2 is not a mechanical "add more fields" pass. Each existing page must be:
- Re-researched as if being written from scratch
- Content gaps filled: add whole new theory sections if the topic warrants it
- Enhanced to the full content standard (theory depth, quiz/Q&A count, pitfalls, sidebar)
- Given a revision card based on what an interviewer would actually ask
This is the same research step as Step 1 in Session Guidelines. Do not skip it.

---

## Vision

**Goal: zero "coming soon" across all 34 hubs. Every page at full quality standard.**
Every card on every hub home must link to a real, fully-written topic page.
Every existing page must meet the enhanced content standard defined in Phase 2.
Every page — including newly written ones — passes the Phase 9 quality audit checklist.

**Total scope:**
- 751 topic pages to build (across 30 hubs at 0% + 4 partially done hubs)
- 136 existing topic pages to enhance (Angular 45 + C# 41 + ASP.NET 33 + SQL 17)
- ~73 practice/reference pages (also need common-mistakes + revision-card where applicable)
- Estimated sessions: ~140 build sessions + ~136 enhancement sessions (1 page each)

---

## Current State (as of 2026-06-14)

| Hub | Live | Coming Soon | Status |
|---|---|---|---|
| Angular | 68 | 0 | Complete — 58 topics + 10 practice/reference |
| C# | 59 | 0 | Complete — 50 topics + 9 practice/reference |
| ASP.NET Core | 54 | 0 | Complete — 45 topics + 9 practice/reference |
| SQL | 53 | 0 | Complete — 44 topics + 9 reference |
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

## Phase 0 — Component Fixes & New Shared Components

### 0A — Fixes to existing components
- [x] 2026-06-13 **Fix TheoryBlock collapsed default** — `signal(false)` → `signal(true)` in
  `shared/theory-block/theory-block.ts`. Theory now visible on all pages immediately.
- [x] 2026-06-13 **Fix BeforeAfter hardcoded label** — "Angular 17+" replaced with configurable
  `beforeLabel` / `afterLabel` inputs. Language union extended with `'csharp' | 'sql'`.

### 0B — New shared components (already built, ready to use)
- [x] 2026-06-13 **RevisionCard** (`shared/revision-card/revision-card.ts`) — interview-prep
  summary card. Interface: `RevisionSummary { oneLiner, mustKnow[], interviewFocus[] }`.
  Placed after Q&A, before PageComplete. Required on every topic page.
- [x] 2026-06-13 **Prerequisites** (`shared/prerequisites/prerequisites.ts`) — small chip bar
  linking to foundational topics. Interface: `Prerequisite { label, route }`. Optional `note`
  input. Placed after PageMeta, before QuickRef. Use on intermediate/advanced pages.

### 0C — Components already built, not yet used on any pages (must include going forward)
These exist and compile — pages just haven't imported them yet. Every new/enhanced page must use them:
- `app-common-mistakes` — `CommonMistake { title, wrong, right, explanation }`. Required on
  every topic page (4–6 entries). Placed after Code Examples, before Challenge.
  Starts collapsed — that is intentional (supplementary). Keep `open = signal(false)`.
- `app-video-embed` — `<app-video-embed videoId="…" title="…" />`. Optional — only add when an
  official-channel YouTube video exists for the specific topic. Placed after Code Examples
  (before Common Mistakes). Do not embed unofficial or low-quality videos.
- `app-before-after` — `BeforeAfterExample { title, before, after, note?, language? }`.
  Optional — use for topics where there is a meaningful "old way vs new way" contrast
  (e.g., Angular signals vs zone.js, C# records vs verbose DTOs, SQL EXISTS vs IN).
  Use `beforeLabel` / `afterLabel` inputs to describe the contrast (e.g., `afterLabel=".NET 8+"`).
  Placed after Code Examples, before Common Mistakes.

---

## Phase 1 — Complete the Near-Done Hubs

These hubs are already wired and partially built. Completing them is the highest ROI
work — small number of pages to write, huge improvement to the user experience.

**Work one page at a time through this list. Research each topic before writing.**

### 1A — Angular hub ✅ COMPLETE `src/app/components/angular/`

All 13 remaining pages completed (2026-06-13). angularTotal = 58. All cards `available: true`. Build passes.
- [x] 2026-06-13 `route-guards` — functional guards (canActivate/canDeactivate/canMatch), inject() in guards, redirect logic, role-based access
- [x] 2026-06-13 `http-interceptors` — functional interceptors (HttpInterceptorFn), retry, auth token injection, error handling
- [x] 2026-06-13 `signal-effects` — effect() deep-dive, cleanup, allowSignalWrites, untracked(), ordering guarantees
- [x] 2026-06-13 `typed-forms` — AbstractControl typing, FormRecord, NonNullableFormBuilder, type narrowing in templates
- [x] 2026-06-13 `host-directives` — hostDirectives API, exposing inputs/outputs, composing built-in directives
- [x] 2026-06-13 `let-template-vars` — @let syntax, scope rules, async unwrapping patterns, vs local variables
- [x] 2026-06-13 `standalone-migration` — ng generate @angular/core:standalone, migration steps, schematic options
- [x] 2026-06-13 `error-handling-patterns` — ErrorHandler, HttpClient error interceptor, global vs local strategies, user-friendly messages
- [x] 2026-06-13 `msw` — Mock Service Worker in Angular tests, setupWorker, http.get handlers, passthrough
- [x] 2026-06-13 `accessibility` — CDK a11y: FocusTrap, LiveAnnouncer, CdkListbox, ARIA in Angular templates, axe-core
- [x] 2026-06-13 `micro-frontends` — Module Federation with Angular, independent deployments, shared libs, routing across MFEs
- [x] 2026-06-13 `angular-devtools` — Profiler, component tree, change detection flame chart, injector tree
- [x] 2026-06-13 `bundle-optimization` — bundle analysis (source-map-explorer), lazy routes, defer, preloading, tree-shaking

---

### 1B — C# hub ✅ COMPLETE `src/app/components/backend/csharp/`

All 9 remaining pages completed (2026-06-13). csharpTotal = 50. All cards `available: true`. Build passes.
Note: source-generators, expression-trees, dynamic, channels, iterators, regex, reflection,
unit-testing were completed in session 2026-06-11 and are already live.
- [x] 2026-06-13 `functional-csharp` — Result<T>, OneOf, FluentResults, railway-oriented programming, avoiding exception-driven control flow
- [x] 2026-06-13 `span-memory` — Span<T>, Memory<T>, ReadOnlySpan, stackalloc, MemoryPool<T>, zero-copy patterns
- [x] 2026-06-13 `di-dotnet` — Microsoft.Extensions.DI deep-dive: lifetimes, keyed services, factory registration, IServiceScope
- [x] 2026-06-13 `json-advanced` — System.Text.Json source gen, JsonSerializerContext, custom converters, Utf8JsonWriter
- [x] 2026-06-13 `unsafe-pointers` — unsafe keyword, fixed statement, pointer arithmetic, stackalloc, P/Invoke foundation
- [x] 2026-06-13 `native-aot` — AOT publishing, trimming annotations, reflection-free patterns, what breaks, when to use
- [x] 2026-06-13 `benchmarkdotnet` — [Benchmark], BenchmarkRunner, MemoryDiagnoser, comparing approaches, reading results
- [x] 2026-06-13 `pinvoke` — DllImport vs LibraryImport, marshalling, unsafe structs, COM interop, platform detection
- [x] 2026-06-13 `dotnet-cli` — dotnet new/build/run/test/publish, global tools, NuGet, project templates, .csproj anatomy

---

### 1C — ASP.NET Core hub ✅ COMPLETE `src/app/components/backend/aspnet/`

All 12 remaining pages completed (2026-06-13). aspnetTotal = 45. All cards `available: true`. Build passes.
- [x] 2026-06-13 `fluent-validation` — FluentValidation setup, AbstractValidator, RuleFor, async validators, integration with minimal APIs/controllers
- [x] 2026-06-13 `masstransit` — AddMassTransit, Consumers, Sagas (state machine), request/response, outbox, RabbitMQ/Azure SB
- [x] 2026-06-13 `opentelemetry` — AddOpenTelemetry, tracing + metrics + logs, OTLP exporter, custom spans, Application Insights
- [x] 2026-06-13 `yarp` — YARP reverse proxy, route/cluster config, transforms, load balancing, auth passthrough
- [x] 2026-06-13 `minimal-api-advanced` — endpoint filters, route groups, TypedResults, OpenAPI with Scalar, output caching
- [x] 2026-06-13 `output-caching-advanced` — OutputCache policies, vary-by, cache tags, distributed (Redis), invalidation
- [x] 2026-06-13 `dapper` — Dapper query/execute/QueryMultiple, parameters, dynamic, multi-mapping, Dapper + EF together
- [x] 2026-06-13 `feature-flags` — Microsoft.FeatureManagement, IFeatureManager, targeting filters, appsettings config
- [x] 2026-06-13 `localization` — AddLocalization, IStringLocalizer, resource files, RequestLocalizationMiddleware, cultures
- [x] 2026-06-13 `websockets` — WebSocket middleware, accept handshake, send/receive loop, SignalR vs raw WebSocket
- [x] 2026-06-13 `response-compression` — AddResponseCompression, Brotli/Gzip, compression providers, when to use
- [x] 2026-06-13 `csrf` — Anti-forgery tokens, ValidateAntiForgeryToken, SameSite cookies, CSRF in SPAs/APIs

---

### 1D — SQL hub ✅ COMPLETE `src/app/components/data/sql/`

SQL hub expanded from 17 → 44 trackable topics across 4 batches. All wiring done.
sqlTotal = 44, hub-home topics = 53. Build passes.

**Batch 1 (2026-06-13/14):**
- [x] `string-functions` — LEN/TRIM/CONCAT/SUBSTRING/REPLACE/CHARINDEX, FORMAT
- [x] `date-functions` — GETDATE/NOW, DATEADD/INTERVAL, DATEDIFF/AGE, EXTRACT, AT TIME ZONE
- [x] `conditional-expressions` — CASE/WHEN, IIF, COALESCE, NULLIF, GREATEST/LEAST
- [x] `set-operations` — UNION/UNION ALL, INTERSECT, EXCEPT/MINUS, set vs bag semantics
- [x] `null-handling` — three-valued logic, IS NULL, COALESCE, NULL in aggregations/JOINs
- [x] `merge` — MERGE statement (T-SQL), INSERT … ON CONFLICT (PG), upsert patterns
- [x] `math-functions` — ROUND/FLOOR/CEILING/ABS/MOD, numeric precision

**Batch 2 (2026-06-14):**
- [x] `pivoting` — PIVOT/UNPIVOT (T-SQL), crosstab (PG), conditional aggregation, dynamic pivot
- [x] `constraints` — PK/FK/UNIQUE/CHECK/DEFAULT, ON DELETE CASCADE/SET NULL, DEFERRABLE
- [x] `views` — updatable views, WITH CHECK OPTION, MSSQL indexed views, PG materialized views
- [x] `sequences` — CREATE SEQUENCE, NEXT VALUE FOR, nextval(), IDENTITY, gaps
- [x] `temp-tables` — #temp vs @table_var (MSSQL), PG TEMP TABLE, CTE vs temp table
- [x] `computed-columns` — virtual vs persisted (MSSQL), GENERATED ALWAYS AS STORED (PG)
- [x] `stored-functions` — MSSQL scalar/TVF UDFs, PG LANGUAGE sql/plpgsql, IMMUTABLE/STABLE

**Batch 3 (2026-06-14):**
- [x] `cursors` — DECLARE/OPEN/FETCH/CLOSE/DEALLOCATE, FAST_FORWARD, PG FOR loop
- [x] `triggers` — AFTER/INSTEAD OF (MSSQL), BEFORE/AFTER (PG), NEW/OLD, audit logging
- [x] `dynamic-sql` — sp_executesql, PG EXECUTE + FORMAT, QUOTENAME, injection prevention
- [x] `isolation-levels` — READ UNCOMMITTED/COMMITTED/REPEATABLE READ/SERIALIZABLE, SNAPSHOT
- [x] `locking` — S/X/U locks, UPDLOCK, NOLOCK, FOR UPDATE, SKIP LOCKED, deadlock prevention
- [x] `execution-plans` — SHOWPLAN/STATISTICS IO, EXPLAIN ANALYZE, Index Seek vs Scan
- [x] `partitioning` — RANGE/LIST/HASH, MSSQL partition function + scheme, PG declarative

**Batch 4 (2026-06-14):**
- [x] `bulk-operations` — BULK INSERT/TABLOCK, bcp, PG COPY/\copy, staging pattern, batched DML
- [x] `query-store` — MSSQL Query Store, plan forcing, pg_stat_statements, top query analysis
- [x] `statistics` — UPDATE STATISTICS, DBCC SHOW_STATISTICS, ANALYZE, pg_stats, stale stats
- [x] `full-text-search` — CONTAINS/FREETEXT/CONTAINSTABLE, tsvector/tsquery/GIN, ts_rank
- [x] `security` — SQL injection/parameterized, GRANT/REVOKE, RLS, encryption, audit triggers
- [x] `connection-pooling` — ADO.NET pool tuning, PgBouncer modes, idle-in-transaction, sizing

---

## Phase 2 — Enhance All Existing Pages (146 pages)

Work through existing pages one at a time. Re-read each page fully before enhancing —
understand what it covers, what's missing, then bring it up to the full standard below.
Every live page (Angular 55, C# 41, ASP.NET 33, SQL 17) must meet this standard.

### The Enhanced Content Standard

**Full page component order (fixed — never reorder):**
```
app-page-meta
app-prerequisites        ← optional; intermediate/advanced pages
app-quick-ref
app-theory-block
Code section (app-code-block)
app-before-after         ← optional; "old vs new" topics only
app-video-embed          ← optional; official video exists
app-common-mistakes      ← required (4–6 entries)
app-challenge-block
app-quiz-block
app-qna-block
app-revision-card        ← required
app-page-complete
```

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

### Enhancement order — complete page list (one page per session)

Every page needs: **research → expand theory → add common-mistakes → add revision-card →
expand quiz to 6-8q → expand Q&A to 6-8 → add prerequisites if advanced → add before-after
if old-vs-new → add sidebar entry → recalculate reading time**

---

#### C# hub — 41 topic pages

**Foundation (do these first — highest traffic)**
- [x] 2026-06-14 `csharp/basics` — value vs reference semantics, boxing, verbatim strings, top-level statements
- [x] 2026-06-14 `csharp/methods` — params, in/out/ref, local functions, expression-bodied, overload resolution
- [x] 2026-06-14 `csharp/fields` — readonly, const vs static readonly, field initializers, backing fields
- [x] 2026-06-14 `csharp/constructors` — primary constructors (C# 12), required members, copy constructors
- [ ] `csharp/namespaces` — file-scoped, global usings, nested, alias directives
- [ ] `csharp/arrays` — jagged vs multidimensional, ArraySegment, Span<T>, stackalloc

**Type system**
- [ ] `csharp/oop` — encapsulation, access modifiers, partial classes, sealed
- [ ] `csharp/inheritance` — virtual/override/new, method hiding, covariant returns (C# 9)
- [ ] `csharp/abstract-interfaces` — default interface members (C# 8+), static abstract (C# 11+)
- [ ] `csharp/properties-indexers` — init accessor, required, computed, indexed properties
- [ ] `csharp/static-enums` — Flags enums, Enum.Parse vs TryParse, enum → int safety
- [ ] `csharp/structures` — struct vs class, readonly struct, ref struct, record struct

**Modern C#**
- [ ] `csharp/generics` — variance (in/out), constraints chain, INumber<T>, default(T)
- [ ] `csharp/linq` — deferred execution, IQueryable vs IEnumerable, LINQ to objects vs EF
- [ ] `csharp/delegates` — Action/Func/Predicate, multicast, event vs delegate, weak events
- [ ] `csharp/pattern-matching` — positional, property, list patterns, switch expressions, guards
- [ ] `csharp/records` — with-expressions, value equality, record struct, deconstruct
- [ ] `csharp/tuples` — ValueTuple vs Tuple, deconstruction, _ discard, tuple return patterns
- [ ] `csharp/extension-methods` — this parameter rules, conflict resolution, extension properties

**Async & Parallel**
- [ ] `csharp/async` — ConfigureAwait, SynchronizationContext, deadlock, async void dangers
- [ ] `csharp/tasks` — Task.WhenAll/WhenAny, TaskCompletionSource, Unwrap, ContinueWith
- [ ] `csharp/threading` — Monitor, Mutex, SemaphoreSlim, Interlocked, lock vs volatile
- [ ] `csharp/channels` — bounded vs unbounded, producer/consumer pattern, backpressure

**Data & Safety**
- [ ] `csharp/strings-datetime` — string interning, StringBuilder, DateTimeOffset vs DateTime, NodaTime
- [ ] `csharp/collections` — IEnumerable vs IList, Dictionary internals, ImmutableDictionary, concurrent
- [ ] `csharp/io-serialization` — System.Text.Json source gen, JsonSerializerOptions, Utf8JsonReader
- [ ] `csharp/gc-disposable` — finalizers, IDisposable, IAsyncDisposable, using declaration, GC.Collect
- [ ] `csharp/null-safety` — nullable reference types, null-forgiving, required, annotations
- [ ] `csharp/exceptions` — custom exceptions, ExceptionDispatchInfo, AggregateException, filter
- [ ] `csharp/type-conversion` — implicit/explicit operators, Convert vs cast, pattern-based cast
- [ ] `csharp/system-object` — Equals/GetHashCode contract, == operator, ReferenceEquals

**Advanced**
- [ ] `csharp/reflection` — Type.GetMembers, caching MethodInfo, Emit basics, performance cost
- [ ] `csharp/iterators` — yield state machine IL, IAsyncEnumerable, infinite sequences
- [ ] `csharp/regex` — named groups, compiled Regex, source-generated ([GeneratedRegex]), backtracking
- [ ] `csharp/expression-trees` — Expression<Func<T>>, Compile(), building IQueryable predicates
- [ ] `csharp/dynamic` — dynamic vs object, ExpandoObject, DLR, DynamicObject, COM interop
- [ ] `csharp/source-generators` — IIncrementalGenerator, SyntaxProvider, output registration
- [ ] `csharp/unit-testing` — xUnit theories, Moq/NSubstitute, FluentAssertions, AutoFixture

**What's New**
- [ ] `csharp/whats-new-9-10` — records, init, top-level statements, pattern improvements, LINQ changes
- [ ] `csharp/whats-new-11-12` — required, generic math, raw string literals, primary constructors
- [ ] `csharp/whats-new-latest` — C# 13+ collection expressions, params span, lock object

---

#### Angular hub — 45 topic pages

**Signals & reactivity (do these first)**
- [ ] `angular/resource-api` — resource(), rxResource(), loading/error states, refresh
- [ ] `angular/linked-signal` — linkedSignal(), write-back pattern, vs computed
- [ ] `angular/signal-store` — @ngrx/signals, signalStore, withState, withMethods, withComputed
- [ ] `angular/ngrx-signals` — feature stores, withEntities, custom features, devtools
- [ ] `angular/change-detection` — OnPush, signal-based detection, ChangeDetectorRef, zone.js-less
- [ ] `angular/zoneless` — provideZonelessChangeDetection, migration from zone.js, performance

**Core framework**
- [ ] `angular/template-syntax` — control flow (@if/@for/@switch), defer, ng-template, ng-content
- [ ] `angular/lifecycle` — OnInit, OnDestroy, DestroyRef, afterNextRender, afterRender
- [ ] `angular/di-demo` — inject(), injection tokens, hierarchical DI, useFactory, forwardRef
- [ ] `angular/routing-demo` — lazy routes, functional guards, resolvers, withViewTransitions
- [ ] `angular/http-demo` — HttpClient, interceptors (functional), provideHttpClient, retry
- [ ] `angular/pipes-demo` — pure vs impure, async pipe internals, custom transform pipes

**Forms**
- [ ] `angular/forms-demo` — reactive vs template, FormGroup, FormControl, typed forms (v14+)
- [ ] `angular/form-array` — FormArray, dynamic controls, array validators, nested groups
- [ ] `angular/dynamic-forms` — building form config from JSON, custom validators
- [ ] `angular/wizard-form` — multi-step form, stepper, inter-step validation
- [ ] `angular/custom-validators` — sync/async validators, cross-field, NG_VALIDATORS token
- [ ] `angular/cva-demo` — ControlValueAccessor, NG_VALUE_ACCESSOR, form integration
- [ ] `angular/zod-forms` — Zod schema + Angular reactive forms, zodValidator adapter

**Components**
- [ ] `angular/parent-child` — @Input, @Output, model(), contentChildren, viewChild
- [ ] `angular/content-projection` — ng-content, select, ngTemplateOutlet, multi-slot
- [ ] `angular/directives-demo` — attribute directives, structural directives, hostDirectives
- [ ] `angular/destroy-ref` — DestroyRef, takeUntilDestroyed, vs OnDestroy

**Async & RxJS**
- [ ] `angular/rxjs-demo` — switchMap/mergeMap/concatMap/exhaustMap, shareReplay, takeUntil
- [ ] `angular/tanstack-query` — Angular TanStack Query, createQuery, createMutation, cache

**Testing**
- [ ] `angular/testing-demo` — TestBed, ComponentFixture, signal testing, HttpClientTestingModule
- [ ] `angular/harnesses` — ComponentHarness, HarnessLoader, CDK test harnesses
- [ ] `angular/e2e` — Playwright vs Cypress for Angular, component testing setup

**Performance & Architecture**
- [ ] `angular/preloading` — PreloadAllModules vs SelectivePreloading, QuicklinkStrategy
- [ ] `angular/route-resolvers` — functional resolvers, inject() in resolvers, error handling
- [ ] `angular/ssr` — Angular Universal/SSR, hydration, transferState, App Shell
- [ ] `angular/pwa` — ngsw-config, caching strategies, push notifications, install prompt
- [ ] `angular/web-workers` — comlink, offloading heavy computation, communication patterns

**Libraries & integrations**
- [ ] `angular/animations-demo` — trigger/state/transition, stagger, AnimationBuilder, route anim
- [ ] `angular/cdk-demo` — FocusTrap, Overlay, DragDrop, VirtualScrollViewport, a11y module
- [ ] `angular/material-demo` — theming (M3), form field, table, dialog, CDK integration
- [ ] `angular/tanstack-query` — (see Async section above)
- [ ] `angular/charts` — ng2-charts/Chart.js, reactive data binding, responsive charts
- [ ] `angular/ag-grid-demo` — AG Grid community, rowData signal, custom cell renderers
- [ ] `angular/ng-image` — NgOptimizedImage, srcset, priority, LQIP
- [ ] `angular/datefns-demo` — date-fns with Angular pipes, locale, formatting patterns
- [ ] `angular/tailwind-demo` — Tailwind CSS 4 in Angular, dark mode, component patterns

**Misc**
- [ ] `angular/counter` — simple signals counter demo — expand into signals deep-dive
- [ ] `angular/todo` — todo app demo — expand into state management patterns demo
- [ ] `angular/i18n` — @angular/localize, $localize, ICU, build-time vs runtime i18n

---

#### ASP.NET Core hub — 33 topic pages

**Foundation (do first)**
- [ ] `aspnet/hosting-startup` — Generic Host, WebApplication.CreateBuilder, IHostedService, startup order
- [ ] `aspnet/middleware` — pipeline order, short-circuit, IMiddlewareFactory, terminal middleware
- [ ] `aspnet/routing` — endpoint routing, route constraints, route groups, MapGroup
- [ ] `aspnet/configuration` — IConfiguration, Options pattern, IOptionsSnapshot, secrets
- [ ] `aspnet/dependency-injection` — lifetimes (singleton/scoped/transient), keyed services, factory
- [ ] `aspnet/logging` — ILogger, structured logging, log levels, Serilog/OpenTelemetry integration

**API layer**
- [ ] `aspnet/controllers` — ApiController, ModelState, ActionResult<T>, problem details
- [ ] `aspnet/minimal-apis` — route handlers, TypedResults, endpoint filters, groups, OpenAPI
- [ ] `aspnet/model-binding` — [FromBody]/[FromRoute]/[FromQuery], custom binders, validation
- [ ] `aspnet/filters` — action/exception/resource/auth filters, IFilterFactory, ordering
- [ ] `aspnet/error-handling` — UseExceptionHandler, ProblemDetails middleware, IProblemDetailsService
- [ ] `aspnet/api-versioning` — URL/header/query versioning, Asp.Versioning, deprecation
- [ ] `aspnet/openapi-swagger` — Scalar, Swashbuckle, XML comments, security definitions

**Data**
- [ ] `aspnet/ef-core-basics` — DbContext lifetime, no-tracking, SaveChanges, transactions
- [ ] `aspnet/ef-relationships` — one-to-many, many-to-many, owned entities, table splitting
- [ ] `aspnet/ef-performance` — compiled queries, split queries, connection resiliency, bulk ops

**Security**
- [ ] `aspnet/authentication` — JWT bearer, cookie auth, IAuthenticationHandler, scheme selection
- [ ] `aspnet/authorization` — policies, requirements, resource-based auth, IAuthorizationHandler
- [ ] `aspnet/cors` — policy builder, pre-flight, credentials, CORS with minimal APIs
- [ ] `aspnet/web-security` — CSRF, XSS, security headers, HTTPS enforcement, HSTS
- [ ] `aspnet/secrets` — User Secrets, Azure Key Vault, DPAPI, ISecretManager
- [ ] `aspnet/rate-limiting` — sliding window, fixed window, token bucket, concurrency limiter

**Advanced**
- [ ] `aspnet/http-clients` — IHttpClientFactory, typed clients, Polly v8, resilience pipeline
- [ ] `aspnet/grpc` — protobuf service/message, Grpc.AspNetCore, client factory, streaming
- [ ] `aspnet/caching` — IMemoryCache, IDistributedCache, Redis, output caching, cache tags
- [ ] `aspnet/static-files` — StaticFileOptions, file provider, cache-control headers

**Infrastructure**
- [ ] `aspnet/background-services` — BackgroundService, IHostedService, Channels integration
- [ ] `aspnet/health-checks` — AddHealthChecks, IHealthCheck, UI, readiness vs liveness
- [ ] `aspnet/testing` — WebApplicationFactory, custom factory, Testcontainers, Respawn
- [ ] `aspnet/signalr` — hubs, groups, connection lifecycle, scale-out with Redis backplane
- [ ] `aspnet/deployment` — Kestrel, IIS, Docker, reverse proxy (NGINX), HTTPS in containers
- [ ] `aspnet/performance` — response compression, response caching, async streaming, BenchmarkDotNet
- [ ] `aspnet/aspire` — AppHost orchestration, service defaults, dashboard, integrations

---

#### SQL hub — 17 topic pages

- [ ] `sql/rdbms-concepts` — ACID, CAP theorem, relational model, keys, constraints overview
- [ ] `sql/data-modeling` — ER diagrams, entity identification, relationships, cardinality
- [ ] `sql/normalization` — 1NF/2NF/3NF/BCNF, denormalisation trade-offs, when to break rules
- [ ] `sql/db-architecture` — query processor, storage engine, buffer pool, WAL, MSSQL vs PG arch
- [ ] `sql/data-types` — numeric precision, varchar vs nvarchar, JSONB, UUID, temporal types
- [ ] `sql/basics` — SELECT, WHERE, ORDER BY, LIMIT/TOP, DISTINCT, aliases, DUAL table (PG)
- [ ] `sql/joins` — INNER/LEFT/RIGHT/FULL/CROSS/SELF join, join order, NULL in join columns
- [ ] `sql/aggregations` — GROUP BY, HAVING, COUNT/SUM/AVG/MIN/MAX, FILTER clause (PG), ROLLUP
- [ ] `sql/subqueries` — correlated vs non-correlated, EXISTS vs IN, lateral joins (PG), scalar subquery
- [ ] `sql/ctes` — recursive CTEs, WITH clause, CTE vs subquery performance, multiple CTEs
- [ ] `sql/window-functions` — ROW_NUMBER/RANK/DENSE_RANK, LAG/LEAD, NTILE, ROWS vs RANGE frames
- [ ] `sql/indexes` — clustered vs non-clustered, covering index, include columns, index maintenance
- [ ] `sql/transactions` — BEGIN/COMMIT/ROLLBACK, savepoints, implicit vs explicit, retry logic
- [ ] `sql/stored-procedures` — parameters, OUTPUT, EXEC, error handling, TRY/CATCH
- [ ] `sql/schema-design` — naming conventions, surrogate vs natural keys, soft delete patterns
- [ ] `sql/json-features` — FOR JSON PATH (T-SQL), jsonb operators (PG), JSON indexing
- [ ] `sql/performance` — execution plans, query hints, statistics, parameter sniffing (T-SQL)

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

## Phase 9 — Final Quality Audit (every page, every hub)

**When to do this:** after all hubs are built (after Phase 8). This is the last pass before
the site can be considered "done." Every single topic page across every hub — including pages
written in Phases 1–8 — gets a structured review and fix pass.

**Why this phase exists:** pages written early follow older, thinner conventions. Pages written
quickly may have skipped components. The standard itself evolved during the project. This phase
is the equaliser — it brings everything to the same bar.

**Rule: one page per session, same as all other phases. No batching.**

### What to check on every page (review checklist)

Open the page, read it fully as a learner would, then check each item:

```
[ ] Theory: 5+ sections, each 5+ bullet points, each point 2+ sentences with WHY
[ ] app-common-mistakes: present, 4–6 entries, wrong/right code + explanation
[ ] app-revision-card: present, oneLiner is crisp, mustKnow has 5–7 items, interviewFocus has 3–5
[ ] Quiz: 6–8 questions, difficulty spread (easy/medium/hard), explanations are 2–3 sentences
[ ] Q&A: 6–8 entries, at least 2 trap questions, answers use <code>/<ul>/<strong> for structure
[ ] app-prerequisites: present on intermediate/advanced pages (2–4 items max, correct routes)
[ ] app-before-after: present if a meaningful old-vs-new contrast exists for the topic
[ ] app-video-embed: present if a good official video exists; absent otherwise
[ ] Sidebar: page-specific entry in SIDEBAR_MAP (not DEFAULT); min 2 resources
[ ] Reading time in app-page-meta: accurate (recalculate if content changed significantly)
[ ] Navigation: nextRoute and nextLabel point to the correct next page
[ ] Hub home card: available: true, description and keyPoints reflect what the page actually covers
[ ] No TypeScript \${} escaping issues (C# string interpolation in template literals)
[ ] Dark mode: no @media (prefers-color-scheme) anywhere — only :host-context(body.dark)
```

If everything passes — check it off. If anything is missing — fix it in the same session,
then check it off. Do not check off a page that still has gaps.

### Audit order

Work hub by hub, topic pages only (practice/reference pages are lower priority):

**Hub 1 — Angular (45 pages):** work through in nav order  
**Hub 2 — C# (41 pages):** work through in nav order  
**Hub 3 — ASP.NET Core (33 pages):** work through in nav order  
**Hub 4 — SQL (35 pages, after Phase 1D completes):** work through in nav order  
**Hubs 5–34 (TypeScript, React, JS, HTML, CSS, …):** work through in hub order

Each hub's pages are not individually listed here — use the hub's nav order as the sequence.
When a hub's audit is complete, note it in Done History.

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

**Revision card (required on every page — new component `app-revision-card`):**
- Placed after Q&A, before Page Complete
- `summary.oneLiner`: 1–2 sentences — what the topic IS; good enough to repeat in an interview
- `summary.mustKnow`: 5–7 strings — the concepts you'd write on a whiteboard; use `<code>` inline
- `summary.interviewFocus`: 3–5 strings — what interviewers actually ask; frame as Q: or talking point
- This is the "skim before an interview" card — keep it ultra-concise and honest about what matters
- Import: `RevisionCardComponent` from `../../../shared/revision-card/revision-card` (adjust path)
  Interface: `RevisionSummary` from the same file

**Common Mistakes (required — `app-common-mistakes`):**
- 4–6 entries, placed after Code Examples, before Challenge
- Each entry: `title` (the mistake name), `wrong` (bad code snippet), `right` (correct code),
  `explanation` (1–2 sentences on WHY it matters and how to remember the fix)
- Focus on mistakes that actually happen in production or that trip people up in interviews
- The wrong/right fields are plain code strings (no HTML) — rendered in `<pre><code>`

**Prerequisites (optional — `app-prerequisites`):**
- Include on intermediate and advanced pages where the learner needs prior knowledge
- Each item: `label` (display name of the topic) + `route` (full path, e.g. `/csharp/generics`)
- Keep to 2–4 items maximum — only list pages that are genuinely required, not just related
- Skip on beginner/foundational pages

**Before / After (optional — `app-before-after`):**
- Use when there is a meaningful "old pattern vs new pattern" contrast for the topic
- Set `beforeLabel` / `afterLabel` to describe what changed (e.g. `beforeLabel="Traditional"`,
  `afterLabel=".NET 8+ / Modern"`) — never leave as generic "Before" / "After"
- Good candidates: topics with C# version upgrades, Angular 17+ changes, SQL modernisation

**Video embed (optional — `app-video-embed`):**
- Only add when an official-channel YouTube video exists for this specific topic
- Do not add videos from unofficial channels or low-quality uploads
- Placed after Code Examples, before Common Mistakes

**Revision card (required — `app-revision-card`):**
- `summary.oneLiner`: 1–2 sentences — what the topic IS; good enough to repeat in an interview
- `summary.mustKnow`: 5–7 strings — the concepts you'd write on a whiteboard; use `<code>` inline
- `summary.interviewFocus`: 3–5 strings — what interviewers actually ask; frame as talking points
- This is the "skim before an interview" card — keep it ultra-concise and honest about what matters

**Sidebar resources:**
- Add a page-specific entry in `shared/page-sidebar/page-sidebar.ts` SIDEBAR_MAP
- Minimum 2 resources: official docs link (badge: 'docs') + 1 of code/blog/video
- Prefer: official docs, official GitHub repos (dotnet/*, angular/*, etc.)

### Step 4 — Wire the page (all 9 checklist items)
1. [ ] Files created: `.ts`, `.html`, `.scss` in correct folder
2. [ ] Route added in `app.routes.ts` (lazy `loadComponent`)
3. [ ] Nav entry added in `app.html` (correct group, progress dot + check mark)
4. [ ] Search entry added in `services/search.service.ts`
5. [ ] Breadcrumb label added in `shared/breadcrumb/breadcrumb.ts`
6. [ ] Hub home card flipped to `available: true`
7. [ ] Sidebar entry added in `shared/page-sidebar/page-sidebar.ts`
8. [ ] Progress service `*Total` count updated
9. [ ] **DevHub home updated** (`hub-home/hub-home.ts`): tech card `topics:` count, hero stat, What's New bar

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
- [x] 2026-06-13 — Angular Phase 1A complete: 12 new topic pages (http-interceptors,
  signal-effects, typed-forms, host-directives, let-template-vars, standalone-migration,
  error-handling-patterns, msw, accessibility, micro-frontends, angular-devtools,
  bundle-optimization). angularTotal 45 → 58. All 13 cards available:true. Build passes.
- [x] 2026-06-13 — C# Phase 1B complete: 8 new topic pages (span-memory, di-dotnet,
  json-advanced, unsafe-pointers, native-aot, benchmarkdotnet, pinvoke, dotnet-cli).
  csharpTotal 41 → 50. All 9 cards available:true. Build passes.
- [x] 2026-06-13 — ASP.NET Core Phase 1C complete: 12 new topic pages (fluent-validation,
  masstransit, opentelemetry, yarp, minimal-api-advanced, output-caching-advanced, dapper,
  feature-flags, localization, websockets, response-compression, csrf).
  aspnetTotal 33 → 45. All 12 cards available:true. Build passes.
- [x] 2026-06-14 — SQL hub Phase 1D complete: 27 new topic pages across 4 batches.
  sqlTotal 17 → 44. hub-home topics 26 → 53. All wiring done. Build passes.
  Batch 1: string-functions, date-functions, conditional-expressions, set-operations,
  null-handling, merge, math-functions.
  Batch 2: pivoting, constraints, views, sequences, temp-tables, computed-columns,
  stored-functions.
  Batch 3: cursors, triggers, dynamic-sql, isolation-levels, locking, execution-plans,
  partitioning.
  Batch 4: bulk-operations, query-store, statistics, full-text-search, security,
  connection-pooling.
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
