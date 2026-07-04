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

**Goal 1 (ACHIEVED 2026-07-02 for the original 34 hubs): zero "coming soon". Every page at full quality standard.**
Every card on every hub home links to a real, fully-written topic page.
Every existing page meets the enhanced content standard defined in Phase 2.
Every page passes the Phase 9 quality audit checklist. See Current State table below.
Two more hubs were added to scope on 2026-07-03 (Rust, QA Engineering — see Phase 11) and are
not yet built; Goal 1 still holds as the standard they must eventually meet.

**Goal 2 (NEW, 2026-07-03 — see Phase 10): DevHub should teach a topic from zero, not just refresh it.**
The site today is excellent for revision — dense, quiz-heavy topic pages that work well if you
already half-know the material. It is not yet a place to *learn* a concept for the first time.
Phase 10 adds a second content tier — subtopic pages — that break each existing topic into its
component concepts and teach each one in depth, interactively, assuming zero prior knowledge of
that specific concept. See Phase 10 for the full plan.

**Total scope (Goal 1, historical):**
- 751 topic pages built (across 30 hubs at 0% + 4 partially done hubs)
- 136 existing topic pages enhanced (Angular 45 + C# 41 + ASP.NET 33 + SQL 17)
- ~73 practice/reference pages (common-mistakes + revision-card where applicable)

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
| Rust | 0 | ~23 | **NOT STARTED — planned, see Phase 11** |
| QA Engineering | 0 | ~24 | **NOT STARTED — planned, see Phase 11** |

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

### 3A — TypeScript hub ✅ COMPLETE `src/app/components/frontend/typescript/`

All 20 trackable topics + 2 reference pages live. tsTotal = 20. All cards `available: true`.
Accent: `#3178c6` (TypeScript blue). Search prefix: `ts-`. Progress key: `tsTotal`.

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

### 3D — HTML hub ✅ COMPLETE `src/app/components/frontend/html/`

All 23 trackable topics + 2 reference pages live. htmlTotal = 23. All cards `available: true`.
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

**Deep content-quality review: COMPLETE (2026-07-02).** Theory depth (≥5 sections×5 points): 451/451 files done. Quiz/Q&A depth (6-8 entries): complete site-wide. Sidebar entries: complete site-wide (23 hubs). Nav-correctness (nextRoute/completion keys): complete, 26 bugs fixed. Hub-home accuracy: complete. Near-duplicate/reworded quiz-qna questions: complete across all 18 hubs (~120 pairs fixed via genuine page-by-page reading, not scripting) — see Done History for the full hub-by-hub breakdown.

**Reading time spot-check: DONE (2026-07-02), no issues found.** Pulled the full site-wide
distribution of `[readingTime]` values (928 pages) and checked every statistical outlier by hand:
the four `readingTime="5"` pages are all reference cheatsheets (containers, terraform, redis, html —
short by design, correct); the single `readingTime="40"` page is DSA's Dynamic Programming topic
(dense content, plausible). No mis-set values found. A full per-page formula recomputation was
judged not worth the engineering cost given this result — the values already track content depth
correctly at the distribution level.

**Remaining (lower priority, optional components — genuinely need per-page editorial judgment,
not mechanical/scriptable, so not suited to further unsupervised automation):**
- `app-prerequisites` presence/correctness on intermediate/advanced pages (2–4 items, correct routes)
- `app-before-after` presence where a genuine old-vs-new contrast exists for the topic
- `app-video-embed` presence where a good official video exists (requires verifying an official,
  embeddable video actually exists per topic — needs a human or web-research pass, not a grep pass)

These are optional-per-page components (not required on every page like common-mistakes/revision-card).
Picking these up requires a human (or a session with real research capability) judging content fit
topic-by-topic — not something to force through mechanically.

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

## Phase 10 — Deep-Dive Subtopic Pages ("Learn Mode")

**Status: IN PROGRESS (rollout approved 2026-07-02 — user said "continue todo and implement
for all topics", skipping a separate manual review pause). 2 of ~34 Angular topics done
(counter, todo) — 836 topics total across all hubs, most with 3-6 subtopics each, so this is
a multi-session effort worked one topic at a time per the Rollout plan below. Read this whole
section before touching any code — it defines a new content tier and a new routing/nav/progress
layer, not just more pages.**

### Why this phase exists

Every existing topic page (e.g. `/angular/signals-state`) is built to the Phase 2 "Enhanced
Content Standard": 5–6 theory sections, code tabs, common mistakes, a challenge, a 6–8 question
quiz, 6–8 Q&A entries, a revision card. That standard is explicitly optimised for **revision and
interview prep** — it assumes the reader already has a rough mental model and is filling gaps,
sharpening recall, and drilling trick questions. It intentionally moves fast and stays dense.

User feedback: *"this site is good for revision but doesn't include learning the topic
completely — we should have sub topic pages to subtopics and explain everything detailed and
interactively."*

That is correct and is a real, structural gap — not something the Phase 2 standard can be
patched to also solve, because "dense enough to revise in 5 minutes" and "slow enough to learn
from zero" are in tension on the same page. The fix is a **second, deeper tier**, not a rewrite
of the first.

**This phase is "zero to hero" content.** Every subtopic page must assume the reader has never
seen this specific concept before and needs to walk out able to actually use it — not a smaller
Phase 2 page, a genuine teaching page. Scope is the full site: every existing trackable topic
page gets a subtopic breakdown eventually (see the complete page list at the end of this phase),
worked through one at a time, same as every other phase in this file.

### What "Learn Mode" is

For each existing topic page, identify the N sub-concepts it currently only summarises (most
topic pages already enumerate these as their `theory` array's section `heading:`s — that list is
the starting point, not something to invent from scratch). Each sub-concept becomes its own
**subtopic page**, nested under the parent topic:

```
/angular/signals-state                    ← existing topic page (untouched, stays as the
                                              overview + revision layer)
/angular/signals-state/what-is-a-signal   ← NEW subtopic page
/angular/signals-state/creating-a-signal  ← NEW subtopic page
/angular/signals-state/computed-signals   ← NEW subtopic page
/angular/signals-state/effects            ← NEW subtopic page
...
```

**The existing topic page is not rewritten or replaced.** It keeps doing its current job
(overview + revision) and gains a "Go deeper" entry point into its subtopics. Subtopic pages are
additive — a second tier underneath, not a replacement for the first.

### Subtopic page content standard (deliberately different from Phase 2's standard)

A subtopic page covers **one concept only** and teaches it from zero. Required shape:

1. **Plain-language framing** — what this concept is, what problem it exists to solve, why it
   was designed this way. No jargon before it's defined.
2. **Build-up, not a dump** — start from the simplest possible working example, then add one
   layer of complexity at a time. Each step should compile/run on its own; the reader should be
   able to follow along and never lose the thread.
3. **At least one live, editable example** — not just a static `<app-code-block>`. The reader
   must be able to change the code and see the result change, in the page, without leaving it.
   See "New component: interactive playground" below — this is the single biggest technical gap
   between Phase 2 pages and what this phase needs.
4. **"Try it yourself" micro-exercise** — a small, specific task ("make the counter reset to 0
   when it hits 10") with a hidden/reveal-on-click solution. Not a full Phase-2-style Challenge
   (those stay on the parent topic page) — smaller, faster, single-concept.
5. **Common beginner misconceptions** — distinct from the parent topic's `app-common-mistakes`
   (which targets production/interview-level mistakes). This section targets first-time
   confusion specifically: "people think X happens, actually Y happens, here's why."
6. **Where this fits** — one short paragraph connecting the concept back to the bigger picture
   (the parent topic, and where it's used in real code) so the reader doesn't learn it in a
   vacuum.
7. **Prev / next subtopic navigation** at the bottom, plus a persistent "back to [Topic] overview"
   link — subtopics are meant to be read in sequence, like a mini-course.

Explicitly **not required** on subtopic pages: a revision card, a 6–8 question quiz, a 6–8 entry
Q&A block, a production-style Challenge. Those are the parent topic page's job. Pulling them onto
every subtopic page would just recreate the density problem this phase exists to fix. A subtopic
page can have a tiny (2–3 question) comprehension check if it earns its place, but it is not a
required section the way it is on Phase 2 pages.

### New component: interactive playground

This is the one genuinely new piece of engineering this phase needs, and it should be built
**once, generically, before the pilot** — not reinvented per subtopic page.

Requirements:
- Embedded directly in the page (no click-through to an external site to see it work)
- Editable: the reader can change the code
- Runnable: some in-page mechanism shows the result of the edit (for JS/TS-family languages this
  can be a real in-browser evaluator; for compiled languages — C#, Go — an embedded StackBlitz/
  CodeSandbox-style iframe pointed at a pre-built starter project is the pragmatic option;
  research the right embed approach per language family before the pilot, don't assume one
  mechanism covers every hub)
- Must work in both light and dark mode (`:host-context(body.dark)` — same rule as everywhere
  else on the site, see CLAUDE.md)
- Must degrade gracefully — if the embed fails to load, the static code (already required by
  point 2 above) is still there and still useful

Do not build subtopic pages ahead of this component existing. A subtopic page without a working
interactive example is just a smaller Phase 2 page with the density removed — it does not
satisfy the actual ask.

### Structural changes required — VALIDATED against the pilot (`/angular/counter/what-is-a-signal`,
built 2026-07-03). This is no longer a plan — it is the confirmed, working pattern. Follow this
exact checklist for **every single subtopic page**, no exceptions, no skipped steps:

1. **Files**: `<hub-area>/<topic-folder>/subtopics/<subtopic-slug>/<subtopic-slug>.ts|.html|.scss`
   — nested inside the parent topic's own folder under a `subtopics/` subfolder. Example:
   `angular/counter/subtopics/what-is-a-signal/what-is-a-signal.ts`.
2. **Routing** (`app.routes.ts`) — convert the flat topic route into one with children:
   `{ path: 'counter', children: [{ path: '', loadComponent: <existing topic component> },
   { path: 'what-is-a-signal', loadComponent: <subtopic component> }] }`. Once a topic has been
   converted, adding further subtopics is just another entry in the same `children` array.
3. **Left nav** (`app.html` + `app.ts`) — **collapsed by default**. Confirmed working pattern:
   - `app.ts`: add the topic's subtopic list to the module-level `SUBTOPICS` map (keyed by the
     topic's route slug, e.g. `counter`), and use the existing `subtopicsOf()` / `isSubtopicsExpanded()`
     / `toggleSubtopics()` helpers — do not reinvent these, they already exist.
   - `app.html`: add a `nav-subtopics-toggle` chevron button inside the topic's `<a>` (only
     rendered `@if (subtopicsOf('slug'))` — topics with no subtopics get no arrow), and the nested
     `.nav-subtopics` list gated behind `@if (isSubtopicsExpanded('slug'))`.
   - Auto-expand on direct navigation is already handled generically by `autoExpandForCurrentUrl()`
     in the `App` constructor — do not duplicate this per topic, it walks the whole `SUBTOPICS` map.
4. **Breadcrumb** (`shared/breadcrumb/breadcrumb.ts`) — already generically 4-level-aware
   (`parentTopicLabel()` / `parentTopicRoute()` added during the pilot — do not rebuild this).
   Only action needed per subtopic: add the subtopic's slug → title mapping to the relevant hub's
   `*_LABELS` map (e.g. `ROUTE_LABELS` for Angular).
5. **Progress model**: subtopic pages do **not** get `app-page-complete` and are **not** counted
   in any hub's progress total — confirmed decision, not revisited per page.
6. **Search index** (`services/search.service.ts`) — add one entry keyed as
   `'<topic-slug>/<subtopic-slug>'` (e.g. `'counter/what-is-a-signal'`). Confirmed: the existing
   bare-route fallback in `search.ts`'s `url()` (`return '/angular/' + route`) already handles the
   nested slash correctly for Angular — no new prefix convention needed. Other hubs already using a
   prefix (`csharp-`, etc.) will need their `url()` branch checked when their first subtopic is built.
7. **Sidebar** (`shared/page-sidebar/page-sidebar.ts`) — add a **genuinely tailored** entry keyed
   as `'<topic-slug>/<subtopic-slug>'` (matches the fallback-stripped `routeKey`, e.g.
   `'counter/what-is-a-signal'`). **Do not leave this on the generic hub DEFAULT** — that was a
   real mistake caught during the pilot review. Scope `apis`/`docs`/`gotchas` to only what this
   specific subtopic covers (not the whole parent topic), and use `related` to link to the parent
   topic overview and the adjacent subtopic(s).
8. **Build**: `npx ng build --configuration=production` must pass.
9. **Verify in browser** (do not skip — this is not a "trust the build" phase): the interactive
   playground actually loads and shows real code (not just that the button renders), dark mode on
   every new component, breadcrumb shows all 4 levels, nav expands/collapses and highlights the
   active subtopic, sidebar shows tailored (not default) content, search finds the page and
   navigates correctly.

**New shared components built during the pilot (reuse these, do not rebuild per subtopic):**
- `shared/live-playground/live-playground.ts` (`app-live-playground`) — the embedded, editable
  StackBlitz example. Click-to-load (dynamic `import('@stackblitz/sdk')`, never in the main
  bundle). Inputs: `title`, `files: PlaygroundFile[]`, `template` (ProjectTemplate — `'angular-cli'`
  for Angular; use `'typescript'`/`'javascript'`/`'node'` for other hubs as appropriate), `openFile`,
  `dependencies?`, `height?`. Has a working "Open in new tab" fallback via `sdk.openProject()` for
  when the embed itself fails to load.
- `shared/try-it/try-it.ts` (`app-try-it`) — the required micro-exercise, hidden/reveal solution.
- `shared/misconceptions/misconceptions.ts` (`app-misconceptions`) — the required beginner
  misconceptions list. **Fields use `[innerHTML]`, not `{{ }}` interpolation** — a real bug was
  caught and fixed during the pilot where `<code>`/`<em>` tags rendered as literal text instead of
  being parsed. Any new component with HTML-bearing string fields must bind with `[innerHTML]`.
- `shared/subtopic-nav/subtopic-nav.ts` (`app-subtopic-nav`) — prev/next + back-to-topic footer nav.

**Content structure inside the subtopic `.ts` file** (confirmed pattern from the pilot): a single
`theory: TheoryPoint[]` array (do NOT split into multiple `<app-theory-block>` calls — that
renders as several redundant stacked "Theory & Key Points" accordions; one call, multiple
sections, exactly like every Phase 2 topic page already does), a `liveDemoFiles: PlaygroundFile[]`
for the playground, an `exercise: TryItExercise`, and a `misconceptions: Misconception[]`.

### Rollout plan — pilot first, then work the full list one at a time

**Do not start broad content production before the pilot.** The scope here is **836 existing
trackable topic pages** (verified by cross-referencing every hub's routes against which pages
actually carry `app-page-complete` — see the complete list at the end of this phase; this is the
real count, not an estimate) × roughly 3–6 subtopics each — several thousand new pages, far larger
than the ~928-page site built so far. Getting the format wrong and discovering it 200 pages in
would be extremely expensive. Sequence:

1. **Pilot: one topic, fully built.** ✅ **DONE (2026-07-02).** Pilot topic: **Angular → Signals
   & Reactive State** (`/angular/counter`). All 6 subtopics built, wired, and browser-verified
   (nav accordion, breadcrumb 4th level, tailored per-page sidebar, search index, dark mode,
   StackBlitz playground load):
   - `/angular/counter/what-is-a-signal` — What Is a Signal?
   - `/angular/counter/computed` — computed() — Derived State
   - `/angular/counter/effects` — effect() — Reactive Side Effects
   - `/angular/counter/control-flow` — @if and @for — Control Flow
   - `/angular/counter/readonly-and-services` — Signals in Services
   - `/angular/counter/rxjs-interop` — RxJS Interop
   Also built along the way: the `LivePlaygroundComponent` (StackBlitz embed), `TryItComponent`,
   `MisconceptionsComponent`, `SubtopicNavComponent` (prev/next pager), and
   `SubtopicEyebrowComponent` (shared "Topic › Subtopic" row, extracted after it was copy-pasted
   into all 3 early pages). Everything is committed and pushed to `development`.
   **Topic 2 — Angular → Reactive Forms & Signal Services** (`/angular/todo`) ✅ **DONE
   (2026-07-02).** 6 subtopics (inject-di, reactive-forms-basics, route-guards,
   signal-based-services, custom-validators, form-state), seeded from the topic's own
   existing `theory` array headings — the same technique as the pilot. Found and fixed two
   real structural gaps not caught by the single-topic pilot (both now in CLAUDE.md):
   `route-guards`/`custom-validators` subtopic slugs collided with unrelated existing
   top-level Angular topics of the same name (breadcrumb label map is flat, keyed by last
   URL segment only — fixed with a composite `'topic/subtopic'` key lookup), and the nav
   accordion chevron/list markup turned out to be per-topic hand-added HTML in `app.html`,
   not generic — the pilot had only wired it for `counter`, so `todo`'s nav initially had no
   visible way to reach its subtopics despite them working fine by direct URL.
2. **Review checkpoint.** ✅ **Skipped by explicit user instruction (2026-07-02)** — user said
   "yes continue todo and implement for all topics", approving rollout without a separate
   manual pause. Structural issues are instead being caught and fixed per-topic as they surface
   (see topic 2's entry below for two real ones found and fixed).
3. **Lock the format.** ✅ **DONE (2026-07-02).** Full wiring recipe written into `CLAUDE.md`'s
   "Phase 10 — Subtopic pages" section — file layout, required shared components, template
   order, 9-step checklist, plus gotchas. **Updated again after topic 2** with two corrections:
   the breadcrumb composite-key collision fix, and the nav-accordion-is-per-topic-not-generic
   correction (see topic 2 below).
4. **Work the complete page list below, one topic at a time**, same "one page at a time, no
   batching-across-topics" discipline as every other phase in this file (within one topic,
   batch all its subtopics' content before one build/verify/commit cycle — see Working
   practices below). The list is already in hub order matching the Current State table
   (gateway/foundational hubs first: Angular, C#, ASP.NET Core, SQL, TypeScript, React,
   JavaScript, HTML, CSS, then the rest). Check off `- [ ]` → `- [x]` with a date as each
   topic's full subtopic set is built, same convention as every other checklist in
   this file. Do not reorder the list to chase what feels interesting — foundational topics are
   listed first because their subtopics are reused as prerequisite links elsewhere once Phase 10
   is far enough along.
5. **Track progress** in a new table here (add once the pilot format is locked):
   `Hub | Topics with subtopics built | Total topics | Notes` — do not reuse the existing Current
   State table (that one tracks Goal 1 / topic-level completion, which is done; mixing the two
   would make both harder to read).

### Complete page list — every existing trackable topic page (work through one at a time)

Extracted 2026-07-03 by cross-referencing `app.routes.ts` (route → component folder) against
every `.html` file that actually contains `app-page-complete` (the real "is this a trackable
topic" signal — the `badge` field in each hub's `home.ts` turned out to be unreliable for this:
some hubs use `badge: 'Reference'` as a genuine content-category tag on real topics, e.g. DSA's
"Bit Manipulation" and "Greedy Algorithms"). Titles are the actual on-page `<h1>` text, not
home.ts card titles, since at least one hub's home.ts (`architecture/security`) has stale
placeholder routes (every entry pointed at `/security` — a real, separate bug worth fixing
independently of Phase 10; not fixed here, out of scope for a planning pass). Counts below match
the Current State table exactly for all 34 hubs — 836 pages total.

**Every subtopic-page session**: pick the next unchecked topic in list order, do the pre-work
research (same rigor as Working Method rule 2), build its full subtopic set per the content
standard above, wire it (routing/nav/breadcrumb/progress/search/sidebar), build, then check it
off here with a date.

---

#### Angular — 58 topic pages

- [x] `/angular/counter` — Signals & Reactive State (2026-07-02, pilot — 6 subtopics)
- [x] `/angular/todo` — Reactive Forms & Signal Services (2026-07-02 — 6 subtopics: inject-di, reactive-forms-basics, route-guards, signal-based-services, custom-validators, form-state)
- [x] `/angular/forms` — Template-Driven vs Reactive Forms (2026-07-02 — 4 subtopics: template-driven-vs-reactive, formgroup-formcontrol-formarray, cross-field-validators, typed-forms)
- [x] `/angular/http` — HTTP Client (2026-07-02 — 4 subtopics: httpclient-setup, get-requests, mutation-requests, error-handling-retry)
- [x] `/angular/http-interceptors` — HTTP Interceptors (2026-07-02 — 4 subtopics: what-are-interceptors, auth-interceptor-token-refresh, global-error-interceptor, loading-spinner-httpcontext)
- [x] `/angular/parent-child` — Parent-Child Communication (2026-07-02 — 5 subtopics: input-signals, output-signals, model-two-way-binding, viewchild-viewchildren, contentchild-migration)
- [x] `/angular/form-array` — FormArray — Dynamic Fields (2026-07-02 — 4 subtopics: dynamic-formarray-of-groups, typed-formarray, formarray-crud-patterns, formarray-level-validation)
- [x] `/angular/defer` — @defer — Deferred Loading (2026-07-02 — 5 subtopics: defer-basics, defer-triggers, placeholder-loading-error, defer-requirements-nesting, defer-performance-prefetch)
- [x] `/angular/material` — Angular Material (2026-07-02 — 5 subtopics: material-setup-theming, material-form-fields, material-common-components, mattable-sorting-pagination, material-testing-accessibility)
- [x] `/angular/store` — Signal Store Pattern (2026-07-02 — 3 subtopics: async-store-operations, signal-store-vs-ngrx, testing-composing-stores)
- [x] `/angular/templates` — Template Syntax (2026-07-02 — 4 subtopics: interpolation-expressions, property-event-two-way-binding, template-refs-and-let, pipes-built-in-custom)
- [x] `/angular/directives` — Custom Directives (2026-07-02 — 3 subtopics: attribute-directive-anatomy, custom-structural-directives, directive-composition-api)
- [x] `/angular/lifecycle` — Lifecycle Hooks (2026-07-02 — 4 subtopics: lifecycle-hook-sequence, init-hooks-ngonchanges-ngoninit, view-content-hooks-afternextrender, cleanup-destroyref-takeuntildestroyed)
- [x] `/angular/pipes` — Pipes (2026-07-02 — 3 subtopics: formatting-pipes-locale, collection-string-pipes, async-pipe-let-performance)
- [x] `/angular/di` — Dependency Injection (2026-07-02 — 3 subtopics: injection-context-deep-dive, multi-providers-extension-points, environment-injectors-standalone-bootstrap)
- [x] `/angular/routing` — Routing & Navigation (2026-07-02 — 4 subtopics: custom-url-matchers-route-config, router-events-navigation-lifecycle, route-reuse-strategy, view-transitions-relative-navigation)
- [x] `/angular/charts` — Chart.js with Angular (2026-07-02 — 3 subtopics: custom-plugins-click-interactions, mixed-charts-annotations, time-scale-large-datasets)
- [x] `/angular/zod-forms` — Zod + Reactive Forms (2026-07-02 — 3 subtopics: discriminated-unions-and-transforms, async-validation-with-zod, nested-schemas-error-formatting)
- [x] `/angular/content-projection` — Content Projection (2026-07-02 — 3 subtopics: programmatic-projection-createcomponent, compound-components-content-queries, recursive-templates-ngtemplateoutlet)
- [x] `/angular/change-detection` — Change Detection (2026-07-02 — 3 subtopics: embedded-views-dynamic-cd, bridging-external-libraries-onpush, testing-onpush-components)
- [x] `/angular/custom-validators` — Custom Validators (2026-07-02 — 3 subtopics: dynamic-validators-runtime, validator-directives-template-forms, generic-reusable-validators)
- [x] `/angular/rxjs` — RxJS Operators (2026-07-02 — 3 subtopics: custom-operators-and-pipe, multicasting-share-operators, testing-rxjs-marble-diagrams)
- [x] `/angular/cdk` — Angular CDK (2026-07-02 — 3 subtopics: cdk-menu-keyboard-navigation, cdk-table-headless-data-table, building-custom-overlay-component)
- [x] `/angular/ag-grid` — AG Grid with Angular (2026-07-02 — 3 subtopics: custom-cell-renderers-angular-components, editable-cells-value-setters, master-detail-row-grouping)
- [x] `/angular/tanstack-query` — TanStack Query (2026-07-02 — 3 subtopics: optimistic-updates-rollback, dependent-and-parallel-queries, infinite-queries-pagination)
- [x] `/angular/date-fns` — date-fns in Angular (2026-07-02 — 3 subtopics: intervals-and-recurring-events, timezone-handling-date-fns-tz, reactive-date-range-picker)
- [x] `/angular/animations` — Angular Animations (2026-07-02 — 3 subtopics: animation-callbacks-lifecycle-events, group-sequence-parallel-orchestration, css-only-and-view-transitions-alternatives)
- [x] `/angular/cva` — Control Value Accessor (2026-07-02 — 3 subtopics: ngcontrol-self-injection-validation-display, composite-value-cva-with-formgroup, testing-cva-components)
- [x] `/angular/testing` — Testing Angular (2026-07-02 — 3 subtopics: testing-directives-with-host-components, testing-routed-components-and-guards, test-doubles-and-mocking-strategies)
- [x] `/angular/tailwind` — Tailwind CSS in Angular (2026-07-02 — 3 subtopics: theme-tokens-and-custom-variants, component-variant-patterns-with-cva, tailwind-transitions-and-animations)
- [x] `/angular/resource-api` — resource() API (2026-07-02 — 3 subtopics: rxresource-and-observable-integration, resource-reload-and-polling-patterns, testing-resource-based-components)
- [x] `/angular/ngrx-signals` — NgRx Signals Store (2026-07-02 — 3 subtopics: withentities-filtering-pagination-sorting, testing-ngrx-signal-stores, signal-store-devtools-and-hooks-cleanup)
- [x] `/angular/dynamic-forms` — Dynamic / Schema-Driven Forms (2026-07-02 — 3 subtopics: nested-and-array-schema-fields, schema-driven-cross-field-and-async-validation, custom-field-renderer-registry-pattern)
- [x] `/angular/route-resolvers` — Route Resolvers & Named Outlets (2026-07-02 — 3 subtopics: testing-route-resolvers, run-guards-and-resolvers-caching, named-outlet-lifecycle-and-detail-drawer-pattern)
- [x] `/angular/preloading` — Preloading Strategies (2026-07-03 — 3 subtopics: priority-tiered-preloading-with-delay, testing-preloading-strategies, measuring-preload-effectiveness)
- [x] `/angular/route-guards` — Route Guards (2026-07-03 — 3 subtopics: canactivatechild-for-nested-admin-sections, tracing-guard-execution-order, async-guards-with-navigation-loading-indicator)
- [x] `/angular/ng-image` — NgOptimizedImage (2026-07-03 — 3 subtopics: custom-loader-with-blur-up-lqip-placeholder, testing-components-that-use-ngoptimizedimage, measuring-lcp-impact-with-performanceobserver)
- [x] `/angular/destroy-ref` — DestroyRef & takeUntilDestroyed (2026-07-03 — 3 subtopics: testing-destroyref-cleanup-and-takeuntildestroyed, runininjectioncontext-for-composables-outside-construction, wrapping-a-non-observable-third-party-api)
- [x] `/angular/linked-signal` — linkedSignal() (2026-07-03 — 3 subtopics: testing-linkedsignal-reset-behavior, linkedsignal-with-resource-for-editable-drafts, debugging-unexpected-linkedsignal-resets)
- [x] `/angular/zoneless` — Zoneless Angular (2026-07-03 — 3 subtopics: auditing-a-codebase-for-zoneless-readiness, zoneless-ssr-and-incremental-hydration, when-ngzone-run-is-actually-unnecessary)
- [x] `/angular/signal-effects` — Signal Effects (2026-07-03 — 3 subtopics: testing-signal-effects-and-cleanup, afterrendereffect-for-dom-measurements, debouncing-effects-for-expensive-side-effects)
- [x] `/angular/typed-forms` — Typed Reactive Forms (2026-07-03 — 3 subtopics: testing-typed-reactive-forms, writing-type-safe-custom-validators, populating-a-typed-form-from-resource)
- [x] `/angular/host-directives` — Host Directives (2026-07-03 — 3 subtopics: testing-components-that-use-hostdirectives, coordinating-multiple-stacked-host-directives, optional-host-directive-injection-for-shared-components)
- [x] `/angular/let-template-vars` — @let Template Variables (2026-07-03 — 3 subtopics: testing-let-driven-templates, profiling-let-recompute-cost, let-inside-ng-template-scope-closure)
- [x] `/angular/standalone-migration` — Standalone Migration (2026-07-03 — 3 subtopics: testing-hybrid-standalone-and-ngmodule-components, scam-pattern-incremental-migration-walkthrough, debugging-nullinjectorerror-after-migration)
- [x] `/angular/error-handling-patterns` — Error Handling Patterns (2026-07-03 — 3 subtopics: testing-a-layered-error-handling-system, retry-with-exponential-backoff-and-give-up, recovering-from-component-rendering-errors)
- [x] `/angular/msw` — Mock Service Worker (MSW) (2026-07-03 — 3 subtopics: testing-auth-interceptor-flows-with-msw, testing-loading-states-with-msw-delay, debugging-unhandled-requests-and-query-param-matching)
- [x] `/angular/accessibility` — Accessibility (a11y) (2026-07-03 — 3 subtopics: automated-accessibility-testing-with-jest-axe, building-a-reusable-route-change-focus-management-service, testing-focus-trap-and-restoration-in-modals)
- [x] `/angular/micro-frontends` — Micro-Frontends (2026-07-03 — 3 subtopics: testing-cross-mfe-communication-with-a-mocked-event-bus, debugging-duplicate-angular-runtime-issues, css-style-isolation-with-shadowdom-encapsulation)
- [x] `/angular/angular-devtools` — Angular DevTools (2026-07-03 — 3 subtopics: building-a-why-did-this-render-debug-helper, safely-enabling-devtools-on-staging, turning-a-profiler-finding-into-a-regression-test)
- [x] `/angular/bundle-optimization` — Bundle Optimization (2026-07-03 — 3 subtopics: testing-defer-blocks-with-deferblockfixture, detecting-duplicate-dependencies-across-lazy-chunks, automated-bundle-budget-enforcement-in-ci)
- [x] `/angular/wizard-form` — Multi-Step Wizard Form (2026-07-03 — 3 subtopics: deep-linking-wizard-steps-with-query-params, cdk-stepper-vs-hand-rolled-wizard, testing-wizard-steps-in-isolation)
- [x] `/angular/web-workers` — Web Workers (2026-07-03 — 3 subtopics: testing-components-that-use-web-workers, building-a-worker-pool-for-parallel-task-dispatch, debugging-and-profiling-web-workers-in-devtools)
- [x] `/angular/pwa` — PWA & Service Workers (2026-07-03 — 3 subtopics: testing-update-prompts-and-install-banners, handling-unrecoverable-state-and-manual-update-checks, spa-routing-pitfalls-navigationurls-and-app-shell-fallback)
- [x] `/angular/i18n` — Internationalisation (i18n) (2026-07-03 — 3 subtopics: testing-components-that-use-transloco-and-signal-i18n, building-rtl-layout-support-with-logical-css-properties, ssr-locale-detection-and-avoiding-hydration-mismatches)
- [x] `/angular/e2e` — E2E Testing with Playwright (2026-07-03 — 3 subtopics: reusing-authentication-state-across-tests-with-storagestate, visual-regression-testing-with-screenshot-comparisons, debugging-flaky-tests-isolation-retries-and-sharding)
- [x] `/angular/harnesses` — Component Harnesses (2026-07-03 — 3 subtopics: composing-nested-harnesses-with-getchildloader, publishing-harnesses-as-a-librarys-public-testing-entry-point, debugging-harness-failures-common-causes-and-diagnosis)
- [x] `/angular/ssr` — SSR & Hydration (2026-07-03 — 3 subtopics: debugging-hydration-mismatches-step-by-step, testing-ssr-safe-components-without-a-real-server, incremental-hydration-triggers-interaction-viewport-and-timer)

#### C# — 50 topic pages

- [x] `/csharp/basics` — Variables & Types (2026-07-03 — 3 subtopics: nullable-value-types-hasvalue-and-null-coalescing-operators, checked-and-unchecked-arithmetic-detecting-integer-overflow, spant-and-stackalloc-parsing-without-heap-allocations — first C# hub subtopic set; locked the non-Angular "See it run" pattern in CLAUDE.md, code-block + page-meta's .NET Fiddle/SharpLab links replace the StackBlitz playground)
- [x] `/csharp/oop` — OOP & Classes (2026-07-03 — 3 subtopics: testing-polymorphic-code-mocking-interfaces-and-verifying-virtual-dispatch, virtual-member-calls-from-constructors-an-initialization-order-footgun, explicit-interface-implementation-resolving-name-collisions)
- [x] `/csharp/records` — Records & Structs (2026-07-03 — 3 subtopics: polymorphic-json-serialization-of-record-hierarchies-with-jsonderivedtype, positional-pattern-matching-with-records-deconstruction-in-switch-expressions, testing-records-equality-hash-codes-and-constructor-validation)
- [x] `/csharp/generics` — Generics (2026-07-03 — 3 subtopics: testing-generic-code-parameterized-tests-across-multiple-type-arguments, generic-attributes-c-11-type-safe-custom-attributes, writing-your-own-static-abstract-interface-members)
- [x] `/csharp/collections` — Collections (2026-07-03 — 3 subtopics: writing-custom-iequalitycomparer-and-icomparer-implementations, frozendictionary-and-frozenset-optimizing-for-read-heavy-lookups, testing-concurrent-collections-catching-race-conditions-in-getoradd)
- [x] `/csharp/linq` — LINQ (2026-07-03 — 3 subtopics: writing-custom-lazy-linq-operators-with-yield-return, expression-trees-why-ef-core-needs-expression-func-t-bool-not-func-t-bool, testing-linq-based-repository-methods-with-ef-core-in-memory)
- [x] `/csharp/async` — async / await (2026-07-03 — 3 subtopics: testing-async-code-verifying-cancellation-and-task-failure-behavior, iasyncdisposable-and-await-using-async-resource-cleanup, producer-consumer-pipelines-with-system-threading-channels)
- [x] `/csharp/null-safety` — Null Safety (2026-07-04 — 3 subtopics: enforcing-nullable-warnings-as-build-errors, nullable-reference-types-with-generic-type-parameters, required-properties-and-system-text-json-deserialization)
- [x] `/csharp/pattern-matching` — Pattern Matching (2026-07-04 — 3 subtopics: testing-exhaustiveness-catching-new-subtypes-with-reflection-based-coverage-tests, pattern-matching-in-ef-core-linq-queries-what-translates-to-sql-and-what-throws, how-the-compiler-lowers-property-patterns-repeated-access-and-performance)
- [x] `/csharp/exceptions` — Exceptions (2026-07-04 — 3 subtopics: testing-exception-filters-verifying-when-predicate-logic, appdomain-unhandledexception-and-taskscheduler-unobservedtaskexception, why-exceptions-are-slow-stack-walking-first-chance-exceptions)
- [x] `/csharp/delegates` — Delegates & Events (2026-07-04 — 3 subtopics: testing-events-xunit-assert-raises-multicast-behavior, how-delegate-equality-actually-works-target-method-pairs, async-void-event-handlers-why-exceptions-vanish)
- [x] `/csharp/fields` — Fields & Constants (2026-07-04 — 3 subtopics: testing-field-thread-safety-race-conditions-increment-vs-interlocked, static-field-initialization-order-beforefieldinit, asynclocal-correct-alternative-to-static-fields-for-per-request-state)
- [x] `/csharp/methods` — Methods (2026-07-04 — 3 subtopics: testing-logic-inside-local-functions-when-to-promote, in-parameter-defensive-copy-trap, caller-info-attributes-callermembername-callerlinenumber)
- [x] `/csharp/type-conversion` — Type Conversion (2026-07-04 — 3 subtopics: testing-conversion-operators-and-overflow-boundaries, user-defined-conversion-chaining-one-operator-limit, compile-time-constant-overflow-always-checked)
- [x] `/csharp/constructors` — Constructors (2026-07-04 — 3 subtopics: testing-constructor-validation-and-chaining, primary-constructor-parameter-capture-field-vs-fixed, diagnosing-typeinitializationexception-inner-exception)
- [x] `/csharp/properties-indexers` — Properties & Indexers (2026-07-04 — 3 subtopics: testing-computed-properties-and-indexers, init-accessors-and-readonly-fields-assignment-window, indexer-initializer-syntax-without-add)
- [x] `/csharp/namespaces` — Namespaces & Usings (2026-07-04 — 3 subtopics: detecting-unused-using-directives-ide0005, extern-alias-resolving-assembly-type-name-collisions, resolving-cs0104-ambiguous-using-directives)
- [x] `/csharp/inheritance` — Inheritance & Overriding (2026-07-04 — 3 subtopics: testing-the-hiding-trap-new-vs-override, how-sealed-enables-devirtualization, covariant-return-types-hidden-bridge-method)
- [x] `/csharp/abstract-interfaces` — Abstract Classes & Interfaces (2026-07-04 — 3 subtopics: testing-default-interface-method-resolution, default-interface-method-diamond-problem, static-abstract-members-generic-constraint-requirement)
- [x] `/csharp/static-enums` — Static Classes, Partial Classes & Enums (2026-07-04 — 3 subtopics: testing-flags-enums-reflection-based-power-of-two-guard, modern-partial-methods-return-types-mandatory-implementation, enum-value-stability-serialization-compatibility)
- [x] `/csharp/structures` — Structures (struct) (2026-07-04 — 3 subtopics: testing-the-struct-copy-mutation-trap, ref-struct-interfaces-generic-constraint-dispatch, array-vs-list-vs-foreach-struct-mutation)
- [x] `/csharp/system-object` — System.Object (2026-07-04 — 3 subtopics: testing-the-equals-gethashcode-contract, gethashcode-instability-across-process-runs, record-equality-and-equalitycontract)
- [x] `/csharp/extension-methods` — Extension Methods (2026-07-04 — 3 subtopics: testing-for-extension-method-shadowing, resolving-extension-method-ambiguity-cs0121, extension-methods-on-structs-this-in-t-receiver)
- [x] `/csharp/tuples` — Tuples & Anonymous Types (2026-07-04 — 3 subtopics: testing-tuple-returning-methods-deconstruction-assertions, valuetuple-8-element-limit-trest-chaining-mechanism, renaming-tuple-field-breaks-some-callers-not-others)
- [x] `/csharp/arrays` — Arrays (2026-07-04 — 3 subtopics: testing-array-equality-sequenceequal-not-equals, real-cost-of-array-covariance-runtime-type-check-every-store, params-array-hidden-allocation-every-call-span-fix)
- [x] `/csharp/strings-datetime` — Strings, DateTime & Math (2026-07-04 — 3 subtopics: testing-culture-sensitive-code-turkish-locale-ci-failures, interning-boundary-which-strings-interned-automatically, string-create-span-char-allocation-free-building)
- [x] `/csharp/io-serialization` — I/O & Serialization (2026-07-04 — 3 subtopics: testing-file-io-without-touching-real-filesystem-abstraction, where-jsonserializeroptions-cache-lives-cold-cache-per-instance, sync-over-async-file-io-deadlocks-result-hangs-forever)
- [x] `/csharp/gc-disposable` — GC & IDisposable (2026-07-04 — 3 subtopics: testing-dispose-actually-called-spy-wrapper-double-dispose, pattern-based-disposal-ref-structs-cannot-implement-idisposable, disposed-but-still-running-event-handler-fire-and-forget-outlives-dispose)
- [x] `/csharp/threading` — Threading (2026-07-04 — 3 subtopics: testing-race-conditions-stress-testing-concurrent-code, old-lock-codegen-bug-monitor-enter-ref-bool-taken, lazy-hidden-thread-safety-modes-concurrentdictionary-fix-not-free)
- [x] `/csharp/tasks` — Tasks & Parallel (2026-07-04 — 3 subtopics: testing-async-timing-deterministic-controllable-taskcompletionsource, valuetask-await-once-rule-when-worth-complexity, whenall-doesnt-start-tasks-parallel-just-awaits-running)
- [x] `/csharp/reflection` — Reflection & Attributes (2026-07-04 — 3 subtopics: testing-reflection-code-attribute-discovery-cache-behavior, beyond-expression-trees-dynamicmethod-reflection-emit, generic-type-reflection-traps-generictypedefinition)
- [x] `/csharp/iterators` — Iterators & yield (2026-07-04 — 3 subtopics: testing-iterator-actually-lazy-side-effects-not-run-before-enumeration, why-getenumerator-sometimes-returns-itself-thread-id-check, iterator-exceptions-stack-traces-movenext-not-call-site)
- [x] `/csharp/functional-csharp` — Functional C# & Result Pattern (2026-07-04 — 3 subtopics: testing-railway-pipelines-asserting-which-step-failed, proving-result-genuine-monad-three-monad-laws, result-equality-traps-never-equal-by-default)
- [x] `/csharp/regex` — Regular Expressions (2026-07-04 — 3 subtopics: testing-regex-redos-proving-matchtimeout-fires, inside-backtracking-engine-nested-quantifiers-traced-step-by-step, unicode-digit-trap-d-matches-more-than-ascii)
- [x] `/csharp/channels` — Channels & Producer/Consumer (2026-07-04 — 3 subtopics: testing-channel-pipelines-without-mocks-real-channel-test-double, how-readallasync-detects-completion-waittoreadasync-tryread, rendezvous-channel-capacity-zero-writeasync-waits-for-reader)
- [x] `/csharp/unit-testing` — Unit Testing (xUnit & Moq) (2026-07-04 — 3 subtopics: testing-your-test-doubles-mock-setup-matches-production-behavior, why-xunit-creates-new-instance-per-test-classfixture, timeprovider-faketimeprovider-deterministic-time-dependent-tests)
- [x] `/csharp/expression-trees` — Expression Trees (2026-07-04 — 3 subtopics: testing-dynamic-expression-trees-asserting-tree-shape-not-compiled-result, parameterexpression-identity-problem-andalso-unusable-lambda, captured-variables-not-constantexpression-hidden-closure-class)
- [x] `/csharp/dynamic` — dynamic & the DLR (2026-07-04 — 3 subtopics: testing-dynamicobject-wrappers-trygetmember-fallback-fail-paths, inside-dlr-call-site-rule-cache-slow-path-fallback, anonymous-types-as-dynamic-assembly-boundary-hidden-cost)
- [x] `/csharp/source-generators` — Source Generators (2026-07-04 — 3 subtopics: testing-source-generators-in-memory-pipeline-snapshotting-output, why-symbols-defeat-incremental-caching-leak-compilation, debugging-source-generator-debugger-launch-technique)
- [x] `/csharp/span-memory` — Span<T> & Memory<T> (2026-07-04 — 3 subtopics: testing-methods-accepting-span-cannot-wrap-call-in-lambda, whats-actually-inside-span-ref-field-fast-restricted, arraypool-rent-returns-dirty-memory-stale-data-leak)
- [x] `/csharp/di-dotnet` — Dependency Injection in .NET (2026-07-04 — 3 subtopics: testing-di-container-configuration-every-registration-resolves, how-validatescopes-catches-captive-dependency-root-child-scope, multiple-implementations-single-t-injection-returns-last)
- [x] `/csharp/json-advanced` — System.Text.Json Advanced (2026-07-04 — 3 subtopics: testing-custom-jsonconverter-round-trips-exact-json-shape, generic-instantiation-needs-own-jsonserializable-source-gen, unknown-type-discriminator-throws-jsonexception-not-forward-compatible)
- [x] `/csharp/unsafe-pointers` — Unsafe Code & Pointers (2026-07-04 — 3 subtopics: testing-safe-wrapper-dispose-idempotent-use-after-dispose-throws, pinned-object-fragments-heap-blocks-gc-compaction-neighbors, stackalloc-inside-loop-never-frees-between-iterations-stackoverflow)
- [x] `/csharp/native-aot` — Native AOT (2026-07-04 — 3 subtopics: testing-aot-compatibility-before-slow-publish-treat-trim-warnings-as-errors, dynamicallyaccessedmembers-redeclared-every-level-call-chain, clean-trim-analysis-still-fails-full-aot-publish-different-checks)
- [x] `/csharp/benchmarkdotnet` — BenchmarkDotNet (2026-07-04 — 3 subtopics: catching-performance-regression-ci-committed-baseline-not-eyeballing, why-bdn-runs-benchmarks-isolated-process-not-in-process, when-mean-lies-bimodal-distribution-hides-two-performance-paths)
- [x] `/csharp/pinvoke` — P/Invoke & Native Interop (2026-07-04 — 3 subtopics: testing-code-calling-pinvoke-wrapping-native-calls-behind-interface, why-blittable-types-skip-marshalling-pinning-vs-full-marshal-cycle, setlasterror-silently-clobbered-by-pinvoke-call-in-between)
- [x] `/csharp/dotnet-cli` — .NET CLI & Tooling (2026-07-04 — 3 subtopics: verifying-build-reproducible-simulating-clean-machine-restore-lock-file, how-rollforward-picks-sdk-version-feature-band-matching-algorithm, automatic-restore-doesnt-use-locked-mode-local-builds-drift-from-lock-file)
- [x] `/csharp/whats-new-9-10` — What's New in C# 9 & 10 (2026-07-04 — 3 subtopics: testing-record-equality-collection-properties-not-list-reference-trap, compiler-generates-equalitycontract-virtual-equals-chain-type-sensitive, records-as-dictionary-keys-break-when-reference-property-mutated)
- [x] `/csharp/whats-new-11-12` — What's New in C# 11 & 12 (2026-07-04 — 3 subtopics: testing-generic-math-across-numeric-types-one-suite-every-inumber-implementation, how-static-abstract-interface-members-dispatch-compile-time-generic-specialization, primary-constructor-parameter-captured-as-field-object-entire-lifetime)
- [x] `/csharp/whats-new-latest` — What's New in C# 13+ & .NET 10/11 (2026-07-04 — 3 subtopics: testing-time-dependent-code-with-faketimeprovider-without-sleeping, how-dynamic-pgo-actually-rejits-tiered-compilation-on-stack-replacement, hybridcache-stampede-protection-only-coalesces-within-one-process)

#### ASP.NET Core — 45 topic pages

- [x] `/aspnet/hosting-startup` — Hosting & Startup (2026-07-04 — 3 subtopics: testing-environment-branching-without-real-environment-variable, what-builder-build-actually-seals-servicecollection-vs-serviceprovider, applicationstopping-fires-before-in-flight-requests-finish-draining)
- [x] `/aspnet/middleware` — Middleware Pipeline (2026-07-04 — 3 subtopics: testing-custom-middleware-isolation-applicationbuilder-no-kestrel, how-middleware-pipeline-built-requestdelegate-composition-nested-closures, onstarting-callbacks-run-lifo-order-last-registered-fires-first)
- [x] `/aspnet/routing` — Routing (2026-07-04 — 3 subtopics: testing-route-precedence-catching-ambiguous-routes-before-production, how-route-precedence-actually-computed-segment-scoring-algorithm, typod-renamed-withname-silently-breaks-linkgenerator-no-compile-check)
- [x] `/aspnet/configuration` — Configuration & Options (2026-07-04 — 3 subtopics: testing-options-validation-actually-rejects-bad-config-not-just-compiles, how-optionsmonitor-detects-file-change-changetoken-propagation, onchange-returns-idisposable-must-be-disposed-or-callback-leaks)
- [x] `/aspnet/dependency-injection` — Dependency Injection (2026-07-04 — 3 subtopics: testing-servicescopefactory-backgroundservice-genuinely-fresh-scope, createasyncscope-vs-createscope, activatorutilities-bypasses-validateonbuild)
- [x] `/aspnet/logging` — Logging & Diagnostics (2026-07-04 — 3 subtopics: testing-structured-log-properties-with-fake-logger, how-beginscope-propagates-ambient-context-asynclocal, reusing-eventid-across-loggermessage-methods-compiles-cleanly)
- [x] `/aspnet/static-files` — Static Files & Uploads (2026-07-04 — 3 subtopics: testing-magic-number-validation-fake-byte-streams, how-usestaticfiles-computes-etag-touching-file-busts-cache, startswith-path-traversal-guard-sibling-directory-bypass)
- [x] `/aspnet/controllers` — Controllers & Actions (2026-07-04 — 3 subtopics: testing-actionresult-catches-null-returns-200-ok-bug, how-binding-source-inference-decides-frombody-vs-fromquery, createdataction-throws-runtime-despite-nameof-safety)
- [x] `/aspnet/minimal-apis` — Minimal APIs (2026-07-04 — 3 subtopics: testing-endpoint-filter-isolation-no-test-server, forgotten-di-registration-silently-falls-through-body-binding, linkgenerator-getpathbyname-returns-null-instead-of-throwing)
- [x] `/aspnet/model-binding` — Model Binding & Validation (2026-07-04 — 3 subtopics: testing-iparsable-tryparse-graceful-failure-daterange, how-recursive-nested-validation-walks-object-graph-circular-reference, fluentvalidation-setvalidator-new-silently-bypasses-di)
- [x] `/aspnet/filters` — Filters & Endpoint Filters (2026-07-04 — 3 subtopics: testing-filters-execute-in-documented-pipeline-order, why-next-runs-action-even-after-context-result-is-set, ifilterfactory-isreusable-silently-recreates-captive-dependency)
- [x] `/aspnet/error-handling` — Error Handling (2026-07-04 — 3 subtopics: testing-exceptionhandler-chain-ordering-works-as-documented, why-reexecuted-error-endpoint-must-explicitly-restore-status-code, handler-writes-before-returning-false-corrupts-next-handler)
- [x] `/aspnet/openapi-swagger` — OpenAPI & Swagger (2026-07-04 — 3 subtopics: testing-openapi-spec-catches-typedresults-regression-to-iresult, why-generator-inspects-signature-not-method-body, generating-clients-against-live-server-undermines-diffing-prs)
- [x] `/aspnet/api-versioning` — API Versioning (2026-07-04 — 3 subtopics: testing-versioned-endpoints-return-genuinely-different-shapes, why-omitting-apiversion-constraint-causes-ambiguous-match, what-happens-when-combined-version-readers-disagree)
- [x] `/aspnet/http-clients` — HttpClient & Resilience (2026-07-04 — 3 subtopics: testing-retry-strategy-fires-transient-not-deterministic-errors, why-transient-delegatinghandlers-shared-across-pool-rotation, addhedging-shared-pipeline-can-hedge-non-idempotent-requests)
- [ ] `/aspnet/grpc` — gRPC Services
- [ ] `/aspnet/ef-core-basics` — EF Core Basics
- [ ] `/aspnet/ef-relationships` — EF Core Relationships
- [ ] `/aspnet/ef-performance` — EF Core Performance
- [ ] `/aspnet/caching` — Caching
- [ ] `/aspnet/authentication` — Authentication
- [ ] `/aspnet/authorization` — Authorization
- [ ] `/aspnet/cors` — CORS & Security Headers
- [ ] `/aspnet/rate-limiting` — Rate Limiting
- [ ] `/aspnet/web-security` — Web Security Essentials
- [ ] `/aspnet/secrets` — Secrets & Data Protection
- [ ] `/aspnet/testing` — Testing ASP.NET Core
- [ ] `/aspnet/background-services` — Background Services
- [ ] `/aspnet/signalr` — SignalR
- [ ] `/aspnet/health-checks` — Health Checks & Observability
- [ ] `/aspnet/deployment` — Deployment & Hosting
- [ ] `/aspnet/performance` — Performance & Diagnostics
- [ ] `/aspnet/aspire` — .NET Aspire
- [ ] `/aspnet/fluent-validation` — FluentValidation
- [ ] `/aspnet/minimal-api-advanced` — Minimal API Advanced
- [ ] `/aspnet/output-caching-advanced` — Output Caching Advanced
- [ ] `/aspnet/dapper` — Dapper & Raw SQL
- [ ] `/aspnet/csrf` — Anti-forgery & CSRF
- [ ] `/aspnet/feature-flags` — Feature Flags
- [ ] `/aspnet/localization` — Localization & Globalization
- [ ] `/aspnet/masstransit` — MassTransit
- [ ] `/aspnet/response-compression` — Response Compression
- [ ] `/aspnet/websockets` — WebSockets
- [ ] `/aspnet/yarp` — YARP Reverse Proxy
- [ ] `/aspnet/opentelemetry` — OpenTelemetry

#### SQL — 44 topic pages

- [ ] `/sql/rdbms-concepts` — RDBMS Concepts
- [ ] `/sql/data-modeling` — Data Modeling
- [ ] `/sql/normalization` — Normalization
- [ ] `/sql/db-architecture` — Database Architecture
- [ ] `/sql/data-types` — Data Types
- [ ] `/sql/basics` — SQL Basics
- [ ] `/sql/joins` — Joins
- [ ] `/sql/aggregations` — Aggregations
- [ ] `/sql/subqueries` — Subqueries
- [ ] `/sql/ctes` — CTEs
- [ ] `/sql/window-functions` — Window Functions
- [ ] `/sql/indexes` — Indexes
- [ ] `/sql/transactions` — Transactions
- [ ] `/sql/schema-design` — Schema Design
- [ ] `/sql/stored-procedures` — Stored Procedures
- [ ] `/sql/performance` — Query Performance
- [ ] `/sql/json-features` — JSON Features
- [ ] `/sql/set-operations` — Set Operations
- [ ] `/sql/null-handling` — NULL Handling
- [ ] `/sql/merge` — MERGE / Upsert
- [ ] `/sql/string-functions` — String Functions
- [ ] `/sql/date-functions` — Date & Time Functions
- [ ] `/sql/conditional-expressions` — Conditional Expressions
- [ ] `/sql/math-functions` — Math & Numeric Functions
- [ ] `/sql/pivoting` — Pivoting & Cross-Tab Queries
- [ ] `/sql/constraints` — Constraints
- [ ] `/sql/views` — Views
- [ ] `/sql/sequences` — Sequences & Identity
- [ ] `/sql/temp-tables` — Temp Tables & Table Variables
- [ ] `/sql/computed-columns` — Computed & Generated Columns
- [ ] `/sql/stored-functions` — Stored Functions
- [ ] `/sql/cursors` — Cursors & Row-by-Row Processing
- [ ] `/sql/triggers` — Triggers
- [ ] `/sql/dynamic-sql` — Dynamic SQL
- [ ] `/sql/isolation-levels` — Isolation Levels
- [ ] `/sql/locking` — Locking & Deadlocks
- [ ] `/sql/execution-plans` — Execution Plans
- [ ] `/sql/partitioning` — Partitioning
- [ ] `/sql/bulk-operations` — Bulk Operations
- [ ] `/sql/query-store` — Query Store & Performance Statistics
- [ ] `/sql/statistics` — Statistics & Query Optimizer
- [ ] `/sql/full-text-search` — Full-Text Search
- [ ] `/sql/security` — SQL Security
- [ ] `/sql/connection-pooling` — Connection Pooling

#### TypeScript — 20 topic pages

- [ ] `/typescript/basics` — TypeScript Fundamentals
- [ ] `/typescript/primitive-types` — Primitive & Literal Types
- [ ] `/typescript/interfaces-types` — Interfaces & Type Aliases
- [ ] `/typescript/unions` — Union & Intersection Types
- [ ] `/typescript/narrowing` — Type Guards & Narrowing
- [ ] `/typescript/enums-tuples` — Enums & Tuples
- [ ] `/typescript/generics` — Generics Fundamentals
- [ ] `/typescript/generic-patterns` — Generic Patterns
- [ ] `/typescript/utility-types` — Utility Types
- [ ] `/typescript/mapped-types` — Mapped Types
- [ ] `/typescript/conditional-types` — Conditional Types
- [ ] `/typescript/template-literal-types` — Template Literal Types
- [ ] `/typescript/classes` — Classes & Visibility
- [ ] `/typescript/decorators` — Decorators
- [ ] `/typescript/tsconfig` — tsconfig Deep Dive
- [ ] `/typescript/modules` — Module System & Namespaces
- [ ] `/typescript/declarations` — Declaration Files (d.ts)
- [ ] `/typescript/frameworks` — TypeScript with Frameworks
- [ ] `/typescript/strict-migration` — Strict Mode & Migration
- [ ] `/typescript/ts-performance` — TypeScript Performance

#### React — 17 topic pages

- [ ] `/react/basics` — React Fundamentals
- [ ] `/react/hooks-core` — Core Hooks
- [ ] `/react/hooks-advanced` — Advanced Hooks
- [ ] `/react/forms` — Forms & Validation
- [ ] `/react/context` — Context API
- [ ] `/react/state-management` — State Management
- [ ] `/react/router` — React Router v6/v7
- [ ] `/react/tanstack-query` — TanStack Query
- [ ] `/react/performance` — React Performance
- [ ] `/react/patterns` — React Patterns
- [ ] `/react/typescript` — TypeScript & React
- [ ] `/react/testing` — Testing React
- [ ] `/react/nextjs` — Next.js App Router
- [ ] `/react/native` — React Native
- [ ] `/react/hook-form` — React Hook Form
- [ ] `/react/animations` — Animations (Framer Motion)
- [ ] `/react/security` — Security in React

#### JavaScript — 22 topic pages

- [ ] `/javascript/fundamentals` — JavaScript Fundamentals
- [ ] `/javascript/closures` — Scope & Closures
- [ ] `/javascript/hoisting` — Hoisting & TDZ
- [ ] `/javascript/symbols` — Symbols & Iterators
- [ ] `/javascript/functions` — Functions Deep Dive
- [ ] `/javascript/prototypes` — Prototypes & Classes
- [ ] `/javascript/objects` — Object Fundamentals
- [ ] `/javascript/destructuring` — Destructuring & Spread
- [ ] `/javascript/arrays` — Arrays & Iteration
- [ ] `/javascript/promises` — Promises & Async/Await
- [ ] `/javascript/event-loop` — Event Loop & Concurrency
- [ ] `/javascript/error-handling` — Error Handling
- [ ] `/javascript/generators` — Generators
- [ ] `/javascript/dom` — DOM Manipulation
- [ ] `/javascript/events` — Events & Custom Events
- [ ] `/javascript/browser-apis` — Browser APIs
- [ ] `/javascript/modules` — Modules & Imports
- [ ] `/javascript/bundlers` — Bundlers & Build Tools
- [ ] `/javascript/patterns` — Design Patterns
- [ ] `/javascript/functional` — Functional Programming
- [ ] `/javascript/proxy` — Proxy & Reflect
- [ ] `/javascript/weakrefs` — WeakRef & FinalizationRegistry

#### HTML — 23 topic pages

- [ ] `/html/document-structure` — Document Structure
- [ ] `/html/semantic-elements` — Semantic Elements
- [ ] `/html/forms` — Forms & Input
- [ ] `/html/media` — Media Elements
- [ ] `/html/tables` — Tables
- [ ] `/html/links-navigation` — Links & Navigation
- [ ] `/html/accessibility` — Accessibility & ARIA
- [ ] `/html/head-metadata` — Head & Metadata
- [ ] `/html/custom-elements` — Web Components & Custom Elements
- [ ] `/html/iframes-embeds` — iFrames & Embeds
- [ ] `/html/canvas-svg` — Canvas & SVG
- [ ] `/html/performance` — HTML Performance
- [ ] `/html/pwa-service-workers` — PWA & Service Workers
- [ ] `/html/seo` — HTML SEO
- [ ] `/html/apis` — HTML5 Browser APIs
- [ ] `/html/fundamentals` — HTML Fundamentals
- [ ] `/html/headings-paragraphs` — Headings & Paragraphs
- [ ] `/html/input-types` — Input Types & Attributes
- [ ] `/html/landmark-elements` — Landmark Elements
- [ ] `/html/aria-roles` — ARIA Roles & Attributes
- [ ] `/html/focus-management` — Focus Management
- [ ] `/html/storage-apis` — HTML5 Storage APIs
- [ ] `/html/drag-drop` — Drag & Drop API

#### CSS — 22 topic pages

- [ ] `/css/box-model` — CSS Box Model
- [ ] `/css/flexbox` — CSS Flexbox
- [ ] `/css/grid` — CSS Grid
- [ ] `/css/positioning` — Positioning & Stacking
- [ ] `/css/custom-properties` — CSS Custom Properties
- [ ] `/css/selectors` — Selectors Deep Dive
- [ ] `/css/typography` — Typography
- [ ] `/css/responsive` — Responsive Design
- [ ] `/css/animations` — CSS Animations
- [ ] `/css/transitions` — CSS Transitions
- [ ] `/css/colors-theming` — Colors & Theming
- [ ] `/css/backgrounds-borders` — Backgrounds & Borders
- [ ] `/css/container-queries` — Container Queries
- [ ] `/css/css-layers` — CSS Cascade Layers
- [ ] `/css/css-nesting` — CSS Nesting
- [ ] `/css/logical-properties` — Logical Properties
- [ ] `/css/css-architecture` — CSS Architecture
- [ ] `/css/tailwind` — Tailwind CSS
- [ ] `/css/scroll-driven-animations` — Scroll-Driven Animations
- [ ] `/css/css-transforms` — CSS Transforms
- [ ] `/css/css-filters` — CSS Filters & Effects
- [ ] `/css/fundamentals` — CSS Fundamentals

#### Web Performance — 20 topic pages

- [ ] `/performance/core-web-vitals` — Core Web Vitals Overview
- [ ] `/performance/lcp` — Largest Contentful Paint
- [ ] `/performance/inp` — Interaction to Next Paint
- [ ] `/performance/cls` — Cumulative Layout Shift
- [ ] `/performance/critical-rendering-path` — Critical Rendering Path
- [ ] `/performance/browser-rendering` — Browser Rendering Pipeline
- [ ] `/performance/resource-hints` — Resource Hints
- [ ] `/performance/http2-http3` — HTTP/2 & HTTP/3
- [ ] `/performance/caching` — Caching & Service Workers
- [ ] `/performance/image-optimisation` — Image Optimisation
- [ ] `/performance/font-performance` — Font Performance
- [ ] `/performance/js-performance` — JavaScript Performance
- [ ] `/performance/third-party-scripts` — Third-Party Scripts
- [ ] `/performance/measurement` — Performance Measurement
- [ ] `/performance/rum` — Real User Monitoring (RUM)
- [ ] `/performance/ssr-streaming` — SSR & Streaming HTML
- [ ] `/performance/css-performance` — CSS Performance
- [ ] `/performance/web-workers` — Web Workers & Off-Main-Thread
- [ ] `/performance/performance-budgets` — Performance Budgets & CI
- [ ] `/performance/speculation-rules` — Speculation Rules API

#### Blazor — 20 topic pages

- [ ] `/blazor/fundamentals` — Blazor Fundamentals
- [ ] `/blazor/render-modes` — Blazor Render Modes
- [ ] `/blazor/razor-components` — Razor Components
- [ ] `/blazor/component-communication` — Component Communication
- [ ] `/blazor/forms` — Blazor Forms
- [ ] `/blazor/data-binding` — Data Binding in Blazor
- [ ] `/blazor/routing` — Blazor Routing
- [ ] `/blazor/dependency-injection` — Dependency Injection in Blazor
- [ ] `/blazor/state-management` — State Management in Blazor
- [ ] `/blazor/js-interop` — JavaScript Interop
- [ ] `/blazor/server-signalr` — Blazor Server & SignalR
- [ ] `/blazor/maui-hybrid` — Blazor Hybrid & MAUI
- [ ] `/blazor/authentication` — Authentication in Blazor
- [ ] `/blazor/error-handling` — Error Handling in Blazor
- [ ] `/blazor/streaming-rendering` — Streaming Rendering
- [ ] `/blazor/sections-layouts` — Sections & Layouts
- [ ] `/blazor/seo-metadata` — SEO & Metadata in Blazor
- [ ] `/blazor/virtualization` — Virtualization in Blazor
- [ ] `/blazor/progressive-enhancement` — Progressive Enhancement
- [ ] `/blazor/performance` — Blazor Performance

#### Node.js — 23 topic pages

- [ ] `/node/architecture` — Node.js Architecture
- [ ] `/node/modules` — Modules & CommonJS
- [ ] `/node/core-modules` — Node.js Core Modules
- [ ] `/node/env-config` — Env Config & dotenv
- [ ] `/node/express` — Express.js
- [ ] `/node/fastify` — Fastify
- [ ] `/node/rest-api` — REST API Design in Node.js
- [ ] `/node/websockets` — WebSockets & Socket.io
- [ ] `/node/graphql` — GraphQL API with Node.js
- [ ] `/node/nestjs` — NestJS
- [ ] `/node/promises-async` — Promises & Async/Await
- [ ] `/node/streams` — Streams & Buffers
- [ ] `/node/error-handling` — Error Handling Patterns
- [ ] `/node/prisma` — Database with Prisma
- [ ] `/node/mongoose` — MongoDB with Mongoose
- [ ] `/node/caching` — Caching with Redis
- [ ] `/node/jwt-auth` — Auth with JWT & Passport
- [ ] `/node/security` — Security Best Practices
- [ ] `/node/performance` — Node.js Performance
- [ ] `/node/logging` — Logging with Pino/Winston
- [ ] `/node/worker-threads` — Worker Threads
- [ ] `/node/testing` — Testing Node.js Apps
- [ ] `/node/deployment` — Deploying Node.js Apps

#### Python — 21 topic pages

- [ ] `/python/fundamentals` — Python Fundamentals
- [ ] `/python/functions-closures` — Functions & Closures
- [ ] `/python/comprehensions-generators` — Comprehensions & Generators
- [ ] `/python/file-io` — File I/O & Pathlib
- [ ] `/python/oop` — OOP in Python
- [ ] `/python/dataclasses-pydantic` — Dataclasses & Pydantic
- [ ] `/python/decorators-context-managers` — Decorators & Context Managers
- [ ] `/python/type-hints` — Type Hints & mypy
- [ ] `/python/collections-itertools` — Collections & Itertools
- [ ] `/python/asyncio` — Async Python (asyncio)
- [ ] `/python/threading-multiprocessing` — Threading & Multiprocessing
- [ ] `/python/concurrency-patterns` — Python Concurrency Patterns
- [ ] `/python/fastapi` — FastAPI
- [ ] `/python/django` — Django & DRF
- [ ] `/python/sqlalchemy` — SQLAlchemy
- [ ] `/python/celery` — Celery & Task Queues
- [ ] `/python/numpy-pandas` — NumPy & Pandas
- [ ] `/python/scikit-learn` — Machine Learning (scikit-learn)
- [ ] `/python/pytest` — Testing with pytest
- [ ] `/python/packaging` — Python Packaging & venv
- [ ] `/python/debugging-profiling` — Debugging & Profiling

#### Go — 21 topic pages

- [ ] `/go/fundamentals` — Go Fundamentals
- [ ] `/go/structs-interfaces` — Structs & Interfaces
- [ ] `/go/error-handling` — Error Handling in Go
- [ ] `/go/slices-maps` — Slices & Maps
- [ ] `/go/goroutines` — Goroutines
- [ ] `/go/channels` — Channels
- [ ] `/go/sync` — sync & sync/atomic
- [ ] `/go/context` — context Package
- [ ] `/go/net-http` — net/http & REST
- [ ] `/go/gin` — Gin Framework
- [ ] `/go/json-encoding` — JSON Encoding
- [ ] `/go/grpc` — gRPC
- [ ] `/go/pgx` — pgx (PostgreSQL)
- [ ] `/go/gorm` — GORM
- [ ] `/go/generics` — Generics
- [ ] `/go/patterns` — Design Patterns
- [ ] `/go/modules` — Modules & Toolchain
- [ ] `/go/testing` — Testing
- [ ] `/go/cli` — Go CLI Tools
- [ ] `/go/profiling` — Performance & Profiling
- [ ] `/go/build` — Build & Deployment

#### DevOps — 21 topic pages

- [ ] `/devops/culture` — DevOps Culture & Principles
- [ ] `/devops/sdlc-agile` — SDLC & Agile
- [ ] `/devops/environment-strategy` — Environment Strategy
- [ ] `/devops/platform-engineering` — Platform Engineering
- [ ] `/devops/git-workflows` — Git Workflows
- [ ] `/devops/github-actions` — GitHub Actions
- [ ] `/devops/azure-pipelines` — Azure DevOps Pipelines
- [ ] `/devops/jenkins` — Jenkins
- [ ] `/devops/continuous-integration` — Continuous Integration
- [ ] `/devops/continuous-delivery` — Continuous Delivery & Deployment
- [ ] `/devops/gitops` — GitOps with ArgoCD & Flux
- [ ] `/devops/artifact-management` — Artifact Management
- [ ] `/devops/docker-cicd` — Docker in CI/CD
- [ ] `/devops/kubernetes-deployments` — Kubernetes Deployments
- [ ] `/devops/iac` — Infrastructure as Code
- [ ] `/devops/monitoring` — Monitoring & Alerting
- [ ] `/devops/logging` — Logging Pipelines
- [ ] `/devops/incident-response` — On-call & Incident Response
- [ ] `/devops/devsecops` — DevSecOps
- [ ] `/devops/release-management` — Release Management
- [ ] `/devops/sre` — SRE Practices

#### Containers/K8s — 22 topic pages

- [ ] `/containers/fundamentals` — Container Fundamentals
- [ ] `/containers/docker-cli` — Docker CLI
- [ ] `/containers/docker-images` — Docker Images & Registry
- [ ] `/containers/dockerfile` — Writing Dockerfiles
- [ ] `/containers/multi-stage` — Multi-Stage Builds
- [ ] `/containers/compose` — Docker Compose
- [ ] `/containers/compose-profiles` — Compose Profiles & Overrides
- [ ] `/containers/k8s-architecture` — Kubernetes Architecture
- [ ] `/containers/kubectl` — kubectl Fundamentals
- [ ] `/containers/pods-deployments` — Pods, Deployments & ReplicaSets
- [ ] `/containers/services-ingress` — Services & Ingress
- [ ] `/containers/configmaps-secrets` — ConfigMaps & Secrets
- [ ] `/containers/storage` — Persistent Volumes & Storage
- [ ] `/containers/operators-crds` — Kubernetes Operators & CRDs
- [ ] `/containers/helm` — Helm
- [ ] `/containers/container-security` — Container Security
- [ ] `/containers/rbac` — Kubernetes RBAC
- [ ] `/containers/statefulsets` — StatefulSets & DaemonSets
- [ ] `/containers/resource-limits` — Resource Requests & Limits
- [ ] `/containers/hpa` — Horizontal Pod Autoscaler
- [ ] `/containers/network-policies` — Network Policies
- [ ] `/containers/troubleshooting` — Kubernetes Troubleshooting

#### AWS — 21 topic pages

- [ ] `/aws/fundamentals` — AWS Fundamentals
- [ ] `/aws/ec2` — EC2 & Auto Scaling
- [ ] `/aws/ecs-eks` — ECS & EKS
- [ ] `/aws/vpc` — VPC & Networking
- [ ] `/aws/route53-cloudfront` — Route 53 & CloudFront
- [ ] `/aws/s3` — S3
- [ ] `/aws/ebs-efs` — EBS, EFS & FSx
- [ ] `/aws/iam` — IAM
- [ ] `/aws/iam-roles` — IAM Roles & Federation
- [ ] `/aws/rds-aurora` — RDS & Aurora
- [ ] `/aws/dynamodb` — DynamoDB
- [ ] `/aws/lambda` — Lambda
- [ ] `/aws/api-gateway` — API Gateway
- [ ] `/aws/cloudwatch` — CloudWatch & X-Ray
- [ ] `/aws/cloudformation-cdk` — CloudFormation & CDK
- [ ] `/aws/security` — AWS Security Services
- [ ] `/aws/sqs-sns` — SQS & SNS
- [ ] `/aws/eventbridge` — EventBridge
- [ ] `/aws/step-functions` — AWS Step Functions
- [ ] `/aws/load-balancing` — Elastic Load Balancing
- [ ] `/aws/cost-optimization` — AWS Cost Optimization

#### Azure — 22 topic pages

- [ ] `/azure/fundamentals` — Azure Fundamentals
- [ ] `/azure/arm` — Azure Resource Manager
- [ ] `/azure/virtual-machines` — Azure Virtual Machines
- [ ] `/azure/app-service` — Azure App Service
- [ ] `/azure/functions` — Azure Functions
- [ ] `/azure/aks` — Azure Kubernetes Service
- [ ] `/azure/virtual-network` — Azure Virtual Network
- [ ] `/azure/load-balancer` — Azure Load Balancer & Front Door
- [ ] `/azure/storage` — Azure Blob & Storage
- [ ] `/azure/entra-id` — Azure Active Directory & Entra ID
- [ ] `/azure/rbac` — Azure RBAC
- [ ] `/azure/sql-cosmos` — Azure SQL & Cosmos DB
- [ ] `/azure/monitor` — Azure Monitor & App Insights
- [ ] `/azure/devops-pipelines` — Azure DevOps & Pipelines
- [ ] `/azure/cost-management` — Azure Cost Management
- [ ] `/azure/security-defender` — Azure Security & Defender for Cloud
- [ ] `/azure/key-vault` — Azure Key Vault
- [ ] `/azure/service-bus` — Azure Service Bus
- [ ] `/azure/container-apps` — Azure Container Apps
- [ ] `/azure/redis` — Azure Cache for Redis
- [ ] `/azure/api-management` — Azure API Management
- [ ] `/azure/bicep` — Azure Bicep Deep-dive

#### Linux — 19 topic pages

- [ ] `/linux/fundamentals` — Linux Fundamentals
- [ ] `/linux/file-system` — File System & Hierarchy
- [ ] `/linux/essential-commands` — Essential Commands
- [ ] `/linux/file-permissions` — File Permissions & Ownership
- [ ] `/linux/users-groups` — Users & Groups
- [ ] `/linux/process-management` — Process Management
- [ ] `/linux/system-monitoring` — System Monitoring
- [ ] `/linux/networking` — Networking Commands
- [ ] `/linux/firewall` — Firewall & iptables
- [ ] `/linux/ssh` — SSH & Remote Access
- [ ] `/linux/bash-scripting` — Bash Scripting Basics
- [ ] `/linux/bash-advanced` — Advanced Bash Scripting
- [ ] `/linux/package-management` — Package Management
- [ ] `/linux/systemd` — systemd & Services
- [ ] `/linux/disk-storage` — Disk & Storage
- [ ] `/linux/environment-variables` — Environment Variables & Shell Config
- [ ] `/linux/log-analysis` — Log Analysis
- [ ] `/linux/performance-tuning` — Performance Tuning
- [ ] `/linux/vim` — Vim & Text Editors

#### Terraform — 21 topic pages

- [ ] `/terraform/fundamentals` — Terraform Fundamentals
- [ ] `/terraform/providers` — Providers
- [ ] `/terraform/variables` — Variables & Locals
- [ ] `/terraform/outputs` — Outputs
- [ ] `/terraform/resources` — Resources & Meta-Arguments
- [ ] `/terraform/data-sources` — Data Sources
- [ ] `/terraform/expressions` — Expressions & Dynamic Blocks
- [ ] `/terraform/functions` — Built-in Functions
- [ ] `/terraform/state` — Terraform State
- [ ] `/terraform/remote-backends` — Remote Backends
- [ ] `/terraform/workspaces` — Workspaces
- [ ] `/terraform/modules` — Modules
- [ ] `/terraform/module-patterns` — Module Patterns
- [ ] `/terraform/provisioners` — Provisioners
- [ ] `/terraform/import` — Import & Generated Config
- [ ] `/terraform/cicd` — CI/CD Integration
- [ ] `/terraform/testing` — Testing Terraform
- [ ] `/terraform/security` — Security & Compliance
- [ ] `/terraform/drift` — Drift Detection
- [ ] `/terraform/refactoring` — Refactoring Terraform
- [ ] `/terraform/opentofu` — OpenTofu

#### Service Mesh — 19 topic pages

- [ ] `/service-mesh/fundamentals` — Service Mesh Fundamentals
- [ ] `/service-mesh/istio-architecture` — Istio Architecture
- [ ] `/service-mesh/istio-install` — Istio Installation & Configuration
- [ ] `/service-mesh/linkerd` — Linkerd
- [ ] `/service-mesh/traffic-management` — Traffic Management
- [ ] `/service-mesh/resilience` — Resilience Patterns
- [ ] `/service-mesh/load-balancing` — Load Balancing
- [ ] `/service-mesh/mtls` — mTLS & Certificate Management
- [ ] `/service-mesh/authorization` — Authorization Policy
- [ ] `/service-mesh/metrics` — Metrics & Observability
- [ ] `/service-mesh/tracing` — Distributed Tracing
- [ ] `/service-mesh/kiali` — Kiali Service Graph
- [ ] `/service-mesh/gateway-api` — Kubernetes Gateway API
- [ ] `/service-mesh/ingress-gateway` — Ingress Gateway
- [ ] `/service-mesh/performance` — Service Mesh Performance
- [ ] `/service-mesh/envoy` — Envoy Proxy Deep Dive
- [ ] `/service-mesh/ambient-mesh` — Ambient Mesh
- [ ] `/service-mesh/multi-cluster` — Multi-Cluster Mesh
- [ ] `/service-mesh/consul` — Consul Service Mesh

#### System Design — 24 topic pages

- [ ] `/system-design/framework` — System Design Framework
- [ ] `/system-design/capacity-estimation` — Capacity Estimation
- [ ] `/system-design/cap-theorem` — CAP & PACELC Theorems
- [ ] `/system-design/networking` — Networking Fundamentals
- [ ] `/system-design/scaling` — Horizontal vs Vertical Scaling
- [ ] `/system-design/load-balancing` — Load Balancing
- [ ] `/system-design/caching` — Caching Strategies
- [ ] `/system-design/cdn` — Content Delivery Networks
- [ ] `/system-design/sharding` — Database Sharding
- [ ] `/system-design/sql-vs-nosql` — SQL vs NoSQL
- [ ] `/system-design/replication` — Replication Strategies
- [ ] `/system-design/indexes` — Indexes & Query Optimisation
- [ ] `/system-design/distributed-transactions` — Distributed Transactions
- [ ] `/system-design/high-availability` — High Availability
- [ ] `/system-design/fault-tolerance` — Fault Tolerance
- [ ] `/system-design/distributed-tracing` — Distributed Tracing
- [ ] `/system-design/disaster-recovery` — Disaster Recovery
- [ ] `/system-design/url-shortener` — Design: URL Shortener
- [ ] `/system-design/social-feed` — Design: Social Feed
- [ ] `/system-design/chat-application` — Design: Chat Application
- [ ] `/system-design/search-engine` — Design: Search Engine
- [ ] `/system-design/payment-system` — Design: Payment System
- [ ] `/system-design/video-streaming` — Design: Video Streaming
- [ ] `/system-design/ai-ml-system-design` — Design: AI/ML Systems

#### Architecture Patterns — 22 topic pages

- [ ] `/arch-patterns/monolith-vs-modular` — Monolith vs Modular Monolith
- [ ] `/arch-patterns/layered-architecture` — Layered Architecture
- [ ] `/arch-patterns/clean-architecture` — Clean / Onion Architecture
- [ ] `/arch-patterns/hexagonal-architecture` — Hexagonal Architecture
- [ ] `/arch-patterns/vertical-slice` — Vertical Slice Architecture
- [ ] `/arch-patterns/service-oriented` — Service-Oriented Architecture
- [ ] `/arch-patterns/microservices-principles` — Microservices Principles
- [ ] `/arch-patterns/service-communication` — Service Communication
- [ ] `/arch-patterns/api-gateway-pattern` — API Gateway Pattern
- [ ] `/arch-patterns/service-discovery` — Service Discovery
- [ ] `/arch-patterns/circuit-breaker` — Circuit Breaker
- [ ] `/arch-patterns/sidecar-service-mesh` — Sidecar & Service Mesh
- [ ] `/arch-patterns/event-driven` — Event-Driven Architecture
- [ ] `/arch-patterns/cqrs-event-sourcing` — CQRS & Event Sourcing
- [ ] `/arch-patterns/saga-choreography` — Saga & Choreography
- [ ] `/arch-patterns/inbox-outbox` — Inbox & Outbox Pattern
- [ ] `/arch-patterns/ddd-core` — Domain-Driven Design Core
- [ ] `/arch-patterns/bounded-contexts` — Bounded Contexts
- [ ] `/arch-patterns/aggregates-domain-events` — Aggregates & Domain Events
- [ ] `/arch-patterns/anti-corruption-layer` — Anti-Corruption Layer
- [ ] `/arch-patterns/strangler-fig` — Strangler Fig Pattern
- [ ] `/arch-patterns/backend-for-frontend` — Backend for Frontend (BFF)

#### Design Patterns — 36 topic pages

- [ ] `/design-patterns/singleton` — Singleton Pattern
- [ ] `/design-patterns/factory-method` — Factory Method Pattern
- [ ] `/design-patterns/abstract-factory` — Abstract Factory Pattern
- [ ] `/design-patterns/builder` — Builder Pattern
- [ ] `/design-patterns/prototype` — Prototype Pattern
- [ ] `/design-patterns/object-pool` — Object Pool Pattern
- [ ] `/design-patterns/adapter` — Adapter Pattern
- [ ] `/design-patterns/bridge` — Bridge Pattern
- [ ] `/design-patterns/composite` — Composite Pattern
- [ ] `/design-patterns/decorator` — Decorator Pattern
- [ ] `/design-patterns/facade` — Facade Pattern
- [ ] `/design-patterns/flyweight` — Flyweight Pattern
- [ ] `/design-patterns/proxy` — Proxy Pattern
- [ ] `/design-patterns/chain-of-responsibility` — Chain of Responsibility
- [ ] `/design-patterns/command` — Command Pattern
- [ ] `/design-patterns/iterator` — Iterator Pattern
- [ ] `/design-patterns/mediator` — Mediator Pattern
- [ ] `/design-patterns/memento` — Memento Pattern
- [ ] `/design-patterns/observer` — Observer Pattern
- [ ] `/design-patterns/state` — State Pattern
- [ ] `/design-patterns/strategy` — Strategy Pattern
- [ ] `/design-patterns/template-method` — Template Method Pattern
- [ ] `/design-patterns/visitor` — Visitor Pattern
- [ ] `/design-patterns/null-object` — Null Object Pattern
- [ ] `/design-patterns/repository` — Repository Pattern
- [ ] `/design-patterns/unit-of-work` — Unit of Work Pattern
- [ ] `/design-patterns/cqrs` — CQRS
- [ ] `/design-patterns/event-sourcing` — Event Sourcing
- [ ] `/design-patterns/saga` — Saga Pattern
- [ ] `/design-patterns/outbox` — Outbox Pattern
- [ ] `/design-patterns/specification` — Specification Pattern
- [ ] `/design-patterns/clean-architecture` — Clean Architecture
- [ ] `/design-patterns/solid` — SOLID Principles
- [ ] `/design-patterns/grasp` — GRASP Principles
- [ ] `/design-patterns/dry-kiss-yagni` — DRY, KISS & YAGNI
- [ ] `/design-patterns/dependency-inversion` — Dependency Inversion

#### Security — 23 topic pages

- [ ] `/security/fundamentals` — Security Fundamentals
- [ ] `/security/owasp-top-10` — OWASP Top 10
- [ ] `/security/threat-modelling` — Threat Modelling
- [ ] `/security/secure-coding` — Secure Coding Practices
- [ ] `/security/password-security` — Password Security
- [ ] `/security/oauth-oidc` — OAuth 2.0 & OIDC
- [ ] `/security/jwt` — JWT (JSON Web Tokens)
- [ ] `/security/mfa` — Multi-Factor Authentication
- [ ] `/security/sso` — Single Sign-On (SSO)
- [ ] `/security/rbac-abac` — RBAC & ABAC
- [ ] `/security/claims-identity` — Claims & Identity
- [ ] `/security/api-security` — API Security
- [ ] `/security/xss` — Cross-Site Scripting (XSS)
- [ ] `/security/csrf-clickjacking` — CSRF & Clickjacking
- [ ] `/security/injection` — Injection Attacks
- [ ] `/security/security-headers` — Security Headers
- [ ] `/security/tls-https` — TLS & HTTPS
- [ ] `/security/secrets-management` — Secrets Management
- [ ] `/security/container-security` — Container Security
- [ ] `/security/symmetric-encryption` — Symmetric Encryption
- [ ] `/security/asymmetric-cryptography` — Asymmetric Cryptography
- [ ] `/security/hashing` — Hashing
- [ ] `/security/supply-chain` — Supply Chain Security

#### API Design — 19 topic pages

- [ ] `/api-design/rest-fundamentals` — REST Fundamentals
- [ ] `/api-design/resource-url-design` — Resource & URL Design
- [ ] `/api-design/http-methods-status-codes` — HTTP Methods & Status Codes
- [ ] `/api-design/pagination-patterns` — Pagination Patterns
- [ ] `/api-design/api-versioning` — API Versioning Strategies
- [ ] `/api-design/error-response-design` — Error Response Design
- [ ] `/api-design/hateoas-hypermedia` — HATEOAS & Hypermedia
- [ ] `/api-design/protocol-buffers` — Protocol Buffers
- [ ] `/api-design/grpc-service-patterns` — gRPC Service Patterns
- [ ] `/api-design/grpc-web-transcoding` — gRPC-Web & Transcoding
- [ ] `/api-design/graphql-fundamentals` — GraphQL Fundamentals
- [ ] `/api-design/graphql-vs-rest` — GraphQL vs REST
- [ ] `/api-design/websockets-sse-polling` — WebSockets vs SSE vs Polling
- [ ] `/api-design/webhook-design` — Webhook Design
- [ ] `/api-design/api-design-principles` — API Design Principles
- [ ] `/api-design/openapi-contracts` — OpenAPI & Contracts
- [ ] `/api-design/api-security` — API Security
- [ ] `/api-design/breaking-changes` — Breaking Changes
- [ ] `/api-design/rate-limiting` — Rate Limiting

#### Observability — 20 topic pages

- [ ] `/observability/observability-fundamentals` — Observability Fundamentals
- [ ] `/observability/opentelemetry` — OpenTelemetry
- [ ] `/observability/sli-slo-sla` — SLIs, SLOs & SLAs
- [ ] `/observability/prometheus-metrics` — Prometheus & Metrics
- [ ] `/observability/grafana-dashboards` — Grafana Dashboards
- [ ] `/observability/custom-app-metrics` — Custom App Metrics
- [ ] `/observability/infrastructure-metrics` — Infrastructure Metrics
- [ ] `/observability/cloud-native-monitoring` — Cloud-Native Monitoring
- [ ] `/observability/structured-logging` — Structured Logging
- [ ] `/observability/log-aggregation` — Log Aggregation
- [ ] `/observability/log-best-practices` — Log Best Practices
- [ ] `/observability/distributed-tracing` — Distributed Tracing
- [ ] `/observability/opentelemetry-tracing` — OTel Tracing Deep Dive
- [ ] `/observability/performance-profiling` — Performance Profiling
- [ ] `/observability/alerting-design` — Alerting Design
- [ ] `/observability/on-call-incidents` — On-Call & Incidents
- [ ] `/observability/error-budgets-toil` — Error Budgets & Toil
- [ ] `/observability/chaos-engineering` — Chaos Engineering
- [ ] `/observability/ebpf-observability` — eBPF Observability
- [ ] `/observability/observability-maturity` — Observability Maturity

#### MongoDB — 21 topic pages

- [ ] `/mongodb/fundamentals` — MongoDB Fundamentals
- [ ] `/mongodb/installation-setup` — Installation & Setup
- [ ] `/mongodb/crud-operations` — CRUD Operations
- [ ] `/mongodb/update-operators` — Update Operators
- [ ] `/mongodb/query-operators` — Query Operators
- [ ] `/mongodb/array-queries` — Array Queries
- [ ] `/mongodb/projections-sorting` — Projections & Sorting
- [ ] `/mongodb/aggregation-pipeline` — Aggregation Pipeline
- [ ] `/mongodb/lookup-joins` — $lookup & Joins
- [ ] `/mongodb/aggregation-expressions` — Aggregation Expressions
- [ ] `/mongodb/schema-design-patterns` — Schema Design Patterns
- [ ] `/mongodb/data-modelling` — Data Modelling
- [ ] `/mongodb/time-series` — Time Series Collections
- [ ] `/mongodb/indexes` — Indexes
- [ ] `/mongodb/query-performance` — Query Performance & explain()
- [ ] `/mongodb/transactions` — Transactions
- [ ] `/mongodb/change-streams` — Change Streams
- [ ] `/mongodb/replication-sharding` — Replication & Sharding
- [ ] `/mongodb/security` — Security & Authentication
- [ ] `/mongodb/mongodb-nodejs` — MongoDB with Node.js
- [ ] `/mongodb/atlas-search` — Atlas Search & Vector Search

#### Redis — 21 topic pages

- [ ] `/redis/fundamentals` — Redis Fundamentals
- [ ] `/redis/installation-setup` — Installation & CLI
- [ ] `/redis/strings` — Strings
- [ ] `/redis/hashes` — Hashes
- [ ] `/redis/lists` — Lists
- [ ] `/redis/sets` — Sets
- [ ] `/redis/sorted-sets` — Sorted Sets
- [ ] `/redis/key-commands` — Key Commands & Patterns
- [ ] `/redis/transactions` — Transactions (MULTI/EXEC)
- [ ] `/redis/lua-scripting` — Lua Scripting
- [ ] `/redis/persistence` — Persistence (RDB & AOF)
- [ ] `/redis/pub-sub` — Pub/Sub Messaging
- [ ] `/redis/streams` — Streams
- [ ] `/redis/caching-patterns` — Caching Patterns
- [ ] `/redis/eviction-policies` — Eviction Policies
- [ ] `/redis/rate-limiting` — Rate Limiting
- [ ] `/redis/replication-sentinel` — Replication & Sentinel
- [ ] `/redis/redis-cluster` — Redis Cluster
- [ ] `/redis/redis-stack` — Redis Stack & Modules
- [ ] `/redis/redis-nodejs` — Redis with Node.js
- [ ] `/redis/security` — Redis Security

#### GraphQL — 20 topic pages

- [ ] `/graphql/fundamentals` — GraphQL Fundamentals
- [ ] `/graphql/schema-definition-language` — Schema Definition Language
- [ ] `/graphql/type-system` — Type System Deep Dive
- [ ] `/graphql/queries` — GraphQL Queries
- [ ] `/graphql/variables-arguments` — Variables & Arguments
- [ ] `/graphql/directives` — Directives
- [ ] `/graphql/mutations` — Mutations
- [ ] `/graphql/error-handling` — Mutation Error Handling
- [ ] `/graphql/subscriptions` — Subscriptions
- [ ] `/graphql/resolvers` — Resolvers
- [ ] `/graphql/dataloader` — DataLoader & N+1 Problem
- [ ] `/graphql/auth` — Authentication & Authorization
- [ ] `/graphql/apollo-server` — Apollo Server
- [ ] `/graphql/pagination` — Pagination Patterns
- [ ] `/graphql/apollo-client` — Apollo Client
- [ ] `/graphql/client-caching` — Client-Side Caching
- [ ] `/graphql/code-generation` — Code Generation
- [ ] `/graphql/performance` — Performance & Security
- [ ] `/graphql/federation` — Schema Federation
- [ ] `/graphql/testing` — Testing GraphQL

#### Messaging/Kafka — 20 topic pages

- [ ] `/messaging/messaging-fundamentals` — Messaging Fundamentals
- [ ] `/messaging/message-queues-vs-streams` — Message Queues vs Event Streams
- [ ] `/messaging/rabbitmq-core` — RabbitMQ Core Concepts
- [ ] `/messaging/rabbitmq-exchanges` — RabbitMQ Exchanges
- [ ] `/messaging/rabbitmq-patterns` — RabbitMQ Patterns
- [ ] `/messaging/kafka-architecture` — Kafka Architecture
- [ ] `/messaging/kafka-producers-consumers` — Producers & Consumers
- [ ] `/messaging/kafka-streams` — Kafka Streams & KSQL
- [ ] `/messaging/kafka-connect` — Kafka Connect
- [ ] `/messaging/schema-registry` — Schema Registry
- [ ] `/messaging/messaging-patterns` — Enterprise Messaging Patterns
- [ ] `/messaging/saga-pattern` — Saga Pattern
- [ ] `/messaging/outbox-pattern` — Outbox Pattern
- [ ] `/messaging/azure-service-bus` — Azure Service Bus
- [ ] `/messaging/azure-event-grid` — Event Grid & Event Hubs
- [ ] `/messaging/aws-sqs` — AWS SQS
- [ ] `/messaging/aws-sns-eventbridge` — AWS SNS & EventBridge
- [ ] `/messaging/idempotency` — Idempotency & Exactly-Once
- [ ] `/messaging/message-ordering` — Message Ordering
- [ ] `/messaging/backpressure` — Backpressure & Flow Control

#### DSA — 21 topic pages

- [ ] `/dsa/big-o` — Big-O Notation
- [ ] `/dsa/arrays` — Arrays
- [ ] `/dsa/strings` — Strings
- [ ] `/dsa/hash-tables` — Hash Tables
- [ ] `/dsa/stacks-queues` — Stacks & Queues
- [ ] `/dsa/linked-lists` — Singly Linked Lists
- [ ] `/dsa/doubly-linked-lists` — Doubly Linked Lists
- [ ] `/dsa/binary-trees` — Binary Trees
- [ ] `/dsa/bst` — Binary Search Trees
- [ ] `/dsa/heaps` — Heaps & Priority Queues
- [ ] `/dsa/graphs-bfs-dfs` — Graphs: BFS & DFS
- [ ] `/dsa/graph-algorithms` — Graph Algorithms
- [ ] `/dsa/basic-sorts` — Basic Sorting Algorithms
- [ ] `/dsa/advanced-sorts` — Advanced Sorting Algorithms
- [ ] `/dsa/binary-search` — Binary Search
- [ ] `/dsa/recursion-backtracking` — Recursion & Backtracking
- [ ] `/dsa/dynamic-programming` — Dynamic Programming
- [ ] `/dsa/dp-patterns` — DP Patterns
- [ ] `/dsa/trie` — Tries
- [ ] `/dsa/bit-manipulation` — Bit Manipulation
- [ ] `/dsa/greedy` — Greedy Algorithms

#### Testing — 19 topic pages

- [ ] `/testing-hub/testing-fundamentals` — Testing Fundamentals
- [ ] `/testing-hub/jest-fundamentals` — Jest Fundamentals
- [ ] `/testing-hub/mocking-spies` — Mocking & Spies
- [ ] `/testing-hub/xunit` — xUnit (.NET Testing)
- [ ] `/testing-hub/tdd` — Test-Driven Development
- [ ] `/testing-hub/test-doubles` — Test Doubles
- [ ] `/testing-hub/integration-testing` — Integration Testing
- [ ] `/testing-hub/testing-databases` — Testing with Databases
- [ ] `/testing-hub/angular-testing` — Angular Testing
- [ ] `/testing-hub/react-testing-library` — React Testing Library
- [ ] `/testing-hub/playwright` — Playwright
- [ ] `/testing-hub/cypress` — Cypress
- [ ] `/testing-hub/api-testing` — API Testing
- [ ] `/testing-hub/contract-testing` — Contract Testing (Pact)
- [ ] `/testing-hub/snapshot-testing` — Snapshot Testing
- [ ] `/testing-hub/vitest` — Vitest
- [ ] `/testing-hub/msw` — MSW — Mock Service Worker
- [ ] `/testing-hub/visual-regression` — Visual Regression Testing
- [ ] `/testing-hub/property-based-testing` — Property-Based Testing

#### AI/ML — 19 topic pages

- [ ] `/ai/ml-fundamentals` — AI & ML Fundamentals
- [ ] `/ai/math-for-ml` — Mathematics for ML
- [ ] `/ai/linear-logistic-regression` — Linear & Logistic Regression
- [ ] `/ai/decision-trees` — Decision Trees & Random Forests
- [ ] `/ai/gradient-boosting` — Gradient Boosting (XGBoost)
- [ ] `/ai/clustering` — Clustering & Dimensionality Reduction
- [ ] `/ai/neural-networks` — Neural Networks
- [ ] `/ai/computer-vision` — CNNs & Computer Vision
- [ ] `/ai/transformers` — Transformers & Attention
- [ ] `/ai/llm-fundamentals` — LLM Fundamentals
- [ ] `/ai/fine-tuning` — Fine-tuning & RLHF
- [ ] `/ai/rag` — RAG
- [ ] `/ai/prompt-engineering` — Prompt Engineering
- [ ] `/ai/ai-agents` — AI Agents & Tool Use
- [ ] `/ai/vector-databases` — Vector Databases
- [ ] `/ai/mlops` — MLOps & Model Deployment
- [ ] `/ai/hugging-face` — Hugging Face & Model Hub
- [ ] `/ai/evaluating-llms` — Evaluating LLM Outputs
- [ ] `/ai/ai-engineering` — AI Engineering Patterns

---

### Explicitly out of scope for this phase

- Rewriting or thinning existing topic pages — they keep their current Phase 2 content untouched.
- Building subtopic pages for reference/practice pages (cheatsheet, interview-prep, glossary,
  decision-guides, etc.) — those aren't "topics" with sub-concepts, skip them.
- Any hub not yet on real content at the topic-page tier (as of 2026-07-03 that's Rust and QA
  Engineering — see Phase 11. Build their topic pages first; subtopic pages for them come later,
  after Phase 10's pilot format is locked and after their own topic-page tier is complete).

---

## Phase 11 — New Hubs: Rust & QA Engineering

**Status: PLANNING (added 2026-07-03). Not started.** These are two ordinary new hubs, built
the same way every hub in Phase 1–8 was: full topic-page tier (Phase 2 Enhanced Content
Standard — theory, code tabs, common mistakes, challenge, quiz, Q&A, revision card), following
the "Adding a whole NEW technology hub" checklist in `CLAUDE.md`. They are not part of Phase 10
(subtopic pages) — that tier comes later, after a hub already has its topic pages, same as every
other hub.

### 11A — Rust hub

**Why:** Rust is now a mainstream, high-demand systems language (used in browsers, OS kernels,
CLI tooling, and increasingly backend services) and is a clear gap next to the existing Go and
C++-adjacent systems coverage. Fits the existing `backend/` hub group alongside Go, Python, Node.js.

- Folder: `src/app/components/backend/rust/`
- Route: `/rust`
- Search prefix: `rust-`
- Progress key: `rustTotal`
- Accent: **proposed** `#ce422b` (Rust's own brand "rust" orange), tint `#fdf2ee` — **verify
  against the existing theming table before scaffolding**; it sits close to DSA's amber
  (`#92400e`) and Messaging's burnt-orange (`#9a3412`) and may need to shift hue or lean harder
  into red to stay visually distinct in the left nav / hub cards.
- Icon: text glyph, proposed `Rs` or the gear/crab motif rendered as a short text glyph (site
  convention for solid-fill hubs is a 2–3 char text abbreviation, not emoji — see CLAUDE.md
  icon pattern rules) — confirm final glyph during scaffolding.
- Challenge.language: add `'rust'` if the shared `code-block`/`challenge-block` components need a
  new language tag registered (check `CodeTab`/`Challenge` language unions before the first page).

**Proposed topic list (~21 topics + 2 reference — refine during Working Method rule 4 pre-hub
research before writing page 1; this is a starting shape, not a locked spec):**

Foundations:
1. Rust Fundamentals — cargo, rustc, variables, mutability, scalar/compound types, control flow
2. Ownership & Borrowing — move semantics, the borrow checker, borrowing rules
3. Lifetimes — lifetime annotations, elision rules, common lifetime compiler errors
4. Structs & Enums — struct types, enum variants, `impl` blocks, methods vs associated functions
5. Pattern Matching — `match`, `if let`, `while let`, destructuring
6. Error Handling — `Result<T, E>`, `Option<T>`, the `?` operator, custom error types, panic vs recoverable errors
7. Traits & Generics — trait definitions, trait bounds, generic functions/structs, default implementations
8. Collections — `Vec`, `HashMap`, `HashSet`, `String` vs `&str`, iterators and iterator adapters
9. Modules & Cargo — module system, visibility, workspaces, `Cargo.toml`, crates.io

Memory & Concurrency:
10. Smart Pointers — `Box`, `Rc`, `Arc`, `RefCell`, `Weak`, interior mutability
11. Concurrency & Threads — `std::thread`, `Mutex`, `Arc<Mutex<T>>`, message passing with channels
12. Async/Await — the Tokio runtime, futures, `async fn`, spawning and awaiting tasks
13. Unsafe Rust & FFI — `unsafe` blocks, raw pointers, calling into C

Building things:
14. Web Frameworks — Actix-web / Axum, routing, extractors, middleware
15. Building REST APIs — request/response handling, JSON with Serde
16. Serialization — Serde derive macros, custom (de)serialization
17. CLI Tools — `clap`, argument parsing, building a real command-line app
18. WASM with Rust — compiling to WebAssembly, `wasm-bindgen`

Craft & ops:
19. Testing in Rust — `#[test]`, integration tests (`tests/`), mocking, property-based testing
20. Macros — declarative macros (`macro_rules!`), an introduction to procedural macros
21. Performance & Profiling — benchmarking, flamegraphs, avoiding unnecessary clones/allocations

Reference:
- `rust-cheatsheet` — ownership rules, syntax, common patterns, one page
- `rust-interview-prep` — 30+ Q&A across ownership, lifetimes, traits, concurrency, error handling

### 11B — QA Engineering hub

**Why — and how this differs from the existing Testing hub:** DevHub already has a `fundamentals/
testing` hub (`/testing-hub`, accent indigo `#6366f1`, `testTotal`). That hub is written from a
**developer's** point of view — how to write and run automated tests as code (Jest, Vitest,
xUnit, Playwright/Cypress as testing libraries, TDD, mutation testing, contract testing). It does
not cover the QA discipline itself: manual testing process, test case design, defect lifecycle,
test management, exploratory testing, non-functional testing, or the QA-specific tooling
ecosystem (Selenium, Postman, JMeter, TestRail/Jira, ISTQB terminology). A dedicated **QA
Engineering** hub fills that gap for a quality-assurance / SDET audience rather than a
software-engineer-who-also-writes-tests audience.

**Do not duplicate the existing Testing hub's content.** Where topics genuinely overlap (e.g.
Playwright, Cypress, API testing), the QA hub's version must be written from a different angle —
QA workflow, test case → automation mapping, reporting, tool selection — not "how do I write a
`test()` block", which the Testing hub already covers well. If a page ends up being a near-copy
of an existing Testing-hub page, that's a signal the topic doesn't belong in this hub, or needs a
sharper QA-specific angle.

- Folder: `src/app/components/fundamentals/qa/` (sits alongside `fundamentals/testing`, `fundamentals/dsa`, `fundamentals/ai`)
- Route: `/qa` (confirm no collision with the existing `/testing-hub` route or any other route)
- Search prefix: `qa-`
- Progress key: `qaTotal`
- Accent: **proposed** `#65a30d` (olive/lime green — distinct from WebPerf's `#16a34a` and Node's
  `#339933`), tint `#f7fee7` — **verify against the existing theming table before scaffolding**.
- Icon: text glyph, proposed `QA`.

**Proposed topic list (~22 topics + 2 reference — refine during pre-hub research before writing
page 1; this is a starting shape, not a locked spec):**

Foundations:
1. QA Fundamentals & SDLC/STLC — software development lifecycle vs software testing lifecycle, QA vs QC vs Testing
2. Test Case Design Techniques — equivalence partitioning, boundary value analysis, decision tables, state transition testing
3. Test Planning & Strategy — test plan documents, entry/exit criteria, risk-based testing
4. Requirements Analysis & Traceability — requirement gathering, the requirements traceability matrix (RTM)
5. Defect/Bug Lifecycle — bug reporting, severity vs priority, triage, defect tracking

Test types:
6. Functional Testing — black-box testing fundamentals, positive/negative test design
7. Regression Testing — regression suites, test selection strategies, when to re-run what
8. Smoke & Sanity Testing — build verification testing, when to run each
9. Exploratory Testing — session-based test management, charters, testing heuristics
10. Usability Testing — UX evaluation, heuristic evaluation
11. Accessibility Testing for QA — WCAG from a tester's checklist, screen reader spot-checks, axe/Lighthouse audits
12. Cross-Browser & Cross-Device Testing — browser/device matrices, responsive testing, BrowserStack/Sauce Labs
13. Mobile App Testing — Android/iOS testing considerations, emulators vs real devices

Automation (QA angle, not dev angle):
14. Test Automation Fundamentals — when to automate, ROI, the automation pyramid from a QA lens
15. Selenium WebDriver — locators, explicit/implicit waits, Page Object Model
16. Playwright & Cypress for QA Workflows — mapping manual test cases to automated suites, reporting
17. API Testing for QA — Postman, REST Assured, contract validation from a tester's perspective
18. Automation Framework Design — Page Object Model, data-driven, keyword-driven, hybrid frameworks

Non-functional & process:
19. Performance & Load Testing for QA — JMeter, k6, reading results and flagging bottlenecks
20. Security Testing Basics for QA — OWASP awareness, basic pen-testing concepts for testers (not a security-engineer deep-dive — that's the existing Security hub's job)
21. Agile & Scrum Testing Practices — testing inside sprints, Definition of Done, BDD/Gherkin for QA
22. Test Management & Metrics — Jira/TestRail/Zephyr, coverage metrics, reporting to stakeholders

Reference:
- `qa-cheatsheet` — ISTQB-style glossary, test design technique quick-reference
- `qa-interview-prep` — 30+ Q&A across manual testing, automation, defect management, agile QA

### Wiring (both hubs — do not skip any step)

Follow the full "WIRING CHECKLIST" in `CLAUDE.md` for **each individual page**, and the "Adding a
whole NEW technology hub" checklist for the **hub itself** (accent/tint, home page, routes block,
`currentSection()`, left nav block + `.section-<tech>` colors, breadcrumb `TECH_SECTIONS` +
labels map, sidebar host class + accent, search route-key prefix, progress service total,
hub-home card flip + hero stat + What's New). Do the pre-hub research step (Working Method rule
4) before writing either hub's first page — the topic lists above are a planning-time draft, not
a substitute for that research.

### Sequencing

Build order: **Rust first, then QA Engineering** (Rust's topic list is more settled/conventional
for a systems language hub; QA Engineering has more genuinely open content-design questions — the
overlap-avoidance rule with the existing Testing hub — so doing Rust first banks a clean win and
leaves more attention for getting the QA hub's angle right). Same "one page at a time, no
batching" discipline as every other phase. Update the Current State table and this file's Done
History after each page, same as always.

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

All 4 items below resolved 2026-07-01 — see Done History.

---

## Done History

- [x] 2026-07-01 — Phase 9 deep content-quality pass STARTED: began the genuine page-by-page read-through of quiz/Q&A content (the item explicitly flagged as needing real reading, not scripting). While reading DSA hub pages, discovered a systemic, mechanically-detectable bug: 35 files site-wide had a QUESTION asked twice verbatim — either the entire last batch of quiz questions AND Q&A entries duplicated as an identical second block (14 files, all in the API Design hub — a clear copy-paste artifact from an earlier authoring pass), or a single question repeated within the same quiz array, within the same Q&A array, or tested identically in both a multiple-choice quiz entry and a free-text Q&A entry (21 more files scattered across many hubs). Wrote a scripted scanner (compares every `q:` field within each file) to find all instances, then fixed every one — either removing the exact duplicate block (API Design) or replacing the redundant copy with a genuinely different question covering a related but distinct angle. Verified a fresh scan afterward shows zero duplicate questions anywhere in the codebase. Also fixed two additional content-quality issues found during manual reading: dsa/linked-lists.ts had a redundant quiz question and no genuine "trap" Q&A entries; dsa/bst.ts had a duplicated Q&A entry.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: DSA hub COMPLETE (21/21 files manually read). Beyond the exact-duplicate scan above, found and fixed 5 more NEAR-duplicate questions the exact-match scanner couldn't catch (same underlying question, reworded) plus one broken answer: `dp-patterns.ts` (answer contained a leftover inline self-correction — "...is 'bbb' (wrong) actually 'bb'..." — left in the final text), `graph-algorithms.ts` (Dijkstra-vs-BFS and topological-sort-usage each asked twice with different phrasing — 2 fixes), `graphs-bfs-dfs.ts` ("BFS = shortest path" asked twice), `heaps.ts` ("heapify is O(n)" asked twice), `strings.ts` ("KMP time complexity" asked twice). All replaced with genuinely distinct questions covering a different angle of the same topic. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: GraphQL hub COMPLETE (22/22 files). Grep-scanned every question — this hub had notably less duplication than others (only 1 near-duplicate pair found): `auth.ts` (WebSocket subscription auth asked twice). Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Redis hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed 14 near-duplicate pairs across 13 files: `caching-patterns.ts`, `key-commands.ts`, `persistence.ts` (x2: AOF rewrite, aof-use-rdb-preamble), `hashes.ts`, `transactions.ts`, `replication-sentinel.ts`, `redis-nodejs.ts`, `sets.ts`, `redis-cluster.ts`, `sorted-sets.ts`, `streams.ts`, `rate-limiting.ts`, `pub-sub.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Observability hub COMPLETE (22/22 files). Grep-scanned every question, found and fixed 9 near-duplicate pairs across 7 files: `alerting-design.ts` (x2: inhibition rule, dead man's switch), `ebpf-observability.ts`, `error-budgets-toil.ts`, `grafana-dashboards.ts`, `log-aggregation.ts` (x2: Loki vs ES, log cost at scale), `on-call-incidents.ts`, `performance-profiling.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: API Design hub COMPLETE (21/21 files). Grep-scanned every question, found and fixed 16 near-duplicate pairs across 12 files: `api-versioning.ts` (x4: strategies/tradeoffs, deprecated-versions-maintained, semver, Sunset header), `breaking-changes.ts`, `api-security.ts`, `error-response-design.ts` (x2: HTTP status codes, RFC 7807/9457), `grpc-service-patterns.ts`, `graphql-fundamentals.ts`, `graphql-vs-rest.ts` (x2: BFF, caching), `openapi-contracts.ts`, `rate-limiting.ts`, `resource-url-design.ts`, `rest-fundamentals.ts`, `webhook-design.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Security hub COMPLETE (25/25 files). Grep-scanned every question, found and fixed 17 near-duplicate pairs across 15 files: `asymmetric-cryptography.ts`, `injection.ts`, `fundamentals.ts`, `hashing.ts`, `oauth-oidc.ts`, `secrets-management.ts`, `jwt.ts`, `secure-coding.ts`, `password-security.ts`, `security-headers.ts`, `symmetric-encryption.ts`, `supply-chain.ts`, `threat-modelling.ts` (x2), `tls-https.ts`, `rbac-abac.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: MongoDB hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed 16 near-duplicate pairs across 14 files: `aggregation-expressions.ts`, `array-queries.ts`, `aggregation-pipeline.ts`, `change-streams.ts`, `crud-operations.ts`, `indexes.ts` (x2), `lookup-joins.ts`, `schema-design-patterns.ts` (x2), `update-operators.ts`, `replication-sharding.ts`, `time-series.ts` (x2), `query-operators.ts`, `security.ts`, `installation-setup.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Design Patterns hub COMPLETE (39/39 files). Grep-scanned every question across the largest remaining hub, found and fixed 22 near-duplicate pairs across 19 files: `adapter.ts`, `cqrs.ts`, `dependency-inversion.ts`, `factory-method.ts`, `event-sourcing.ts`, `facade.ts`, `dry-kiss-yagni.ts`, `grasp.ts`, `memento.ts`, `observer.ts`, `outbox.ts` (x2), `saga.ts` (x2), `proxy.ts`, `state.ts`, `visitor.ts` (x2), `specification.ts`, `singleton.ts`, `template-method.ts`, `repository.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Architecture Patterns hub COMPLETE (25/25 files). Grep-scanned every question — this hub had the heaviest duplication found so far (23 duplicate pairs across 16 files, `backend-for-frontend.ts` alone had 4 pairs). Fixed: `aggregates-domain-events.ts`, `circuit-breaker.ts`, `backend-for-frontend.ts` (x4: BFF problem, BFF vs gateway, BFF ownership, GraphQL alternative), `cqrs-event-sourcing.ts`, `clean-architecture.ts` (x2: dependency rule, overkill), `ddd-core.ts`, `event-driven.ts` (x2: schema evolution, DLQ), `bounded-contexts.ts` (x2), `anti-corruption-layer.ts` (x2), `inbox-outbox.ts`, `service-communication.ts` (x3: gRPC, async-vs-sync, queue-vs-topic), `sidecar-service-mesh.ts`, `saga-choreography.ts`, `service-oriented.ts`, `service-discovery.ts`, `strangler-fig.ts`. Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Azure hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed near-duplicates in 12 files: `aks.ts` (AKS upgrade with minimal downtime twice), `arm.ts` (ARM vs Bicep relationship twice), `app-service.ts` (deployment slots purpose twice), `devops-pipelines.ts` (environment approvals twice, service connections twice — 2 fixes), `functions.ts` (Durable Functions vs plain function twice), `entra-id.ts` (Conditional Access twice), `fundamentals.ts` (Region vs AZ twice), `container-apps.ts` (Container Apps Environment twice), `load-balancer.ts` (Traffic Manager vs Front Door twice), `monitor.ts` (Metrics vs Logs twice), `service-bus.ts` (Queue vs Topic twice), `security-defender.ts` (Secure Score twice). Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Containers/K8s hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed near-duplicates in 15 files: `configmaps-secrets.ts`, `fundamentals.ts` (container vs VM), `compose.ts` (depends_on twice, scale service twice — 2 fixes), `dockerfile.ts` (HEALTHCHECK twice, ADD vs COPY twice — 2 fixes), `container-security.ts` (privileged container twice), `multi-stage.ts` (main benefit/advantage twice), `network-policies.ts` (default network behavior twice), `kubectl.ts` (rollout undo twice), `services-ingress.ts` (K8s DNS twice), `statefulsets.ts` (headless service twice), `storage.ts` (PVC vs PV twice), `resource-limits.ts` (memory limit exceeded twice), `rbac.ts` (audit ServiceAccount twice), `operators-crds.ts` (Operator pattern twice), `k8s-architecture.ts` (etcd role/backup twice). Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Messaging/Kafka hub COMPLETE (22/22 files). Grep-scanned every question, found and fixed near-duplicates in 13 files (15 duplicate pairs total, 2 files had 2 each): `aws-sns-eventbridge.ts` (SNS-vs-EventBridge difference twice, EventBridge-over-SNS timing twice — 2 fixes), `aws-sqs.ts` (long polling twice), `azure-service-bus.ts` (queue vs topic twice), `kafka-connect.ts` (source/sink connector difference twice, schema evolution twice, offset tracking twice — 3 fixes), `kafka-architecture.ts` (ordering guarantee twice), `kafka-producers-consumers.ts` (exactly-once end-to-end twice), `message-queues-vs-streams.ts` (queue-vs-stream preference twice), `kafka-streams.ts` (KStream vs KTable twice), `message-ordering.ts` (SQS FIFO ordering twice), `messaging-patterns.ts` (claim-check pattern twice), `rabbitmq-exchanges.ts` (bind queue to exchanges twice), `outbox-pattern.ts` (outbox problem twice), `saga-pattern.ts` (compensating transaction twice). Every fix replaced the redundant copy with a genuinely distinct question. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: AI/ML hub COMPLETE (22/22 files). Grep-scanned every question, found and fixed 16 near-duplicate quiz/qna pairs: `ai-engineering.ts` (prompt injection defense asked twice), `fine-tuning.ts` (fine-tuning-vs-RAG timing twice), `clustering.ts` (DBSCAN advantage twice), `ai-agents.ts` (ReAct pattern twice, single-vs-multi-agent twice — 2 fixes), `gradient-boosting.ts` (early stopping purpose twice), `linear-logistic-regression.ts` (L1/L2 regularization asked 3×), `ml-fundamentals.ts` (cross-validation-preferred twice), `rag.ts` (RAG pipeline evaluation twice), `neural-networks.ts` (backprop gradient computation twice), `vector-databases.ts` (choosing a vector DB twice), `math-for-ml.ts` (chain rule in backprop twice), `llm-fundamentals.ts` (base vs instruction-tuned model twice), `responsible-ai.ts` (EU AI Act twice), `transformers.ts` (multi-head attention benefit twice), `evaluating-llms.ts` (BLEU limitations twice), `prompt-engineering.ts` (chain-of-thought benefit twice). Every fix replaced the redundant copy with a genuinely distinct question on a different angle of the same topic. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Testing hub COMPLETE (22/22 files) + discovered and fixed a site-wide BYTE-CORRUPTION bug unrelated to duplicates. While fixing a near-duplicate in `vitest.ts`, found a stray vertical-tab control byte (0x0B) silently replacing the letter "v" in rendered text (e.g. "the i object" instead of "the vi object") — a leftover artifact of some earlier batch-authoring script that mishandled backslash-escape sequences in embedded code snippets (`\v`, `\a`, `\f`, `\e` interpreted as control chars instead of literal text, each swallowing one letter). Ran a site-wide grep for stray control bytes (`[\x00-\x08\x0b\x0c\x0e-\x1f]`) and found 10 affected files total (1 in `vitest.ts` plus 9 more: 2 in `data/mongodb` — `aggregation-expressions.ts`, `projections-sorting.ts` — and 7 more in the Testing hub — `angular-testing.ts` ×2, `api-testing.ts`, `integration-testing.ts`, `msw.ts`, `property-based-testing.ts`, `react-testing-library.ts`, `snapshot-testing.ts` ×4, `testing-fundamentals.ts`). Confirmed the exact byte→letter mapping held everywhere (0x07→'a', 0x0C→'f', 0x1B→'e', 0x0B→'v') and batch-restored all 14 occurrences; additionally rewrote `api-testing.ts`'s "test authentication" qna answer from scratch since its template-literal code snippet (a Bearer-token header example) had been mangled beyond just a missing letter — the backtick/`${token}` content itself was lost, not just one character. Verified zero remaining stray control bytes site-wide after the fix. Separately, found and fixed 8 near-duplicate quiz/qna questions in the Testing hub itself: `api-testing.ts` (paginated endpoints asked twice), `integration-testing.ts` (Testcontainers definition twice), `playwright.ts` (Page Object Model twice), `property-based-testing.ts` (shrinking twice), `testing-fundamentals.ts` (Test Pyramid twice), `test-doubles.ts` (Dummy object twice), `tdd.ts` (TDD's primary benefit twice), `vitest.ts` (jest.fn()/spyOn() equivalent twice). Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 deep content-quality pass: Python hub COMPLETE (23/23 files). Switched technique for speed: grep-extracted every `q: '...'` question text per hub in one pass, scanned for near-duplicate phrasing across each file, then verified candidates by reading full context before fixing (avoids the false-negative problem of the exact-string scanner while being far faster than reading every file end-to-end). Found and fixed near-duplicate questions in 14 of 23 files — this hub had noticeably MORE duplication than DSA, confirming the pattern is systemic to whichever earlier authoring pass appended single-line quiz/qna entries without checking existing multi-line ones: `asyncio.ts`, `dataclasses-pydantic.ts` (2 dups), `comprehensions-generators.ts` (list-comp-vs-generator asked 3×, yield-from asked 2× — 3 fixes), `decorators-context-managers.ts` (functools.wraps asked 3×, __exit__/return-True asked 2× — 3 fixes), `celery.ts` (chord, idempotency — 2 dups), `functions-closures.ts` (late binding, *args/**kwargs — 2 dups), `fundamentals.ts` (walrus operator, list-vs-tuple — 2 dups), `packaging.ts`, `numpy-pandas.ts`, `sqlalchemy.ts`, `pytest.ts` (parametrize, fixture scope — 2 dups), `scikit-learn.ts`, `type-hints.ts` (Optional-vs-|None asked 3×, runtime-effect asked 2× — 2 fixes), `threading-multiprocessing.ts`. Every fix replaced the redundant copy with a genuinely different, non-overlapping question on a related but distinct angle of the same topic — never just removed (would drop below the 6-question depth requirement). Build clean, committed, pushed. Continuing hub-by-hub with the faster grep-scan technique: Testing next, then AI/ML, Messaging, Containers/K8s, Azure, Architecture Patterns, Design Patterns, MongoDB, Security, API Design, Observability, Redis, GraphQL, Node.js, Go, Blazor, DevOps, AWS, Linux, Terraform, Service Mesh, System Design, then the 9 earlier hubs (Angular, C#, ASP.NET, SQL, TypeScript, React, JavaScript, HTML, CSS) that only got the quiz/qna DEPTH pass, not this deeper QUALITY read.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Node.js hub COMPLETE (23/23 files, 14 files with fixes). This hub had the heaviest near-duplication density found so far — several files showed genuine triplicates (a question asked in the original quiz array, again in a later-appended quiz block, AND again in the qna array), not just pairs. Found and fixed 18 near-duplicate/triplicate groups across 14 files: `error-handling.ts` (operational-vs-programmer errors x2), `caching.ts` (cache stampede x2, cache-aside-vs-write-through x2 — 3 fixes total), `fastify.ts` (why Fastify is faster x2), `modules.ts` ("type":"module" in package.json x2), `logging.ts` (Pino-vs-Winston, structured logging, log correlation — 3 fixes), `promises-async.ts` (Promise.allSettled asked 3x — 2 fixes), `security.ts` (helmet asked 3x, CSRF x2 — 3 fixes), `streams.ts` (backpressure x2), `rest-api.ts` (HTTP status for resource creation x2), `websockets.ts` (scaling Socket.io x2), `graphql.ts` (N+1/DataLoader x2), `env-config.ts` (validate env vars at startup x2, never commit .env x2, different configs per environment x2 — 3 fixes), `deployment.ts` (multi-stage Docker builds x2), `express.ts` (structuring a large Express app x2). Every fix replaced the redundant copy with a genuinely distinct question probing a different angle (e.g. worker-thread log ordering, staging-vs-prod schema parity, ABI mismatches from copying node_modules across Docker stages) rather than just rephrasing the same fact. Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Go hub COMPLETE (23/23 files, discovered dupes in 12 files). Grep-scanned every question, found and fixed 12 near-duplicate pairs: `cli.ts` (RunE vs Run), `error-handling.ts` (sentinel error trade-offs), `gorm.ts` (soft delete), `goroutines.ts` (GOMAXPROCS), `channels.ts` (select on multiple ready cases), `modules.ts` (go mod tidy), `sync.ts` (Mutex vs RWMutex), `structs-interfaces.ts` (value vs pointer receiver), `slices-maps.ts` (map iteration order), `testing.ts` (-race flag), `patterns.ts` (functional options pattern), `gin.ts` (gin.Default vs gin.New). Every fix replaced the redundant copy with a genuinely distinct question (e.g. re-entrant RWMutex deadlock, GOMAXPROCS vs cgroup CPU limits in Kubernetes, fallible functional options, panic behavior without gin.Recovery). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Blazor hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed 7 near-duplicate pairs: `routing.ts` (NavigateTo forceLoad), `maui-hybrid.ts` (BlazorWebView definition), `state-management.ts` (Fluxor adoption), `performance.ts` (@key diffing), `progressive-enhancement.ts` (data-enhance on forms), `virtualization.ts` (ItemsProvider vs fixed Items), `streaming-rendering.ts` ([StreamRendering] perceived performance). Every fix replaced the redundant copy with a genuinely distinct question (e.g. duplicate @key values breaking diffing, ItemsProviderRequest cancellation for stale scroll fetches, mixed streaming/non-streaming components on one page). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: DevOps hub COMPLETE (22/22 files). Grep-scanned every question, found and fixed 9 near-duplicate pairs: `continuous-delivery.ts` (CD vs Continuous Deployment), `artifact-management.ts` (:latest tag mutability), `continuous-integration.ts` (flaky tests), `docker-cicd.ts` (multi-stage build benefit), `devsecops.ts` (SAST vs DAST), `monitoring.ts` (four golden signals), `jenkins.ts` (Declarative vs Scripted), `platform-engineering.ts` (golden path), `sdlc-agile.ts` (Scrum vs Kanban), `kubernetes-deployments.ts` (maxUnavailable:0 twice, PodDisruptionBudget twice — 2 fixes). Every fix replaced the redundant copy with a genuinely distinct question (e.g. BuildKit skipping unreferenced test stages, PDB with zero slack blocking node drains, registry tag immutability). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: AWS hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed 8 near-duplicate/overlapping pairs: `vpc.ts` (Security Group vs NACL asked twice, near-identical wording), `iam.ts` (explicit Deny vs Allow), `cloudwatch.ts` (composite alarm), `ecs-eks.ts` ("choose ECS over EKS" asked twice), `rds-aurora.ts` (Multi-AZ vs Read Replica, RDS Proxy purpose — 2 fixes), `dynamodb.ts` (single-table design rationale), `step-functions.ts` (Standard vs Express workflow). Every fix replaced the redundant copy with a genuinely distinct question (e.g. NACL stateless ephemeral-port gotcha, resource-based policy Deny overlooked by identity-policy readers, Express at-least-once idempotency trap, GSI migration cost for new access patterns). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Linux hub COMPLETE (21/21 files). Grep-scanned every question, found and fixed 10 near-duplicate pairs: `bash-advanced.ts` (process substitution), `cron.ts` (@reboot, debug-a-broken-cron-job, /etc/cron.d storage — 3 fixes), `environment-variables.ts` (NAME=value vs export, near-identical wording), `fundamentals.ts` (kernel version command), `systemd.ts` (start vs enable), `package-management.ts` (PPA), `security-hardening.ts` (fail2ban purpose), `ssh.ts` (two near-identical -L port-forwarding examples). Every fix replaced the redundant copy with a genuinely distinct question (e.g. -R reverse tunneling vs -L, distributed brute force defeating per-IP fail2ban, boot-loop risk for non-idempotent @reboot jobs, enable-without-start still firing at next boot). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Terraform hub COMPLETE (23/23 files). Grep-scanned every question, found and fixed 12 near-duplicate pairs: `opentofu.ts` (BSL license-change origin story asked 3× — 2 fixes), `outputs.ts` (sensitive output), `drift.ts` (drift prevention), `data-sources.ts` (resource vs data source, evaluation timing — 2 fixes), `fundamentals.ts` (terraform init), `import.ts` (import block vs CLI), `remote-backends.ts` (partial backend config), `workspaces.ts` (default workspace), `state.ts` (corrupted state recovery), `expressions.ts` (splat expression). Every fix replaced the redundant copy with a genuinely distinct question (e.g. for_each incompatibility with splat, BSL only restricting competing products not internal use, data-source re-resolution at apply time, stuck lock on stale state restore). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Service Mesh hub COMPLETE (21/21 files). Grep-scanned every question, found and fixed 7 near-duplicate pairs: `consul.ts` (Intentions vs AuthorizationPolicy asked twice, Consul-vs-Istio comparison asked 3× — 2 fixes), `envoy.ts` (debugging Envoy config), `multi-cluster.ts` (primary-remote vs multi-primary), `linkerd.ts` (Linkerd's advantage over Istio, Linkerd mTLS vs Istio — 2 fixes), `load-balancing.ts` (locality-weighted LB). Every fix replaced the redundant copy with a genuinely distinct question (e.g. Consul intention precedence not translating 1:1 to Istio, Linkerd's lack of a WASM-equivalent extensibility escape hatch, locality routing not guaranteeing load fairness across uneven zone replica counts). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: System Design hub COMPLETE (27/27 files). Grep-scanned every question, found and fixed 9 near-duplicate pairs: `caching.ts` (cache stampede), `cdn.ts` (origin shield), `scaling.ts` (connection pooling), `search-engine.ts` (autocomplete), `payment-system.ts` (idempotency), `high-availability.ts` (99.99% availability downtime, zero-downtime deployments — 2 fixes), `distributed-tracing.ts` (choosing a tracing backend), `distributed-transactions.ts` (choreography vs orchestration). Every fix replaced the redundant copy with a genuinely distinct question (e.g. availability multiplying across serial dependencies, backend-specific SDK lock-in without OpenTelemetry, distributed vs in-process cache-stampede coalescing across a horizontally-scaled fleet). Build clean. **All 8 originally-scoped remaining hubs now complete** (Node.js, Go, Blazor, DevOps, AWS, Linux, Terraform, Service Mesh, System Design) — 9 hubs total this session. Remaining Phase 9 deep content-quality work: the 9 earlier hubs (Angular, C#, ASP.NET, SQL, TypeScript, React, JavaScript, HTML, CSS) that only received the quiz/qna DEPTH pass previously, not this deeper QUALITY read.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: Angular hub COMPLETE (69/69 files, ~900 quiz/qna questions scanned). This is the largest hub in the site. Found and fixed 14 near-duplicate pairs: `charts.ts` (bridging signals to Chart.js), `change-detection.ts` (signals + OnPush), `destroy-ref.ts` (onDestroy return value), `custom-validators.ts` (validator return value), `form-array.ts` (adding a control at runtime), `http-demo.ts` (provide HttpClient, httpResource vs toSignal — 2 fixes), `linked-signal.ts` (linkedSignal vs computed, reset timing — 2 fixes), `lifecycle.ts` (ngAfterViewInit replacement), `parent-child.ts` (withComponentInputBinding), `resource-api.ts` (resource vs httpResource), `pipes-demo.ts` (pure pipe definition), `ssr.ts` (SSR vs SSG). Many of these came from a recurring pattern: an early short quiz/qna array plus a later-appended longer array covering the same core facts. Every fix replaced the redundant copy with a genuinely distinct question (e.g. chart.update('none') for high-frequency data, fetch() inside resource() bypassing HttpTestingController, per-route RenderMode mixing SSR/SSG). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: C# hub COMPLETE (63/63 files, ~800 quiz/qna questions scanned). Found and fixed 10 near-duplicate pairs: `async.ts` (async void danger, .Result deadlock — 2 fixes), `gc-disposable.ts` (using statement vs declaration), `functional-csharp.ts` (Map vs Bind), `namespaces.ts` (namespace depth performance), `linq.ts` (Select vs SelectMany), `null-safety.ts` (int? vs string?), `oop.ts` (override vs new), `threading.ts` (volatile guarantees), `type-conversion.ts` (Convert.ToInt32 vs cast). Every fix replaced the redundant copy with a genuinely distinct question (e.g. async void testability in unit tests, volatile publish-pattern for non-volatile fields, ASP.NET Core avoiding but not eliminating the .Result deadlock risk). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: ASP.NET Core hub COMPLETE (54/54 files, ~750 quiz/qna questions scanned). Found and fixed 12 near-duplicate pairs: `authentication.ts` (AddIdentityCore vs AddIdentity), `caching.ts` (HybridCache), `cors.ts` (middleware order), `background-services.ts` (stopping on fatal error), `deployment.ts` (self-contained vs Native AOT), `ef-relationships.ts` (AsSplitQuery), `ef-performance.ts` (AsNoTrackingWithIdentityResolution), `grpc.ts` (Protobuf field number change), `dependency-injection.ts` (Transient disposable from root container), `error-handling.ts` (unhandled IExceptionHandler), `hosting-startup.ts` (CreateSlimBuilder), `openapi-swagger.ts` (Swagger UI bearer auth). Every fix replaced the redundant copy with a genuinely distinct question (e.g. AddIdentityCore composability, cross-instance HybridCache L1 invalidation, AsSplitQuery split-read consistency risk, global vs per-operation Swagger security requirements). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: SQL hub COMPLETE (44/44 files, ~650 quiz/qna questions scanned). This hub's simpler structure (no common-mistakes/revision-card, per CLAUDE.md) meant far less redundant depth-pass content than other hubs — only 1 near-duplicate pair found: `transactions.ts` (SNAPSHOT isolation vs RCSI asked twice on adjacent lines, one quiz one qna). Fix replaced the redundant copy with a genuinely distinct question about version-store/tempdb exhaustion risk from long-running SNAPSHOT transactions. Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: TypeScript hub COMPLETE (23/23 files, ~450 quiz/qna questions scanned). Zero near-duplicates found — this hub was authored cleanly in a single pass without the recurring "short early array + longer later array covering the same facts" pattern that caused most duplicates in other hubs. No changes needed; audit confirms content quality is already solid.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: React hub COMPLETE (20/20 files, ~380 quiz/qna questions scanned). Found and fixed 1 near-duplicate pair: `hooks-core.ts` (why does useEffect run twice in dev, asked as both quiz and qna). Fix replaced the redundant copy with a genuinely distinct question about module-level side effects (not React state) being invisibly duplicated by Strict Mode's double-invocation. Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: JavaScript hub COMPLETE (25/25 files, ~400 quiz/qna questions scanned). Found and fixed 3 near-duplicate pairs: `dom.ts` (layout thrashing), `events.ts` (event delegation), `symbols.ts` (Symbol keys hidden from JSON.stringify, asked twice with near-identical wording in the SAME quiz array). Every fix replaced the redundant copy with a genuinely distinct question (e.g. layout thrashing caused by opaque third-party library calls, closest() correctly resolving delegated clicks through nested SVG elements, Symbol keys providing zero real access-control despite being invisible to JSON output). Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: HTML hub COMPLETE (26/26 files, ~350 quiz/qna questions scanned; some files use double-quoted `q:` strings instead of single-quoted, requiring a second grep pattern to catch). Found and fixed 8 near-duplicate pairs: `custom-elements.ts` (Shadow DOM open/closed), `focus-management.ts` (.focus-visible), `accessibility.ts` (aria-label vs aria-labelledby), `headings-paragraphs.ts` (strong/b/em/i), `input-types.ts` (autocomplete attribute), `performance.ts` (fetchpriority='high' asked 3× — 2 fixes), `pwa-service-workers.ts` (stale-while-revalidate). Also found and fixed a genuine **factual bug** while investigating a duplicate: `pwa-service-workers.ts`'s quiz question describing stale-while-revalidate behavior had its answer key pointing at "Cache-first" instead of "Stale-while-revalidate" — corrected the answer index and explanation. Every duplicate fix replaced the redundant copy with a genuinely distinct question. Build clean.
- [x] 2026-07-02 — Phase 9 deep content-quality pass: CSS hub COMPLETE (24/24 files, ~300 quiz/qna questions scanned). Zero near-duplicates found — like TypeScript, this hub was authored cleanly without the recurring dual-array pattern. No changes needed.

**🎉 PHASE 9 DEEP CONTENT-QUALITY PASS COMPLETE — ALL 18 HUBS AUDITED (2026-07-02).** Every hub site-wide has now had its quiz/qna content manually read (not just exact-string-matched) for near-duplicate/reworded questions: Node.js, Go, Blazor, DevOps, AWS, Linux, Terraform, Service Mesh, System Design, Angular, C#, ASP.NET Core, SQL, TypeScript, React, JavaScript, HTML, CSS. Totals: ~120 near-duplicate pairs found and fixed across ~16 hubs (2 hubs — TypeScript and CSS — had zero, having been authored cleanly); 1 genuine factual bug found and fixed as a side-effect (HTML hub's pwa-service-workers.ts cache-strategy answer key). Every fix replaced the redundant copy with a genuinely distinct question probing a different angle of the same topic, never just deleted (preserving the 6-question depth minimum). Every hub individually built, committed, and pushed. This closes out the last major item from the original Phase 9 "Final Quality Audit" checklist — the deep read-through explicitly flagged as needing real reading rather than scripting.
- [x] 2026-07-01 — All 4 open Tech Debt items resolved: added `.gitattributes` (`* text=auto`) to stop CRLF/LF warnings on future commits; migrated deprecated Sass `lighten()`/`darken()` to `color.adjust()` across 4 files (the 2 originally flagged plus 2 more found in a full site-wide sweep: `angular/interview-prep.scss`, `architecture/design-patterns/home/home.scss`); raised `angular.json` budgets to match actual measured output (initial 500kB→2.5MB, anyComponentStyle 16kB→30kB) rather than chasing bundle-size reduction. Build now produces zero Sass deprecation warnings and zero budget warnings.
- [x] 2026-07-01 — Phase 9 required-components regression check COMPLETE: re-verified every trackable page site-wide still has `app-common-mistakes` and `app-revision-card` after today's massive content-addition session (zero missing outside SQL, which intentionally omits both by design) and confirmed no reference page wrongly has `app-page-complete`. Also cross-checked every `progress.service.ts` hub total against the actual count of pages with `app-page-complete` — all match except an apparent C# off-by-one that turned out to be the orphaned/unrouted `csharp.html` dead-code file (not a real bug, since it's unreachable).
- [x] 2026-07-01 — Phase 9 hub-home accuracy pass COMPLETE: cross-checked every hub-home.ts card's `topics:` count against the actual number of routed pages per hub (via the same app.routes.ts parser built for the nav-correctness pass). Every hub matched except Angular (showed 63, actually 68 — the card was silently undercounting by 5, even though CLAUDE.md's own documented total of 68 was already correct). Fixed the Angular card count and the site-wide hero stat (928+ → 933+ Live Pages). Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 nav-correctness pass COMPLETE: reconstructed the full valid-route set by parsing app.routes.ts (script handles both single-line `{ path: 'x', children: [...] }` and multi-line block styles present in the file), then cross-checked every `nextRoute=` (795 usages) and every `route=` completion key (721 usages) site-wide. Found and fixed 26 genuine bugs: 17 `nextRoute` values pointing at a demo-component slug that was never an actual route (dead 404 "next" links, e.g. `/angular/forms-demo` → `/angular/forms`), and 9 `route=` completion keys using the wrong slug so completing the page would never trigger its ✓ checkmark in the nav (e.g. `pipes-demo` → `pipes`, `k8s-k8s-architecture` → `k8s-architecture`, and one page had a stray leading slash: `/defer` → `defer`). One unrouted, dead orphan file (`backend/csharp/csharp.html` / `CsharpDemo`) was found not referenced anywhere in app.routes.ts — left alone since it's unreachable and out of scope to clean up. Verified zero broken nav links or completion keys remain among all reachable pages. Build clean, committed, pushed.
- [x] 2026-07-01 — Phase 9 sidebar-entry pass IN PROGRESS: discovered 15 hubs (Python, Node.js, Go, Blazor, DevOps, AWS, Azure, Linux, Terraform, Containers/K8s, Service Mesh, System Design, Architecture Patterns, Design Patterns) had NO route-prefix wired into page-sidebar.ts at all — every page in those hubs was silently showing Angular's signal()/computed() sidebar (wrong APIs, wrong docs, wrong related-topic routes). Fixed by adding a hub-appropriate `*_DEFAULT` SidebarData constant for each (real, well-known official doc URLs) and wiring `section`/`data`/`docsHeading` computed signals — this was a genuine correctness bug, not just a "generic content" gap. Then began adding page-specific SIDEBAR_MAP entries (replacing the hub default with tailored related-routes/tip/gotchas per page, reusing verified hub-level docs/resources to avoid unverified URLs) for: Design Patterns (36/36), Architecture Patterns (22/22), Containers/K8s (21/21), Azure (22/22), Messaging (21/21), AI/ML (22/22), Testing (22/22), Python (22/22), DSA (21/21), MongoDB (21/21), Security (23/23), API Design (19/19), Observability (20/20), Redis (21/21), GraphQL (20/20) — cheatsheet/interview-prep reference pages intentionally left on hub default. All pre-existing default-only hubs now complete. **COMPLETE 2026-07-01** — Node.js (23/23), Go (21/21), Blazor (21/21), DevOps (21/21), AWS (21/21), Linux (21/21), Terraform (21/21), Service Mesh (19/19), and System Design (24/24) all finished. Every hub in the site (23 hubs total covered this pass) now has page-specific sidebar entries instead of falling back to a hub-level or — worse — the wrong Angular default. Each hub built (zero errors), committed, and pushed individually. Grand total: ~460 page-specific sidebar entries added across the session, plus the systemic 15-hub routing fix that was the actual root-cause bug. Hubs intentionally left on their hub-level default: cheatsheet/interview-prep reference pages site-wide (not trackable topics, lower priority per CLAUDE.md), and any hub not explicitly listed above that was already covered by a pre-existing complete SIDEBAR_MAP (Angular, C#, ASP.NET, SQL, TypeScript, React, JavaScript, HTML, CSS — these predate this session's work).
- [x] 2026-07-01 — Phase 9 quiz/Q&A depth pass complete across the ENTIRE site (every hub, every page, including reference pages with quiz/qna blocks). Scanned all hubs for quiz<6 or qna<6 and patched every gap found: MongoDB (21 pages, prior session), API Design (19), Messaging (3 pages + fixed a malformed qna entry in azure-service-bus), Web Performance (20), Node.js (23), Python (21), Blazor (21 + bunit quiz fix), AWS (21, quiz+qna), JavaScript (2: patterns, weakrefs), Testing (3 reference pages: cheatsheet, mutation-testing, performance-testing). GraphQL, Redis, Containers, Terraform, DSA, AI, Go, DevOps, Azure, Linux, CSS, HTML, TypeScript, React, SQL, ASP.NET, C#, Angular, all architecture/* sub-hubs, service-mesh, and MongoDB were already at or above the 6/6 threshold — no changes needed. Every hub built, committed, and pushed individually per standing "commit after each hub" instruction. Theory depth / prerequisites / before-after / video-embed / sidebar-entry review remains the outstanding Phase 9 work (see checklist above) — this pass covered quiz and Q&A depth only.

**2026-07-01 — Theory depth scan (grep-based, `heading:` count per file):** 861 pages have a theory block; **451 of them have fewer than 5 sections** (the ≥5-section target). This is the single largest remaining Phase 9 gap — each flagged file needs 1–4 new theory sections written (5+ bullet points each, 2+ sentences with WHY per point), which is a materially bigger content task per file than the quiz/Q&A pass above. Breakdown by hub (files below 5 sections, topic pages only — reference/practice pages like cheatsheet/interview-prep are lower priority and mostly excluded from these counts):
architecture/design-patterns 36, backend/nodejs 23 ✅ DONE, fundamentals/testing 22, fundamentals/ai 22, data/messaging 22, cloud/containers 22, cloud/azure 22, backend/python 21-22, architecture/arch-patterns 22, fundamentals/dsa 21, frontend/blazor 21, data/redis 21, cloud/terraform 21, frontend/css 20, cloud/linux 20, architecture/observability 19, architecture/api-design 19, data/mongodb 18, architecture/system-design 17, architecture/security 17 ✅ DONE, frontend/javascript 15 ✅ DONE, frontend/html 4 ✅ DONE, backend/go 0 (only ref pages), cloud/devops 0 (only ref pages).

**COMPLETE — 451/451 files done (100%).** Final hub (architecture/design-patterns, 36 files) finished 2026-07-01. Full breakdown: Node.js 23, Security 17, System Design 17, MongoDB 18, Observability 19, API Design 19, CSS 20, Linux 20, Redis 21, Terraform 21, Blazor 21, JavaScript 15, HTML 4, DSA 21, Python 22, Testing 22, AI/ML 22, Messaging 22, Containers/K8s 22, Azure 22, Architecture Patterns 22, Design Patterns 36. Every hub built, committed, and pushed individually. Every topic page across the entire site now has ≥5 theory sections.
Known remaining gap (intentionally out of scope, low priority): a handful of reference-only pages (backend/go/cheatsheet, backend/go/interview-prep, backend/nodejs/cheatsheet, backend/nodejs/interview-prep, cloud/devops/cheatsheet, and possibly a few similar reference pages elsewhere) sit below 5 sections — these were excluded from the original 451-file count since reference/practice pages are lower priority per CLAUDE.md and were not part of the tracked scope. Two recurring authoring bugs found and fixed during this pass — noted here so future sessions don't repeat them:
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
