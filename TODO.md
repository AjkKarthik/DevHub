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

**9. Content generation workflow (updated 2026-06-20):**
Use `ollama run qwen3.6:35b-a3b` to generate TypeScript content for each page.
Claude reviews the output for correctness, data shape compliance, and dark-mode rule,
then writes the final file. Build, commit (`git commit`), and push after **each page**.
Claude does NOT generate content from scratch — Ollama generates, Claude reviews and fixes.

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

## Current State (as of 2026-06-26)

| Hub | Live | Coming Soon | Status |
|---|---|---|---|
| Angular | 68 | 0 | Complete — 58 topics + 10 practice/reference |
| C# | 59 | 0 | Complete — 50 topics + 9 practice/reference |
| ASP.NET Core | 54 | 0 | Complete — 45 topics + 9 practice/reference |
| SQL | 53 | 0 | Complete — 44 topics + 9 reference |
| TypeScript | 22 | 0 | Complete — 20 topics + 2 reference |
| React | 19 | 0 | Complete — 17 topics + 2 reference |
| JavaScript | 24 | 0 | Complete — 22 topics + 2 reference |
| HTML | 25 | 0 | Complete — 23 topics + 2 reference |
| CSS | 24 | 0 | Complete — 22 topics + 2 reference |
| Web Performance | 22 | 0 | Complete — 20 topics + 2 reference |
| Blazor | 23 | 0 | Complete — 20 topics + 3 reference |
| Node.js | 25 | 0 | Complete — 23 topics + 2 reference |
| Python | 23 | 0 | Complete — 21 topics + 2 reference |
| Go | 23 | 0 | Complete — 21 topics + 2 reference |
| DevOps | 22 | 0 | Complete — 21 topics + 1 cheatsheet reference |
| Containers/K8s | 23 | 0 | Complete — 22 topics + 1 reference |
| AWS | 22 | 0 | Complete — 21 topics + 1 cheatsheet reference |
| Azure | 23 | 0 | Complete — 22 topics + 1 cheatsheet reference |
| Linux | 21 | 0 | Complete — 19 topics + 2 reference |
| Terraform | 23 | 0 | Complete — 21 topics + 2 reference |
| Service Mesh | 21 | 0 | Complete — 19 topics + 2 reference |
| System Design | 26 | 0 | Complete — 24 topics + 2 reference |
| Architecture Patterns | 25 | 0 | Complete — 22 topics + 3 reference |
| Design Patterns | 39 | 0 | Complete — 36 topics + 3 reference |
| Security | 25 | 0 | Complete — 23 topics + 2 reference |
| API Design | 21 | 0 | Complete — 19 topics + 2 reference |
| Observability | 22 | 0 | Complete — 20 topics + 2 reference |
| MongoDB | 23 | 0 | Complete — 21 topics + 2 reference |
| Redis | 23 | 0 | Complete — 21 topics + 2 reference |
| GraphQL | 22 | 0 | Complete — 20 topics + 2 reference |
| Messaging/Kafka | 22 | 0 | Complete — 20 topics + 2 reference |
| DSA | 22 | 0 | Complete — 21 topics + home |
| Testing | 22 | 0 | Complete — 19 topics + 3 reference |
| AI/ML | 22 | 0 | Complete — 19 topics + 3 reference |

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
- [x] 2026-06-14 `csharp/namespaces` — file-scoped, global usings, nested, alias directives
- [x] 2026-06-14 `csharp/arrays` — jagged vs multidimensional, ArraySegment, Span<T>, stackalloc

**Type system**
- [x] 2026-06-14 `csharp/oop` — encapsulation, access modifiers, partial classes, sealed
- [x] 2026-06-14 `csharp/inheritance` — virtual/override/new, method hiding, covariant returns (C# 9)
- [x] 2026-06-14 `csharp/abstract-interfaces` — default interface members (C# 8+), static abstract (C# 11+)
- [x] 2026-06-14 `csharp/properties-indexers` — init accessor, required, computed, indexed properties
- [x] 2026-06-14 `csharp/static-enums` — Flags enums, Enum.Parse vs TryParse, enum → int safety
- [x] 2026-06-14 `csharp/structures` — struct vs class, readonly struct, ref struct, record struct

**Modern C#**
- [x] 2026-06-14 `csharp/generics` — variance (in/out), constraints chain, INumber<T>, default(T)
- [x] `csharp/linq` — deferred execution, IQueryable vs IEnumerable, LINQ to objects vs EF ✓ 2026-06-14
- [x] `csharp/delegates` — Action/Func/Predicate, multicast, event vs delegate, weak events ✓ 2026-06-14
- [x] `csharp/pattern-matching` — positional, property, list patterns, switch expressions, guards ✓ 2026-06-14
- [x] `csharp/records` — with-expressions, value equality, record struct, deconstruct ✓ 2026-06-14
- [x] `csharp/tuples` — ValueTuple vs Tuple, deconstruction, _ discard, tuple return patterns ✓ 2026-06-14
- [x] `csharp/extension-methods` — this parameter rules, conflict resolution, extension properties ✓ 2026-06-14

**Async & Parallel**
- [x] `csharp/async` — ConfigureAwait, SynchronizationContext, deadlock, async void dangers ✓ 2026-06-14
- [x] `csharp/tasks` — Task.WhenAll/WhenAny, TaskCompletionSource, Unwrap, ContinueWith ✓ 2026-06-14
- [x] `csharp/threading` — Monitor, Mutex, SemaphoreSlim, Interlocked, lock vs volatile ✓ 2026-06-14
- [x] `csharp/channels` — bounded vs unbounded, producer/consumer pattern, backpressure ✓ 2026-06-14

**Data & Safety**
- [x] 2026-06-14 `csharp/strings-datetime` — string interning, StringBuilder, DateTimeOffset vs DateTime, NodaTime
- [x] 2026-06-14 `csharp/collections` — IEnumerable vs IList, Dictionary internals, ImmutableDictionary, concurrent
- [x] 2026-06-14 `csharp/io-serialization` — System.Text.Json source gen, JsonSerializerOptions, Utf8JsonReader
- [x] 2026-06-14 `csharp/gc-disposable` — finalizers, IDisposable, IAsyncDisposable, using declaration, GC.Collect
- [x] 2026-06-14 `csharp/null-safety` — nullable reference types, null-forgiving, required, annotations
- [x] 2026-06-14 `csharp/exceptions` — custom exceptions, ExceptionDispatchInfo, AggregateException, filter
- [x] 2026-06-14 `csharp/type-conversion` — implicit/explicit operators, Convert vs cast, pattern-based cast
- [x] 2026-06-14 `csharp/system-object` — Equals/GetHashCode contract, == operator, ReferenceEquals

**Advanced**
- [x] 2026-06-14 `csharp/reflection` — Type.GetMembers, caching MethodInfo, Emit basics, performance cost
- [x] 2026-06-14 `csharp/iterators` — yield state machine IL, IAsyncEnumerable, infinite sequences
- [x] 2026-06-14 `csharp/regex` — named groups, compiled Regex, source-generated ([GeneratedRegex]), backtracking
- [x] 2026-06-14 `csharp/expression-trees` — Expression<Func<T>>, Compile(), building IQueryable predicates
- [x] 2026-06-14 `csharp/dynamic` — dynamic vs object, ExpandoObject, DLR, DynamicObject, COM interop
- [x] 2026-06-14 `csharp/source-generators` — IIncrementalGenerator, SyntaxProvider, output registration
- [x] 2026-06-14 `csharp/unit-testing` — xUnit theories, Moq/NSubstitute, FluentAssertions, AutoFixture

**What's New**
- [x] 2026-06-14 `csharp/whats-new-9-10` — records, init, top-level statements, pattern improvements, LINQ changes
- [x] 2026-06-14 `csharp/whats-new-11-12` — required, generic math, raw string literals, primary constructors
- [x] 2026-06-14 `csharp/whats-new-latest` — C# 13+ collection expressions, params span, lock object

---

#### Angular hub — 45 topic pages

**Signals & reactivity (do these first)**
- [x] 2026-06-14 `angular/resource-api` — resource(), rxResource(), loading/error states, refresh
- [x] 2026-06-14 `angular/linked-signal` — linkedSignal(), write-back pattern, vs computed
- [x] 2026-06-14 `angular/signal-store` — @ngrx/signals, signalStore, withState, withMethods, withComputed
- [x] 2026-06-14 `angular/ngrx-signals` — feature stores, withEntities, custom features, devtools
- [x] 2026-06-14 `angular/change-detection` — OnPush, signal-based detection, ChangeDetectorRef, zone.js-less
- [x] 2026-06-14 `angular/zoneless` — provideZonelessChangeDetection, migration from zone.js, performance

**Core framework**
- [x] 2026-06-15 `angular/template-syntax` — control flow (@if/@for/@switch), defer, ng-template, ng-content
- [x] 2026-06-15 `angular/lifecycle` — OnInit, OnDestroy, DestroyRef, afterNextRender, afterRender
- [x] 2026-06-15 `angular/di-demo` — inject(), injection tokens, hierarchical DI, useFactory, forwardRef
- [x] 2026-06-15 `angular/routing-demo` — lazy routes, functional guards, resolvers, withViewTransitions
- [x] 2026-06-15 `angular/http-demo` — HttpClient, interceptors (functional), provideHttpClient, retry
- [x] 2026-06-15 `angular/pipes-demo` — pure vs impure, async pipe internals, custom transform pipes

**Forms**
- [x] 2026-06-15 `angular/forms-demo` — reactive vs template, FormGroup, FormControl, typed forms (v14+)
- [x] 2026-06-15 `angular/form-array` — FormArray, dynamic controls, array validators, nested groups
- [x] 2026-06-15 `angular/dynamic-forms` — building form config from JSON, custom validators
- [x] 2026-06-15 `angular/wizard-form` — multi-step form, stepper, inter-step validation
- [x] 2026-06-15 `angular/custom-validators` — sync/async validators, cross-field, NG_VALIDATORS token
- [x] 2026-06-15 `angular/cva-demo` — ControlValueAccessor, NG_VALUE_ACCESSOR, form integration
- [x] 2026-06-15 `angular/zod-forms` — Zod schema + Angular reactive forms, zodValidator adapter

**Components**
- [x] 2026-06-15 `angular/parent-child` — @Input, @Output, model(), contentChildren, viewChild
- [x] 2026-06-15 `angular/content-projection` — ng-content, select, ngTemplateOutlet, multi-slot
- [x] 2026-06-15 `angular/directives-demo` — attribute directives, structural directives, hostDirectives
- [x] 2026-06-15 `angular/destroy-ref` — DestroyRef, takeUntilDestroyed, vs OnDestroy

**Async & RxJS**
- [x] 2026-06-15 `angular/rxjs-demo` — switchMap/mergeMap/concatMap/exhaustMap, shareReplay, takeUntil
- [x] 2026-06-15 `angular/tanstack-query` — Angular TanStack Query, createQuery, createMutation, cache

**Testing**
- [x] 2026-06-15 `angular/testing-demo` — TestBed, ComponentFixture, signal testing, HttpClientTestingModule
- [x] 2026-06-15 `angular/harnesses` — ComponentHarness, HarnessLoader, CDK test harnesses
- [x] 2026-06-15 `angular/e2e` — Playwright vs Cypress for Angular, component testing setup

**Performance & Architecture**
- [x] 2026-06-15 `angular/preloading` — PreloadAllModules vs SelectivePreloading, QuicklinkStrategy
- [x] 2026-06-15 `angular/route-resolvers` — functional resolvers, inject() in resolvers, error handling
- [x] 2026-06-15 `angular/ssr` — Angular Universal/SSR, hydration, transferState, App Shell
- [x] 2026-06-16 `angular/pwa` — ngsw-config, caching strategies, push notifications, install prompt
- [x] 2026-06-16 `angular/web-workers` — comlink, offloading heavy computation, communication patterns

**Libraries & integrations**
- [x] 2026-06-16 `angular/animations-demo` — trigger/state/transition, stagger, AnimationBuilder, route anim
- [x] 2026-06-16 `angular/cdk-demo` — FocusTrap, Overlay, DragDrop, VirtualScrollViewport, a11y module
- [x] 2026-06-16 `angular/material-demo` — theming (M3), form field, table, dialog, CDK integration
- [x] `angular/tanstack-query` — (see Async section above)
- [x] 2026-06-16 `angular/charts` — ng2-charts/Chart.js, reactive data binding, responsive charts
- [x] 2026-06-16 `angular/ag-grid-demo` — AG Grid community, rowData signal, custom cell renderers
- [x] 2026-06-16 `angular/ng-image` — NgOptimizedImage, srcset, priority, LQIP
- [x] 2026-06-16 `angular/datefns-demo` — date-fns with Angular pipes, locale, formatting patterns
- [x] 2026-06-16 `angular/tailwind-demo` — Tailwind CSS 4 in Angular, dark mode, component patterns

**Misc**
- [x] 2026-06-16 `angular/counter` — simple signals counter demo — expand into signals deep-dive
- [x] 2026-06-16 `angular/todo` — todo app demo — expand into state management patterns demo
- [x] 2026-06-16 `angular/i18n` — @angular/localize, $localize, ICU, build-time vs runtime i18n

---

#### ASP.NET Core hub — 33 topic pages

**Foundation (do first)**
- [x] 2026-06-16 `aspnet/hosting-startup` — Generic Host, WebApplication.CreateBuilder, IHostedService, startup order
- [x] 2026-06-16 `aspnet/middleware` — pipeline order, short-circuit, IMiddlewareFactory, terminal middleware
- [x] 2026-06-16 `aspnet/routing` — endpoint routing, route constraints, route groups, MapGroup
- [x] 2026-06-16 `aspnet/configuration` — IConfiguration, Options pattern, IOptionsSnapshot, secrets
- [x] 2026-06-16 `aspnet/dependency-injection` — lifetimes (singleton/scoped/transient), keyed services, factory
- [x] 2026-06-16 `aspnet/logging` — ILogger, structured logging, log levels, Serilog/OpenTelemetry integration

**API layer**
- [x] 2026-06-16 `aspnet/controllers` — ApiController, ModelState, ActionResult<T>, problem details
- [x] `aspnet/minimal-apis` — route handlers, TypedResults, endpoint filters, groups, OpenAPI (2026-06-16)
- [x] `aspnet/model-binding` — [FromBody]/[FromRoute]/[FromQuery], custom binders, validation (2026-06-16)
- [x] `aspnet/filters` — action/exception/resource/auth filters, IFilterFactory, ordering (2026-06-16)
- [x] `aspnet/error-handling` — UseExceptionHandler, ProblemDetails middleware, IProblemDetailsService (2026-06-16)
- [x] `aspnet/api-versioning` — URL/header/query versioning, Asp.Versioning, deprecation (2026-06-16)
- [x] `aspnet/openapi-swagger` — Scalar, Swashbuckle, XML comments, security definitions (2026-06-16)

**Data**
- [x] `aspnet/ef-core-basics` — DbContext lifetime, no-tracking, SaveChanges, transactions (2026-06-16)
- [x] `aspnet/ef-relationships` — one-to-many, many-to-many, owned entities, table splitting (2026-06-16)
- [x] `aspnet/ef-performance` — compiled queries, split queries, connection resiliency, bulk ops (2026-06-16)

**Security**
- [x] `aspnet/authentication` — JWT bearer, cookie auth, IAuthenticationHandler, scheme selection (2026-06-16)
- [x] `aspnet/authorization` — policies, requirements, resource-based auth, IAuthorizationHandler (2026-06-16)
- [x] `aspnet/cors` — policy builder, pre-flight, credentials, CORS with minimal APIs (2026-06-16)
- [x] `aspnet/web-security` — CSRF, XSS, security headers, HTTPS enforcement, HSTS (2026-06-16)
- [x] `aspnet/secrets` — User Secrets, Azure Key Vault, DPAPI, ISecretManager (2026-06-16)
- [x] 2026-06-16 `aspnet/rate-limiting` — sliding window, fixed window, token bucket, concurrency limiter

**Advanced**
- [x] 2026-06-16 `aspnet/http-clients` — IHttpClientFactory, typed clients, Polly v8, resilience pipeline
- [x] 2026-06-16 `aspnet/grpc` — protobuf service/message, Grpc.AspNetCore, client factory, streaming
- [x] 2026-06-16 `aspnet/caching` — IMemoryCache, IDistributedCache, Redis, output caching, cache tags
- [x] 2026-06-16 `aspnet/static-files` — StaticFileOptions, file provider, cache-control headers

**Infrastructure**
- [x] `aspnet/background-services` — BackgroundService, IHostedService, Channels integration (2026-06-16)
- [x] `aspnet/health-checks` — AddHealthChecks, IHealthCheck, UI, readiness vs liveness (2026-06-16)
- [x] 2026-06-16 `aspnet/testing` — WebApplicationFactory, custom factory, Testcontainers, Respawn
- [x] 2026-06-16 `aspnet/signalr` — hubs, groups, connection lifecycle, scale-out with Redis backplane
- [x] 2026-06-16 `aspnet/deployment` — Kestrel, IIS, Docker, reverse proxy (NGINX), HTTPS in containers
- [x] 2026-06-16 `aspnet/performance` — response compression, response caching, async streaming, BenchmarkDotNet
- [x] 2026-06-16 `aspnet/aspire` — AppHost orchestration, service defaults, dashboard, integrations

---

#### SQL hub — 17 topic pages

- [x] `sql/rdbms-concepts` — ACID, CAP theorem, relational model, keys, constraints overview `2026-06-16`
- [x] `sql/data-modeling` — 2026-06-16
- [x] `sql/normalization` — 1NF/2NF/3NF/BCNF, denormalisation trade-offs, when to break rules `2026-06-16`
- [x] `sql/db-architecture` — 2026-06-16
- [x] `sql/data-types` — 2026-06-16
- [x] `sql/basics` — 2026-06-16
- [x] `sql/joins` — 2026-06-16
- [x] `sql/aggregations` — 2026-06-16
- [x] `sql/subqueries` — correlated vs non-correlated, EXISTS vs IN, lateral joins (PG), scalar subquery `2026-06-16`
- [x] `sql/ctes` — recursive CTEs, WITH clause, CTE vs subquery performance, multiple CTEs `2026-06-16`
- [x] `sql/window-functions` — ROW_NUMBER/RANK/DENSE_RANK, LAG/LEAD, NTILE, ROWS vs RANGE frames `2026-06-16`
- [x] `sql/indexes` — clustered vs non-clustered, covering index, include columns, index maintenance `2026-06-16`
- [x] `sql/transactions` — BEGIN/COMMIT/ROLLBACK, savepoints, implicit vs explicit, retry logic `2026-06-16`
- [x] `sql/stored-procedures` — parameters, OUTPUT, EXEC, error handling, TRY/CATCH `2026-06-16`
- [x] `sql/schema-design` — naming conventions, surrogate vs natural keys, soft delete patterns `2026-06-16`
- [x] `sql/json-features` — FOR JSON PATH (T-SQL), jsonb operators (PG), JSON indexing `2026-06-16`
- [x] `sql/performance` — execution plans, query hints, statistics, parameter sniffing (T-SQL) `2026-06-16`

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

- [x] 2026-06-16 `ts-basics` — Type annotations, inference, `any` vs `unknown`, `never`, type assertions
- [x] 2026-06-17 `ts-basics` — type annotations, inference, any/unknown/never, assertions
- [x] 2026-06-17 `ts-primitive-types` — string, number, boolean, null, undefined, void, never, unknown, literal types
- [x] 2026-06-17 `ts-interfaces-types` — interface vs type alias, declaration merging, index signatures
- [x] 2026-06-17 `ts-unions` — union/intersection types, discriminated unions, narrowing
- [x] 2026-06-17 `ts-enums-tuples` — const/string enums, reverse mapping, tuple types
- [x] 2026-06-17 `ts-generics` — generic functions, constraints, interfaces, classes, default params
- [x] 2026-06-17 `ts-generic-patterns` — Result<T,E>, Option<T>, generic factories, conditional generics
- [x] 2026-06-17 `ts-utility-types` — Partial, Required, Readonly, Pick, Omit, Record, Extract, Exclude, NonNullable, ReturnType
- [x] 2026-06-17 `ts-mapped-types` — [K in keyof T], +/- modifiers, key remapping with as
- [x] 2026-06-17 `ts-template-literal-types` — template literal syntax, Uppercase/Capitalize/infer
- [x] 2026-06-17 `ts-conditional-types` — T extends U ? X : Y, infer, distributive, built-ins
- [x] 2026-06-17 `ts-narrowing` — typeof, instanceof, in, predicates, assertion functions, exhaustiveness
- [x] 2026-06-17 `ts-decorators` — TC39 Stage 3 vs legacy, class/method/field/accessor decorators
- [x] 2026-06-17 `ts-classes` — access modifiers, abstract, readonly, override, parameter properties
- [x] 2026-06-17 `ts-tsconfig` — target/lib, module/moduleResolution, strict flags, paths, composite
- [x] 2026-06-17 `ts-modules` — ES modules, import type, resolution, path aliases, namespaces
- [x] 2026-06-17 `ts-declarations` — .d.ts files, DefinitelyTyped, ambient declare, module augmentation
- [x] 2026-06-17 `ts-frameworks` — React, Express, Zod, Next.js App Router typed patterns
- [x] 2026-06-17 `ts-strict-migration` — strict: true flags, allowJs, @ts-expect-error, bottom-up migration
- [x] 2026-06-17 `ts-ts-performance` — incremental, composite, isolatedModules, noEmit, barrel chains
- [x] 2026-06-17 `ts-cheatsheet` — 8-tab reference: types, narrowing, generics, utility, mapped, classes, modules, config
- [x] 2026-06-17 `ts-interview-prep` — 35 Q&A across Type System, Generics, Advanced Types, Classes, Modules, Config, Patterns

Wiring checklist per CLAUDE.md: routes, nav block, search entries, breadcrumb labels,
sidebar entries, progress service (`tsTotal`), hub-home card flip.

---

### 3B — React hub ✅ COMPLETE `src/app/components/frontend/react/`

All 17 trackable topics + 2 reference pages live (2026-06-17). reactTotal = 17. All cards `available: true`.
Accent: `#0ea5e9` sky-blue. Search prefix: `react-`. Hero stat updated to 275+.

- [x] 2026-06-17 `react-basics` — JSX, components, props, rendering, keys, fragments, reconciliation
- [x] 2026-06-17 `react-hooks-core` — useState, useEffect, useRef, useContext
- [x] 2026-06-17 `react-hooks-advanced` — useReducer, useMemo, useCallback, useTransition, useDeferredValue, useId, custom hooks
- [x] 2026-06-17 `react-forms` — controlled vs uncontrolled, HTML5 validation, React Hook Form + Zod
- [x] 2026-06-17 `react-context` — createContext, useContext, context splitting, Zustand intro
- [x] 2026-06-17 `react-state-management` — useState vs useReducer vs Zustand vs Jotai vs Redux Toolkit
- [x] 2026-06-17 `react-router` — createBrowserRouter, nested routes, loader, action, useNavigate, Outlet
- [x] 2026-06-17 `react-tanstack-query` — useQuery, useMutation, cache invalidation, optimistic updates
- [x] 2026-06-17 `react-performance` — React.memo, useMemo, useCallback, Profiler, react-window
- [x] 2026-06-17 `react-patterns` — Compound components, render props, HOCs, custom hooks
- [x] 2026-06-17 `react-typescript` — Typing props/events/refs, generic components, discriminated unions
- [x] 2026-06-17 `react-testing` — RTL, Vitest, userEvent, MSW, async testing
- [x] 2026-06-17 `react-nextjs` — App Router, Server Components, Server Actions, Suspense, layouts
- [x] 2026-06-17 `react-native` — View/Text/FlatList, StyleSheet, Expo, React Navigation, New Architecture
- [x] 2026-06-17 `react-hook-form` — register, handleSubmit, Controller, zodResolver, field arrays
- [x] 2026-06-17 `react-animations` — Framer Motion: motion.div, variants, AnimatePresence, useSpring
- [x] 2026-06-17 `react-security` — XSS, dangerouslySetInnerHTML + DOMPurify, CSP, CSRF, httpOnly cookies
- [x] 2026-06-17 `react-cheatsheet` — 7-tab reference (Hooks, Components, JSX, TypeScript, Patterns, Performance, Router)
- [x] 2026-06-17 `react-interview-prep` — 32 Q&A across Fundamentals/Hooks/State/Patterns/Testing/Next.js/React 19

---

### 3C — JavaScript hub ✅ COMPLETE `src/app/components/frontend/javascript/`

All 22 trackable topics + 2 reference pages live (2026-06-17). jsTotal = 22. All 24 cards `available: true`.
Accent: `#f7df1e` (JS yellow). Search prefix: `js-`. Hero stat updated to 300+.

- [x] 2026-06-17 `js-fundamentals`, `js-closures`, `js-hoisting`, `js-symbols`, `js-functions`
- [x] 2026-06-17 `js-prototypes`, `js-objects`, `js-destructuring`, `js-arrays`, `js-promises`
- [x] 2026-06-17 `js-event-loop`, `js-error-handling`, `js-generators`, `js-dom`, `js-events`
- [x] 2026-06-17 `js-browser-apis`, `js-modules`, `js-bundlers`, `js-patterns`, `js-functional`
- [x] 2026-06-17 `js-proxy`, `js-weakrefs`, `js-cheatsheet` (reference), `js-interview-prep` (reference)

---

### 3D — HTML hub (22 topics) `src/app/components/frontend/html/`

Accent: `#e34c26` (HTML orange). Search prefix: `html-`.

**Batch 1 (2026-06-18):**
- [x] 2026-06-18 `html-document-structure` — DOCTYPE, `<html lang>`, `<meta charset>`, `<head>` vs
  `<body>`, rendering pipeline, parse vs DOMContentLoaded
- [x] 2026-06-18 `html-semantic-elements` — `<main>`, `<article>`, `<section>`, `<aside>`, `<nav>`,
  `<figure>`, `<time>`, `<address>` — when and why each
- [x] 2026-06-18 `html-forms` — `<form>`, `<input>` types, `<label>`, `<fieldset>`, `<select>`,
  `<textarea>`, HTML5 validation attributes, constraint API
- [x] 2026-06-18 `html-media` — `<img>` (srcset, sizes, loading=lazy, decoding=async), `<picture>`,
  `<video>` (controls, poster, track), `<audio>`, `<source>`
- [x] 2026-06-18 `html-tables` — `<table>`, `<thead>`, `<tbody>`, `<th scope>`, `<caption>`,
  `<colgroup>` — accessibility requirements, when not to use tables
- [x] 2026-06-18 `html-links-navigation` — `<a>` (href, rel, target, download), relative vs absolute
  URLs, `<link>`, `<base>`, fragment navigation, skip links


**Workflow: qwen3.6 writes full .ts file → Claude validates build errors only → Claude does wiring**

- [x] 2026-06-18 `html-accessibility` — ARIA roles, aria-label vs aria-labelledby, aria-live, focus management, landmark roles
- [x] 2026-06-18 `html-head-metadata` — charset/viewport, Open Graph, Twitter Cards, canonical, link rel preload/prefetch
- [x] 2026-06-18 `html-custom-elements` — Web Components: template, slot, shadow DOM, customElements.define, lifecycle
- [x] 2026-06-18 `html-iframes-embeds` — iframe sandbox, allow, CSP frame-ancestors, embed vs object vs SVG
- [x] 2026-06-18 `html-canvas-svg` — canvas 2D context API vs SVG — shapes, text, gradients, animation
- [x] 2026-06-18 `html-performance` — Resource hints, loading=lazy, critical rendering path, render-blocking
- [x] 2026-06-18 `html-pwa-service-workers` — manifest.json, service worker lifecycle, Cache API, offline strategies
- [x] 2026-06-18 `html-seo` — JSON-LD structured data, canonical, robots.txt, Core Web Vitals, hreflang
- [x] 2026-06-18 `html-apis` — Geolocation, Notifications, File API, Drag and Drop, Clipboard API, Web Share
- [x] 2026-06-18 `html-cheatsheet` — reference page (no app-page-complete, no app-revision-card)
- [x] 2026-06-18 `html-interview-prep` — reference page (no app-page-complete, no app-revision-card)
- [x] 2026-06-19 `html-fundamentals` — elements, attributes, void elements, block vs inline, DOCTYPE, character encoding
- [x] 2026-06-19 `html-headings-paragraphs` — h1–h6 hierarchy, paragraph, inline text elements, semantic vs presentational
- [x] 2026-06-19 `html-input-types` — email/tel/url/number/date/range/color/search, autocomplete, inputmode, pattern
- [x] 2026-06-19 `html-landmark-elements` — all 8 ARIA landmark roles, HTML equivalents, aria-label for duplicates
- [x] 2026-06-19 `html-aria-roles` — ARIA role categories, aria-label/labelledby/describedby, live regions, states
- [x] 2026-06-19 `html-focus-management` — tabindex, focus(), :focus-visible, skip links, modal focus traps, inert
- [x] 2026-06-19 `html-storage-apis` — localStorage vs sessionStorage vs IndexedDB vs cookies, capacity, security
- [x] 2026-06-19 `html-drag-drop` — draggable, drag event sequence, DataTransfer, effectAllowed/dropEffect

---

### 3E — CSS hub ✅ COMPLETE `src/app/components/frontend/css/`

All 22 trackable topics + 2 reference pages live (2026-06-19). cssTotal = 22. All 24 cards `available: true`.
Accent: `#264de4` (CSS blue). Search prefix: `css-`. Icon content: `CSS`. `tech="javascript"` in page-meta.

- [x] 2026-06-19 `css-fundamentals` — cascade, specificity, inheritance, box-sizing, :is()/:where()
- [x] 2026-06-19 `css-box-model` — content/padding/border/margin, BFC, collapsing margins
- [x] 2026-06-19 `css-selectors` — :is/:where/:has/:not, combinators, attribute selectors, pseudo-elements
- [x] 2026-06-19 `css-custom-properties` — CSS variables, var(), fallback, scope, design token patterns
- [x] 2026-06-19 `css-flexbox` — flex container/items, justify-content, align-items, gap, flex shorthand
- [x] 2026-06-19 `css-grid` — template-columns/rows, fr unit, auto-fill/auto-fit, named areas, subgrid
- [x] 2026-06-19 `css-positioning` — static/relative/absolute/fixed/sticky, z-index stacking contexts
- [x] 2026-06-19 `css-typography` — font loading, variable fonts, clamp(), font-display
- [x] 2026-06-19 `css-colors-theming` — oklch, color-mix(), dark mode strategies, accessible contrast
- [x] 2026-06-19 `css-backgrounds-borders` — gradients, background-size, multiple backgrounds, box-shadow
- [x] 2026-06-19 `css-responsive` — mobile-first, media queries, fluid grids, container queries
- [x] 2026-06-19 `css-container-queries` — @container, cqw/cqh units, component-scoped responsiveness
- [x] 2026-06-19 `css-transitions` — transition property/duration/easing, transform+opacity only for 60fps
- [x] 2026-06-19 `css-animations` — @keyframes, animation shorthand, will-change, prefers-reduced-motion
- [x] 2026-06-19 `css-css-layers` — @layer, layer order, unlayered styles beat all layers
- [x] 2026-06-19 `css-css-nesting` — native CSS nesting, & parent selector, nested @media
- [x] 2026-06-19 `css-logical-properties` — margin-inline/block, inset, writing-mode, RTL support
- [x] 2026-06-19 `css-css-architecture` — BEM, ITCSS, CSS Modules, utility-first
- [x] 2026-06-19 `css-tailwind` — utility-first, JIT mode, @apply, group/peer variants, dark mode class
- [x] 2026-06-19 `css-css-transforms` — translate/rotate/scale/3D, perspective, transform-origin, GPU layers
- [x] 2026-06-19 `css-css-filters` — filter, backdrop-filter, mix-blend-mode, isolation, frosted glass
- [x] 2026-06-19 `css-scroll-driven-animations` — animation-timeline: scroll()/view(), animation-range
- [x] 2026-06-19 `css-cheatsheet` — reference: 7-tab (Selectors/Box Model/Layout/Typography/Colors/Animations/Modern CSS)
- [x] 2026-06-19 `css-interview-prep` — reference: 20 Q&A filterable by difficulty + topic

---

### 3F — Web Performance hub (22 topics) ✅ COMPLETE

All 22 pages written and committed (2026-06-20). perfTotal=20. Hub-home topics: 22, available: true. Hero stat: 350+. Build passes.
- [x] 2026-06-19 `core-web-vitals` — LCP, INP, CLS thresholds, CrUX, PerformanceObserver
- [x] 2026-06-20 `lcp` — Largest Contentful Paint
- [x] 2026-06-20 `inp` — Interaction to Next Paint
- [x] 2026-06-20 `cls` — Cumulative Layout Shift
- [x] 2026-06-20 `critical-rendering-path` — Critical Rendering Path
- [x] 2026-06-20 `browser-rendering` — Browser Rendering Pipeline
- [x] 2026-06-20 `resource-hints` — Resource Hints
- [x] 2026-06-20 `http2-http3` — HTTP/2 & HTTP/3
- [x] 2026-06-20 `caching` — Caching & Service Workers
- [x] 2026-06-20 `image-optimisation` — Image Optimisation
- [x] 2026-06-20 `font-performance` — Font Performance
- [x] 2026-06-20 `js-performance` — JavaScript Performance
- [x] 2026-06-20 `third-party-scripts` — Third-Party Scripts
- [x] 2026-06-20 `measurement` — Performance Measurement
- [x] 2026-06-20 `rum` — Real User Monitoring
- [x] 2026-06-20 `ssr-streaming` — SSR & Streaming HTML
- [x] 2026-06-20 `css-performance` — CSS Performance
- [x] 2026-06-20 `web-workers` — Web Workers & Off-Main-Thread
- [x] 2026-06-20 `performance-budgets` — Performance Budgets & CI
- [x] 2026-06-20 `speculation-rules` — Speculation Rules API
- [x] 2026-06-20 `cheatsheet` — Performance Cheat Sheet (reference)
- [x] 2026-06-20 `interview-prep` — Performance Interview Prep (reference)

---

### 3G — Blazor hub ✅ COMPLETE `src/app/components/frontend/blazor/`

All 20 trackable topics + 3 reference pages live (2026-06-21). blazorTotal = 20. All 23 cards `available: true`.
Accent: `#5c2d91` (Blazor purple). Search prefix: `blazor-`. Route: `/blazor`.
Nav groups: Foundations, Components, Data & Forms, Routing, State & Services, Advanced, Reference.
Reference pages: bunit, cheatsheet, interview-prep (no PageComplete on these).

---

## Phase 4 — Backend Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 4A — Node.js hub ✅ COMPLETE `src/app/components/backend/nodejs/`

All 23 trackable topics + 2 reference pages live (2026-06-21). nodeTotal = 23. All 25 cards `available: true`.
Accent: `#339933` (Node green). Search prefix: `node-`. Route: `/node`.
Nav groups: Foundations, HTTP & APIs, Async & Streams, Database, Auth & Security, Performance, Tooling, Reference.

---

### 4B — Python hub ✅ COMPLETE `src/app/components/backend/python/`

All 21 trackable topics + 2 reference pages live (2026-06-21). pyTotal = 21. All 23 cards `available: true`.
Accent: `#3776ab` (Python blue). Search prefix: `py-`. Route: `/python`.
Nav groups: Foundations, OOP & Patterns, Data & Types, Async, Web & APIs, Data Science, Tooling, Reference.

---

### 4C — Go hub ✅ COMPLETE `src/app/components/backend/go/`

All 21 trackable topics + 2 reference pages live (2026-06-21). goTotal = 21. All 23 cards `available: true`.
Accent: `#00add8` (Go blue). Search prefix: `go-`. Hero stat updated to 400+.

- [x] 2026-06-21 `go-fundamentals` — variables, types, functions, multiple returns, defer, pointers
- [x] 2026-06-21 `go-structs-interfaces` — struct types, methods, interfaces, embedding, implicit satisfaction
- [x] 2026-06-21 `go-error-handling` — error pattern, errors.Is/As, %w wrapping, custom error types, panic/recover
- [x] 2026-06-21 `go-slices-maps` — slice internals (len/cap/backing array), maps, maps.Clone, slices.Clone
- [x] 2026-06-21 `go-goroutines` — lightweight threads, GMP scheduler, goroutine leaks, GOMAXPROCS
- [x] 2026-06-21 `go-channels` — buffered vs unbuffered, directional channels, select, closing, range over channel
- [x] 2026-06-21 `go-sync` — Mutex, RWMutex, WaitGroup, Once, Cond, atomic operations
- [x] 2026-06-21 `go-context` — cancellation, deadlines, timeouts, request-scoped values
- [x] 2026-06-21 `go-net-http` — net/http server, ServeMux (Go 1.22+), middleware, JSON APIs
- [x] 2026-06-21 `go-gin` — Gin web framework, routing, middleware, param binding, error handling
- [x] 2026-06-21 `go-json-encoding` — JSON marshalling/unmarshalling, struct tags, custom MarshalJSON
- [x] 2026-06-21 `go-grpc` — .proto definitions, protoc codegen, interceptors, streaming
- [x] 2026-06-21 `go-pgx` — pgx for PostgreSQL, connection pool, prepared statements, COPY bulk insert
- [x] 2026-06-21 `go-gorm` — GORM ORM, AutoMigrate, Preload/Joins, hooks, raw SQL
- [x] 2026-06-21 `go-generics` — type parameters, constraints, comparable, when to use generics
- [x] 2026-06-21 `go-patterns` — functional options, errgroup, worker pools, fan-out/fan-in, retry
- [x] 2026-06-21 `go-modules` — go.mod, go.sum, MVS, workspaces, GOPRIVATE, build tags, cross-compilation
- [x] 2026-06-21 `go-testing` — table-driven tests, testify, httptest, benchmarks, race detection, fuzzing
- [x] 2026-06-21 `go-cli` — cobra, flag package, stdin/piping, spinner goroutine, goreleaser
- [x] 2026-06-21 `go-profiling` — pprof, net/http/pprof, sync.Pool, GC tuning, execution tracer
- [x] 2026-06-21 `go-build` — static binaries, multi-stage Docker, graceful shutdown, GitHub Actions CI, goreleaser
- [x] 2026-06-21 `go-cheatsheet` — reference page: types, concurrency, errors, testing patterns
- [x] 2026-06-21 `go-interview-prep` — reference page: 35+ Q&A across goroutines, interfaces, GC, generics

---

## Phase 5 — Cloud & DevOps Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).
Build order: DevOps → Containers → AWS → Azure → Linux → Terraform → Service Mesh.

### 5A — DevOps hub ✅ COMPLETE `src/app/components/cloud/devops/`

All 21 trackable topics + 1 cheatsheet reference live (2026-06-21). devopsTotal = 21. All 22 cards `available: true`.
Accent: `#ee5d25` (DevOps orange). Search prefix: `devops-`.

- [x] 2026-06-21 `devops-culture` — CALMS, three ways, feedback loops, Dev+Ops collaboration
- [x] 2026-06-21 `devops-sdlc-agile` — Waterfall vs Agile, Scrum/Kanban, sprints, velocity
- [x] 2026-06-21 `devops-environment-strategy` — env parity, ephemeral PR envs, secrets per env, promotion gates
- [x] 2026-06-21 `devops-platform-engineering` — IDP, Backstage, golden paths, Team Topologies
- [x] 2026-06-21 `devops-git-workflows` — Gitflow vs trunk-based, feature flags, branch protection, conventional commits
- [x] 2026-06-21 `devops-github-actions` — workflow YAML, matrix, reusable workflows, environment protection rules
- [x] 2026-06-21 `devops-azure-pipelines` — stages/jobs/steps, templates, service connections, deployment gates
- [x] 2026-06-21 `devops-jenkins` — declarative vs scripted, Jenkinsfile, shared libraries, Blue Ocean
- [x] 2026-06-21 `devops-continuous-integration` — fast feedback, test gates, coverage, SonarQube, artefact versioning
- [x] 2026-06-21 `devops-continuous-delivery` — CD vs CD distinction, blue/green, canary, rolling, rollback triggers
- [x] 2026-06-21 `devops-gitops` — ArgoCD Application CRD, Flux HelmRelease, sync policies, rollback via git revert
- [x] 2026-06-21 `devops-artifact-management` — SemVer, GHCR/ACR/ECR, immutable tags, SBOM, Cosign signing
- [x] 2026-06-21 `devops-docker-cicd` — multi-stage builds, layer cache ordering, registry-backed cache, Trivy, Cosign
- [x] 2026-06-21 `devops-kubernetes-deployments` — kubectl/Helm/Kustomize, probes, Argo Rollouts, GitOps RBAC
- [x] 2026-06-21 `devops-iac` — Terraform, Bicep, Pulumi, remote backends, Policy as Code (Checkov/OPA)
- [x] 2026-06-21 `devops-monitoring` — four golden signals, Prometheus, SLO burn-rate, Grafana USE/RED, Azure Monitor
- [x] 2026-06-21 `devops-logging` — structured JSON, correlation IDs, Fluent Bit DaemonSet, Loki vs ELK, Serilog/Pino
- [x] 2026-06-21 `devops-incident-response` — P1–P4 severity, runbooks, blameless post-mortems, 5 Whys, DORA MTTR
- [x] 2026-06-21 `devops-devsecops` — SAST (Semgrep/CodeQL), SCA/Snyk, gitleaks secrets scanning, container/IaC security
- [x] 2026-06-21 `devops-release-management` — SemVer, conventional commits, changelogs, feature flags, hotfix process
- [x] 2026-06-21 `devops-sre` — SLIs, SLOs, error budgets, burn-rate alerting, toil elimination, blameless post-mortems
- [x] 2026-06-21 `devops-cheatsheet` — reference: DORA metrics, pipeline stages, Git/Docker/Helm/kubectl/Terraform/SLO

### 5B — Containers/K8s hub ✅ COMPLETE `src/app/components/cloud/containers/`

All 22 trackable topics + 1 reference live (2026-06-25). k8sTotal = 22. All 23 cards `available: true`.
Accent: `#326ce5` (Kubernetes blue). Search prefix: `k8s-`.

### 5C — AWS hub ✅ COMPLETE `src/app/components/cloud/aws/`

All 21 trackable topics + 1 cheatsheet reference live (2026-06-21). awsTotal = 21. All 22 cards `available: true`.
Accent: `#ff9900` (AWS orange). Search prefix: `aws-`. hub-home topics: 22, available: true. Hero stat: 479+.

- [x] 2026-06-21 `aws-fundamentals` — Regions, AZs, shared responsibility model, AWS CLI, Well-Architected Framework
- [x] 2026-06-21 `aws-ec2` — Instance types, AMIs, EBS gp3/io2, security groups, ASG launch templates
- [x] 2026-06-21 `aws-ecs-eks` — ECS task/service, Fargate, EKS managed node groups, ALB, IRSA
- [x] 2026-06-21 `aws-vpc` — Subnets, route tables, IGW, NAT Gateway, security groups vs NACLs, VPC peering
- [x] 2026-06-21 `aws-route53-cloudfront` — Route 53 routing policies, CloudFront distributions, OAC, ACM
- [x] 2026-06-21 `aws-s3` — Storage classes, versioning, lifecycle rules, cross-region replication, presigned URLs
- [x] 2026-06-21 `aws-ebs-efs` — EBS gp3/io2, EFS NFS multi-AZ, FSx variants, AWS Backup
- [x] 2026-06-21 `aws-iam` — Users/groups/roles/policies, permission boundaries, SCPs, policy evaluation
- [x] 2026-06-21 `aws-iam-roles` — Cross-account AssumeRole, OIDC federation, IRSA, IAM Identity Center, STS
- [x] 2026-06-21 `aws-rds-aurora` — RDS Multi-AZ, Aurora Serverless v2, read replicas, parameter groups
- [x] 2026-06-21 `aws-dynamodb` — Partition/sort key design, GSI/LSI, Streams, DAX, on-demand vs provisioned
- [x] 2026-06-21 `aws-lambda` — Event sources, layers, concurrency, cold starts, power tuning, ESM
- [x] 2026-06-21 `aws-api-gateway` — REST/HTTP/WebSocket APIs, Lambda authoriser, throttling, CORS, stages
- [x] 2026-06-21 `aws-sqs-sns` — Standard/FIFO queues, visibility timeout, DLQ, SNS fan-out, message filtering
- [x] 2026-06-21 `aws-eventbridge` — Event buses, content-based routing, schema registry, Pipes, cross-account
- [x] 2026-06-21 `aws-step-functions` — Standard vs Express, ASL state types, Retry/Catch, Parallel/Map, SDK integrations
- [x] 2026-06-21 `aws-cloudwatch` — Metrics/alarms, Log Insights, X-Ray tracing, EMF, dashboards, 4 Golden Signals
- [x] 2026-06-21 `aws-cloudformation-cdk` — CloudFormation stacks, Change Sets, CDK L1/L2/L3, bootstrap, cdk deploy/diff
- [x] 2026-06-21 `aws-load-balancing` — ALB (L7 path/host routing), NLB (L4), target groups, health checks
- [x] 2026-06-21 `aws-security` — GuardDuty, Security Hub, Shield Standard/Advanced, WAF Web ACL, Macie, KMS envelope encryption
- [x] 2026-06-21 `aws-cost-optimization` — Savings Plans vs RIs vs Spot, Cost Explorer, Budgets, Compute Optimizer, data transfer costs
- [x] 2026-06-21 `aws-cheatsheet` — Reference: CLI commands (4 tabs), Service Reference grid (7 categories), IAM patterns, Architecture patterns

### 5D — Azure hub ✅ COMPLETE `src/app/components/cloud/azure/`

All 22 trackable topics + 1 cheatsheet reference live (2026-06-22). azureTotal = 22. All 23 cards `available: true`.
Accent: `#0089d6` (Azure blue). Search prefix: `azure-`.

### 5E — Linux hub ✅ COMPLETE `src/app/components/cloud/linux/`

All 19 trackable topics + 2 reference pages live (2026-06-22). linuxTotal = 19. All 21 cards `available: true`.
Accent: `#fcc624` (Linux yellow). Search prefix: `linux-`.

### 5F — Terraform hub ✅ COMPLETE `src/app/components/cloud/terraform/`

All 21 trackable topics + 2 reference live (2026-06-25). tfTotal = 21. All 23 cards `available: true`.
Accent: `#7b42bc` (Terraform purple). Search prefix: `tf-`.

### 5G — Service Mesh hub ✅ COMPLETE `src/app/components/cloud/service-mesh/`

All 19 trackable topics + 2 reference live (2026-06-25). meshTotal = 19. All 21 cards `available: true`.
Accent: `#466bb0` (Istio blue). Search prefix: `mesh-`.

---

## Phase 6 — Architecture Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 6A — System Design hub ✅ COMPLETE `src/app/components/architecture/system-design/`

All 24 trackable topics + 2 reference live (2026-06-25). sysdesignTotal = 24. All 26 cards `available: true`.
Accent: `#0f172a` (slate). Search prefix: `sysdesign-`.

### 6B — Architecture Patterns hub ✅ COMPLETE `src/app/components/architecture/arch-patterns/`

All 22 trackable topics + 3 reference live (2026-06-25). archTotal = 22. All 25 cards `available: true`.
Accent: `#7c3aed` (violet). Search prefix: `arch-`.

### 6C — Design Patterns hub ✅ COMPLETE `src/app/components/architecture/design-patterns/`

All 36 trackable topics + 3 reference live (2026-06-25). dpTotal = 36. All 39 cards `available: true`.
Accent: `#0369a1` (blue). Search prefix: `dp-`.

### 6D — Security hub ✅ COMPLETE `src/app/components/architecture/security/`

All 23 trackable topics + 2 reference live (2026-06-25). secTotal = 23. All 25 cards `available: true`.
Accent: `#dc2626` (red). Search prefix: `sec-`.

### 6E — API Design hub ✅ COMPLETE `src/app/components/architecture/api-design/`

All 19 trackable topics + 2 reference live (2026-06-25). apiTotal = 19. All 21 cards `available: true`.
Accent: `#0891b2` (cyan). Search prefix: `api-`.

### 6F — Observability hub ✅ COMPLETE `src/app/components/architecture/observability/`

All 20 trackable topics + 2 reference live (2026-06-25). obsTotal = 20. All 22 cards `available: true`.
Accent: `#059669` (emerald). Search prefix: `obs-`.

---

## Phase 7 — Data Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 7A — MongoDB hub ✅ COMPLETE `src/app/components/data/mongodb/`

All 21 trackable topics + 2 reference pages live (2026-06-25). mongoTotal = 21. All 23 cards `available: true`.
Accent: `#00ed64` (MongoDB green). Search prefix: `mongo-`. Route: `/mongodb`.

### 7B — Redis hub ✅ COMPLETE `src/app/components/data/redis/`

All 21 trackable topics + 2 reference pages live (2026-06-25). redisTotal = 21. All 23 cards `available: true`.
Accent: `#dc382d` (Redis red). Search prefix: `redis-`. Route: `/redis`.
Nav groups: Foundations, Data Structures, Commands, Persistence, Pub/Sub & Streams, Caching, Cluster & HA, Ecosystem, Reference.

### 7C — GraphQL hub ✅ COMPLETE `src/app/components/data/graphql/`

All 20 trackable topics + 2 reference pages live (2026-06-25). gqlTotal = 20. All 22 cards `available: true`.
Accent: `#e535ab` (GraphQL pink). Search prefix: `gql-`. Route: `/graphql`.
Nav groups: Foundations, Operations, Server, Client, Advanced, Reference.

### 7D — Messaging/Kafka hub ✅ COMPLETE `src/app/components/data/messaging/`

All 20 trackable topics + 2 reference pages live (2026-06-25). kafkaTotal = 20. All 22 cards `available: true`.
Accent: `#9a3412` (burnt orange). Search prefix: `kafka-`. Route: `/messaging`.
Nav groups: Foundations, RabbitMQ, Kafka, Patterns, Cloud Messaging, Reliability, Reference.

---

## Phase 8 — Fundamentals Hubs

**Before writing the first page of each hub:** run pre-hub research (Working Method rule 4).

### 8A — Testing hub ✅ COMPLETE `src/app/components/fundamentals/testing/`

All 19 trackable topics + 3 reference pages live (2026-06-25). testTotal = 19. All 22 cards `available: true`.
Accent: `#6366f1` (indigo). Search prefix: `test-`. Route: `/testing-hub`. Hero stat: 793+.

- [x] 2026-06-25 `test-testing-fundamentals`, `test-jest-fundamentals`, `test-mocking-spies`, `test-xunit`, `test-tdd`
- [x] 2026-06-25 `test-test-doubles`, `test-integration-testing`, `test-testing-databases`, `test-angular-testing`
- [x] 2026-06-25 `test-react-testing-library`, `test-playwright`, `test-cypress`, `test-api-testing`
- [x] 2026-06-25 `test-contract-testing`, `test-snapshot-testing`, `test-vitest`, `test-msw`
- [x] 2026-06-25 `test-visual-regression`, `test-property-based-testing`
- [x] 2026-06-25 `cheatsheet` (reference), `performance-testing` (reference), `mutation-testing` (reference)

### 8B — DSA hub ✅ COMPLETE `src/app/components/fundamentals/dsa/`

All 21 trackable topics live (2026-06-25). dsaTotal = 21. All 22 cards `available: true`. Wiring complete (routes, search, nav, progress, breadcrumb, sidebar).
Accent: `#92400e` (amber). Search prefix: `dsa-`. Route: `/dsa`. Hero stat updated to 815+. DsaNavComponent.

### 8C — AI/ML hub ✅ COMPLETE `src/app/components/fundamentals/ai/`

All 19 trackable topics + 3 reference live (2026-06-25). aiTotal = 19. All 22 cards `available: true`.
Accent: `#7c3aed` (violet). Search prefix: `ai-`.

---

## Phase 9 — Final Quality Audit (every page, every hub)

**Structural grep-based audit: COMPLETE (2026-06-26)**
All 928 pages passed or were fixed:
- Dark mode violations — zero ✅ | Missing revision-card — fixed 3 pages ✅
- Missing common-mistakes — zero ✅ | Wrong CSS wrapper class — fixed 5 pages ✅
- Wrong icon class — fixed generics + linq ✅ | Light-tint icon in solid-fill hubs — zero ✅
- Wrong padding — all correct ✅ | Wrong hub section class — zero ✅
- SQL pages with forbidden components — zero ✅ | tech= missing — fixed 3 pages ✅
- nav-home-link inside nav-group — zero ✅ | content-grid gap — correct ✅
- Old .page wrapper on topic pages — all fixed ✅

**Remaining:** Deep content-quality review (theory depth ≥5 sections×5 points, quiz difficulty spread, Q&A trap questions) — requires page-by-page review.

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
[ ] Page header icon: <div class="page-header-icon <hub>-icon">CONTENT</div> — BOTH classes
    present. Hub class matches the page's hub. Content per hub:
    Angular=A | C#=C# | ASP.NET=ASP | SQL=SQL | TS=TS | JS=JS | React=⚛ (atom, ALL pages).
    React pages: always ⚛, never "React"/"RHF"/"RN"/"FM" text — use the brand symbol.
[ ] Icon fill pattern is correct for the hub:
    - Angular/C#/ASP.NET = SOLID FILL (accent bg, white text). If component SCSS defines
      the icon with `background: $tint; color: $accent;` that is WRONG — fix it to
      `background: $accent; color: #fff;`. Remove any `border:` on solid-fill icons.
    - SQL/TS/React/JS = LIGHT TINT (tint bg, accent text). Do not change these to solid fill.
    - Pages that do NOT define the icon in component SCSS use the global styles.scss — this
      is fine and preferred. Only override in SCSS if the global doesn't cover a special case.
[ ] Inline code inside .page-subtitle always uses light tint:
    `code { background: $tint; color: $accent; }` — NEVER `background: $accent; color: #fff;`
    on inline code (that would render solid red/purple on text).
[ ] .ng-page / .cs-page etc. padding is consistent with other pages in the same hub:
    Check that padding matches the standard: `padding: 2rem 1.25rem 4rem;` for Angular/C#.
    If a component SCSS defines different padding (e.g. 1.5rem), update it to match.
[ ] content-grid gap: .content-grid.has-sidebar must have gap: 2rem in app.scss — zero gap
    puts content and sidebar edge-to-edge with no breathing room.
[ ] Page wrapper class matches hub: ng-page / cs-page / asp-page / sq-page / ts-page /
    react-page / js-page. Never use another hub's wrapper on a page.
[ ] Section class matches hub: ng-section / cs-section / asp-section / sq-section /
    ts-section / react-section / js-section. Never mix.
[ ] SCSS starts with correct $accent and $tint for the hub (see CLAUDE.md theming table).
    Icon SCSS block copied from a page in THE SAME HUB (not from a different hub).
[ ] Component set matches hub type:
    - Standard hubs (Angular/C#/ASP.NET/TS/React/JS): MUST have app-common-mistakes
      AND app-revision-card. Missing either is a gap.
    - SQL hub: must NOT have app-common-mistakes or app-revision-card. Adding them is wrong.
    - Reference pages (cheatsheet/interview-prep/glossary): no app-page-complete, no
      app-revision-card. These are not trackable; don't add page-complete to them.
[ ] Page wrapper padding matches hub standard — must be consistent across ALL pages in the hub:
    - Angular (.ng-page): `padding: 2rem 1.25rem 4rem;` (max-width 860px)
    - C# (.cs-page): `padding: 2rem 1.5rem 4rem;` (max-width 860px)
    - ASP.NET (.asp-page / .aspnet-page): `padding: 2rem 1.5rem 4rem;` (max-width 860px)
    Common wrong values found: `2rem 1.5rem` (no bottom!), `1.5rem 1rem 3rem`, `1.5rem 1.25rem 3rem`.
    Pages with no component SCSS wrapper class inherit from global styles.scss (correct).
    Pages that define the wrapper in component SCSS must match the standard exactly.
[ ] Icon size in component SCSS — no custom sizes:
    Angular ng-icon: 48px (or 3rem) square — NEVER 52px or other values.
    C# cs-icon: `padding: 0.4rem 0.8rem; border-radius: 8px;` (pill shape) — NEVER `width: 56px`.
    ASP.NET asp/aspnet-icon: 48px square — same as Angular.
[ ] Hub nav home link in app.html: is a standalone <a class="nav-home-link"> OUTSIDE any
    nav-group. No hub-name nav-group-label above it.
[ ] tech= in app-page-meta matches hub (angular/csharp/aspnet/sql/typescript/react/javascript).
    Wrong tech= shows the wrong playground button.
[ ] Dark mode: all dark styles use :host-context(body.dark) — zero @media(prefers-color-scheme).
```

### Design consistency — quick grep commands (run before marking a hub complete)

```bash
# Wrong icon class or emoji content
grep -rn "\"sq-icon\"\|\"cs-icon\"\|\"ng-icon\"\|\"ts-icon\"\|\"react-icon\"\|\"js-icon\"\|\"asp-icon\"" \
  src/app/components/<hub>/ --include="*.html" | grep -v "page-header-icon"
# → should return 0 lines (all icons must have BOTH classes)

# Emoji in icon divs
grep -rn "page-header-icon" src/app/components/<hub>/ --include="*.html" | grep -E "⚛|🗄️|🔷|💎"
# → should return 0 lines

# Wrong hub class (e.g. cs-icon on a React page)
grep -rn "cs-icon\|ng-icon\|asp-icon" src/app/components/frontend/react/ --include="*.html"
# → should return 0 lines

# Light-tint icon in solid-fill hub (Angular/C#/ASP.NET) — should be $accent bg not $tint
grep -rn "background.*\$tint" src/app/components/angular/ --include="*.scss" | grep -i "icon"
grep -rn "background.*\$tint" src/app/components/backend/csharp/ --include="*.scss" | grep -i "icon"
grep -rn "background.*\$tint" src/app/components/backend/aspnet/ --include="*.scss" | grep -i "icon"
# → should return 0 lines (icon blocks must use $accent, not $tint for these hubs)

# Wrong .ng-page padding (Angular standard: 2rem 1.25rem 4rem)
grep -rn "\.ng-page" src/app/components/angular/ --include="*.scss" -A5 | grep "padding" | sort | uniq -c
# → all should be "2rem 1.25rem 4rem" — flag any that differ

# Wrong .cs-page padding (C# standard: 2rem 1.5rem 4rem)
grep -rn "\.cs-page" src/app/components/backend/csharp/ --include="*.scss" -A5 | grep "padding" | sort | uniq -c
# → all should be "2rem 1.5rem 4rem"

# Wrong icon size in component SCSS (Angular: 3rem or 48px; C#: no width, only padding)
grep -rn "ng-icon\|cs-icon" src/app/components/ --include="*.scss" -A5 | grep "width:" | grep -v "48px\|3rem"
# → should return 0 lines (52px, 56px etc. are wrong)

# Dark mode violations
grep -rn "@media (prefers-color-scheme" src/app/components/<hub>/ --include="*.scss"
# → should return 0 lines

# SQL pages with wrong components
grep -rn "app-common-mistakes\|app-revision-card" src/app/components/data/sql/ --include="*.html"
# → should return 0 lines (SQL intentionally omits these)
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

- [x] 2026-07-01 — Phase 9 quiz/Q&A depth pass complete across the ENTIRE site (every hub, every page, including reference pages with quiz/qna blocks). Scanned all hubs for quiz<6 or qna<6 and patched every gap found: MongoDB (21 pages, prior session), API Design (19), Messaging (3 pages + fixed a malformed qna entry in azure-service-bus), Web Performance (20), Node.js (23), Python (21), Blazor (21 + bunit quiz fix), AWS (21, quiz+qna), JavaScript (2: patterns, weakrefs), Testing (3 reference pages: cheatsheet, mutation-testing, performance-testing). GraphQL, Redis, Containers, Terraform, DSA, AI, Go, DevOps, Azure, Linux, CSS, HTML, TypeScript, React, SQL, ASP.NET, C#, Angular, all architecture/* sub-hubs, service-mesh, and MongoDB were already at or above the 6/6 threshold — no changes needed. Every hub built, committed, and pushed individually per standing "commit after each hub" instruction. Theory depth / prerequisites / before-after / video-embed / sidebar-entry review remains the outstanding Phase 9 work (see checklist above) — this pass covered quiz and Q&A depth only.

**2026-07-01 — Theory depth scan (grep-based, `heading:` count per file):** 861 pages have a theory block; **451 of them have fewer than 5 sections** (the ≥5-section target). This is the single largest remaining Phase 9 gap — each flagged file needs 1–4 new theory sections written (5+ bullet points each, 2+ sentences with WHY per point), which is a materially bigger content task per file than the quiz/Q&A pass above. Breakdown by hub (files below 5 sections, topic pages only — reference/practice pages like cheatsheet/interview-prep are lower priority and mostly excluded from these counts):
architecture/design-patterns 36, backend/nodejs 23 ✅ DONE, fundamentals/testing 22, fundamentals/ai 22, data/messaging 22, cloud/containers 22, cloud/azure 22, backend/python 21-22, architecture/arch-patterns 22, fundamentals/dsa 21, frontend/blazor 21, data/redis 21, cloud/terraform 21, frontend/css 20, cloud/linux 20, architecture/observability 19, architecture/api-design 19, data/mongodb 18, architecture/system-design 17, architecture/security 17 ✅ DONE, frontend/javascript 15 ✅ DONE, frontend/html 4 ✅ DONE, backend/go 0 (only ref pages), cloud/devops 0 (only ref pages).

**Progress so far: 256/451 files done (57%)** (Node.js 23, Security 17, System Design 17, MongoDB 18, Observability 19, API Design 19, CSS 20, Linux 20, Redis 21, Terraform 21, Blazor 21, JavaScript 15, HTML 4, DSA 21). Each hub built, committed, and pushed individually. Two recurring authoring bugs found and fixed during this pass — noted here so future sessions don't repeat them:
1. **Doubled single-quote `''`** instead of backslash-escaped `\'` when a new theory point contains a possessive/contraction (e.g. "server's", "browser's") — `''` inside a PowerShell here-string becomes literal `''` in the `.ts` file, which is invalid JS string syntax (esbuild error TS1005). Always grep the batch script for `''` and fix to `\'` before running.
2. **Duplicate closing `];`** — the PatchFile/AddTheory helper functions already append `` `n  ];`n`n  <nextProp>... `` after the inserted sections; if the heredoc content ALSO ends with its own `  ];` line (copy-paste habit), the array gets closed twice, which is also a syntax error. Never end a batch script's new-sections heredoc with a `];` line — let the helper function's replacement string supply it.

Continuing hub-by-hub (smallest-gap first), same build→commit→push-per-hub pattern as the quiz/Q&A pass.
- [x] 2026-06-26 — Phase 9 structural audit complete across all 928 pages: fixed JS/React cheatsheet wrong cs-page wrapper, C# csharp/generics/linq old .page wrapper + icon classes, Angular defer-demo + ngrx-signals ng-page wrapper + icon + tech= + revision-card, csharp intro missing revision-card + tech=. Zero dark-mode violations, zero missing revision-cards, zero wrong common-mistakes remaining. Content-quality review (theory depth, quiz spread) is the outstanding Phase 9 work.
- [x] 2026-06-25 — DSA hub Phase 8B complete: all 21 topic pages live. dsaTotal = 21. All 22 cards available: true. Amber accent #92400e, search prefix dsa-, icon DSA, DsaNavComponent. Hero stat updated to 815+.
- [x] 2026-06-25 — AI/ML hub Phase 8C complete: all 22 pages live (19 trackable topics + 3 reference). aiTotal = 19. All 22 cards available: true. Violet accent #7c3aed, search prefix ai-, icon 🤖, AiNavComponent.
- [x] 2026-06-25 — Testing hub Phase 8A complete: all 22 pages live (19 trackable topics + 3 reference). testTotal = 19. All 22 cards available: true. Indigo accent #6366f1, search prefix test-, route /testing-hub, icon ✓, TestingNavComponent.
- [x] 2026-06-25 — Messaging/Kafka hub Phase 7D complete: all 22 pages live (20 trackable topics + monitoring + messaging-security reference). kafkaTotal = 20. hub-home Messaging card topics: 22, available: true. Hero stat updated to 771+. Burnt-orange accent #9a3412, search prefix kafka-, icon ⇄, MessagingNavComponent.
- [x] 2026-06-25 — GraphQL hub Phase 7C complete: all 22 pages live (20 trackable topics + 2 reference). gqlTotal = 20. All 22 cards available: true. Pink accent #e535ab, search prefix gql-, icon ◈, GqlNavComponent.
- [x] 2026-06-25 — Redis hub Phase 7B complete: all 23 pages live (21 trackable topics + 2 reference). redisTotal = 21. All 23 cards available: true. Red accent #dc382d, search prefix redis-, icon R, RedisNavComponent.
- [x] 2026-06-25 — MongoDB hub Phase 7A complete: all 23 pages live (21 trackable topics + 2 reference). mongoTotal = 21. All 23 cards available: true. Green accent #00ed64, search prefix mongo-.
- [x] 2026-06-25 — Observability hub Phase 6F complete: all 22 pages live (20 trackable topics + 2 reference). obsTotal = 20. All 22 cards available: true. Emerald accent #059669, search prefix obs-, ObsNavComponent.
- [x] 2026-06-25 — API Design hub Phase 6E complete: all 21 pages live (19 trackable topics + 2 reference). apiTotal = 19. All 21 cards available: true. Cyan accent #0891b2, search prefix api-, ApiDesignNavComponent.
- [x] 2026-06-25 — Security hub Phase 6D complete: all 25 pages live (23 trackable topics + 2 reference). secTotal = 23. All 25 cards available: true. Red accent #dc2626, search prefix sec-, SecurityNavComponent.
- [x] 2026-06-25 — Design Patterns hub Phase 6C complete: all 39 pages live (36 trackable topics + 3 reference). dpTotal = 36. All 39 cards available: true. Blue accent #0369a1, search prefix dp-, DpNavComponent.
- [x] 2026-06-25 — Architecture Patterns hub Phase 6B complete: all 25 pages live (22 trackable topics + 3 reference). archTotal = 22. All 25 cards available: true. Violet accent #7c3aed, search prefix arch-, ArchNavComponent.
- [x] 2026-06-25 — System Design hub Phase 6A complete: all 26 pages live (24 trackable topics + 2 reference). sysdesignTotal = 24. All 26 cards available: true. Slate accent #0f172a, search prefix sysdesign-, SysdesignNavComponent.
- [x] 2026-06-25 — Service Mesh hub Phase 5G complete: all 21 pages live (19 trackable topics + 2 reference). meshTotal = 19. All 21 cards available: true. Blue accent #466bb0, search prefix mesh-, MeshNavComponent.
- [x] 2026-06-25 — Terraform hub Phase 5F complete: all 23 pages live (21 trackable topics + 2 reference). tfTotal = 21. All 23 cards available: true. Purple accent #7b42bc, search prefix tf-, TerraformNavComponent.
- [x] 2026-06-25 — Containers/K8s hub Phase 5B complete: all 23 pages live (22 trackable topics + 1 reference). k8sTotal = 22. All 23 cards available: true. Blue accent #326ce5, search prefix k8s-, ContainersNavComponent.
- [x] 2026-06-22 — Linux hub Phase 5E complete: all 21 pages live (19 trackable topics + 2 reference). linuxTotal = 19. All 21 cards available: true. Yellow accent #fcc624, search prefix linux-, route /linux. Build passes.
- [x] 2026-06-22 — Azure hub Phase 5D complete: all 23 pages live (22 trackable topics + cheatsheet). azureTotal = 22. hub-home Azure card topics: 23, available: true. Hero stat updated to 505+. Blue accent #0089d6, search prefix azure-. Pages: fundamentals, arm, bicep, virtual-machines, app-service, functions, aks, container-apps, virtual-network, load-balancer, storage, entra-id, rbac, key-vault, sql-cosmos, redis, monitor, devops-pipelines, service-bus, api-management, cost-management, security-defender, cheatsheet.
- [x] 2026-06-21 — DevOps hub Phase 5A complete: all 22 pages live (21 trackable topics + cheatsheet). devopsTotal = 21. All 22 cards available: true. Orange accent #ee5d25, search prefix devops-, route /devops. Build passes.
- [x] 2026-06-21 — AWS hub Phase 5C complete: all 22 pages live (21 trackable topics + cheatsheet). awsTotal = 21. hub-home AWS card topics: 22, available: true. Hero stat updated to 479+. Orange accent #ff9900, search prefix aws-.
- [x] 2026-06-21 — Python hub Phase 4B complete: all 23 pages live (21 trackable topics + cheatsheet + interview-prep). pyTotal = 21. hub-home Python card topics: 23, available: true. Hero stat updated to 450+. Blue accent #3776ab, search prefix py-. py-icon added to styles.scss.
- [x] 2026-06-21 — Node.js hub Phase 4A complete: all 25 pages live (23 trackable topics + cheatsheet + interview-prep). nodeTotal = 23. hub-home Node.js card topics: 25, available: true. Hero stat updated to 425+. Build passes. Green accent #339933, search prefix node-. Icon styles added to styles.scss (go-icon, node-icon, css-icon, blazor-icon).
- [x] 2026-06-21 — Blazor hub Phase 3G complete: all 23 pages live (20 trackable topics + bunit + cheatsheet + interview-prep reference). blazorTotal = 20. hub-home Blazor card topics: 23, available: true. Purple accent #5c2d91, search prefix blazor-, route /blazor. Build passes.
- [x] 2026-06-21 — Go hub Phase 4C complete: all 23 pages live (21 trackable topics + cheatsheet + interview-prep). goTotal = 21. hub-home Go card topics: 23, available: true. Teal accent #00add8, search prefix go-.
- [x] 2026-06-20 — Web Performance hub Phase 3F complete: all 22 pages live (20 trackable topics + cheatsheet + interview-prep). perfTotal = 20. hub-home card topics: 22, available: true. Hero stat updated to 350+. Build passes. Green accent #16a34a, search prefix perf-.
- [x] 2026-06-19 — Web Performance hub Phase 3F wiring complete: routes, nav, progress (perfTotal=20), search (22 perf- entries), breadcrumb, app.scss section-performance, search.ts perf- URL routing. 21 stub components created. First full page: core-web-vitals. Build passes. Green accent #16a34a.
- [x] 2026-06-19 — HTML hub Phase 3D complete: all 25 pages live (23 trackable topics + cheatsheet + interview-prep). htmlTotal = 23. hub-home HTML card topics: 25, available: true. Accent #e34c26, search prefix html-. Build passes.
- [x] 2026-06-19 — CSS hub Phase 3E complete: all 24 pages live (22 trackable topics + cheatsheet + interview-prep). cssTotal = 22. hub-home CSS card topics: 24, available: true. Accent #264de4, search prefix css-. Build passes.
- [x] 2026-06-18 — HTML hub Phase 3D Batch 2: 7 new pages (canvas-svg, performance, pwa-service-workers, seo, apis, cheatsheet, interview-prep). htmlTotal = 20. hub-home HTML card topics: 17, available: true. Build passes. 17 pages live (15 topics + 2 reference), 8 coming soon.
- [x] 2026-06-17 — JavaScript hub Phase 3C complete: all 24 pages live (22 trackable topics + cheatsheet + interview-prep). jsTotal = 22. hub-home JavaScript card topics: 24, available: true. Hero stat updated to 300+. Build passes.
- [x] 2026-06-17 — React hub Phase 3B complete: all 19 pages live (17 trackable topics + cheatsheet + interview-prep). reactTotal = 17. hub-home React card topics: 19, available: true. Hero stat updated to 275+. Build passes.
- [x] 2026-06-17 — TypeScript hub Phase 3A complete: all 22 pages live (20 trackable topics + cheatsheet + interview-prep). tsTotal = 20. hub-home TypeScript card topics: 22, available: true. Hero stat: 250+. Build passes.
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
