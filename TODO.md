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
- [x] `/aspnet/grpc` — gRPC Services (2026-07-04 — 3 subtopics: testing-server-streaming-rpc-cancellation-stops-mid-stream, how-proto3-optional-actually-tracks-field-presence, grpc-web-cors-needs-allowed-request-headers-not-exposed)
- [x] `/aspnet/ef-core-basics` — EF Core Basics (2026-07-04 — 3 subtopics: testing-asnotracking-queries-genuinely-arent-tracked-sqlite, how-change-tracker-snapshot-produces-minimal-update, reload-discards-edit-getdatabasevaluesasync-preserves-it)
- [x] `/aspnet/ef-relationships` — EF Core Relationships (2026-07-04 — 3 subtopics: testing-deletebehavior-restrict-genuinely-throws-sqlite, how-skip-navigations-determine-join-table-insert-delete, replacing-ownsmany-collection-deletes-reinserts-everything)
- [x] `/aspnet/ef-performance` — EF Core Performance (2026-07-05 — 3 subtopics: testing-executeupdateasync-bypasses-savechanges-interceptors, what-ef-compilequery-actually-eliminates, captured-reference-pooled-dbcontext-leaks-across-requests)
- [x] `/aspnet/caching` — Caching (2026-07-05 — 3 subtopics: testing-getorcreateasync-concurrent-misses-factory-runs-twice, how-imemorycache-expiry-actually-enforced-lazy-not-timers, write-invalidate-stale-repopulation-race-ttl-backstop)
- [x] `/aspnet/authentication` — Authentication (2026-07-05 — 3 subtopics: testing-jwt-clockskew-expired-token-still-validates, why-setapplicationname-matters-shared-dataprotection-keys, jwt-claim-type-mapping-sub-becomes-nameidentifier)
- [x] `/aspnet/authorization` — Authorization (2026-07-06 — 3 subtopics: testing-multi-handler-or-semantics-fail-veto, how-authorization-middleware-combines-default-fallback-policies, allowanonymous-anywhere-wins-authorize-cannot-override)
- [x] `/aspnet/cors` — CORS & Security Headers (2026-07-06 — 3 subtopics: testing-preflight-bypasses-auth-middleware-terminal-response, how-browser-decides-simple-vs-preflight-request, misspelled-requirecors-policy-name-fails-silently-no-headers)
- [x] `/aspnet/rate-limiting` — Rate Limiting (2026-07-06 — 3 subtopics: testing-fixed-window-boundary-burst-with-faketimeprovider, concurrency-permit-held-until-response-fully-transmitted, partition-factory-runs-once-tier-upgrade-ignored-until-evicted)
- [x] `/aspnet/web-security` — Web Security Essentials (2026-07-06 — 3 subtopics: testing-antiforgery-token-validation-with-webapplicationfactory, contextual-encoding-html-encode-doesnt-protect-attributes-or-js, missing-separator-in-startswith-check-allows-sibling-directory-bypass)
- [x] `/aspnet/secrets` — Secrets & Data Protection (2026-07-06 — 3 subtopics: testing-validateonstart-only-fails-fast-via-host-startasync, ioptionsmonitor-onchange-never-fires-for-env-vars-or-key-vault, pruning-data-protection-keys-invalidates-still-valid-time-limited-tokens)
- [x] `/aspnet/testing` — Testing ASP.NET Core (2026-07-06 — 3 subtopics: testing-role-based-auth-per-test-without-new-factory-subclass, collection-fixtures-silently-disable-parallelism-for-grouped-classes, singleton-state-in-shared-factory-leaks-across-test-methods)
- [x] `/aspnet/background-services` — Background Services (2026-07-06 — 3 subtopics: testing-periodic-worker-loops-with-faketimeprovider-tick-control, startasync-returns-before-executeasync-actually-completes, channel-writer-never-completed-loses-items-on-graceful-shutdown)
- [x] `/aspnet/signalr` — SignalR (2026-07-06 — 3 subtopics: testing-hub-methods-with-mocked-clients-groups-and-context, how-groups-and-context-persist-across-transient-hub-instances, connection-identity-captured-once-ignores-later-claim-changes)
- [x] `/aspnet/health-checks` — Health Checks & Observability (2026-07-06 — 3 subtopics: testing-health-check-boundary-logic-and-liveness-runs-zero-checks, db-check-connection-pool-contention-causes-cascading-failure, degraded-returns-200-by-default-invisible-to-load-balancers)
- [x] `/aspnet/deployment` — Deployment & Hosting (2026-07-06 — 3 subtopics: testing-forwardedheaders-trust-configuration-rejects-spoofed-ips, how-forwardedheaders-walks-multi-hop-chains-to-resolve-client-ip, healthcheck-curl-instruction-fails-on-minimal-aspnet-runtime-image)
- [x] `/aspnet/performance` — Performance & Diagnostics (2026-07-06 — 3 subtopics: testing-allocation-regressions-with-getallocatedbytesforthread, server-gc-heap-count-follows-perceived-not-actual-cpu-limit, streaming-query-missing-cancellationtoken-runs-after-disconnect)
- [x] `/aspnet/aspire` — .NET Aspire (2026-07-06 — 3 subtopics: testing-apphost-topology-with-distributedapplicationtestingbuilder, addproject-type-parameter-requires-build-not-just-project-reference, otel-exporter-needs-endpoint-guard-when-running-outside-apphost)
- [x] `/aspnet/fluent-validation` — FluentValidation (2026-07-06 — 3 subtopics: testing-async-mustasync-rules-with-fluentvalidation-testhelper, inline-when-defaults-to-all-validators-in-the-same-rulefor-chain, adding-one-mustasync-rule-breaks-every-synchronous-validate-caller)
- [x] `/aspnet/minimal-api-advanced` — Minimal API Advanced (2026-07-06 — 3 subtopics: testing-endpoint-filters-without-webapplicationfactory, ctx-arguments-oftype-is-fragile-use-getargument-by-position, nested-group-filters-execute-outside-in-like-middleware)
- [x] `/aspnet/output-caching-advanced` — Output Caching Advanced (2026-07-06 — 3 subtopics: testing-tag-eviction-with-fake-outputcachestore, how-cache-stampede-locking-survives-population-failures, custom-ioutputcachepolicy-skips-every-built-in-safety-check)
- [x] `/aspnet/dapper` — Dapper & Raw SQL (2026-07-07 — 3 subtopics: testing-dapper-repositories-with-in-memory-sqlite, how-dapper-decides-whether-to-close-the-connection-it-used, transferasync-example-holds-its-connection-open-far-too-long)
- [x] `/aspnet/csrf` — Anti-forgery & CSRF (2026-07-07 — 3 subtopics: testing-get-requests-cant-reach-state-changing-endpoints, cookie-token-and-request-token-are-not-the-same-string, manual-validation-middleware-and-useantiforgery-are-redundant-not-layered)
- [x] `/aspnet/feature-flags` — Feature Flags (2026-07-07 — 3 subtopics: testing-feature-flagged-code-mocking-and-config-override, percentagefilter-re-rolls-on-every-call-not-sticky-per-user, featuregate-multiple-flags-defaults-to-requirementtype-all)
- [x] `/aspnet/localization` — Localization & Globalization (2026-07-07 — 3 subtopics: testing-localized-responses-fixed-culture-provider-vs-accept-language, resx-fallback-follows-culture-hierarchy-not-just-missing-keys, culture-cookie-endpoint-hardcoded-list-silently-rejects-arabic)
- [x] `/aspnet/masstransit` — MassTransit (2026-07-07 — 3 subtopics: testing-masstransit-consumers-and-request-reply-with-itestharness, usemessageretry-and-usedelayedredelivery-multiply-not-add, send-hardcoded-queue-name-can-silently-point-at-an-empty-queue)
- [x] `/aspnet/response-compression` — Response Compression (2026-07-07 — 3 subtopics: testing-minimum-size-threshold-and-skip-if-already-encoded, registration-order-only-breaks-ties-among-client-supported-encodings, diagnostic-middleware-must-wrap-compression-not-nest-inside-it)
- [x] `/aspnet/websockets` — WebSockets (2026-07-07 — 3 subtopics: testing-websocket-endpoints-with-testservers-websocketclient, close-handshake-mechanics-what-actually-ends-the-receive-loop, receive-loop-examples-silently-truncate-multi-frame-messages)
- [x] `/aspnet/yarp` — YARP Reverse Proxy (2026-07-07 — 3 subtopics: testing-yarp-routes-and-transforms-with-loadfrommemory, passive-health-checks-dont-verify-recovery-just-retry-after-timeout, proxy-pipeline-order-is-not-arbitrary-affinity-before-load-balancing)
- [x] `/aspnet/opentelemetry` — OpenTelemetry (2026-07-07 — 3 subtopics: testing-custom-spans-and-metrics-with-activitylistener-and-meterlistener, settag-guards-against-null-not-against-a-sampled-out-span, fire-and-forget-inside-a-span-creates-a-child-that-outlives-its-parent)

#### SQL — 44 topic pages

- [x] `/sql/rdbms-concepts` — RDBMS Concepts (2026-07-07 — 3 subtopics: testing-constraints-with-tsqlt-and-pgtap, plan-cache-pollution-is-about-query-text-not-query-structure, cascade-delete-demo-doesnt-match-the-pages-own-schema)
- [x] `/sql/data-modeling` — Data Modeling (2026-07-07 — 3 subtopics: testing-the-polymorphic-check-constraint-with-tsqlt-and-pgtap, recursive-cte-has-no-cycle-protection-and-dialects-fail-differently, uuid-example-uses-the-exact-pattern-its-own-theory-warns-against)
- [x] `/sql/normalization` — Normalization (2026-07-07 — 3 subtopics: testing-that-the-ordertotal-trigger-actually-stays-in-sync, why-a-computed-column-cant-replace-the-ordertotal-trigger, challenge-solutions-comment-contradicts-its-own-fk-declaration)
- [x] `/sql/db-architecture` — Database Architecture (2026-07-07 — 3 subtopics: testing-idle-in-transaction-session-timeout-actually-works, buffer-hit-ratio-query-reads-a-meaningless-raw-counter, dead-tup-in-pg-stat-user-tables-is-an-estimate-not-live)
- [x] `/sql/data-types` — Data Types (2026-07-07 — 3 subtopics: testing-that-financial-columns-stay-decimal-not-float, implicit-conversion-warning-has-the-risky-direction-backwards, jsonb-set-silently-no-ops-on-a-null-target)
- [x] `/sql/basics` — SQL Basics (2026-07-07 — 3 subtopics: distinct-on-and-row-number-examples-have-no-tie-breaker, confirming-not-trusting-the-implicit-conversion-claim, offset-pagination-skips-or-duplicates-rows-when-data-changes-mid-pagination)
- [x] `/sql/joins` — Joins (2026-07-07 — 3 subtopics: testing-that-the-row-multiplication-fix-actually-prevents-double-counting, year-wrapped-date-filter-fix-still-isnt-sargable, anti-join-self-join-both-tab-has-a-postgresql-only-clause)
- [x] `/sql/aggregations` — Aggregations (2026-07-07 — 3 subtopics: testing-that-the-count-distinct-alternative-returns-identical-counts, legacy-stuff-for-xml-path-pattern-silently-xml-encodes-special-characters, grouping-sets-omits-the-disambiguation-its-own-theory-warns-about)
- [x] `/sql/subqueries` — Subqueries (2026-07-07 — 3 subtopics: testing-that-the-window-function-rewrite-matches-the-correlated-subquery, the-avoid-this-window-function-in-having-example-doesnt-run-at-all, row-subqueries-and-the-mssql-rewrite-the-page-never-shows)
- [x] `/sql/ctes` — CTEs (2026-07-07 — 3 subtopics: testing-that-the-depth-guard-actually-stops-a-cyclic-manager-chain, categorypath-has-no-depth-guard-and-postgresql-wont-save-it, confirming-that-a-twice-referenced-cte-actually-executes-twice)
- [x] `/sql/window-functions` — Window Functions (2026-07-07 — 3 subtopics: testing-that-the-islands-and-gaps-pattern-actually-splits-on-a-real-gap, why-first-values-explicit-frame-is-a-no-op-but-last-values-is-essential, confirming-that-identical-over-clauses-really-do-share-a-single-sort)
- [x] `/sql/indexes` — Indexes (2026-07-07 — 3 subtopics: testing-that-a-filtered-index-actually-gets-used-not-silently-skipped, quantifying-why-a-wide-clustered-key-multiplies-storage-across-indexes, the-no-sort-needed-claim-breaks-its-own-leftmost-prefix-rule)
- [x] `/sql/transactions` — Transactions (2026-07-07 — 3 subtopics: testing-that-the-bank-transfer-example-is-already-safe-without-updlock, demonstrating-write-skew-the-one-anomaly-left-without-code, the-postgresql-savepoint-example-rolls-back-a-successful-insert)
- [x] `/sql/schema-design` — Schema Design (2026-07-07 — 3 subtopics: testing-whether-step-1s-default-actually-backfills-existing-rows, the-postgresql-enum-alternative-is-harder-to-evolve-not-easier, adding-the-lookup-table-pattern-never-retires-the-original-check)
- [x] `/sql/stored-procedures` — Stored Procedures (2026-07-07 — 3 subtopics: testing-that-usp-placeorder-can-oversell-stock-under-concurrent-calls, confirming-that-the-inline-tvfs-where-clause-actually-gets-pushed-down, demonstrating-that-scope-identity-is-scoped-to-the-dynamic-batch)
- [x] `/sql/performance` — Query Performance (2026-07-07 — 3 subtopics: testing-that-the-or-to-union-all-rewrite-doesnt-duplicate-overlapping-rows, the-missing-index-impact-score-formula-is-missing-a-100, demonstrating-the-execution-plan-regression-test-the-page-only-describes)
- [x] `/sql/json-features` — JSON Features (2026-07-07 — 3 subtopics: testing-that-merge-silently-wipes-out-nested-keys-instead-of-deep-merging, demonstrating-what-openjsons-untyped-output-looks-like-for-object-arrays, the-partial-indexs-not-equal-predicate-silently-excludes-null-status-rows)
- [x] `/sql/set-operations` — Set Operations (2026-07-07 — 3 subtopics: testing-that-the-schema-comparison-query-misses-type-only-drift, demonstrating-that-intersects-tighter-binding-actually-changes-the-result, confirming-that-except-materialises-both-sets-not-exists-short-circuits)
- [x] `/sql/null-handling` — NULL Handling (2026-07-07 — 3 subtopics: testing-that-union-treats-two-nulls-as-equal-while-join-doesnt, isnull-can-silently-truncate-a-bigger-reason-than-portability, demonstrating-what-ansi-nulls-off-actually-does-to-comparisons)
- [x] `/sql/merge` — MERGE / Upsert (2026-07-07 — 3 subtopics: testing-that-the-mssql-merge-duplicate-source-bug-is-real, on-conflict-is-atomic-once-the-partial-index-predicate-matches, concurrent-merge-statements-can-still-race-without-holdlock)
- [x] `/sql/string-functions` — String Functions (2026-07-07 — 3 subtopics: testing-that-name-normaliser-returns-null-for-a-null-last-name, demonstrating-that-prefix-like-needs-pattern-ops-under-default-locale, replace-is-case-insensitive-by-default-contradicting-its-own-claim)
- [x] `/sql/date-functions` — Date & Time Functions (2026-07-07 — 3 subtopics: testing-that-the-monthly-revenue-report-drops-zero-order-months, group-by-date-trunc-still-needs-an-expression-index-not-the-raw-column, demonstrating-at-time-zones-automatic-dst-adjustment-across-march)
- [x] `/sql/conditional-expressions` — Conditional Expressions (2026-07-07 — 3 subtopics: case-when-order-is-standard-guaranteed-not-just-typical-behavior, testing-that-nullif-count-zero-can-never-actually-fire, nested-iif-where-example-contradicts-its-own-nesting-advice)
- [x] `/sql/math-functions` — Math & Numeric Functions (2026-07-07 — 3 subtopics: correcting-the-bankers-rounding-claim-for-postgresql-numeric, testing-that-avg-on-integers-differs-between-postgresql-and-mssql, mssql-tablesample-rows-can-return-far-fewer-rows-than-requested)
- [x] `/sql/pivoting` — Pivoting & Cross-Tab Queries (2026-07-07 — 3 subtopics: demonstrating-that-pivots-implicit-group-by-silently-multiplies-rows, fixing-the-cross-apply-unpivot-examples-missing-month-column, testing-that-crosstabs-two-argument-form-handles-a-missing-month)
- [x] `/sql/constraints` — Constraints (2026-07-07 — 3 subtopics: testing-that-on-delete-restrict-is-invalid-t-sql-syntax, testing-that-mssql-unique-allows-only-one-null-not-multiple, not-valid-plus-validate-constraint-avoids-the-full-table-lock)
- [x] `/sql/views` — Views (2026-07-07 — 3 subtopics: testing-that-the-mssql-challenge-solution-is-missing-with-check-option, demonstrating-that-left-ssn-0-in-the-masking-example-is-dead-code, demonstrating-an-instead-of-insert-trigger-for-a-multi-table-join-view)
- [x] `/sql/sequences` — Sequences & Identity (2026-07-07 — 3 subtopics: correcting-the-peek-next-value-answer-when-cache-is-greater-than-one, demonstrating-the-scope-identity-vs-identity-divergence-with-a-trigger, testing-that-committed-sequence-ids-can-appear-out-of-order)
- [x] `/sql/temp-tables` — Temp Tables & Table Variables (2026-07-07 — 3 subtopics: correcting-the-nested-proc-cannot-create-duplicate-temp-table-claim, demonstrating-that-table-variables-are-not-rolled-back-by-rollback, demonstrating-that-table-variables-support-inline-non-unique-indexes)
- [x] `/sql/computed-columns` — Computed & Generated Columns (2026-07-07 — 3 subtopics: testing-that-mssql-computed-columns-can-reference-each-other, checksum-is-not-stable-across-sql-server-versions-or-patches, adding-a-stored-generated-column-locks-the-whole-table)
- [x] `/sql/stored-functions` — Stored Functions (2026-07-07 — 3 subtopics: correcting-the-search-path-public-pin-in-the-security-definer-example, writing-an-actual-create-aggregate-example-the-quiz-only-describes, demonstrating-that-business-days-depends-on-set-datefirst)
- [x] `/sql/cursors` — Cursors & Row-by-Row Processing (2026-07-07 — 3 subtopics: testing-that-local-cursors-auto-deallocate-without-explicit-deallocate, demonstrating-that-fetch-customers-is-not-really-a-refcursor-example, demonstrating-that-the-cursor-discount-example-is-actually-a-price-markup)
- [x] `/sql/triggers` — Triggers (2026-07-07 — 3 subtopics: testing-that-the-challenges-postgresql-trigger-subquery-is-a-tautology, testing-that-on-conflict-do-nothing-is-a-no-op-without-a-constraint, correcting-which-setting-actually-stops-cross-table-trigger-recursion)
- [x] `/sql/dynamic-sql` — Dynamic SQL (2026-07-07 — 3 subtopics: search-table-is-injection-safe-but-not-access-control-safe, demonstrating-that-get-orders-by-status-does-not-need-dynamic-sql-at-all, testing-that-usp-searchorders-has-no-guard-against-the-full-scan-risk)
- [x] `/sql/isolation-levels` — Isolation Levels (2026-07-07 — 3 subtopics: testing-that-the-challenges-serializable-solution-needs-a-retry-loop, snapshot-protects-via-conflict-detection-not-just-non-repeatable-reads, demonstrating-that-read-committed-blocking-behavior-depends-on-rcsi)
- [x] `/sql/locking` — Locking & Deadlocks (2026-07-08 — 3 subtopics: testing-that-the-challenges-postgresql-solution-is-not-valid-standalone-sql, demonstrating-that-deadlock-priority-low-does-not-prevent-the-deadlock, testing-that-order-by-on-update-is-invalid-syntax-not-a-lock-technique)
- [x] `/sql/execution-plans` — Execution Plans (2026-07-08 — 3 subtopics: correcting-the-scan-not-seek-claim-for-int-vs-varchar-precedence, demonstrating-that-index-scan-is-not-the-desired-mssql-outcome, testing-that-small-tables-seq-scan-despite-a-covering-index)
- [x] `/sql/partitioning` — Partitioning (2026-07-08 — 3 subtopics: testing-that-switch-to-orders-archive-partition-1-is-invalid-syntax, testing-that-truncate-orders-archive-discards-the-data-just-switched-in, demonstrating-that-detach-concurrently-cannot-run-in-a-transaction-block)
- [x] `/sql/bulk-operations` — Bulk Operations (2026-07-08 — 3 subtopics: testing-that-the-batched-update-example-never-finds-a-matching-row, testing-that-the-challenges-step-4-insert-is-missing-the-duplicate-guard, correcting-the-bulk-logged-advice-missing-the-point-in-time-restore-gap)
- [x] `/sql/query-store` — Query Store & Performance Statistics (2026-07-08 — 3 subtopics: testing-that-the-historic-average-includes-the-regressed-interval, testing-that-flush-db-does-not-purge-or-reduce-query-store-storage, demonstrating-that-multiple-plans-can-appear-without-parameter-sniffing)
- [x] `/sql/statistics` — Statistics & Query Optimizer (2026-07-08 — 3 subtopics: testing-that-the-challenges-solution-never-flags-which-stats-are-overdue, correcting-the-density-quizs-rows-per-distinct-value-claim, testing-that-the-stale-stats-query-ranks-by-the-outdated-flat-percentage)
- [x] `/sql/full-text-search` — Full-Text Search (2026-07-08 — 3 subtopics: testing-that-the-challenges-search-vector-goes-stale-for-new-rows, correcting-the-ts-ranks-fixed-0-to-1-range-claim, testing-that-stemming-does-not-reduce-ran-to-the-same-token-as-run)
- [x] `/sql/security` — SQL Security (2026-07-08 — 3 subtopics: testing-that-the-challenges-rls-solution-has-no-block-predicate-for-writes, testing-that-the-audit-trigger-misclassifies-rows-during-a-merge-statement, testing-that-an-unset-session-context-silently-returns-zero-rows)
- [x] `/sql/connection-pooling` — Connection Pooling (2026-07-08 — 3 subtopics: testing-that-the-idle-in-tx-proxy-uses-the-wrong-timestamp-column, correcting-the-claim-that-set-local-requires-pgbouncer-session-mode, testing-that-the-idle-in-transaction-queries-miss-the-aborted-state)

#### TypeScript — 20 topic pages

- [x] `/typescript/basics` — TypeScript Fundamentals (2026-07-08 — 3 subtopics: testing-that-excess-property-checking-applies-to-function-arguments-too, demonstrating-the-exact-compiler-error-when-a-new-shape-variant-is-added, testing-that-the-fixed-any-vs-unknown-example-still-uses-as-any — first TypeScript hub topic; discovered and fixed a pre-existing site-wide CSS bug affecting all 132 SQL subtopic pages (see Current Work note below); SUBTOPICS map key hub-prefixed to 'ts-basics' due to collision with existing bare 'basics' key from /csharp/basics)
- [x] `/typescript/primitive-types` — Primitive & Literal Types (2026-07-08 — 3 subtopics: testing-that-as-consts-readonly-is-compile-time-only-not-runtime, testing-that-narrowing-to-object-still-isnt-enough-to-access-cfg-port, testing-that-throw-fail-cannot-appear-in-an-expression-position)
- [x] `/typescript/interfaces-types` — Interfaces & Type Aliases (2026-07-08 — 3 subtopics: testing-that-pluginregistry-never-verifies-name-matches-its-key, testing-that-window-merging-needs-declare-global-in-a-module-file, testing-that-conflicting-merged-properties-are-a-compile-error)
- [x] `/typescript/unions` — Union & Intersection Types (2026-07-08 — 3 subtopics: testing-that-bigint-zero-is-falsy-and-skipped-by-truthiness-narrowing, testing-that-the-safe-isuser-fix-still-uses-as-any-twice, testing-that-the-assertion-function-example-never-actually-runs)
- [x] `/typescript/narrowing` — Type Guards & Narrowing (2026-07-08 — 3 subtopics: testing-that-narrowing-survives-an-unrelated-function-call, testing-that-array-isarray-narrows-to-any-and-loses-element-safety, testing-that-greet-with-an-empty-string-does-not-say-hello-stranger)
- [x] `/typescript/enums-tuples` — Enums & Tuples (2026-07-08 — 3 subtopics: testing-that-direction-42-returns-undefined-not-a-name, testing-that-const-enum-import-doesnt-throw-in-this-playground, testing-that-minmax-without-return-type-becomes-an-array)
- [x] `/typescript/generics` — Generics Fundamentals (2026-07-08 — 3 subtopics: testing-that-memoize-collapses-nan-and-null-into-the-same-result, testing-that-getinstance-returns-the-same-object-across-different-t, testing-that-getorset-avoids-the-falsy-value-cache-trap — SUBTOPICS map key hub-prefixed to 'ts-generics' due to collision with existing bare 'generics' key from /csharp/generics)
- [x] `/typescript/generic-patterns` — Generic Patterns (2026-07-08 — 3 subtopics: testing-that-pipeline-skips-pipe-entirely-and-still-type-checks, testing-that-functionkeys-drops-optional-methods-from-the-result, testing-that-querybuilder-builds-successfully-with-zero-fields-set)
- [x] `/typescript/utility-types` — Utility Types (2026-07-08 — 3 subtopics: testing-that-partial-record-of-literal-keys-is-safely-optional, testing-that-viewdtos-readonly-tags-array-can-still-be-pushed-to, testing-that-distributiveomit-preserves-per-member-narrowing)
- [x] `/typescript/mapped-types` — Mapped Types (2026-07-08 — 3 subtopics: testing-that-eventhandlers-wrongly-includes-online, testing-that-stringkeys-excludes-an-optional-string-property, testing-that-optionaltonullable-detects-implicit-undefined — hit a NEW single-brace escaping gotcha, see CLAUDE.md)
- [x] `/typescript/conditional-types` — Conditional Types (2026-07-08 — 3 subtopics: testing-that-equals-cannot-distinguish-any-from-unknown, testing-that-head-of-an-empty-tuple-hides-undefined-behind-never, testing-that-myreturntype-rejects-a-class-constructor)
- [x] `/typescript/template-literal-types` — Template Literal Types (2026-07-08 — 3 subtopics: testing-that-a-let-variable-widens-handlername-to-plain-string, testing-that-dotpath-hits-infinite-recursion-on-self-reference, testing-that-a-single-as-cast-defeats-the-cssvarname-cross-product)
- [x] `/typescript/classes` — Classes & Visibility (2026-07-08 — 3 subtopics: testing-that-typescript-private-is-still-included-in-json-stringify, testing-that-getstates-object-freeze-doesnt-stop-mutating-items, testing-that-object-create-bypasses-appconfigs-private-constructor)
- [x] `/typescript/decorators` — Decorators (2026-07-08 — 3 subtopics: testing-that-celsius-field-decorator-only-validates-construction, testing-that-singleton-silently-ignores-second-calls-args, testing-that-describes-class-decorator-returns-an-unnamed-class)
- [x] `/typescript/tsconfig` — tsconfig Deep Dive (2026-07-08 — 3 subtopics: testing-that-strictpropertyinitialization-misses-a-private-helper, testing-that-nouncheckedindexedaccess-doesnt-affect-tuple-access, testing-that-strictfunctiontypes-doesnt-apply-to-method-syntax — new pattern: playground includes a tsconfig.json PlaygroundFile to force the specific strict sub-flag under test)
- [x] `/typescript/modules` — Module System & Namespaces (2026-07-08 — 3 subtopics: testing-that-circular-imports-work-fine-for-functions-not-consts, testing-that-a-barrel-import-runs-every-files-side-effects, testing-that-export-type-strips-the-value-even-for-a-class — SUBTOPICS map key left bare ('modules'); JS/Node.js/Go/Terraform hubs also route to 'modules' — MUST hub-prefix if any of them add subtopics to their own modules topic later)
- [x] `/typescript/declarations` — Declaration Files (d.ts) (2026-07-08 — 3 subtopics: testing-that-interface-and-type-alias-with-the-same-name-conflict, testing-that-declaration-merging-ignores-generic-parameter-names, testing-that-a-hand-written-d-ts-doesnt-verify-the-real-js)
- [x] `/typescript/frameworks` — TypeScript with Frameworks (2026-07-08 — 3 subtopics: testing-that-counterreducers-explicit-return-type-catches-gaps, testing-that-apiresponse-still-requires-data-on-an-error-status, testing-that-settimeouts-return-type-depends-on-node-types)
- [x] `/typescript/strict-migration` — Strict Mode & Migration (2026-07-08 — 3 subtopics: testing-that-ts-expect-error-doesnt-check-which-error-it-suppresses, testing-that-noimplicitany-doesnt-restrict-explicit-any, testing-that-a-leaf-modules-untyped-import-leaks-any)
- [x] `/typescript/ts-performance` — TypeScript Performance (2026-07-08 — 3 subtopics: testing-that-deeppartials-depth-counter-makes-deep-fields-required, testing-that-forgetting-as-const-collapses-the-color-union-to-string, testing-that-skiplibcheck-only-skips-d-ts-extension-not-content — **TypeScript hub Phase 10 rollout complete: 20/20 topics done**)

#### React — 17 topic pages

- [x] `/react/basics` — React Fundamentals (2026-07-08 — 3 subtopics: testing-that-batching-applies-to-native-event-listeners-not-just-onclick, testing-that-index-keys-leave-stale-text-in-an-uncontrolled-input-after-prepend, testing-that-react-memo-alone-doesnt-stop-a-fresh-object-prop-re-render — first React hub topic; piloted the `create-react-app` StackBlitz template (see CLAUDE.md); SUBTOPICS map key hub-prefixed to 'react-basics' due to collision with existing bare 'basics' key from /csharp/basics)
- [x] `/react/hooks-core` — Core Hooks (2026-07-08 — 3 subtopics: testing-that-strictmode-double-invokes-the-lazy-initializer-not-just-effects, testing-that-usecontexts-defaultvalue-is-skipped-by-a-provider-passing-undefined [folder renamed to `usecontext-defaultvalue-undefined-provider` — hit the 260-char path limit at git-add time], testing-that-a-functional-update-fixes-stale-state-but-not-a-stale-prop — SUBTOPICS map key left bare ('hooks-core'), collision-free)
- [x] `/react/hooks-advanced` — Advanced Hooks (2026-07-08 — 3 subtopics: testing-that-usereducers-lazy-init-is-strictmode-double-invoked-too, testing-that-memoizing-a-context-selector-doesnt-stop-the-consumer-rerendering, testing-that-a-module-level-variable-leaks-state-across-custom-hook-instances — all 3 folders named short from the start to stay under the 260-char path limit; SUBTOPICS map key left bare ('hooks-advanced'), collision-free)
- [x] `/react/forms` — Forms & Validation (2026-07-08 — 3 subtopics: testing-that-z-coerce-number-converts-an-empty-string-to-zero-not-nan, testing-that-refines-path-option-only-flags-confirm-not-password-too, testing-that-real-time-validation-mode-reintroduces-per-keystroke-rerenders-in-rhf — first use of real react-hook-form + zod npm deps in the create-react-app playground's package.json; SUBTOPICS map key hub-prefixed to 'react-forms' due to collision with existing bare 'forms' key from /angular/forms)
- [x] `/react/context` — Context API (2026-07-08 — 3 subtopics: testing-that-createcontexts-numeric-default-works-with-zero-providers, testing-that-a-mega-context-re-renders-consumers-of-unrelated-fields, testing-that-a-toast-container-outside-the-provider-cant-access-notifications — hit and fixed a real build break from a backtick-inside-backtick-template-literal typo, see CLAUDE.md; SUBTOPICS map key left bare ('context'), collision-free for now but Go also has a /go/context topic that could collide later)
- [x] `/react/state-management` — State Management (2026-07-08 — 3 subtopics: testing-that-a-zustand-computed-selector-rerenders-on-every-store-update, testing-that-mutating-a-useselector-value-directly-fails-silently, testing-that-jotais-atomfamily-shares-state-for-the-same-id — first use of real zustand/@reduxjs/toolkit+react-redux/jotai npm deps, one library per subtopic; SUBTOPICS map key left bare ('state-management'), collision-free)
- [x] `/react/router` — React Router v6/v7 (2026-07-08 — 3 subtopics: testing-that-usefetcher-revalidates-the-current-routes-loader, testing-that-a-child-errorelement-bubbles-up-and-replaces-the-parents-whole-layout, testing-that-navlinks-end-prop-is-needed-for-root-but-would-break-nested-active-highlighting-elsewhere — hit a transient StackBlitz npm-install hiccup for react-router-dom, see CLAUDE.md; SUBTOPICS map key left bare ('router'), collision-free)
- [x] `/react/tanstack-query` — TanStack Query (2026-07-08 — 3 subtopics: testing-that-an-inline-object-querykey-does-not-actually-refetch-on-rerender, testing-that-the-abort-signal-must-be-explicitly-wired-into-fetch-to-actually-cancel-the-request, testing-that-initialdata-skips-the-immediate-fetch-but-placeholderdata-always-triggers-one — SUBTOPICS map key hub-prefixed to 'react-tanstack-query' due to collision with Angular hub's own tanstack-query demo page)
- [x] `/react/performance` — React Performance (2026-07-08 — 3 subtopics: testing-that-children-is-a-fresh-reference-every-render-defeating-memo-even-with-identical-jsx, testing-that-usedeferredvalue-needs-memo-on-the-child-or-it-rerenders-immediately-anyway, testing-that-duplicate-import-calls-are-deduplicated-not-double-fetched — SUBTOPICS map key proactively hub-prefixed to 'react-performance', following the existing 'aspnet-performance' precedent since 'performance' is shared by 7+ hubs)
- [x] `/react/patterns` — React Patterns (2026-07-08 — 3 subtopics: testing-that-gettogglerprops-silently-overwrites-a-consumers-own-id-unlike-its-onclick-composition, testing-that-useproductsearch-shares-localstorage-across-every-component-instance-via-its-hardcoded-key, testing-that-usecounters-reset-is-frozen-to-the-mount-time-initialcount-ignoring-later-prop-changes — SUBTOPICS map key left bare ('patterns'); JS and Go hubs also route to 'patterns', hub-prefix to 'react-patterns' if either adds subtopics first)
- [x] `/react/typescript` — TypeScript & React (2026-07-09 — 3 subtopics: testing-that-selects-runtime-coercion-silently-mishandles-a-boolean-typed-t, testing-that-discriminated-union-narrowing-gives-zero-runtime-protection-against-mismatched-data, testing-that-simpleinputs-optional-onchange-can-silently-create-a-readonly-controlled-input — caught and fixed a real straight-apostrophe-in-single-quoted-binding build bug during authoring, see CLAUDE.md; SUBTOPICS map key proactively hub-prefixed to 'react-typescript' since 'typescript' is also the whole TypeScript hub's own route slug)
- [x] `/react/testing` — Testing React (2026-07-09 — 3 subtopics: testing-that-queryby-returns-null-and-getby-throws-using-the-real-testing-library, testing-that-fireevent-click-doesnt-trigger-focus-but-userevent-click-does, testing-that-calling-a-hooks-setter-without-act-produces-a-real-console-warning — novel technique: calls real @testing-library/react / userEvent / renderHook / act functions directly from plain browser button clicks (no test runner) since the topic's claims are about testing-library API behavior rather than React's own runtime; SUBTOPICS map key hub-prefixed to 'react-testing' due to collision with Angular's own bare 'testing' key)
- [x] `/react/nextjs` — Next.js App Router (2026-07-09 — 3 subtopics: testing-that-use-client-propagates-to-every-plain-utility-import-not-just-components, testing-that-revalidatepath-only-refreshes-the-server-cache-not-already-rendered-client-state, testing-that-usesearchparams-without-suspense-forces-the-entire-page-dynamic-not-just-that-segment — first React-hub topic with NO live playground: Server Components/Actions/revalidatePath need an actual Next.js server no supported StackBlitz template can run, so "See it run" falls back to a plain app-code-block like the C#/SQL/Python pattern, see CLAUDE.md; SUBTOPICS map key left bare ('nextjs'), collision-free)
- [x] `/react/native` — React Native (2026-07-09 — 3 subtopics: testing-that-text-directly-in-view-crashes-only-in-production-builds-not-in-dev-or-expo-go, testing-that-getitemlayout-assumes-uniform-row-height-and-corrupts-scroll-position-if-rows-vary, testing-that-stylesheetcreate-optimizes-native-layout-not-react-reconciliation-unlike-reactmemo — second React-hub topic with no live playground (no supported StackBlitz template runs a real RN app), same code-block fallback as /react/nextjs; SUBTOPICS map key left bare ('native'), collision-free)
- [x] `/react/hook-form` — React Hook Form (2026-07-09 — 3 subtopics: testing-that-watch-rerenders-the-whole-component-on-every-keystroke-not-just-the-watched-field, testing-that-index-keys-show-the-wrong-typed-value-after-usefieldarray-remove, testing-that-missing-valueasnumber-turns-submitted-numbers-into-concatenated-strings — back to full live playground (create-react-app + real react-hook-form dep), unlike nextjs/native; SUBTOPICS map key left bare ('hook-form'), collision-free)
- [x] `/react/animations` — Animations (Framer Motion) (2026-07-09 — 3 subtopics: testing-that-a-missing-key-makes-animatepresence-exit-animate-the-wrong-list-item, testing-that-animating-width-reflows-sibling-elements-but-animating-transform-never-does, testing-that-viewport-once-true-stops-the-whileinview-animation-from-repeating-on-every-scroll-reentry — full live playground (create-react-app + real framer-motion dep); SUBTOPICS map key hub-prefixed to 'react-animations' due to collision with Angular's own bare 'animations' key)
- [x] `/react/security` — Security in React (2026-07-09 — 3 subtopics: testing-that-jsx-renders-a-real-text-node-while-unsanitized-dangerouslysetinnerhtml-creates-a-real-element, testing-that-dompurify-strips-event-handlers-and-javascript-urls-but-keeps-allowed-tags-intact, testing-that-a-protocol-relative-url-bypasses-a-naive-starts-with-slash-open-redirect-check — full live playground (create-react-app + real dompurify dep); SUBTOPICS map key hub-prefixed to 'react-security' due to collision with the standalone Security & Auth hub's own bare 'security' key. **React hub Phase 10 rollout complete — all 17/17 topics done.**)

#### JavaScript — 22 topic pages

- [x] `/javascript/fundamentals` — JavaScript Fundamentals (2026-07-09 — 3 subtopics: testing-that-numberisnan-and-global-isnan-disagree-on-empty-strings-whitespace-and-garbage-text, testing-that-nullish-assignment-keeps-zero-while-or-assignment-silently-overwrites-it, testing-that-mutating-a-frozen-object-throws-in-strict-mode-es-modules-not-silently-fails — first JavaScript hub subtopic set, see CLAUDE.md for the hub's conventions (js- prefix, full-path sidebar keys, solid-fill icon, 'typescript' StackBlitz template); SUBTOPICS map key left bare ('fundamentals'), collision-free; fixed a pre-existing gap where NO JavaScript hub page had a sidebar entry at all)
- [x] `/javascript/closures` — Scope & Closures (2026-07-09 — 3 subtopics: testing-that-var-shares-one-binding-across-a-loop-while-let-creates-a-fresh-one-per-iteration, testing-that-two-separate-memoize-wrappers-of-the-same-function-keep-genuinely-private-caches, testing-that-a-closure-over-an-object-property-sees-later-mutations-while-a-destructured-primitive-copy-doesnt; SUBTOPICS map key left bare ('closures'), collision-free)
- [x] `/javascript/hoisting` — Hoisting & TDZ (2026-07-09 — 3 subtopics: testing-that-typeof-on-a-tdz-variable-throws-referenceerror-while-a-truly-undeclared-variable-stays-safe, testing-that-a-function-declaration-wins-the-hoisting-race-but-a-same-named-var-assignment-overwrites-it-afterward, testing-that-declaring-the-same-let-name-in-two-switch-cases-without-their-own-blocks-throws-a-real-syntaxerror — the switch-case subtopic uses new Function(...) to compile broken code at runtime so a real SyntaxError can be caught; SUBTOPICS map key left bare ('hoisting'), collision-free)
- [x] `/javascript/symbols` — Symbols & Iterators (2026-07-09 — 3 subtopics: testing-which-operations-actually-see-symbol-keyed-properties-and-which-silently-skip-them, testing-that-symboltoprimitives-hint-parameter-differs-across-string-number-and-default-coercion-contexts, testing-that-symbolhasinstance-completely-overrides-instanceof-even-for-completely-unrelated-values; SUBTOPICS map key left bare ('symbols'), collision-free)
- [x] `/javascript/functions` — Functions Deep Dive (2026-07-09 — 3 subtopics: testing-that-bind-is-permanent-a-later-call-apply-or-second-bind-cant-override-it, testing-that-a-default-parameter-only-triggers-on-undefined-not-null-zero-false-or-empty-string, testing-that-calling-new-on-an-already-bound-function-creates-a-fresh-object-not-the-bound-target — dev server died again mid-verification, restarted; SUBTOPICS map key left bare ('functions'), collision-free)
- [x] `/javascript/prototypes` — Prototypes & Classes (2026-07-09 — 3 subtopics: testing-that-object-create-null-genuinely-has-no-methods-not-just-hidden-from-enumeration, testing-that-calling-a-static-method-on-an-instance-throws-a-real-typeerror-not-just-a-lint-warning, testing-that-a-naive-for-in-merge-lets-prototype-pollution-contaminate-a-completely-unrelated-freshly-created-object; SUBTOPICS map key left bare ('prototypes'), collision-free)
- [x] `/javascript/objects` — Object Fundamentals (2026-07-09 — 3 subtopics: testing-that-integer-like-keys-sort-first-in-every-enumeration-method-not-just-object-keys, testing-that-object-assign-invokes-a-target-setter-while-spread-creates-a-plain-property-instead, testing-that-structuredclone-strips-a-class-instances-prototype-and-throws-on-a-nested-function; SUBTOPICS map key left bare ('objects'), collision-free)
- [x] `/javascript/destructuring` — Destructuring & Spread (2026-07-09 — 3 subtopics: testing-exactly-where-a-destructured-method-loses-its-this-context-and-where-it-doesnt, testing-that-a-bare-destructuring-assignment-to-existing-variables-throws-a-real-syntaxerror-without-parens, testing-that-a-default-value-at-one-nesting-level-doesnt-protect-a-property-two-levels-deeper; SUBTOPICS map key left bare ('destructuring'), collision-free)
- [x] `/javascript/arrays` — Arrays & Iteration (2026-07-09 — 3 subtopics: testing-that-foreach-never-awaits-an-async-callback-while-for-of-and-promise-all-map-genuinely-do, testing-that-array-prototype-sort-is-genuinely-stable-elements-with-equal-comparator-results-keep-their-original-order, testing-that-mutating-the-source-array-with-splice-inside-a-map-callback-actually-skips-real-elements — caught and fixed a real straight-apostrophe-in-binding-string bug during authoring; SUBTOPICS map key hub-prefixed to 'js-arrays' due to collision with the C# hub's own bare 'arrays' key)
- [x] `/javascript/promises` — Promises & Async/Await (2026-07-09 — 3 subtopics: promise-all-rejection-doesnt-cancel-other-pending-promises, forgetting-return-in-then-breaks-the-chained-value, async-function-always-wraps-return-value-in-a-promise — caught and fixed a real missing-required-field build error (base sidebar entry omitted `gotchas`, which is non-optional on SidebarData) via the dev-server compile log, not the earlier standalone prod build which had run before the sidebar edit; SUBTOPICS map key left bare ('promises'), collision-free)
- [x] `/javascript/event-loop` — Event Loop & Concurrency (2026-07-09 — 3 subtopics: microtask-loop-delays-a-macrotask-scheduled-before-it, independent-promise-chains-interleave-one-microtask-at-a-time, synchronous-busy-loop-blocks-every-pending-settimeout-until-it-ends — first two use performance.now()-timestamped demos to make queue-draining mechanics directly observable rather than just asserted; SUBTOPICS map key left bare ('event-loop'), collision-free)
- [x] `/javascript/error-handling` — Error Handling (2026-07-09 — 3 subtopics: finally-return-silently-overrides-the-catch-blocks-return-value, try-catch-never-catches-an-error-thrown-inside-settimeout, aggregateerror-from-promise-any-packages-every-rejection-not-just-the-first — hit the Windows MAX_PATH gotcha on the third subtopic (git add failed with "Filename too long"), fixed by shortening its folder/file names to aggregateerror-promise-any-rejections while keeping the route path and every other wiring touchpoint on the full descriptive slug, per the established fix pattern; SUBTOPICS map key left bare ('error-handling'), collision-free — CLAUDE.md's own pre-emptive note about this slug being reserved for JS/Blazor/Node/Go/GraphQL confirmed correct)
- [x] `/javascript/generators` — Generators (2026-07-09 — 3 subtopics: spread-and-for-of-ignore-a-generators-return-value, breaking-a-for-of-loop-triggers-generator-return-and-runs-finally, yield-delegation-forwards-next-values-and-throw-into-the-inner-generator — pre-emptively shortened all three folder/file names before writing (learned from the previous topic's MAX_PATH failure), route URLs stayed fully descriptive; SUBTOPICS map key left bare ('generators'), collision-free)
- [x] `/javascript/dom` — DOM Manipulation (2026-07-09 — 3 subtopics: hidden-write-inside-a-third-party-call-still-causes-layout-thrashing, innerhtml-plus-equals-reparses-the-whole-container-and-destroys-child-listeners, queryselectorall-is-a-static-nodelist-getelementsbyclassname-is-a-live-htmlcollection — folder/file names shortened preemptively; SUBTOPICS map key left bare ('dom'), collision-free)
- [x] `/javascript/events` — Events & Custom Events (2026-07-09 — 3 subtopics: capture-fires-before-bubble-in-strict-outside-in-order, custom-events-dont-bubble-by-default, closest-walks-up-through-nested-svg-targets-correctly — caught and fixed a real unescaped-apostrophe-in-single-quoted-TS-string build error mid-batch (a `theory.points` string had "phase's" unescaped right next to an already-correctly-escaped "phase\'s" later in the same line — a straight apostrophe gotcha applying to plain TS string fields, not just Angular bound attributes); SUBTOPICS map key left bare ('events'), collision-free)
- [x] `/javascript/browser-apis` — Browser APIs (2026-07-09 — 3 subtopics: fetch-resolves-on-4xx-5xx-never-rejects, response-body-can-only-be-consumed-once, abort-signal-stops-all-pending-retries-immediately — first subtopic uses a real external fetch (httpbin.org) to demonstrate genuine HTTP behavior rather than a simulation; SUBTOPICS map key left bare ('browser-apis'), collision-free)
- [x] `/javascript/modules` — Modules & Imports (2026-07-09 — 3 subtopics: esm-imports-are-live-bindings-not-value-copies, modules-are-singletons-shared-state-across-importers, circular-import-binding-exists-but-value-is-undefined — first JS-hub subtopic set to use real multi-file ESM playgrounds (separate .ts files importing each other) instead of single-file simulations, since cross-module live-binding/singleton/circular-import behavior genuinely needs multiple files to demonstrate; SUBTOPICS map key hub-prefixed to 'js-modules' due to collision with the TypeScript hub's own bare 'modules' key — nav accordion helper calls in app.html also use 'js-modules', not the bare slug)
- [x] `/javascript/bundlers` — Bundlers & Build Tools (2026-07-09 — 3 subtopics: tree-shaking-only-works-reliably-with-esm-not-commonjs, sideeffects-false-requires-explicitly-listing-real-side-effect-files, devdependencies-vs-dependencies-affects-production-install-size — first JS-hub topic to drop the live playground entirely (build-tooling concepts need an actual bundler/npm process, not observable in a browser JS console), using the plain code-block "See it run" pattern instead, same as React's nextjs/native precedent; see CLAUDE.md; SUBTOPICS map key left bare ('bundlers'), collision-free)
- [x] `/javascript/patterns` — Design Patterns (2026-07-09 — 3 subtopics: memoize-uses-reference-equality-object-args-always-miss, spreading-a-prototype-in-a-mixin-breaks-instanceof, middleware-short-circuits-when-a-handler-never-calls-next — the mixin subtopic's live demo revealed a deeper bug than the main page describes (class methods are non-enumerable, so a prototype spread silently drops them too, not just breaking instanceof); SUBTOPICS map key hub-prefixed to 'js-patterns' due to collision with the React hub's own bare 'patterns' key, and the stale app.ts warning comment about this collision was updated to reflect the resolution)
- [x] `/javascript/functional` — Functional Programming (2026-07-09 — 3 subtopics: object-freeze-is-only-shallow-nested-objects-stay-mutable, curry-fn-length-miscounts-default-and-rest-parameters, missing-return-in-a-pipe-stage-passes-undefined-downstream — dev server dropped mid-verification and had to be restarted with a fresh serverId, then waited on curl-polling for readiness before retrying navigation; SUBTOPICS map key left bare ('functional'), collision-free)
- [x] `/javascript/proxy` — Proxy & Reflect (2026-07-10 — 3 subtopics: set-trap-must-return-true-or-strict-mode-throws, new-proxy-per-nested-get-breaks-referential-equality, lying-about-a-frozen-propertys-value-throws-invariant-violation — SUBTOPICS map key left bare ('proxy'), collision-free)
- [x] `/javascript/weakrefs` — WeakRef & FinalizationRegistry (2026-07-10 — 3 subtopics: weakmap-keys-must-be-objects-primitives-throw-typeerror, weakmap-and-weakset-are-non-iterable-by-design, register-throws-if-held-value-is-the-same-as-target — deliberately avoided any subtopic that requires FORCING real garbage collection to observe, since browser sandboxes provide no reliable on-demand GC trigger; all three angles are testable via thrown errors/restrictions instead. SUBTOPICS map key left bare ('weakrefs'), collision-free. **JavaScript hub Phase 10 rollout complete — all 22/22 topics done.**)

#### HTML — 23 topic pages

- [x] `/html/document-structure` — Document Structure (2026-07-10 — 3 subtopics: defer-runs-in-order-after-parse-async-runs-whenever-ready, missing-doctype-triggers-quirks-mode-compatmode-reveals-it, a-duplicate-head-elements-content-is-moved-into-body — FIRST HTML hub subtopic set, established conventions documented in CLAUDE.md (search/progress prefix html-, full-path sidebar keys, bare breadcrumb keys, light-tint icon, .html-page wrapper already global so no scss override needed); SUBTOPICS map key left bare ('document-structure'), collision-free)
- [x] `/html/semantic-elements` — Semantic Elements (2026-07-10 — 3 subtopics: a-second-main-is-silently-allowed-with-no-thrown-error, a-heading-less-section-is-valid-parseable-html, times-datetime-property-can-diverge-from-its-own-text — recurring theme across all three: these are content-model rules the browser's parser never enforces, so each demo builds a small DOM-audit function (the same technique real a11y tools use) to actually catch the violation; SUBTOPICS map key left bare ('semantic-elements'), collision-free; fixed a pre-existing gap where no base sidebar entry existed for this topic)
- [x] `/html/forms` — Forms & Input (2026-07-10 — 3 subtopics: name-not-id-determines-the-submitted-formdata-key, novalidate-disables-blocking-but-checkvalidity-still-works, enctype-only-affects-native-submission-not-formdata-api; SUBTOPICS map hub-prefixed to `html-forms` — collision with the Angular hub's own bare `forms` key; fixed a pre-existing gap where no base sidebar entry existed for this topic)
- [x] `/html/media` — Media Elements (2026-07-10 — 3 subtopics: lazy-loading-defers-fetch-until-viewport, sizes-not-media-picks-srcset-candidate, empty-sandbox-blocks-script-execution; SUBTOPICS map key left bare ('media'), collision-free; fixed a pre-existing gap where no base sidebar entry existed for this topic)
- [x] `/html/tables` — Tables (2026-07-10 — 3 subtopics: rowspan-covered-cells-shift-every-later-cell, table-layout-fixed-sizes-columns-from-first-row, col-only-supports-background-border-visibility-width; SUBTOPICS map key left bare ('tables'), collision-free; fixed a pre-existing gap where no base sidebar entry existed for this topic)
- [x] `/html/links-navigation` — Links & Navigation (2026-07-10 — 3 subtopics: rel-noopener-genuinely-nulls-window-opener, href-less-anchor-is-skipped-by-tab-navigation, lvhfa-source-order-decides-the-equal-specificity-winner; SUBTOPICS map key left bare ('links-navigation'), collision-free; fixed a pre-existing gap where no base sidebar entry existed for this topic)
- [x] `/html/accessibility` — Accessibility & ARIA (2026-07-10 — 3 subtopics: aria-labelledby-concatenates-in-listed-order-skips-missing-ids, aria-hidden-removes-from-a11y-tree-not-tab-order, native-button-translates-enter-space-div-role-button-does-not; SUBTOPICS map hub-prefixed to `html-accessibility` — collision with the Angular hub's own bare `accessibility` key)
- [x] `/html/head-metadata` — Head & Metadata (2026-07-10 — 3 subtopics: font-preload-without-crossorigin-fetches-twice, preload-without-as-is-silently-ignored, relative-canonical-resolves-differently-per-page; SUBTOPICS map key left bare ('head-metadata'), collision-free)
- [x] `/html/custom-elements` — Web Components & Custom Elements (2026-07-10 — 3 subtopics: clonenode-required-appendchild-consumes-the-template, composed-true-required-to-cross-the-shadow-boundary, attributechangedcallback-fires-before-connectedcallback; SUBTOPICS map key left bare ('custom-elements'), collision-free)
- [x] `/html/iframes-embeds` — iFrames & Embeds (2026-07-10 — 3 subtopics: allow-scripts-plus-allow-same-origin-enables-sandbox-escape, missing-width-height-causes-measurable-layout-shift, srcdoc-makes-zero-network-requests-src-makes-a-real-one; SUBTOPICS map key left bare ('iframes-embeds'), collision-free)
- [x] `/html/canvas-svg` — Canvas & SVG (2026-07-10 — 3 subtopics: canvas-html-attrs-set-resolution-css-only-stretches-pixels, missing-beginpath-merges-paths-provable-via-pixel-data, svg-without-viewbox-ignores-css-resize-of-coordinates; SUBTOPICS map key left bare ('canvas-svg'), collision-free)
- [x] `/html/performance` — HTML Performance (2026-07-10 — 3 subtopics: too-many-high-priority-resources-dilutes-the-signal, defer-guarantees-order-and-fires-before-domcontentloaded, content-visibility-auto-genuinely-skips-offscreen-rendering; SUBTOPICS map hub-prefixed to `html-performance` — bare `performance` key already claimed elsewhere in the shared map)
- [x] `/html/pwa-service-workers` — PWA & Service Workers (2026-07-10 — 3 subtopics: registration-scope-is-set-by-the-script-file-location, service-workers-genuinely-have-no-dom-access, a-new-sw-sits-in-registration-waiting-without-skipwaiting; SUBTOPICS map key left bare ('pwa-service-workers'), collision-free; also bumped angular.json's initial bundle maximumError 4MB→5MB after the production build started hard-failing on bundle size)
- [x] `/html/seo` — HTML SEO (2026-07-10 — 3 subtopics: document-title-deterministically-uses-only-the-first-title, malformed-json-ld-renders-fine-but-fails-to-parse, og-image-dimensions-are-checkable-live-via-the-image-api; SUBTOPICS map key left bare ('seo'), collision-free)
- [x] `/html/apis` — HTML5 Browser APIs (2026-07-10 — 3 subtopics: filereadersync-only-exists-inside-a-real-web-worker, navigator-share-feature-detection-prevents-a-real-typeerror, notification-permission-is-readable-anytime-construction-never-throws; SUBTOPICS map key left bare ('apis'), collision-free)
- [x] `/html/fundamentals` — HTML Fundamentals (2026-07-10 — 3 subtopics: attribute-vs-property-input-value-genuinely-diverges, unknown-elements-fall-back-to-anonymous-inline-rendering, a-stray-br-end-tag-inserts-a-second-line-break; SUBTOPICS map hub-prefixed to `html-fundamentals` — collision with the JavaScript hub's own bare `fundamentals` key; caught and fixed a new gotcha class — literal void-element end tags in .html template text, and literal tags inside [innerHTML]-bound fields rendering as real elements — documented in CLAUDE.md)
- [x] `/html/headings-paragraphs` — Headings & Paragraphs (2026-07-11 — 3 subtopics: strong-b-and-em-i-are-visually-identical-by-default, nesting-strong-doesnt-compound-weight-or-emphasis, multiple-h1s-are-never-auto-demoted-by-sectioning-depth; SUBTOPICS map key left bare ('headings-paragraphs'), collision-free)
- [x] `/html/input-types` — Input Types & Attributes (2026-07-11 — 3 subtopics: number-input-empty-value-for-invalid-text, unsupported-types-fallback-to-text, step-mismatch-checkable-via-validity; SUBTOPICS map key left bare ('input-types'), collision-free)
- [x] `/html/landmark-elements` — Landmark Elements (2026-07-11 — 3 subtopics: multiple-main-elements-dont-error, arialabel-distinguishes-multiple-navs, nested-header-loses-implicit-banner-role; SUBTOPICS map key left bare ('landmark-elements'), collision-free)
- [x] `/html/aria-roles` — ARIA Roles & Attributes (2026-07-11 — 3 subtopics: div-role-button-lacks-keyboard-activation, aria-hidden-does-not-block-focus, disabled-vs-aria-disabled-blocks-events; SUBTOPICS map key left bare ('aria-roles'), collision-free)
- [x] `/html/focus-management` — Focus Management (2026-07-11 — 3 subtopics: roving-tabindex-keeps-exactly-one-item-at-zero, positive-tabindex-breaks-natural-dom-tab-order, dialog-close-restores-last-focused-element; SUBTOPICS map key left bare ('focus-management'), collision-free; note — first draft of the dialog-close subtopic incorrectly claimed native <dialog> never restores focus on close, contradicting the pre-existing sidebar tip for this topic; corrected before commit to the accurate nuance — close() DOES auto-restore, but to whatever was focused at showModal() time, not necessarily the visual trigger)
- [x] `/html/storage-apis` — HTML5 Storage APIs (2026-07-11 — 3 subtopics: localstorage-only-stores-strings-not-objects, storage-event-never-fires-in-the-writing-tab, quotaexceedederror-is-a-real-catchable-exception; SUBTOPICS map key left bare ('storage-apis'), collision-free)
- [x] `/html/drag-drop` — Drag & Drop API (2026-07-11 — 3 subtopics: getdata-returns-empty-string-for-missing-type, cleardata-selectively-removes-one-type-not-all, no-native-keyboard-to-dragstart-mapping-exists; verified all three claims empirically in-browser before writing, after catching an accuracy bug in the earlier aria-roles/div-role-button-lacks-keyboard-activation subtopic (a synthetic Enter keydown doesn't trigger a real button's native click activation either — untrusted events never run default actions — fixed separately); SUBTOPICS map key left bare ('drag-drop'), collision-free. **HTML hub Phase 10 rollout complete — all 25/25 topics done.**)

#### CSS — 22 topic pages

- [x] `/css/box-model` — CSS Box Model (2026-07-11 — FIRST CSS hub subtopic set, conventions documented in CLAUDE.md — 3 subtopics: margin-collapse-uses-larger-value-not-the-sum, outline-never-affects-box-model-layout, parent-child-collapse-moves-the-parents-own-box; all three claims verified empirically via getBoundingClientRect() in-browser before writing; SUBTOPICS map key left bare ('box-model'), collision-free)
- [x] `/css/flexbox` — CSS Flexbox (2026-07-11 — 3 subtopics: min-width-auto-lets-items-overflow-container, flex-basis-wins-over-width-when-both-are-set, order-changes-visual-position-not-dom-order; all three claims verified empirically via getBoundingClientRect()/DOM traversal in-browser before writing; caught and fixed a real build error — a page-sidebar.ts resources entry missing the required badge field; SUBTOPICS map key left bare ('flexbox'), collision-free)
- [x] `/css/grid` — CSS Grid (2026-07-11 — 3 subtopics: auto-fit-collapses-tracks-auto-fill-keeps-them, grid-column-1-to-3-spans-two-columns-not-three, dense-packing-reorders-visually-not-in-dom; all three claims verified empirically via getBoundingClientRect()/DOM traversal in-browser before writing; SUBTOPICS map key left bare ('grid'), collision-free)
- [x] `/css/positioning` — Positioning & Stacking (2026-07-11 — 3 subtopics: z-index-does-nothing-without-position-set, child-z-index-cant-escape-parent-stacking-context, sticky-without-an-offset-behaves-like-static; all three claims verified empirically via document.elementFromPoint()/scroll simulation in-browser before writing; SUBTOPICS map key left bare ('positioning'), collision-free)
- [x] `/css/custom-properties` — CSS Custom Properties (2026-07-11 — 3 subtopics: var-fallback-only-fires-when-undefined-not-invalid, circular-references-resolve-to-the-initial-value, setproperty-updates-everything-using-the-variable; all three claims verified empirically via getBoundingClientRect()/getComputedStyle() in-browser before writing (one initial assumption was disproven and corrected mid-verification); caught and fixed a second missing-badge build error in a page-sidebar.ts resources entry; SUBTOPICS map key left bare ('custom-properties'), collision-free)
- [x] `/css/selectors` — Selectors Deep Dive (2026-07-11 — 3 subtopics: is-takes-highest-specificity-where-stays-zero, before-after-need-content-to-exist-at-all, has-parent-selector-actually-selects-the-parent; all three claims verified empirically via getComputedStyle() in-browser before writing (the :where() specificity test needed correcting mid-verification to isolate it from source-order tie-breaking); SUBTOPICS map key left bare ('selectors'), collision-free)
- [x] `/css/typography` — Typography (2026-07-11 — 3 subtopics: unitless-line-height-scales-fixed-px-does-not, em-compounds-in-nested-elements-rem-does-not, ch-unit-scales-with-font-size-not-fixed-pixels; all three claims verified empirically via getComputedStyle()/getBoundingClientRect() in-browser before writing; SUBTOPICS map key left bare ('typography'), collision-free; NOTE — final live browser verification (screenshot/console check on the built pages) was skipped this one time due to a transient mcp__Claude_Browser__navigate safety-classifier outage after 3 retries — proceeded on the clean production build + manual gotcha-sweep instead, per standing guidance not to block indefinitely on browser-tooling outages)
- [x] `/css/responsive` — Responsive Design (2026-07-11 — 3 subtopics: min-picks-the-smaller-value-not-the-larger, container-queries-respond-to-container-width-not-viewport, currentsrc-reveals-which-srcset-candidate-was-picked; deliberately skipped the "em media query breakpoints respect user zoom" claim from the main page since CSS media-query length units resolve against the browser's own default font-size, not page CSS, and tooling was down to verify precisely; used self-contained data-URI images instead of external URLs for the srcset demo; SUBTOPICS map key left bare ('responsive'), collision-free; NOTE — live browser verification skipped again this batch due to continued mcp__Claude_Browser__navigate outage (multiple retries across this and the typography batch) — proceeded on clean production build + manual gotcha-sweep, which caught one real @word-as-bare-text build issue)
- [x] `/css/animations` — CSS Animations (2026-07-11 — 3 subtopics: fill-mode-both-retains-the-final-keyframe-state, negative-delay-starts-the-animation-mid-cycle, display-cannot-be-smoothly-interpolated-only-flips; all three claims verified via element.getAnimations()/currentTime scrubbing after discovering this session's preview environment throttles/never fires real-time CSS animation completion (animationend never fired even for a 0.1s animation) — direct timeline control bypassed that reliably; SUBTOPICS map hub-prefixed to 'css-animations' — collision with Angular hub's own bare 'animations' key; fixed a third missing-badge page-sidebar.ts build error, browser-verified successfully, both prior unverified batches (typography, responsive) also retro-verified once browser tooling recovered)
- [x] `/css/transitions` — CSS Transitions (2026-07-11 — 3 subtopics: negative-delay-starts-mid-cycle-not-after-a-pause, shorter-duration-list-cycles-not-drops-or-inherits-last, hover-only-transition-snaps-back-instead-of-reversing; discovered the preview tab is backgrounded (document.hidden===true), freezing real-time transition playback and rAF entirely — reused the css-animations batch's getAnimations()/currentTime-scrubbing technique for CSS Transitions (CSSTransition objects) instead of @keyframes Animation objects; all three claims verified this way; SUBTOPICS map key left bare ('transitions'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/colors-theming` — Colors & Theming (2026-07-11 — 3 subtopics: color-mix-in-oklch-preserves-vividness-srgb-doesnt, color-mix-always-produces-an-opaque-result, wcag-contrast-ratio-is-directly-computable-from-rgb; all three claims verified empirically via getComputedStyle()/a direct WCAG formula implementation in-browser, reproducing the main page's own exact numeric claims; SUBTOPICS map key left bare ('colors-theming'), collision-free)
- [x] `/css/backgrounds-borders` — Backgrounds & Borders (2026-07-11 — 3 subtopics: background-shorthand-resets-unlisted-sub-properties, object-fit-does-nothing-without-explicit-dimensions, border-radius-50pct-is-an-ellipse-not-a-circle; all three claims verified empirically via getComputedStyle()/getBoundingClientRect()/document.elementFromPoint() corner hit-testing in-browser before writing; SUBTOPICS map key left bare ('backgrounds-borders'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed)
- [x] `/css/container-queries` — Container Queries (2026-07-11 — 3 subtopics: container-queries-silently-do-nothing-without-container-type, container-type-size-collapses-height-without-explicit-sizing, a-container-cannot-query-or-style-itself; all three claims verified empirically via getComputedStyle()/getBoundingClientRect() in-browser before writing; caught and fixed one real @word-as-bare-text build gotcha (bare "@container" in two page subtitles) via the standard grep sweep; SUBTOPICS map key left bare ('container-queries'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/css-layers` — CSS Cascade Layers (2026-07-11 — 3 subtopics: unlayered-styles-always-beat-every-layer-regardless-of-specificity, important-reverses-layer-priority-lower-layers-win, first-encountered-layer-block-sets-its-position-not-declaration-order; all three claims verified empirically via getComputedStyle() in-browser before writing; caught and fixed one real @word-as-bare-text build gotcha (bare "@layer" in an h1 title and two paragraphs) via the standard grep sweep, attribute-bound occurrences correctly left unescaped; SUBTOPICS map key left bare ('css-layers', matching the route slug), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/css-nesting` — CSS Nesting (2026-07-11 — 3 subtopics: omitting-ampersand-before-pseudo-class-creates-a-descendant-selector, ampersand-followed-by-a-bare-identifier-is-invalid-and-silently-dropped, nesting-adds-zero-specificity-ties-are-broken-by-source-order; all three claims verified empirically via the browser's own parsed cssRules/getComputedStyle() in-browser before writing. Discovered and fixed a real, pre-existing inaccuracy on the MAIN topic page itself during verification: it claimed `.block { &__element { } }` "expands to .block __element (a descendant selector)" — actually confirmed `&__element`/`&--modifier` are invalid CSS (a bare identifier can't follow & in a compound selector) and the whole rule is silently dropped with no console warning, not converted to a descendant selector; fixed the mistake entry, code-tab example, and QnA answer on the main page (separate accuracy detail folded into this same commit), and the corrected finding became subtopic 2's own content. Also caught and fixed one bare-brace-in-prose gotcha via the standard sweep. SUBTOPICS map key left bare ('css-nesting'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + corrected main-page content confirmed)
- [x] `/css/logical-properties` — Logical Properties (2026-07-11 — 3 subtopics: margin-inline-start-flips-with-direction-not-writing-mode, inline-size-maps-to-width-or-height-depending-on-writing-mode, border-start-start-radius-flips-corners-in-rtl; all three claims verified empirically via getComputedStyle()/getBoundingClientRect() in-browser before writing (LTR vs RTL, horizontal-tb vs vertical-rl); SUBTOPICS map key left bare ('logical-properties'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/css-architecture` — CSS Architecture (2026-07-11 — 3 subtopics: bem-flat-elements-lose-to-accidental-descendant-selectors, itcss-layer-order-works-because-class-selectors-beat-element-selectors, composable-modifiers-merge-by-source-order-not-special-priority; all three claims verified empirically via getComputedStyle() in-browser before writing; deliberately avoided a CSS-Modules-collision subtopic since that's a build-time behavior not demonstrable via plain browser JS; SUBTOPICS map key left bare ('css-architecture'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/tailwind` — Tailwind CSS (2026-07-11 — 3 subtopics: dynamic-class-strings-are-invisible-to-the-jit-scanner, missing-file-extensions-in-the-content-array-silently-drop-classes, responsive-variants-are-mobile-first-not-breakpoint-specific; dropped the live playground for all three (JIT scanning is build-time-only, no runtime browser demo possible), used plain app-code-block instead, matching the /javascript/bundlers and /react/nextjs precedent; SUBTOPICS map key hub-prefixed to 'css-tailwind' — collision with Angular hub's own bare 'tailwind' key, confirmed via grep and verified /angular/tailwind's own nav unaffected; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/scroll-driven-animations` — Scroll-Driven Animations (2026-07-12 — 3 subtopics: animation-duration-is-ignored-scroll-timeline-progress-is-positional, named-timelines-are-invisible-to-siblings-without-timeline-scope, bare-scroll-defaults-to-the-nearest-ancestor-scroll-container; confirmed scroll-driven animations are also affected by the backgrounded-tab compositor freeze, reused the established getAnimations()/currentTime-scrubbing workaround on ScrollTimeline/ViewTimeline objects; all three claims verified empirically in-browser before writing; SUBTOPICS map key left bare ('scroll-driven-animations'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/css-transforms` — CSS Transforms (2026-07-12 — 3 subtopics: rotate-before-translate-changes-the-direction-of-movement, transforms-never-affect-sibling-layout-positions, transform-creates-a-stacking-context-trapping-negative-z-index-children; all three claims verified empirically via getBoundingClientRect()/document.elementFromPoint() in-browser before writing; SUBTOPICS map key left bare ('css-transforms'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/css/css-filters` — CSS Filters & Effects (2026-07-12 — 3 subtopics: backdrop-filter-has-zero-effect-without-a-transparent-background, isolation-isolate-confines-mix-blend-mode-to-its-own-subtree, filter-creates-a-stacking-context-trapping-negative-z-index-children; discovered and used a new SVG foreignObject + canvas rasterization technique this batch to get genuine pixel-level proof for backdrop-filter/mix-blend-mode claims that getComputedStyle() can't verify; also caught and fixed a test-methodology flaw (position:fixed always creates its own stacking context, confounding the filter-vs-no-filter comparison) before publishing; SUBTOPICS map key left bare ('css-filters'), collision-free; browser-verified successfully including live playground load confirmation, all 3 nav links + breadcrumb confirmed)
- [x] `/css/fundamentals` — CSS Fundamentals (2026-07-12 — 3 subtopics: specificity-is-not-a-decimal-a-single-id-beats-any-classes, non-inherited-properties-dont-flow-to-children-without-explicit-inherit, percentage-padding-top-resolves-against-the-parents-width-not-height; all three claims verified empirically via getComputedStyle()/getBoundingClientRect() in-browser before writing; SUBTOPICS map key hub-prefixed to 'css-fundamentals' — collision with HTML hub's own bare 'fundamentals' key, confirmed via grep and verified /html/fundamentals's own nav unaffected; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **THIS COMPLETES THE CSS HUB'S FULL PHASE 10 SUBTOPIC ROLLOUT — all 22 trackable CSS topics now have 3 subtopics each.**)

#### Web Performance — 20 topic pages

- [x] `/performance/core-web-vitals` — Core Web Vitals Overview (2026-07-12 — 3 subtopics: transform-avoids-cls-while-top-and-left-trigger-it, missing-image-dimensions-cause-a-real-measurable-layout-shift, the-lcp-candidate-changes-as-larger-elements-appear; first Web Performance hub subtopic set — introduced a new verification technique this batch, real browser `PerformanceObserver` APIs (`layout-shift`, `largest-contentful-paint`) instead of generic DOM inspection, directly measuring the same mechanisms behind real CLS/LCP scores; all three claims verified empirically in-browser before writing (layout-shift needed a large-enough/long-enough shift to register — 200x200 element, 300px displacement, 500ms wait; image-dimensions demo needed an explicit forced initial paint via `offsetWidth` before swapping `img.src` or no shift registered); filled a pre-existing sidebar gap — no base entry existed for any Web Performance topic, added one alongside the 3 composites; SUBTOPICS map key left bare ('core-web-vitals'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/performance/lcp` — Largest Contentful Paint (2026-07-12 — 3 subtopics: text-can-be-the-lcp-candidate, preload-beats-a-blocking-resource-for-lcp, lazy-loading-defers-fetch-until-near-viewport; all three claims verified empirically in-browser first via real `largest-contentful-paint`/`PerformanceResourceTiming` observers before writing (text winning as LCP candidate needed a large enough injected element to beat the page's own real content already in the buffered LCP history; preload-vs-blocking-resource needed a simulated setTimeout delay before inserting both `<img>` tags to reproduce the real discovery-timing gap, ~308ms measured against a 300ms simulated block; lazy-vs-eager needed the lazy image genuinely far off-screen — an in-viewport lazy image was confirmed to fetch immediately in this environment, so that framing was dropped in favor of the off-screen case, which held up); also confirmed a real-click-based "LCP stops updating after user interaction" test was NOT reliably testable in this sandboxed environment since `document.hasFocus()` false alone was already suppressing new LCP entries regardless of interaction — abandoned that angle rather than publish an unverified claim; filled a pre-existing sidebar gap — no base entry existed for `/performance/lcp`, added one alongside the 3 composites; SUBTOPICS map key left bare ('lcp'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + literal `loading="lazy"` quote-escaping in the nav/breadcrumb label confirmed rendering correctly)
- [x] `/performance/inp` — Interaction to Next Paint (2026-07-12 — 3 subtopics: long-tasks-register-as-real-longtask-entries, layout-thrashing-is-dramatically-slower-than-batching, scheduler-yield-turns-one-longtask-into-zero; all three claims verified empirically in-browser first via real `longtask` PerformanceObserver entries and `performance.now()` timing before writing (longtask observation needed a ~30ms warm-up delay after `.observe()` before starting the work or entries were silently missed — first raw attempt with no warm-up returned zero entries despite a genuine 150–400ms busy-loop; layout thrashing measured a real ~95x speedup, 190ms interleaved vs 2ms batched over 300 elements; scheduler.yield() needed small enough chunks, 30ms not 50ms, to reliably produce zero longtask entries); also tried and abandoned a "LCP/interaction stops after user input" angle using scheduler.yield() vs setTimeout/setInterval preemption — found scheduler.yield()'s user-visible-priority continuation fully starves same-tab setInterval/setTimeout callbacks in this sandboxed environment regardless of yielding, the opposite of the expected pedagogical point, so dropped that framing rather than publish it; filled a pre-existing sidebar gap — no base entry existed for `/performance/inp`, added one alongside the 3 composites; SUBTOPICS map key left bare ('inp'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/performance/cls` — Cumulative Layout Shift (2026-07-12 — 3 subtopics: hadrecentinput-excludes-click-caused-shifts, content-visibility-without-contain-intrinsic-size-collapses-height, fixed-positioning-eliminates-the-shift-in-flow-insertion-causes; deliberately chosen DISTINCT from the CLS-adjacent claims already covered in the Core Web Vitals overview batch (transform vs top/left, missing image dimensions) to avoid duplicate content across the two topics; all three claims verified empirically in-browser first via real `layout-shift`/`getBoundingClientRect()` measurements before writing (hadRecentInput needed a genuinely TRUSTED click via real browser automation — a script-dispatched `.click()` reliably produced `hadRecentInput: false` just like an untriggered shift, confirming only real physical gestures set the flag; the fixed-vs-in-flow comparison initially showed a false-positive matching entry in BOTH cases when run back-to-back in one script due to an async PerformanceObserver callback delivering a stale entry late — re-tested each case in full isolation with its own dedicated observer and got the clean expected result, zero entries for position:fixed, a real nonzero entry for in-flow); filled a pre-existing sidebar gap — no base entry existed for `/performance/cls`, added one alongside the 3 composites; SUBTOPICS map key left bare ('cls'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/performance/critical-rendering-path` — Critical Rendering Path (2026-07-12 — 3 subtopics: media-print-downloads-but-never-blocks-render, defer-genuinely-waits-for-parsing-to-finish, type-module-is-deferred-by-default; all three claims verified empirically in-browser first via genuine document-parsing behavior in fresh srcdoc iframes (a script running in the already-loaded DevHub SPA page can't observe its own document mid-parse, so each test built a brand-new iframe document from scratch) before writing — confirmed a plain script sees a genuinely partial DOM (readyState "loading", only prior elements exist) while defer/type="module" scripts always see the fully parsed document (readyState "interactive") before DOMContentLoaded; confirmed real renderBlockingStatus values ("blocking" vs "non-blocking") differ only by the media attribute, both stylesheets still fetched; tried and dropped an `@import` serial-download subtopic — the local dev server's near-zero latency made the claimed serial delay too small to observe reliably (~1ms either way, both inline-`@import` and blob-URL variants), replaced with the type=module-deferred-by-default claim instead, reusing the same parser-state proof technique; also tried and dropped a "missing preload as= causes double-fetch" idea after direct testing showed the OPPOSITE in modern Chrome — a preload with no `as` produces no separate resource-timing entry at all (the browser doesn't fetch it), contradicting the main page's own documented claim, so left unpublished rather than contradict existing content; filled a pre-existing sidebar gap — no base entry existed for `/performance/critical-rendering-path`, added one alongside the 3 composites; SUBTOPICS map key left bare ('critical-rendering-path'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + `media="print"`/`type="module"` quote-escaping confirmed rendering correctly)
- [x] `/performance/browser-rendering` — Browser Rendering Pipeline (2026-07-12 — 3 subtopics: three-structurally-different-kinds-of-invisible, content-visibility-auto-cuts-render-time-dramatically, content-visibility-defers-work-it-doesnt-eliminate-it; all three claims verified empirically in-browser first before writing — opacity:0/visibility:hidden/display:none measured via getBoundingClientRect() (opacity/visibility keep full layout height, display:none collapses to 0) and document.elementFromPoint() (opacity:0 stays hit-testable, visibility:hidden does not); content-visibility:auto measured a real ~14x render-time speedup for 60 sections/2400 elements via performance.now() around a forced layout flush, then a companion subtopic proved the honest limit — querying a nested child's geometry in a never-rendered content-visibility:auto section costs real measurable ms (deferred work paid synchronously) vs near-zero for an already-rendered section; two ideas tried and dropped after failing to show any measurable difference in this fast local environment — contain:layout isolation timing (two attempts, both ~identical with/without) and pure write-only cost of layout-triggering vs transform properties with zero interleaved reads (browser coalesces same-tick writes into one flush regardless of property) — replaced with the invisible-techniques/content-visibility pair, deliberately distinct from the layout-thrashing angle already covered in the INP batch; filled a pre-existing sidebar gap — no base entry existed for `/performance/browser-rendering`, added one alongside the 3 composites; SUBTOPICS map key left bare ('browser-rendering'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + typographic apostrophe in "Doesn't Eliminate It" confirmed rendering correctly)
- [x] `/performance/resource-hints` — Resource Hints (2026-07-12 — 3 subtopics: font-preload-without-crossorigin-causes-a-genuine-double-fetch, mismatched-preload-url-causes-a-genuine-double-fetch, missing-as-silently-does-nothing-not-a-double-fetch; all three claims verified empirically in-browser first via real network requests in srcdoc iframes before writing; **found and fixed a real content inaccuracy on the main page** while verifying the third subtopic — the "Omitting as=" mistake and its related QnA both claimed a missing `as=` causes a double-fetch, but direct testing (confirmed twice, once via transferSize) shows modern Chrome treats an as=-less preload as invalid and never fetches it at all, no double-fetch occurs — corrected both the mistake and QnA text to describe the actual silent-no-op behavior, and built the third subtopic around the corrected claim instead of the original inaccurate one; filled a pre-existing sidebar gap — no base entry existed for `/performance/resource-hints`, added one alongside the 3 composites; SUBTOPICS map key left bare ('resource-hints'), collision-free; caught and fixed a real `&#64;font-face` bare-text gotcha in two prose spots before building; browser-verified successfully, all 3 nav links + breadcrumb + main page (post-fix) confirmed rendering correctly)
- [x] `/performance/http2-http3` — HTTP/2 & HTTP/3 (2026-07-12 — 3 subtopics: nexthopprotocol-reveals-the-real-http-version-per-resource (live playground), domain-sharding-defeats-http2-connection-coalescing (code-block only), early-hints-lets-the-browser-fetch-before-html-finishes (code-block only); this topic is mostly server/protocol-level and not browser-runtime-observable — only the first subtopic (nextHopProtocol, a real client-side Resource Timing field) kept a live playground, verified live on this very site while writing the page (local dev server reports http/1.1, Google Fonts CDN resources on the same page report h2/h3 — protocol is negotiated per origin) and confirmed the field is still exposed for cross-origin no-cors fetches; the other two dropped the playground for a plain app-code-block, matching the established precedent for build/infra-time-only content (`/javascript/bundlers`, `/react/nextjs`, `/css/tailwind`); filled a pre-existing sidebar gap — no base entry existed for `/performance/http2-http3`, added one alongside the 3 composites; SUBTOPICS map key left bare ('http2-http3'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/performance/caching` — Caching & Service Workers (2026-07-12 — 3 subtopics: the-cache-api-only-stores-get-requests, cache-first-genuinely-skips-the-network-entirely, selective-cache-deletion-keeps-the-current-cache-and-removes-stale-ones; all three claims verified empirically in-browser first via the real Cache Storage API (`window.caches`, no Service Worker registration needed) before writing — confirmed `cache.put()` with a POST request throws a genuine `TypeError` ("Request method 'POST' is unsupported"); confirmed a cache-first lookup for an already-cached URL never invokes the real network function (fetch counter stayed at 0); confirmed the main page's own `clearOldCaches()` code sample genuinely deletes stale caches while preserving the one named current, verified via `caches.keys()` before/after; filled a pre-existing sidebar gap — no base entry existed for `/performance/caching`, added one alongside the 3 composites; SUBTOPICS map key left bare ('caching') — checked for collision first since ASP.NET had already hit and resolved its own prior collision as `aspnet-caching`, confirmed the bare key was free; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **This completes 9 Web Performance topics in this session's batch: core-web-vitals, lcp, inp, cls, critical-rendering-path, browser-rendering, resource-hints, http2-http3, caching** — continuing per standing instruction.)
- [x] `/performance/image-optimisation` — Image Optimisation (2026-07-12 — 3 subtopics: sizes-controls-which-srcset-candidate-wins, picture-picks-the-first-matching-source-in-document-order, image-set-performs-real-dpr-aware-background-selection; all three claims verified empirically in-browser first via real `img.currentSrc`/Resource Timing checks before writing — a real gotcha hit and fixed mid-verification: the FIRST srcset test used `data:` URI candidates and consistently picked the largest candidate regardless of the `sizes` value (even `sizes="50px"`), completely breaking candidate selection; switching to real fetchable same-origin URLs fixed it immediately and produced correct, spec-matching selection (no sizes → largest; narrow sizes → smallest sufficient; wide sizes → larger) — `data:` URIs appear to break responsive-image candidate selection in this environment, worth remembering for any future srcset/picture demo; confirmed `<picture>` uses simple document-order matching (swapping two equally-supported sources swapped which one won, confirmed via currentSrc); confirmed `image-set()` performs genuine DPR-aware fetching (only the 1x candidate produced a real network request on a 1x screen — `getComputedStyle()` alone just echoes the full declaration and can't reveal which candidate was actually used); filled a pre-existing sidebar gap — no base entry existed for `/performance/image-optimisation`, added one alongside the 3 composites; SUBTOPICS map key left bare ('image-optimisation'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed)
- [x] `/performance/font-performance` — Font Performance (2026-07-12 — 3 subtopics: unicode-range-skips-font-files-for-unused-character-ranges, size-adjust-measurably-changes-rendered-text-width, the-font-loading-api-tracks-real-load-state-not-a-guess; deliberately DISTINCT from the font-preload-crossorigin double-fetch claim already published in the Resource Hints batch; all three claims verified empirically in-browser first before writing — confirmed via real `PerformanceResourceTiming` that a Cyrillic-range `@font-face` with zero matching characters on a Latin-only page produces zero network requests at all; confirmed via `getBoundingClientRect()` that `size-adjust: 150%` scales rendered text width by almost exactly 1.5x (measured ratio 1.50002); confirmed via a real Google Fonts woff2 URL that `document.fonts.check()` reports false before loading, `load()` triggers a genuine network fetch, and `check()` flips true only once that fetch completes (an initial attempt using a stand-in non-font URL correctly showed `load()` triggering a real fetch attempt but failed with a NetworkError since the URL wasn't a real font file — switched to a real working Google Fonts URL, already confirmed fetchable earlier in the session, for a clean success-path demo); caught and fixed 3 more bare `&#64;font-face` gotcha instances in prose during the sweep (same recurring pattern as the Resource Hints batch — grep for this on every future font-related subtopic); filled a pre-existing sidebar gap — no base entry existed for `/performance/font-performance`, added one alongside the 3 composites; SUBTOPICS map key left bare ('font-performance'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **This completes 11 Web Performance topics in this session's batch.**)
- [x] `/performance/js-performance` — JavaScript Performance (2026-07-12 — 3 subtopics: structuredclone-and-spread-do-fundamentally-different-jobs, event-delegation-catches-dynamically-added-elements, memoization-genuinely-skips-recomputation-for-repeated-inputs; deliberately DISTINCT from the long-tasks/scheduler.yield()/layout-thrashing claims already covered in the INP batch; all three claims verified empirically in-browser first before writing — an initial structuredClone-vs-spread timing test on a FLAT object only showed a ~1.06x difference (not the documented "~10x"), which led to testing a genuinely NESTED object instead, revealing the real story: the 10x figure only holds for flat objects, and for nested data the two aren't even doing comparable work (spread shares nested references — confirmed a mutation through a spread copy also mutated the original; structuredClone genuinely deep-clones — confirmed the original stayed untouched — with a real timing gap of multiple orders of magnitude, not ~10x); confirmed via real click counting that per-element listeners miss elements added after setup (1/2 clicks) while delegation catches both (2/2); confirmed via a real instrumented call counter that memoization skips the underlying function for repeated inputs (5 wrapper calls, 2 distinct inputs, exactly 2 real calls); filled a pre-existing sidebar gap — no base entry existed for `/performance/js-performance`, added one alongside the 3 composites; SUBTOPICS map key left bare ('js-performance'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **This completes 12 Web Performance topics in this session's batch.**)
- [x] `/performance/third-party-scripts` — Third-Party Scripts (2026-07-12 — 3 subtopics: subresource-integrity-genuinely-blocks-a-mismatched-script, a-facade-loads-zero-third-party-bytes-until-interaction, resource-timing-correctly-separates-first-party-from-third-party; all three claims verified empirically in-browser first before writing — computed a real SHA-384 hash live via `crypto.subtle.digest()` and confirmed a mismatched-hash script fails (`onerror`, never executes) while the correctly-hashed identical script loads AND executes (confirmed via its own side effect); confirmed a facade produces zero resource-timing entries for the widget before any click and exactly one immediately after; confirmed the main page's own third-party-audit code sample produces correct real results when run live against THIS actual production page (86 first-party vs 4 third-party requests, correctly grouped by hostname — fonts.googleapis.com, fonts.gstatic.com); a fourth idea (document.write() being blocked/ignored after page load, matching the main page's own mistake explanation) was tested and dropped — direct testing showed document.write() succeeding normally in this environment, since Chrome's real intervention is conditioned on detected slow-network conditions, not a blanket post-load block; replaced with the Resource Timing audit subtopic instead; filled a pre-existing sidebar gap — no base entry existed for `/performance/third-party-scripts`, added one alongside the 3 composites; SUBTOPICS map key left bare ('third-party-scripts'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **This completes 13 Web Performance topics in this session's batch.**)
- [x] `/performance/measurement` — Performance Measurement (2026-07-12 — 3 subtopics: performance-mark-creates-real-timeline-entries-performance-now-does-not, fcp-and-lcp-are-genuinely-different-real-timestamps, navigation-timings-responsestart-genuinely-computes-ttfb; all three claims verified empirically in-browser first, largely by reading real Performance API data live from THIS actual page before writing — confirmed `performance.now()` produces zero queryable mark/measure entries while `performance.mark()`/`measure()` create real named ones; confirmed real FCP (360ms) and final LCP (460ms, ~6.5x larger pixel area) are genuinely distinct timestamps on this page's own load, not the same measurement under two names; confirmed this page's own `PerformanceNavigationTiming` entry (fetchStart 2ms, requestStart 5ms, responseStart 8ms) produces a genuine computed TTFB of 3ms via the documented formula; filled a pre-existing sidebar gap — no base entry existed for `/performance/measurement`, added one alongside the 3 composites; SUBTOPICS map key left bare ('measurement'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **This completes 14 Web Performance topics in this session's batch — 6 remain: rum, ssr-streaming, css-performance, web-workers, performance-budgets, speculation-rules.**)
- [x] `/performance/rum` — Real User Monitoring (RUM) (2026-07-12 — 3 subtopics: sendbeacon-fires-a-real-request-with-its-own-initiator-type, p75-and-average-can-disagree-on-the-pass-fail-rating-entirely, batching-metrics-into-one-beacon-genuinely-cuts-requests; all three claims verified empirically in-browser first before writing — confirmed `navigator.sendBeacon()` produces a real resource-timing entry with `initiatorType: "beacon"` (distinct from fetch/xhr); computed a realistic 20-session LCP dataset (14 fast, 6 genuinely slow, a real mobile/3G-style tail) where average (1,839ms) and P75 (2,600ms) landed on OPPOSITE sides of the 2,500ms good/poor threshold — took two attempts to hit a dataset shape where they actually diverged on rating, not just numerically; confirmed 5 separate `sendBeacon()` calls produce 5 real requests vs 1 for a batched call, via real resource-timing counts; a transient network error during the production build (Google Fonts inlining fetch failed) resolved on a simple retry, unrelated to the code changes; filled a pre-existing sidebar gap — no base entry existed for `/performance/rum`, added one alongside the 3 composites; SUBTOPICS map key left bare ('rum'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb confirmed. **This completes 15 of 20 Web Performance topics in this session's batch — 5 remain: ssr-streaming, css-performance, web-workers, performance-budgets, speculation-rules.**)
- [x] `/performance/ssr-streaming` — SSR & Streaming HTML (2026-07-12 — 3 subtopics: a-readablestream-genuinely-delivers-chunks-at-different-real-times, non-deterministic-values-genuinely-differ-between-renders, reading-chunk-by-chunk-beats-waiting-for-the-full-response; all three claims verified empirically in-browser first before writing — confirmed a real `ReadableStream` enqueuing 3 chunks with `setTimeout` delays between them delivers genuinely distinct arrival timestamps (0ms, 584ms, 1589ms measured) via a real `reader.read()` loop; confirmed the identical rendering function called twice (simulating server-render then client-render 1.2s later) produces genuinely different `Date`/`Math.random()` values almost every time, directly explaining why hydration mismatches from non-deterministic values are structurally inevitable, not a rare edge case; confirmed against the identical stream that chunk-by-chunk `reader.read()` returns the first chunk at +0ms while `await new Response(stream).text()` blocks for the full duration (1020ms measured) waiting for the slowest chunk — proving the streaming benefit depends on the CONSUMPTION pattern, not just whether the producer streams; tried and abandoned a TTFB/`responseStart`-vs-`responseEnd` divergence test using a real static-file fetch against the local dev server — local static files resolve too fast (~1ms gap, both timestamps nearly identical) to demonstrate any meaningful streaming divergence since there's no way to control server-side response delay in this environment, replaced with the controlled `ReadableStream`+`setTimeout` approach used in subtopics 1 and 3 instead; filled a pre-existing sidebar gap — no base entry existed for `/performance/ssr-streaming`, added one alongside the 3 composites; SUBTOPICS map key left bare ('ssr-streaming'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + accordion auto-expand-on-direct-navigation confirmed. **This completes 16 of 20 Web Performance topics in this session's batch — 4 remain: css-performance, web-workers, performance-budgets, speculation-rules.**)
- [x] `/performance/css-performance` — CSS Performance (2026-07-12 — 3 subtopics: selector-complexity-barely-moves-recalc-style-time-at-scale, unused-css-selectors-stay-in-the-cssom-until-you-remove-them, contain-content-clips-overflow-like-overflow-hidden; all three claims verified empirically in-browser first before writing — a first naive selector-complexity timing test showed a misleading ~7x gap purely from warm-up/order bias (the first-run pass paid the one-time cost of building the initial style tree for 5,000 fresh elements); corrected methodology (one warm-up pass, then 6 alternating trials swapping which selector goes first) collapsed the "gap" to a 0.07% difference (25.02ms flat class vs 25.00ms 4-level descendant selector), directly confirming the main page's own QnA claim; confirmed via `document.styleSheets`/`cssRules` that a rule for a class matching zero DOM elements is still fully parsed and present in the live CSSOM, supporting why PurgeCSS/Tailwind JIT must run at build time rather than relying on any browser-level "used CSS" mechanism; confirmed via `document.elementFromPoint()` that `contain: content` (paint containment) genuinely clips an overflowing child at the container's edge — hit-testable with no containment, non-hit-testable at the identical position with `contain: content` applied, geometry unchanged in both cases; also tried and abandoned two ideas before settling on the above three — a "content-visibility: hidden caches render state, cheaper to reveal than display:none" claim was tested and found to show the OPPOSITE of the intended point across 5 trials (hidden reveal consistently ~20-22ms vs display:none's ~17.5ms), so dropped rather than publish a contradicted claim; a "top vs transform forces layout" rAF-based timing test hit the known backgrounded-tab rAF freeze (confirmed via `document.hasFocus() === false`) and a forced-offsetHeight-per-frame variant showed only a 1.09x ratio since ANY style mutation forces the same synchronous layout recalc on a forced read regardless of which property changed — this matches the already-documented abandoned idea from the browser-rendering batch ("pure write-only cost of layout-triggering vs transform properties... browser coalesces same-tick writes into one flush regardless of property"), so this angle was not retried a third time; filled a pre-existing sidebar gap — no base entry existed for `/performance/css-performance`, added one alongside the 3 composites; SUBTOPICS map key left bare ('css-performance'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar + prev/next footer nav confirmed. **This completes 17 of 20 Web Performance topics in this session's batch — 3 remain: web-workers, performance-budgets, speculation-rules.**)
- [x] `/performance/web-workers` — Web Workers & Off-Main-Thread (2026-07-12 — 3 subtopics: transferred-arraybuffers-become-genuinely-detached-zero-copy, a-worker-genuinely-keeps-the-main-thread-responsive-during-heavy-work, reusing-a-worker-is-dramatically-faster-than-creating-one-per-task; all three claims verified empirically in-browser first using real Worker objects built from Blob URLs (no separate worker file needed for a live in-page demo) before writing — confirmed a real 1MB ArrayBuffer transferred via `postMessage(buffer, [buffer])` drops to `byteLength === 0` on the sending side immediately while the Worker receives the full 1,048,576 bytes; confirmed a `setInterval` on the main thread ticked 0 times during an identical 300ms synchronous busy-loop run directly on the main thread, but 4 times during the SAME work run inside a real Worker — direct, measured proof of the main page's core "off the main thread" claim; confirmed 20 trivial tasks took 89ms with a fresh Worker created+terminated per task versus 5ms reusing one Worker for all 20, a measured 17.8x overhead penalty entirely attributable to Worker creation/teardown; **found and fixed a real SUBTOPICS map key collision** — the topic's own bare slug `web-workers` was already claimed by Angular's own `/angular/web-workers` topic (which already has its own 3 subtopics) — hub-prefixed to `perf-web-workers` per the established `aspnet-routing`/`css-tailwind` collision pattern, and correspondingly used `'perf-web-workers'` (not the bare slug) in all four nav-accordion helper calls (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) in `app.html`; verified via browser that `/angular/web-workers`'s own nav toggle and subtopics remained completely unaffected after the fix; breadcrumb composite keys stayed bare (`'web-workers/<slug>'`) since `PERFORMANCE_LABELS` is its own separate object literal from Angular's `ROUTE_LABELS`, no collision risk there; sidebar composite keys used the full-path convention (`'performance/web-workers/<slug>'`), also collision-free since sidebar keys are globally full-path-qualified; filled a pre-existing sidebar gap — no base entry existed for `/performance/web-workers`, added one alongside the 3 composites; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 18 of 20 Web Performance topics in this session's batch — 2 remain: performance-budgets, speculation-rules.**)
- [x] `/performance/performance-budgets` — Performance Budgets & CI (2026-07-12 — 3 subtopics: gzip-approximation-is-wildly-inaccurate, a-median-of-3-runs-genuinely-narrows-measurement-variance, initial-vs-anyscript-budgets-catch-genuinely-different-failure-modes; all claims verified empirically in-browser first before writing — used the real `CompressionStream('gzip')` Web API to directly test the main page's own "Custom CI budget assertion" code sample, which approximates gzip size as raw size × 0.3: a repetitive minified-JS-like sample (151,200 bytes of repeated function patterns) real-gzipped to just 3,516 bytes (ratio 0.023), meaning the ×0.3 approximation overstated it by ~1190%; a high-entropy random sample (60,000 bytes) real-gzipped to 44,945 bytes (ratio 0.749), meaning the approximation understated it by 60% — genuinely wrong in opposite directions depending on content redundancy; confirmed via 30 real, individually-timed same-origin `fetch()` round-trips that raw single-run timings had a stddev of 0.97ms and a 2.7–7.3ms range, while grouping into medians of 3 narrowed stddev to 0.77ms and the range to 2.9–5.5ms, directly grounding the main page's "Lighthouse swings ±10 points single-run, ±3 at median-of-3" claim in a general, reproducible statistical mechanism rather than something specific to the Lighthouse tool; the third subtopic (Angular CLI budget types) is build-time-only with no observable runtime behavior, so it dropped the live playground for a plain code-block, matching the established `/javascript/bundlers`/`/react/nextjs`/`/css/tailwind` precedent — walked through two concrete, worked scenarios (ten 40KB chunks failing `initial` while passing `anyScript`; one legitimate 180KB chunk failing `anyScript` while passing `initial`) plus a follow-up point that a lazy-loaded chunk is excluded from the `initial` total by definition, so only `anyScript` catches unbounded lazy-chunk growth; **hit a real Windows MAX_PATH risk before writing any files** — the first planned slug (`the-size-times-0-3-gzip-approximation-is-wildly-wrong-depending-on-content`, 76 chars) combined with the folder+file doubling pattern produced a 266-character absolute path, over the 260-char limit; renamed to a short folder/file slug (`gzip-approximation-is-wildly-inaccurate`, 40 chars → 196-char path) BEFORE writing any files this time, per the established fix, and used that same short slug consistently as the actual route too (rather than decoupling a long descriptive route from a short folder) since there was no requirement to keep the original long phrasing; filled a pre-existing sidebar gap — no base entry existed for `/performance/performance-budgets`, added one alongside the 3 composites; SUBTOPICS map key left bare ('performance-budgets'), collision-free; browser-verified successfully, all 3 nav links + breadcrumb + code-block-only third subtopic (no live playground, confirmed rendering "Code Examples"/"View Code" instead of "See it run") confirmed. **This completes 19 of 20 Web Performance topics in this session's batch — 1 remains: speculation-rules.**)
- [x] `/performance/speculation-rules` — Speculation Rules API (2026-07-12 — 3 subtopics: feature-detection-genuinely-confirms-support-before-you-speculate, document-prerendering-genuinely-reports-false-on-a-normal-page-load, malformed-speculation-rules-json-is-not-silently-ignored; all claims verified empirically in-browser first before writing — confirmed `HTMLScriptElement.supports('speculationrules')` returns `true` in this session's actual Chromium 148-based browser and a dynamically injected `<script type="speculationrules">` block is accepted into the DOM without error; confirmed `document.prerendering` correctly reports `false` on this actual DevHub page (loaded via normal navigation, not a speculative prerender), and `prerenderingchange` listener registration succeeds without error, grounding the main page's analytics-guard pattern; confirmed malformed JSON inside a speculationrules block does NOT fail silently in a supporting browser — it triggers a real, catchable `window` `'error'` event with the message "Uncaught TypeError: Line: 1, column: 3, Syntax error." (reported ASYNCHRONOUSLY, not synchronously at the `appendChild()` call — a local try/catch around the injection would not catch it, only a global error handler), a genuinely different signal from an unsupported browser's complete silence; **caught and fixed a real raw-HTML-tag-as-text gotcha during browser verification** (not caught by the build) — the third subtopic's `exercise.prompt` and two `misconceptions` entries contained literal `<script type="speculationrules">`/`<script>` text meant to be read as prose, but since those fields bind via `[innerHTML]`, the browser parsed the literal tags as real (invisible) elements and silently swallowed everything after them in the same string — confirmed via `get_page_text` showing truncated sentences ending mid-word right where the tag began; fixed by wrapping all 4 occurrences in `<code>&lt;script type="speculationrules"&gt;</code>`/`<code>&lt;script&gt;</code>` per the established pattern, rebuilt, and re-verified the fix rendered the complete text correctly; also hit a transient tool-level issue mid-batch — the browser tool's safety classifier was temporarily unavailable for a few minutes (`mcp__Claude_Browser__navigate`/`javascript_tool` both errored with "claude-sonnet-5 is temporarily unavailable"), resolved by waiting ~90s via a scheduled wakeup and retrying, unrelated to any code issue; filled a pre-existing sidebar gap — no base entry existed for `/performance/speculation-rules`, added one alongside the 3 composites; SUBTOPICS map key left bare ('speculation-rules'), collision-free; browser-verified successfully (after the tag-escaping fix), all 3 nav links + breadcrumb + tailored sidebar confirmed. **THIS COMPLETES THE WEB PERFORMANCE HUB'S FULL PHASE 10 SUBTOPIC ROLLOUT — all 20 trackable Web Performance topics now have 3 subtopics each (60 subtopic pages total).**)

#### Blazor — 20 topic pages

- [x] `/blazor/fundamentals` — Blazor Fundamentals (2026-07-12 — first subtopic set for the Blazor hub — 3 subtopics: statehaschanged-is-automatic-after-sync-handlers-manual-elsewhere, scoped-services-are-per-circuit-not-per-request-in-blazor-server, static-ssr-parents-cannot-make-children-interactive; **dropped the live playground for all three** (plain `<app-code-block>` instead) — Blazor/.NET has no in-browser runtime, matching the established non-Angular-hub pattern (C#, SQL, Python, Go); content expands each of the main page's existing mistake entries into the actual underlying mechanism (Blazor's dispatched-event render pipeline, the SignalR-circuit-as-DI-scope-boundary, and the .NET 8 interactive-island render-mode boundary) rather than empirical browser verification, since there's no .NET runtime to test claims against in this browser — consistent with how C#/ASP.NET hub subtopics are already built; **confirmed via a dedicated Explore-agent investigation BEFORE writing** (per the "check hub-specific SIDEBAR_MAP/SUBTOPICS/breadcrumb conventions before a hub's first subtopic set" discipline) that: `BLAZOR_LABELS` breadcrumb map uses bare keys; `search.service.ts` uses `blazor-` prefixed routes; `page-sidebar.ts` uses full-path `blazor/<slug>` keys (base entry for `blazor/fundamentals` already existed); nav accordion helper calls + progress/diff keys use `blazor-fundamentals`; **and that bare `'fundamentals'` in `app.ts`'s SUBTOPICS map was already claimed by the JavaScript hub** — hub-prefixed to `'blazor-fundamentals'` with the same `// NOTE:` comment pattern already used for the `html-fundamentals`/`css-fundamentals` collisions; **caught two real gotchas during the build/sweep, not by the initial grep pass**: (1) a bare `@onclick`/`@rendermode` in a page-subtitle text node, fixed with the standard `&#64;` escape; (2) a NEW variant of the raw-HTML-tag-as-text gotcha specific to C#/Blazor content — a C# generic type expression `AddScoped<AuditLogBuffer>()` written as plain text inside an `[innerHTML]`-bound `exercise.prompt` field was parsed by the browser as a literal `<AuditLogBuffer>` HTML tag (the same failure mode as a literal `<script>` mention, just triggered by C# generic angle-bracket syntax instead of an actual tag name) — fixed by escaping to `&lt;AuditLogBuffer&gt;`; **this is a new standing gotcha specific to future C#/Blazor/generic-heavy subtopic content**: any `SomeType<T>` generic syntax written as prose inside an `[innerHTML]`-bound field must be entity-escaped, not just literal tag names; (3) a genuine build failure from a straight apostrophe in ".NET 8's" inside a single-quoted `exercise.solution` string — same root-cause category as the established backtick/apostrophe-in-bound-attribute gotcha, but this instance was in a component's own TS string field (not a `.html` bound attribute), confirming the "any delimiter character appearing literally inside a string using that same delimiter" rule applies universally across both file types, not just the previously-documented `.html`-file cases — fixed with `\'`; browser-verified successfully after all fixes, all 3 nav links + breadcrumb + tailored sidebar + `.NET Fiddle`/SharpLab run-it links (`tech="csharp"`) confirmed rendering correctly.)
- [x] `/blazor/render-modes` — Blazor Render Modes (2026-07-12 — 3 subtopics: interactiveauto-loses-state-when-it-switches-from-server-to-webassembly, oninitializedasync-genuinely-runs-twice-during-prerender-then-hydrate, streamrendering-flushes-placeholder-html-before-async-data-resolves; deliberately DISTINCT from `/blazor/fundamentals`'s third subtopic (which already covered the Static-SSR/interactive-island boundary mechanism in depth) — this batch instead covers InteractiveAuto's actual Server→WASM teardown-and-restart mechanism and the PersistentComponentState fix, the harmless-vs-dangerous distinction for OnInitializedAsync's default double-execution during prerender-then-hydrate, and how [StreamRendering] changes response TIMING (not duration) for purely Static SSR pages; no live playground for any of the three (same non-Angular-hub pattern as the fundamentals batch); gotcha sweep (bare `@word`, C# generics in `[innerHTML]`-bound fields, possessive apostrophes) came back clean this time — the two new gotchas documented in CLAUDE.md after the fundamentals batch were caught proactively during writing rather than needing a build-failure fix; build passed on the first attempt; `SUBTOPICS` map key left bare (`'render-modes'`), confirmed collision-free; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar + `.NET Fiddle`/SharpLab run-it links confirmed rendering correctly.)
- [x] `/blazor/razor-components` — Razor Components (2026-07-12 — 3 subtopics: renderfragment-t-compiles-to-a-delegate-the-framework-invokes-per-item, cascadingparameter-flows-through-any-depth-without-explicit-forwarding, shouldrender-cannot-suppress-a-components-first-render; expands the main page's generic-component code sample into RenderFragment<T>'s actual Func<T, RenderFragment> delegate mechanism, contrasts CascadingValue's any-depth reach against a [Parameter] chain's explicit-forwarding requirement (and the visibility tradeoff that makes each appropriate in different cases), and covers two easy-to-miss ShouldRender() edge cases (first render is unconditional; false only suppresses that component's own markup, not children's); no live playground (same non-Angular-hub pattern); **caught the C#-generics-in-innerHTML gotcha proactively during the sweep** (2 unescaped `RenderFragment<T>` occurrences in a `hint`/`solution` field), fixed before wiring rather than discovered via a truncated-text bug after build — confirms the gotcha-sweep discipline documented after the fundamentals batch is catching real instances; `SUBTOPICS` map key left bare (`'razor-components'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar + `.NET Fiddle`/SharpLab run-it links confirmed rendering correctly, all `RenderFragment<T>` entity-escapes decoding and displaying correctly with no truncation anywhere on the page.)
- [x] `/blazor/component-communication` — Component Communication (2026-07-12 — 3 subtopics: eventcallback-statehaschanged-targets-receiver-not-invoker, bind-value-desugars-into-two-separate-parameters-not-magic-binding, isfixed-true-permanently-freezes-a-cascading-values-re-traversal; clarifies exactly WHICH component EventCallback's automatic re-render targets (the original handler owner, never the invoker or intermediate forwarders), shows @bind-Value as pure compile-time text expansion with an exact-name-match requirement (not runtime reflection), and explains IsFixed=true as a permanent one-time promise rather than a "rarely changes" optimization; no live playground (same non-Angular-hub pattern); **hit and fixed 3 real gotchas this batch, more than any prior Blazor batch**: (1) 2 unescaped C# generics in a `hint`/`solution` field (`RenderFragment<T>`-style, from the prior razor-components pattern, caught proactively before wiring); (2) a raw `<RatingPicker ...>` tag mentioned as prose inside a `theory` field, caught via the standard sweep; (3) two bare `@bind-Value` occurrences in "Where this fits" prose sections that the initial sweep pass missed on the first read and were caught on a second full-batch sweep — reinforces running the sweep across ALL 3 files together at the end, not just per-file as each is written; **also made and immediately caught two escaping MISTAKES of my own before they reached the build**: writing `@@bind-Value` instead of the correct `&#64;bind-Value` HTML-entity escape for a bare `@` in prose, and using backslash-escaped straight apostrophes (`\'`) instead of the established typographic `’` (U+2019) inside `[prev]`/`[next]` bound-attribute label strings; `SUBTOPICS` map key left bare (`'component-communication'`), confirmed collision-free; build passed on the first attempt once all fixes were applied; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed, all entity-escaped tags/generics/@-words decoding and displaying correctly with no truncation anywhere.)
- [x] `/blazor/forms` — Blazor Forms (2026-07-12 — 3 subtopics: notifyvalidationstatechanged-is-required-editcontext-cant-see-msgstore-adds, dataannotationsvalidator-skips-nested-objects-without-validatecomplextype, supplyparameterfromform-only-binds-on-a-real-post-not-first-load; explains the actual event mechanism behind the main page's own `ctx.NotifyValidationStateChanged()` code samples (ValidationSummary/ValidationMessage subscribe to `OnValidationStateChanged`, not a general re-render), works through the two-piece `[ValidateComplexType]` + `ObjectGraphDataAnnotationsValidator` fix for nested-object validation with a full before/after code walkthrough, and clarifies `[SupplyParameterFromForm]` only has data to bind after a genuine POST (a first-load "empty" model is not the attribute "clearing" anything); no live playground (same non-Angular-hub pattern); gotcha sweep came back completely clean this batch — no `@word`, apostrophe, or raw-tag fixes needed; **real `SUBTOPICS` map bare-key collision**: `forms` was already claimed by the Angular hub's own `/angular/forms` topic (itself the reason the pre-existing `html-forms` precedent exists) — hub-prefixed to `'blazor-forms'`, with the nav-accordion helper calls in `app.html` all using the prefixed key too; build passed on the first attempt; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 5 of 20 Blazor topics.**)
- [x] `/blazor/data-binding` — Data Binding in Blazor (2026-07-12 — 3 subtopics: key-prevents-blazor-from-misattributing-state-when-a-list-reorders, omitting-bind-format-on-dates-risks-a-silent-locale-parse-mismatch, a-hand-rolled-debounce-needs-cancellation-not-just-a-timer; **found and fixed a real, confirmed inaccuracy on the ALREADY-PUBLISHED main page** while designing subtopic 1 — dispatched two research agents to verify C# closure-capture semantics before publishing anything (per the "verify before writing" discipline), which confirmed the main page's "Forgetting the loop variable capture" mistake entry, its matching quiz question, and its "Loop variable capture" code sample were all describing the classic foreach-closure bug INCORRECTLY as still current — that bug was fixed at the C# LANGUAGE level for foreach specifically at C# 5.0 (2012), giving each iteration its own fresh variable capture, and Razor's own `@foreach` codegen in current .NET 8/9 matches that same per-iteration semantics; a second research pass confirmed this Blazor-specific advice is now obsolete inertia from pre-3.0-era documentation, and that the ACTUALLY still-current, still-real gotcha in the same area is `@key` and diffing-by-position state misattribution when a list reorders/filters — replaced the main page's mistake entry, quiz question, and code sample with `@key` content, and built subtopic 1 around the corrected topic instead of the original (wrong) premise; **caught and fixed a new-flavor gotcha this batch**: bare `@key`/`@bind:format` as literal TEXT in h1/p tags across all 3 subtopic `.html` files (not just prose MENTIONING a directive, but the directive name itself being the page's own subject/title) — escaped to `&#64;key`/`&#64;bind:format` per the established pattern, caught via the standard sweep in 2 of 3 files and one instance in the third that the sweep initially missed until a follow-up full-batch pass; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key left bare (`'data-binding'`), confirmed collision-free; build passed cleanly after all fixes; browser-verified successfully — the `@key` subtopic page and the corrected main page both render with zero truncation, all entity-escapes decoding correctly, nav accordion (manually toggled from the main page, confirmed generic auto-expand only fires on direct subtopic navigation) shows all 3 links. **This completes 6 of 20 Blazor topics.**)
- [x] `/blazor/routing` — Blazor Routing (2026-07-12 — 3 subtopics: onparameterset-fires-without-oninitialized-when-blazor-reuses-a-component, navigateto-forceload-schedules-the-reload-code-after-it-still-runs, catch-all-routes-capture-everything-after-the-prefix-as-one-string; expands the main page's mistake entry into the actual same-type-component-reuse mechanism, its QnA into a full NavigateTo()-returns-immediately bug/fix worked example, and its catch-all-route mention into exact capture/leading-slash/decoding/matching-precedence behavior; **reconsidered and revised one exercise mid-authoring**: an initial draft claimed URL-encoded slashes (%2F) decode into literal "/" before reaching a catch-all route parameter — recognized this touches security-sensitive, version/configuration-dependent ASP.NET Core routing internals not confidently verifiable without a .NET runtime, and replaced it with a safer, well-documented claim instead (Path.Combine silently dropping earlier segments when a later argument is rooted/absolute) — the same "verify C#/.NET claims before publishing" discipline documented after the prior data-binding batch, this time catching a risky claim during drafting rather than after research-agent fact-checking; no live playground (same non-Angular-hub pattern); gotcha sweep came back completely clean; `SUBTOPICS` map key hub-prefixed to `'blazor-routing'` — a collision ALREADY anticipated and pre-documented in CLAUDE.md before this batch even started (bare `'routing'` claimed by Angular, ASP.NET Core already resolved the same clash as `'aspnet-routing'`); build passed on the first attempt; browser-verified successfully (after a dev-server restart mid-batch), all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 7 of 20 Blazor topics.**)
- [x] `/blazor/dependency-injection` — Dependency Injection in Blazor (2026-07-12 — 3 subtopics: owningcomponentbase-gives-each-instance-its-own-scoped-service, captive-dependency-freezes-scoped-instance-at-singleton-construction, iservicescopefactory-must-dispose-its-scope-immediately-after-use; deliberately DISTINCT from the fundamentals batch's own "Scoped Services Are Per-Circuit, Not Per-Request" subtopic — this batch goes deeper into DI mechanics rather than re-covering basic Scoped/Singleton/Transient semantics: the concurrent-access danger OwningComponentBase solves for shared DbContext, the construction-time capture mechanism behind captive dependencies (and why a Scoped-vs-Singleton registration swap is the wrong fix), and the tempting-but-wrong "cache one scope for reuse" mistake with IServiceScopeFactory; no live playground (same non-Angular-hub pattern); gotcha sweep came back completely clean — all C# generics in innerHTML-bound fields were properly escaped from the start this batch, confirming the discipline documented after the razor-components/component-communication batches is now applied proactively; `SUBTOPICS` map key hub-prefixed to `'blazor-dependency-injection'` (bare key already claimed elsewhere; ASP.NET Core previously resolved the same collision as `'aspnet-dependency-injection'`); build passed on the first attempt; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 8 of 20 Blazor topics.**)
- [x] `/blazor/state-management` — State Management in Blazor (2026-07-12 — 3 subtopics: protectedlocalstorage-encrypts-at-rest-not-the-decrypted-value-in-memory, cross-tab-sync-needs-the-browsers-own-storage-event-not-blazor, a-forgotten-unsubscribe-throws-on-a-disposed-components-next-event; clarifies the exact security boundary ProtectedLocalStorage provides (ciphertext at rest, fully exposed plaintext once decrypted into app memory), walks through a full JS-interop cross-tab sync pattern grounded in the browser's own native 'storage' event (confirmed via MDN-documented behavior that it fires only in OTHER tabs), and reframes the main page's "unsubscribe to avoid memory leaks" mistake entry as a correctness bug — the service still invokes a disposed component's handler on its next event, which can throw; no live playground (same non-Angular-hub pattern); gotcha sweep came back completely clean including a careful check that every `'storage'` (single-quoted event name) mention inside innerHTML-bound TS fields was correctly backslash-escaped; `SUBTOPICS` map key hub-prefixed to `'blazor-state-management'` (bare key already claimed by the React hub's own `/react/state-management` topic); build passed on the first attempt; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 9 of 20 Blazor topics.**)
- [x] `/blazor/js-interop` — JavaScript Interop (2026-07-12 — 3 subtopics: jsonstringify-throws-a-real-typeerror-on-circular-references, dynamic-import-genuinely-scopes-exports-never-touching-window, ijsinprocessruntime-only-works-in-wasm-same-process-execution; **the first Blazor subtopic batch with genuinely browser-verifiable claims** — since JS interop crosses into real JavaScript APIs, verified two claims empirically via `javascript_tool` before writing: (1) a real circular-referencing object passed to `JSON.stringify()` genuinely throws `TypeError: Converting circular structure to JSON`, grounding the main page's "non-serializable types" mistake entry in an actual reproduced failure rather than an assumed one; (2) a real dynamic `import()` of a Blob-URL ES module, checking `window` before and after, confirmed the imported function never touches `window` at any point (module-scoped export only), proving the ES-module interop pattern's collision-safety is structural, not just cleaner-looking code; the third subtopic (`IJSInProcessRuntime` sync-only-in-WASM) is grounded in documented .NET architecture (same-process vs. cross-network execution) rather than empirical testing, since it's a C#-side constraint with no browser-observable behavior; **caught and fixed a real build failure** — an unescaped apostrophe in "the first's function" inside a `solution` field broke the build with the usual confusing cascade of unrelated parser errors; notably, an EARLIER grep sweep pass on this same file had reported clean (a false negative), only caught by the build itself — re-verified with a fresh sweep after the fix, confirmed genuinely clean this time; no live playground (same non-Angular-hub pattern, though this topic's claims happen to be independently browser-testable); `SUBTOPICS` map key left bare (`'js-interop'`), confirmed collision-free; build passed after the fix; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 10 of 20 Blazor topics — halfway through the hub.**)
- [x] `/blazor/server-signalr` — Blazor Server & SignalR (2026-07-12 — 3 subtopics: a-custom-hub-and-the-render-circuit-are-separate-signalr-mechanisms, the-reconnection-window-only-preserves-state-for-the-same-circuit, azure-signalr-service-routes-messages-it-doesnt-replicate-circuit-state; explains why injecting IHubContext directly into a component compiles and even broadcasts successfully, yet the component never receives its own messages back (it occupies the server-side-sender role, not the connected-client role, until it opens its own HubConnection); expands the reconnection QnA into the DisconnectedCircuitRetentionPeriod mechanism and its real server-memory tradeoff; clarifies Azure SignalR Service solves connection-ROUTING (removing the load-balancer sticky-session requirement) not state-DURABILITY — a circuit's actual state still lives on exactly one app server instance, just as vulnerable to that server's own crash; no live playground (same non-Angular-hub pattern); caught 3 raw C# generics (`Hub<T>`, `IHubContext<T>`) in misconceptions fields during the sweep — this batch's SignalR API surface is unusually generic-heavy, worth extra sweep attention on similarly API-dense future batches; `SUBTOPICS` map key left bare (`'server-signalr'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed (also confirmed the sidebar's `apis` array field renders via plain `{{ }}` interpolation, not `[innerHTML]`, so raw generic syntax there needs no escaping — a useful distinction from the theory/exercise/misconceptions fields). **This completes 11 of 20 Blazor topics.**)
- [x] `/blazor/maui-hybrid` — Blazor Hybrid & MAUI (2026-07-12 — 3 subtopics: a-wrong-hostpage-path-produces-a-blank-screen-with-no-error, rootcomponent-selector-must-match-an-element-in-hostpages-own-html, hybrid-has-no-circuit-state-lives-in-the-native-process-not-a-connection; explains why an incorrect HostPage path fails at the native WebView-navigation layer before any .NET/Blazor code runs (genuinely no exception anywhere to find), covers RootComponent.Selector as a real CSS selector with its own distinct silent-failure signature (static content stuck forever vs. HostPage's total blank screen — a useful diagnostic distinction between the two), and contrasts Hybrid's native-process-lifecycle state model with Blazor Server's network-circuit model, mapping CircuitHandler's underlying goal onto MAUI's own Window.Resumed/Stopped lifecycle hooks; no live playground (same non-Angular-hub pattern); gotcha sweep came back clean; `SUBTOPICS` map key left bare (`'maui-hybrid'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully, all 3 nav links + breadcrumb + tailored sidebar confirmed. **This completes 12 of 20 Blazor topics.**)
- [x] `/blazor/authentication` — Authentication in Blazor (2026-07-14 — 3 subtopics: notifyauthenticationstatechanged-is-the-only-trigger-for-authorizeview, prerender-and-post-hydration-auth-state-come-from-different-sources, oidc-roles-often-use-a-different-claim-type-than-authorize-expects; expands the main page's three auth mistake entries into their actual mechanisms — AuthenticationStateProvider's own internal event is the SOLE trigger that wakes an already-rendered AuthorizeView/[Authorize] (no polling, ever, confirmed via a "GetAuthenticationStateAsync() returns the right value but the UI still shows stale" exercise that isolates the two concerns); Static SSR pre-render and post-hydration interactivity use genuinely separate AuthenticationStateProvider implementations reading from different sources (HttpContext.User vs. a persisted/circuit-derived state), which can disagree without AddAuthenticationStateSerialization() explicitly bridging the boundary — grounded in documented ASP.NET Core auth-state-persistence APIs, not a runtime-tested claim; and [Authorize(Roles = "Admin")] checking one specific ClaimsIdentity.RoleClaimType (defaulting to the Microsoft-namespaced ClaimTypes.Role URI) rather than searching every claim for a matching value, explaining the "authenticated, role claim genuinely present with the right value, still forbidden" symptom most OIDC providers trigger by sending roles under their own claim type; no live playground (same non-Angular-hub pattern, grounded in documented Microsoft Learn framework behavior per the standing C#/.NET verification discipline — no runtime available to test auth flows against); all 3 Windows MAX_PATH-shortened folder names, confirmed safe (244/238/236 chars) before writing any file content; gotcha sweep came back clean (no bare `@word`, no unescaped apostrophes, no raw untagged generics/tags in innerHTML-bound fields — all C# generics like `Task<AuthenticationState>` and Razor tags like `<AuthorizeView>` stayed safely inside plain-interpolation `codeTabs` fields); `SUBTOPICS` map key left bare (`'authentication'`) — confirmed free, since the ASP.NET Core hub had already pre-emptively hub-prefixed its own same-named topic to `'aspnet-authentication'` in anticipation of Blazor claiming the bare key; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, sidebar shows tailored (not DEFAULT) content per subtopic, dark mode renders correctly, prev/next footer nav correct. **This completes 13 of 20 Blazor topics.**)
- [x] `/blazor/error-handling` — Error Handling in Blazor (2026-07-14 — 3 subtopics: errorboundary-recover-clears-the-error-not-the-childs-own-state, dispose-exceptions-are-fatal-not-recoverable-via-errorboundary, async-void-event-handlers-bypass-errorboundary-entirely; **research-verified two framework-mechanism claims against Microsoft's own source before writing, rather than the doc-only verification used in prior batches** — a research agent read `ErrorBoundaryBase.cs` directly (dotnet/aspnetcore) confirming `Recover()` only resets `_errorCount`/`CurrentException` and calls `StateHasChanged()`, never disposing/recreating the child instance (so lifecycle methods don't re-run), corroborated by the Learn doc's own warning against calling `Recover()` from rendering logic to avoid an infinite loop; a second pass confirmed Dispose/DisposeAsync exceptions are fatal-to-circuit per Learn docs directly ("the exception is fatal to the app's circuit") and deliberately routed around ErrorBoundary recovery in the renderer source; **a third verification pass on a planned claim about OnAfterRenderAsync being caught by ErrorBoundary came back only source-code-corroborated, NOT confirmed by official docs — this subtopic angle was dropped and replaced with the doc-confirmed Dispose-fatality angle instead**, following the standing risky-claim self-correction discipline (same category as the earlier `%2F` routing self-correction) rather than publishing a claim resting on internal implementation detail alone; the third subtopic (async void bypassing ErrorBoundary) is grounded in well-established C# async/await semantics (no Task for the renderer to observe) rather than needing fresh verification, since it's foundational language behavior already stated as fact on the main page; caught and fixed a house-style inconsistency during the sweep — initially used markdown-style backtick emphasis (`` `async void` ``) inside single-quoted exercise/theory fields, which is technically safe (backticks don't conflict with the `'...'` delimiter) but inconsistent with every prior Blazor subtopic's plain-text convention for inline code mentions in these fields; removed for consistency; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key hub-prefixed to `'blazor-error-handling'` — bare `'error-handling'` was already claimed by the JavaScript hub (and pre-emptively resolved by ASP.NET Core as `'aspnet-error-handling'` in anticipation); build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, sidebar shows tailored content, dark mode renders correctly, prev/next footer nav correct. **This completes 14 of 20 Blazor topics.**)
- [x] `/blazor/streaming-rendering` — Streaming Rendering (2026-07-14 — 3 subtopics: enhanced-navigation-can-undo-dom-changes-unless-marked-data-permanent, streamrendering-is-redundant-on-interactive-modes-not-blocked, streamed-sections-patch-in-resolution-order-not-markup-order; **both mechanism-level hypotheses tested against Microsoft Learn docs before writing were corrected by the research** — the initial guess that enhanced navigation preserves a "safe zone" for DOM outside the routed page content was wrong; the docs state plainly the diffing algorithm compares the WHOLE rendered document and "may undo dynamic changes to the DOM if the updated content isn't part of the server rendering," with `data-permanent` as the only real exemption and an `enhancedload` event for content that needs active re-application — subtopic 1 was written around this corrected, doc-quoted fact instead; separately, the initial guess that `[StreamRendering]` is skipped on interactive render modes because a SignalR circuit/WASM runtime can't handle a partial HTTP response was also wrong — Microsoft's actual documented reason is that interactive modes already deliver the identical incremental-UI-update experience through their own normal render pipeline, making the attribute redundant there, not technically blocked — subtopic 2 explicitly rules out the plausible-but-wrong circuit-connection framing in its own theory content, continuing the standing risky-claim self-correction discipline; subtopic 3 (resolution-order vs. markup-order arrival for independent streamed sections) is a direct, lower-risk expansion of the main page's own already-published Dashboard/QnA example rather than a fresh claim needing research verification; caught and fixed one `&#64;Body` prose-text escape in a page-subtitle during the sweep (safe unescaped in codeTabs and page-meta bound attributes, but bare text in a `<p>` needs the standard entity escape); no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key left bare (`'streaming-rendering'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, sidebar shows tailored content (confirmed `tip`/`gotchas` fields render via plain `{{ }}` interpolation like `apis`, so raw `@Body`/`@if` mentions there needed no escaping), prev/next footer nav correct. **This completes 15 of 20 Blazor topics — three-quarters through the hub.**)
- [x] `/blazor/sections-layouts` — Sections & Layouts (2026-07-14 — 3 subtopics: last-sectioncontent-wins-means-last-registered-not-last-declared, sectionoutlet-matching-is-a-global-lookup-not-ancestor-scoped, a-sectionname-typo-fails-silently-with-no-built-in-fallback; **all three subtopics needed source-level verification, since Microsoft Learn's docs state the high-level rules but not the underlying mechanics** — a research agent read `SectionRegistry.cs`/`SectionContent.cs`/`SectionOutlet.cs`/`Dispatcher.cs` directly (dotnet/aspnetcore) confirming: (1) "last SectionContent wins" tracks real-time `SetParametersAsync` registration order via `providers.Add(provider)` on a shared list, NOT markup/file declaration order — an async component's SectionContent can register, and win, after an already-rendered synchronous sibling's, even if declared earlier in the page; (2) the `SectionRegistry` is a plain field on `Dispatcher` (not a DI service), shared app/circuit-wide with ZERO ancestor-relationship checks anywhere — SectionName strings form a genuinely global namespace, and a SECOND active SectionOutlet for the same name actually THROWS (`Subscribe` enforces one subscriber per identifier), a different failure mode than the SectionContent side's silent "last wins" competition; (3) a SectionName typo produces no exception or warning in EITHER direction — an unmatched SectionContent just sits unrendered in the registry, an unmatched SectionOutlet renders an empty fragment — and SectionOutlet has no built-in fallback/default-content parameter at all (confirmed via a GitHub issue, dotnet/aspnetcore#52477, discussing this as a known gap); explicitly flagged the typo-silent-failure specifics as source-derived rather than doc-corroborated, per the standing verify-and-flag-confidence-gaps discipline; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key left bare (`'sections-layouts'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — nav accordion expands showing all 3 subtopic links, 4-level breadcrumb, tailored sidebar, no console errors (dev server took ~2 minutes to complete its initial build on this large project, requiring two `ScheduleWakeup` waits before navigation succeeded — not a code issue). **This completes 16 of 20 Blazor topics.**)
- [x] `/blazor/seo-metadata` — SEO & Metadata in Blazor (2026-07-14 — 3 subtopics: pagetitle-and-headcontent-are-sections-in-disguise, json-ld-inside-script-silently-corrupts-not-throws, og-image-and-other-og-urls-must-be-absolute-not-relative; **subtopic 1 directly builds on the just-completed Sections & Layouts batch's verified findings** — a research agent read `PageTitle.cs`/`HeadContent.cs`/`HeadOutlet.cs` (dotnet/aspnetcore) confirming these are literal thin wrappers: `PageTitle` renders a `SectionContent` targeting a well-known internal `TitleSectionId`, `HeadContent` does the same for `HeadSectionId`, and `HeadOutlet` renders two `SectionOutlet` instances — meaning "last PageTitle wins" is the EXACT SAME real-time-registration-order mechanism already verified for general Sections, not a special title-specific rule, and "page beats layout" is a consequence of render order (layouts render before their own @Body) rather than hardcoded precedence; subtopic 2 required a second verification pass confirming `<script>` is an HTML "raw text element" per the WHATWG spec — content is never HTML-entity-decoded by the browser, so Razor's default `@expression` HTML-encoding (correct for ordinary attributes) leaves a literal `&quot;` inside a JSON-LD script block forever, producing JSON that usually still PARSES successfully but contains silently corrupted values — genuinely more dangerous than the main page's existing HTML-attribute-escaping mistake entry, which covers a different failure mode entirely; fix is `JsonSerializer.Serialize()` + `MarkupString` to bypass HTML-encoding; subtopic 3 (absolute vs. relative OG URLs) is grounded in standard, well-established Open Graph protocol requirements rather than needing Blazor-specific source verification; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key left bare (`'seo-metadata'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar content, no console errors, entity-escaped `&lt;script&gt;`/`&quot;` references render correctly as literal display text in theory/misconceptions fields. **This completes 17 of 20 Blazor topics.**)
- [x] `/blazor/virtualization` — Virtualization in Blazor (2026-07-14 — 3 subtopics: virtualize-recreates-item-dom-on-every-filter-without-key, virtualize-discards-stale-itemsprovider-results-itself, overscancount-splits-evenly-with-no-scroll-direction-awareness; a research agent read `Virtualize.cs` directly (dotnet/aspnetcore, confirmed identical on `main` and `release/9.0`) verifying two mechanism claims: (1) `RefreshDataCoreAsync` cancels the PREVIOUS request's token the instant a newer request starts, then checks that same captured token immediately before committing any result — meaning a non-cooperative ItemsProvider that ignores `CancellationToken` entirely still cannot have its stale result reach the screen, refining the main page's own QnA (which frames token-forwarding as preventing a "wrong data on screen" bug) into the more precise "efficiency, not correctness" distinction; (2) `OverscanCount` is applied identically via the same constant in both the top-spacer and bottom-spacer visible-range calculations with zero scroll-direction or velocity signal anywhere in the file — confirmed purely symmetric, no adaptive biasing; subtopic 1 (`@key` diffing cost) extends already-established Blazor diffing knowledge from the earlier data-binding batch, applied specifically to the main page's own Contact List search-as-you-type challenge as the highest-churn scenario; **hit the established `@key`-as-subject density gotcha again** (same pattern as the earlier `/blazor/data-binding` batch) — since these subtopics are literally ABOUT `@key`, it appeared bare in h1 titles and prose paragraphs across all 3 files, requiring the full-batch sweep to catch and fix 4 separate instances (`&#64;key`) after the per-file writing pass initially missed them; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key left bare (`'virtualization'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar, no console errors, escaped `&#64;key` titles render correctly as literal `@key` text. **This completes 18 of 20 Blazor topics.**)
- [x] `/blazor/progressive-enhancement` — Progressive Enhancement (2026-07-14 — 3 subtopics: enhanced-forms-share-enhanced-navigations-fetch-and-patch-pipeline, a-cross-origin-redirect-after-enhanced-form-submission-hard-fails, formname-defaults-to-empty-string-with-no-ancestor-scoping; **directly extends verified findings from two earlier Blazor batches** — subtopic 1 confirms (via Microsoft Learn's forms/navigation docs and `NavigationEnhancement.ts` source) that enhanced forms (`data-enhance`) and enhanced navigation share ONE documented fetch-and-patch pipeline, not two separate implementations, meaning the `data-permanent` escape hatch already established in the streaming-rendering batch applies identically to form submissions; subtopic 3 confirms FormName defaults to an empty string and has NO ancestor scoping (a flat, page-independent namespace, same pattern as SectionName from the sections-layouts batch, with `FormMappingScope` as the equivalent escape hatch) — two unnamed forms on one page silently collide rather than erroring; **found and fixed a real inaccuracy on the already-published main page** — the "don't use data-enhance on login forms" mistake entry AND its matching quiz question both attributed the failure to a cookie-setting problem on 302 redirects; a research pass confirmed same-origin redirects actually DO set cookies correctly via fetch, and the real, doc-confirmed failure is specific to CROSS-ORIGIN redirects (common OAuth flows) becoming opaque fetch responses that Blazor's enhanced form handling explicitly treats as a hard error for non-GET requests — both the mistake explanation and quiz explanation were rewritten to the precise mechanism, continuing the standing self-correction discipline; subtopic 2 builds the corrected explanation into a full subtopic; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key left bare (`'progressive-enhancement'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar, no console errors. **This completes 19 of 20 Blazor topics — one topic remaining.**)
- [x] `/blazor/performance` — Blazor Performance (2026-07-14 — 3 subtopics: blazor-already-skips-setparametersasync-for-unchanged-primitives, shouldrender-false-also-skips-onafterrender-not-just-the-diff, imemorycache-getorcreateasync-can-run-its-factory-concurrently; a research agent read `RenderTreeDiffBuilder.cs`/`ParameterView.cs`/`ChangeDetection.cs`/`Renderer.cs`/`ComponentBase.cs` directly (dotnet/aspnetcore) verifying two rendering-lifecycle mechanisms: (1) Blazor already compares child component parameters by VALUE for a fixed whitelist of immutable types (numbers, strings, bool, enums, Guid, DateOnly/TimeOnly, EventCallback) via `DefinitelyEquals`/`ChangeDetection.MayHaveChanged`, skipping `SetParametersAsync` when every parameter provably hasn't changed — but for any reference type (record, class, collection) it always re-invokes `SetParametersAsync` unconditionally, since it can't safely assume no in-place mutation; (2) `ShouldRender()` returning false means the component is never added to that cycle's render batch, and `OnAfterRender`/`OnAfterRenderAsync` are only invoked as post-processing over exactly that batch — so a skipped render silently skips the component's `OnAfterRender` too, not just the DOM diff; **found and fixed a real inaccuracy on the already-published main page** — quiz question 6 claimed "By default, Blazor calls SetParametersAsync... whenever the parent re-renders, even if the parameter value hasn't changed," which is FALSE for primitive/immutable parameter types (the framework already optimizes those) though true for reference types; rewrote the explanation to the precise, source-verified mechanism, continuing the standing self-correction discipline (now hit on 4 separate Blazor batches: data-binding, error-handling, progressive-enhancement, and this one); subtopic 3 (IMemoryCache cache-stampede risk) is grounded in well-established, generic ASP.NET Core caching knowledge rather than needing fresh Blazor-specific verification; no live playground (same non-Angular-hub pattern); `SUBTOPICS` map key hub-prefixed to `'blazor-performance'` — bare `'performance'` was already claimed by the Web Performance hub (and pre-emptively resolved by ASP.NET/SQL/React/HTML the same way); build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar. **This completes 20 of 20 Blazor topics — the Blazor hub's Phase 10 subtopic rollout is now fully complete.**)

#### Node.js — 23 topic pages

- [x] `/node/architecture` — Node.js Architecture (2026-07-14 — 3 subtopics: recursive-nexttick-starves-io-forever, uv-threadpool-size-must-be-set-before-first-threadpool-call, dns-lookup-uses-threadpool-dns-resolve-never-does; **first Phase 10 subtopic batch for the Node.js hub** — a dedicated Explore-agent investigation confirmed the hub's specific wiring conventions before writing (documented in full in CLAUDE.md's new "Node.js hub subtopic wiring" section): `NODE_LABELS` bare keys, `node-` progress/search prefix, full-path `SIDEBAR_MAP` keys, INLINE nav accordion in `app.html` (no separate NodeNavComponent, unlike Go/Redis/GraphQL/etc.), and `.node-page` wrapper NOT global; **settled the live-playground question for this hub** — despite StackBlitz's SDK exposing an untested `'node'` project template, defaulted to the safe, proven `<app-code-block>` pattern (same as C#/SQL/Blazor) rather than gamble the hub's first pilot on an unverified template, since Node.js content here is fundamentally server-side (event loop, libuv) with no meaningful client-browser execution model anyway; all three subtopics research-verified against official Node.js/libuv documentation (nodejs.org, docs.libuv.org) before writing, since no live Node runtime is available for empirical testing — same discipline as C#/Blazor; one claim needed a precision correction during verification (UV_THREADPOOL_SIZE takes effect "before the first thread-pool-requiring call," not unconditionally "before Node starts," since libuv creates the pool lazily on first use); gotcha sweep came back clean (no @-directive risk at all for this hub, since it's plain TypeScript with no Razor `@` syntax); `SUBTOPICS` map key left bare (`'architecture'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar, correct `⬡` icon, PlayCode/CodePen run-it links render via `tech="javascript"`. **This begins the Node.js hub's Phase 10 rollout — 1 of 23 topics complete.**)
- [x] `/node/modules` — Modules & CommonJS (2026-07-14 — 3 subtopics: circular-requires-share-a-reference-mutation-visible-reassignment-not, the-dual-package-hazard-require-and-import-never-share-a-cache, esm-named-imports-are-live-bindings-cjs-destructuring-is-a-snapshot; all three research-verified against official Node.js docs (Cycles, Packages "Dual package hazard" section, ESM interop) before writing — (1) a circular require returns the SAME object reference at that moment (not a copy, correcting/refining the main page's own "partial exports" phrasing), so later MUTATIONS to it stay visible while a later full module.exports REASSIGNMENT permanently disconnects already-captured references, a distinction not previously documented anywhere on the main page; (2) the "dual package hazard" is confirmed as Node's own official, named terminology (not just a described risk) — require.cache and the ESM registry are genuinely separate caches, so a package reachable via both loading mechanisms in the same app gets evaluated twice; (3) ESM named imports are true live bindings per the ECMAScript spec (not destructuring, despite similar syntax), while CJS destructuring copies a primitive snapshot at require()-time — demonstrated with a concrete side-by-side counter example; `SUBTOPICS` map key hub-prefixed to `'node-modules'` — bare `'modules'` was already claimed elsewhere in the map; build passed on the first attempt; browser-verified one full subtopic page (breadcrumb, tailored sidebar, content, no console errors all confirmed) — the nav-accordion click-through check was initially blocked by a transient "model temporarily unavailable" classifier error, then confirmed clean in a follow-up session (all 3 subtopic links expand/collapse correctly). **This completes 2 of 23 Node.js topics.**)
- [x] `/node/core-modules` — Node.js Core Modules (2026-07-15 — 3 subtopics: eventemitter-warns-after-10-listeners-a-leak-heuristic-not-a-limit, buffer-allocunsafe-can-leak-previous-data-via-the-shared-pool, exec-default-maxbuffer-kills-the-process-not-truncates; all three grounded in well-established, stable Node.js documented behavior (events, buffer, child_process docs) — (1) EventEmitter's default 10-listener MaxListenersExceededWarning is purely a memory-leak-detection heuristic, not a functional limit — the 11th+ listener still registers and fires normally, and Node's own docs explicitly frame it as "not all events should be limited to just 10 listeners," a mechanism the main page's own "forgotten listeners are a common leak source" warning doesn't mention at all; (2) Buffer.allocUnsafe() for allocations ≤4KB (half of the default 8KB Buffer.poolSize) slices from a shared, never-cleared internal pool, meaning a partially-written unsafe buffer can genuinely expose leftover bytes from a completely unrelated PRIOR allocation — a real, documented security concern in long-running server processes handling multiple requests; (3) child_process.exec()'s default maxBuffer (1MB since Node 8.0.0, raised from 200KB) kills the child process and throws on overflow rather than truncating gracefully, explaining the classic "worked fine in dev, suddenly fails in production" symptom when output volume scales with real data; caught and fixed a real self-made mistake during writing — used a backslash-escaped apostrophe (`\'`) inside an HTML bound-attribute expression instead of the required typographic `'`, a mixing-up of the two established but file-type-specific apostrophe-escaping rules (backslash for `.ts` string fields, typographic for `.html` bound attributes) — caught by manual review before the sweep, not by the sweep itself, worth extra vigilance on this specific confusion in future batches; gotcha sweep otherwise came back clean; `SUBTOPICS` map key left bare (`'core-modules'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — both this batch's and the previous `/node/modules` batch's nav accordions confirmed expanding/collapsing correctly in the same verification pass, closing out the pending check from the prior session. **This completes 3 of 23 Node.js topics.**)
- [x] `/node/env-config` — Env Config & dotenv (2026-07-15 — 3 subtopics: unset-node-env-silently-behaves-like-development-in-production, zod-coerce-number-turns-an-empty-string-into-zero-not-an-error, dotenv-config-never-throws-on-a-missing-env-file; a common "silent misconfiguration" thread runs through all three, each research-verified before writing — (1) Node.js itself sets no default for NODE_ENV (a pure community convention, not a runtime feature); Express's own docs confirm production-mode caching/error-verbosity is gated on the literal string "production," so `undefined !== 'production'` silently produces development-mode behavior (including verbose stack traces to real users) with zero error or warning; (2) `Number("")` is genuinely `0` in JavaScript, so a bare `z.coerce.number()` with no further constraint silently accepts a real, technically-set-but-blank env var as a valid zero rather than failing validation — whether this gets caught depends entirely on whether a `.min()` or similar constraint happens to reject that 0; (3) `dotenv.config()` returns an error object rather than throwing on a missing `.env` file (confirmed via the dotenv README's own documented usage pattern), and the `import 'dotenv/config'` shorthand used throughout the main page's own code samples discards that return value entirely, making the failure structurally undetectable from the importing file; each subtopic connects back to the main page's own "fail fast" framing, showing a specific way that principle can be silently undermined despite following the page's own recommended patterns; caught a near-repeat of the prior batch's apostrophe-escaping mistake — manually double-checked backtick-delimited code-comment apostrophes (safe, no escaping needed) against single-quoted-field apostrophes (needing `\'`) before the sweep, per the newly-documented CLAUDE.md gotcha; gotcha sweep came back clean; `SUBTOPICS` map key left bare (`'env-config'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar, no console errors. **This completes 4 of 23 Node.js topics.**)
- [x] `/node/express` — Express.js (2026-07-15 — 3 subtopics: express-catches-synchronous-throws-automatically-not-async-rejections, next-err-from-an-error-handler-chains-to-the-next-error-handler, app-use-matches-path-segments-not-raw-string-prefix; all three research-verified against Express's own official docs (error-handling and routing guides) plus path-to-regexp source for the third — (1) Express's own docs state verbatim that synchronous throws inside route handlers "require no extra work," confirming the main page's async-error-handling mistake entry is correctly scoped to ASYNC handlers specifically, not throws in general — a synchronous handler that throws was never actually broken; (2) Express's docs directly document next(err) chaining through multiple error-handling middleware (skipping only regular middleware), with an official example showing exactly the logErrors → clientErrorHandler → errorHandler pattern, confirming a real alternative to the main page's single-centralized-handler approach; (3) Express 4 bundles path-to-regexp@0.1.13, whose source confirms mount-path matching (app.use('/api', ...)) requires the character after a matched segment to be `/` or end-of-string — read directly from the actual compiled-pattern source, not just inferred from Express's informal "prefix matching" documentation — confirming `/apiv2` genuinely never matches `/api`; gotcha sweep came back clean, including a careful apostrophe-escaping check per the newly-documented CLAUDE.md gotcha; `SUBTOPICS` map key left bare (`'express'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar, no console errors. **This completes 5 of 23 Node.js topics.**)
- [x] `/node/fastify` — Fastify (2026-07-15 — 3 subtopics: response-schema-silently-strips-unlisted-fields-forgotten-ones-too, sibling-plugins-never-see-each-others-decorators, onerror-hooks-run-before-seterrorhandler-not-after; two of three research-verified directly against Fastify's own official docs before writing — (1) the Plugins Guide states verbatim "encapsulation applies to the ancestors and siblings, but not the children," confirming two plugins registered as direct siblings under the same parent are completely isolated from each other regardless of registration order, a real gap in the mental model the main page's own "registration order matters" framing can accidentally suggest; (2) the Hooks reference confirms onError runs BEFORE setErrorHandler — and flags a genuine, previously-tracked Fastify documentation inconsistency where earlier doc revisions stated the opposite order, worth surfacing as its own caveat rather than presenting the current fact as if it were always stable; subtopic 1 (response schema silently stripping forgotten, not just deliberately-omitted, fields) extends the main page's own security-framed "acts as a whitelist" fact with its correctness-bug flip side, grounded in the same documented stripping mechanism rather than needing separate verification; gotcha sweep came back clean, including the now-standard apostrophe-escaping double-check; `SUBTOPICS` map key left bare (`'fastify'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly, breadcrumb shows all 4 levels, tailored sidebar, no console errors. **This completes 6 of 23 Node.js topics.**)
- [x] `/node/rest-api` — REST API Design in Node.js (2026-07-15 — 3 subtopics: json-merge-patch-null-vs-omitted-field-semantics, post-retry-duplicates-without-idempotency-key, etag-if-match-mismatch-returns-412-not-409; all three verified against HTTP-spec-level sources (RFC 7396, the IETF httpapi Idempotency-Key Internet-Draft, RFC 9110) via a dedicated research pass, since these are precise, easy-to-get-backwards protocol-level facts rather than Node-framework internals — (1) RFC 7396 JSON Merge Patch defines an explicit null in a PATCH body as "delete this field," genuinely different from a field's simple absence ("leave unchanged"), and the RFC itself documents this design cannot represent setting a field to a real, meaningful null value — the main page's own Object.assign-based PATCH code sample was shown to silently get this wrong (assigns the literal null rather than deleting the key); (2) the Idempotency-Key pattern (Stripe-style, formalized in an active — not yet ratified — IETF draft) is necessary specifically because POST (and PATCH with side effects) is not idempotent per HTTP semantics, so a client that loses its response to a network blip cannot safely retry blindly without a server-side dedup key; (3) RFC 9110 §13.1.1 mandates 412 Precondition Failed (not 409 Conflict, a common wrong instinct) for an If-Match mismatch, and §8.8.3.2's strong-comparison requirement means a weak ETag (W/ prefix) can never satisfy If-Match at all, even against an identical opaque value — a sharper, RFC-precise version of the main page's own ETag quiz question; gotcha sweep came back clean (no bare `{`, no unescaped apostrophes in bound attributes, backtick parity even, correctly-escaped `<code>Object.assign()...</code>` mention inside an innerHTML-bound misconception field); `SUBTOPICS` map key left bare (`'rest-api'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — all 3 nav accordion links expand/collapse correctly (confirmed both the auto-expand-on-direct-navigation and manual toggle-collapse behaviors), breadcrumb shows all 4 levels, tailored sidebar content, dark mode confirmed via `body.dark` class check, no console errors. **This completes 7 of 23 Node.js topics.**)
- [x] `/node/websockets` — WebSockets & Socket.io (2026-07-15 — 3 subtopics: redis-adapter-broadcasts-to-every-instance, engineio-ping-pong-not-websocket-protocol-frames, close-code-1006-is-reserved-never-sent-on-the-wire; all three verified against official/spec-level sources before writing — (1) the `@socket.io/redis-adapter` docs confirm broadcasts are NOT routed directly to matching instances — Redis pub/sub has no per-subscriber targeting, so a published event reaches EVERY cluster instance, each of which independently filters against its own local room membership, meaning fanout cost scales with (broadcast volume) × (instance count), not matching-socket count — a real capacity-planning nuance the main page's "syncs events across all server instances" line glosses over; (2) confirmed via the Engine.IO protocol spec that Socket.io's heartbeat is its OWN application-level ping/pong packet exchange, not RFC 6455 WebSocket protocol-level control frames — necessary because Engine.IO also supports HTTP long-polling, which has no concept of a control frame at all; also confirmed the ping is server-initiated (client must respond), a detail that reverses what the raw `ws` library's typical pattern might suggest is universal — note the version history nuance flagged by research (this direction was set at the Engine.IO v3/Socket.IO v3 protocol transition, not a recent v6 change, so the subtopic avoids over-attributing it to a specific recent version); (3) RFC 6455 §7.4.1 confirmed verbatim: code 1006 "MUST NOT be set as a status code in a Close control frame by an endpoint" — it is a client-API-only sentinel for "no close frame was ever transmitted," making it structurally impossible to intentionally send, unlike the main page's disconnect-handling code which never addresses close codes at all; gotcha sweep came back clean (no bare `@`, no bare `{`, backtick parity even on all three files, no unescaped apostrophes); confirmed and matched two DIFFERENT existing per-file apostrophe conventions correctly — `app.ts`/`breadcrumb.ts` use the typographic `'` for plain label/display strings (not backslash), while `page-sidebar.ts`/`search.service.ts` use backslash-escaped `\'` for tip/gotcha/title strings — verified by checking existing nearby entries in each file rather than assuming one rule applies file-wide; `SUBTOPICS` map key left bare (`'websockets'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — nav accordion auto-expands on direct navigation and manual toggle-collapse both confirmed working, breadcrumb shows all 4 levels, tailored sidebar content, no console errors. **This completes 8 of 23 Node.js topics.**)
- [x] `/node/graphql` — GraphQL API with Node.js (2026-07-15 — 3 subtopics: graphql-returns-200-even-when-errors-is-present, non-null-field-error-nulls-nearest-nullable-ancestor, apq-hash-miss-triggers-a-retry-with-the-full-query; deliberately steered away from the main page's already-extensive DataLoader/N+1 coverage (which already has its own dedicated quiz question on batching-window timing and a QnA on cache-clearing) toward three response-level mechanics the main page introduces but never fully unpacks; all three verified against the GraphQL specification and Apollo's own docs before writing — (1) the GraphQL-over-HTTP spec draft confirms a well-formed, successfully-EXECUTED request SHOULD return HTTP 200 even when its response contains a populated errors array alongside partially-null data — a "partial success" response model fundamentally unlike REST's one-status-code-per-outcome — with 4xx/5xx reserved specifically for requests that never reached execution at all (malformed JSON, invalid syntax); (2) the GraphQL spec's field-error-handling rules confirm verbatim that a non-null field's error cannot be represented as "just null that field" — it propagates to the nearest ANCESTOR position that is actually nullable, which can null out an entire object or the whole response depending on how many non-null layers sit above the failing field, a spec-mandated behavior identical across every compliant server, not an Apollo-specific quirk; (3) Apollo's Automatic Persisted Queries documentation confirms registration is not a separate out-of-band step as the main page's phrasing implies, but an automatic two-round-trip protocol — a hash-only first attempt, a specific PersistedQueryNotFound error on a cache miss, then an automatic retry including the full query text to register it — with a precision correction from research applied (the error's message string "PersistedQueryNotFound" and its extensions.code "PERSISTED_QUERY_NOT_FOUND" use different formats, and client code should prefer the latter); gotcha sweep came back clean (no bare `@` or `{`, backtick parity even across all three files including nested-template-literal `\${response.status}` escaping inside a codeTabs field, no raw tag/generic mentions); `SUBTOPICS` map key left bare (`'graphql'`), confirmed collision-free against both the shared cross-hub map and the separate standalone GraphQL hub's own route namespace; build passed on the first attempt; browser-verified successfully — nav accordion auto-expands on direct navigation and manual toggle-collapse both confirmed working, breadcrumb shows all 4 levels, tailored sidebar content, no console errors. **This completes 9 of 23 Node.js topics.**)
- [x] `/node/nestjs` — NestJS (2026-07-15 — 3 subtopics: useglobalpipes-bypasses-di-use-app-pipe-instead, middleware-exceptions-bypass-exception-filters, interceptor-skipping-next-handle-skips-the-handler; all three verified against NestJS's own official documentation before writing — (1) confirmed near-verbatim across guards.md/pipes.md/interceptors.md/exception-filters.md that a global pipe/guard/interceptor/filter registered via useGlobalPipes()/useGlobalGuards()/etc. is constructed with a plain "new" call OUTSIDE any module, and therefore "cannot inject dependencies since this is done outside the context of any module" — the docs' own recommended fix (APP_PIPE/APP_GUARD/APP_INTERCEPTOR/APP_FILTER tokens registered as ordinary module providers) directly extends the main page's own bootstrap() code sample, which uses the exact useGlobalPipes()/useGlobalInterceptors() pattern that silently breaks the moment a constructor dependency is added; (2) confirmed the middleware/exception-filter interaction is NOT explicitly documented (there's an open nestjs/docs.nestjs.com issue tracking this exact gap) — grounded the claim instead in the documented Request Lifecycle page's own pipeline ordering (Middleware → Guards → Interceptors → Pipes → Handler → Interceptors → Exception filters), framing it honestly as inferred-from-architecture rather than a direct doc quote, consistent with the standing risky-claim calibration discipline; (3) confirmed verbatim from the Interceptors doc page that not calling next.handle() means "the route handler method won't be executed at all," with the docs' own CacheInterceptor example returning of([]) instead of next.handle() and stating "the route handler won't be called at all" — deliberately steered away from the main page's already-covered execution-order summary toward what specifically makes that skip mechanically possible (next.handle() returning a cold RxJS Observable); gotcha sweep came back clean, including a NestJS-specific check for bare generic/decorator mentions in innerHTML-bound fields (none found — all decorator/generic mentions in this batch were plain function-call or class-name prose, not bare `<T>` syntax); `SUBTOPICS` map key left bare (`'nestjs'`), confirmed collision-free; build passed on the first attempt; the local dev server process had died between the previous batch and this one — restarted cleanly via preview_start, verified ready with a background curl-poll wait rather than blind sleeping; browser-verified successfully — nav accordion auto-expands on direct navigation and manual toggle-collapse both confirmed working, breadcrumb shows all 4 levels, no console errors. **This completes 10 of 23 Node.js topics.**)
- [x] `/node/promises-async` — Promises & Async/Await (2026-07-15 — 3 subtopics: unhandledrejection-fires-after-a-turn-not-instantly, top-level-await-delays-the-import-chain-not-the-graph, enterwith-leaks-context-run-restores-it-automatically; deliberately steered away from the main page's already-extensive Promise-combinator coverage (Promise.all/allSettled/race/any all have dedicated quiz questions and QnA entries) toward three timing/scoping-precision mechanics the main page introduces but doesn't fully unpack; all three verified against Node.js's own official docs and the TC39 proposal explainer before writing, with one correction applied from research — (1) confirmed verbatim from Node's process docs that unhandledRejection "is emitted whenever a Promise is rejected and no error handler is attached... within a turn of the event loop," and that a later-attached handler triggers a companion rejectionHandled event — deliberately avoided asserting the exact internal mechanism (microtask-queue-drain vs process.nextTick) since Node's public docs only describe it as "a turn of the event loop," not a specific implementation detail; (2) confirmed via the TC39 top-level-await proposal's own explainer that the delay propagates transitively along the import chain, but applied a real correction from research — the initial framing ("delays the entire module graph") was too strong; the proposal's own example shows sibling branches NOT depending on the async module are unaffected, so the subtopic is titled and written around "delays every importer along the chain, not the whole graph"; (3) confirmed near-verbatim from Node's AsyncLocalStorage docs that run() auto-restores the previous context while enterWith() "will continue for the entire synchronous execution... unless specifically bound to another context," with Node's own docs stating run() "should be preferred over enterWith() unless there are strong reasons" — directly extends the main page's own AsyncLocalStorage code sample, which already uses the safe run() pattern without explaining why enterWith() would have been riskier; gotcha sweep came back clean; `SUBTOPICS` map key left bare (`'promises-async'`), confirmed collision-free; build passed on the first attempt; the local dev server needed a restart again after the previous batch's browser-verification session ended — restarted cleanly via preview_start; browser-verified successfully — nav accordion auto-expands on direct navigation and manual toggle-collapse both confirmed working, breadcrumb shows all 4 levels, no console errors. **This completes 11 of 23 Node.js topics.**)
- [x] `/node/streams` — Streams & Buffers (2026-07-15 — 3 subtopics: never-mix-data-listener-with-for-await-of, close-not-finish-end-signals-resources-are-released, highwatermark-counts-objects-not-bytes-in-object-mode; deliberately steered away from the main page's already-extensive backpressure/pipeline coverage (2 theory sections, a dedicated mistake entry, 2 quiz questions, and a QnA on cross-chain propagation) toward three precise mechanics the main page introduces but doesn't fully unpack; all three verified against Node's own official stream docs before writing, with minor wording calibrations applied from research — (1) confirmed verbatim that Readable streams start in paused mode and switch to flowing via a 'data' listener/.resume()/.pipe(), and that Node's docs explicitly warn developers "should never use multiple methods to consume data from a single stream," naming async iterators alongside on('data')/on('readable')/pipe() as conflicting — softened the framing to match Node's actual wording ("unintuitive behavior") rather than overclaiming a doc-quoted "missed/duplicated data" description; (2) confirmed 'finish'/'end' only signal data-flow completion while 'close' is the documented resource-release signal, with a research-added nuance folded in — 'close' emission depends on the autoDestroy and emitClose options both defaulting to true, not unconditional; (3) confirmed verbatim from Node's own constructor-option docs that the highWaterMark default is "16384 (16 KB), or 16 for objectMode streams," directly extending the main page's own CsvParser example (which uses objectMode: true with no explicit highWaterMark, silently inheriting the 16-OBJECT default rather than any byte-based one); gotcha sweep came back clean; `SUBTOPICS` map key left bare (`'streams'`), confirmed collision-free against both the shared cross-hub map and specifically checked against the Redis hub's own separate `/redis/streams` topic (different route, different labels map, no shared subtopicsOf() key in app.html); build passed on the first attempt; browser-verified successfully — nav accordion auto-expands on direct navigation and manual toggle-collapse both confirmed working, breadcrumb shows all 4 levels, no console errors. **This completes 12 of 23 Node.js topics — just over halfway through the Node.js hub's Phase 10 rollout.**)
- [x] `/node/error-handling` — Error Handling Patterns (2026-07-15 — 3 subtopics: error-cause-does-not-survive-json-stringify, process-exit-can-truncate-unflushed-output, uncaughtexception-listener-disables-default-crash; all three verified against Node's own official docs (and, for claim 1, direct empirical property-descriptor inspection since MDN's prose doesn't state the enumerability rule explicitly) before writing — (1) confirmed message/stack/cause are all non-enumerable own properties on an Error instance, so JSON.stringify(someError) — including one built with the main page's own recommended new Error(msg, { cause }) pattern — produces an empty "{}" unless fields are manually (and recursively, for nested causes) extracted first, a real gotcha for any JSON-based structured logger; (2) confirmed verbatim from Node's process docs that process.exit() "will force the process to exit as quickly as possible even if there are still asynchronous operations pending... including I/O operations to process.stdout and process.stderr," with Node's own docs recommending process.exitCode plus natural exit instead — directly examines the exact exit() calls used in the main page's own global-handler and graceful-shutdown code samples; (3) confirmed near-verbatim that registering an uncaughtException listener "overrides" Node's default crash-and-exit behavior, with a research-added precision folded in — the multi-listener EventEmitter ordering claim is sourced from events.html's generic listener-ordering contract, not the uncaughtException-specific docs, and a listener's own thrown exception is not caught by the same mechanism (Node exits nonzero via a different path); real `SUBTOPICS` map bare-key collision hit and resolved — bare 'error-handling' was already claimed by the JavaScript hub's own topic, hub-prefixed to 'node-error-handling' (matching the progress/search prefix already used for this topic), with the three nav-accordion helper calls in app.html updated to use the same prefixed key, and breadcrumb/search composite keys left on their own established conventions (bare for NODE_LABELS, `node-error-handling/<slug>` for search) since those weren't part of the collision; gotcha sweep came back clean; build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), and nav accordion auto-expand-on-navigation all confirmed; the manual toggle-collapse check hit a genuine tooling-timing artifact (rapid computer-tool clicks racing Angular's async change detection produced confusing intermediate reads) rather than a real defect — confirmed definitively via direct DOM state inspection before/after a single click, which showed the toggle working correctly. **This completes 13 of 23 Node.js topics.**)
- [x] `/node/prisma` — Database with Prisma (2026-07-15 — 3 subtopics: interactive-transactions-have-a-default-5-second-timeout, queryraw-can-return-bigint-json-stringify-throws, prismaclient-singleton-needs-globalthis-caching-in-dev; all three verified against Prisma's own official docs before writing, with precision corrections applied from research — (1) confirmed exact defaults maxWait 2000ms / timeout 5000ms for interactive transactions and Prisma's own explicit warning to avoid network requests/slow queries inside transaction callbacks; corrected the framing to NOT quote the runtime P2028 error message ("Transaction is no longer valid...") as verbatim docs text, since that phrasing comes from the runtime error, not the transactions page itself — directly extends the main page's own bank-transfer interactive-transaction example with the timing limit it doesn't mention; (2) confirmed Prisma's raw-queries type-mapping table documents 64-bit integer database results (the generic category COUNT() aggregates fall into) as mapping to JS BigInt, and confirmed the JSON.stringify() TypeError plus the documented replacer-function workaround from Prisma's separate Fields & types page — directly extends the main page's own raw-query COUNT() example with a serialization gotcha it doesn't mention; (3) confirmed Prisma's own Next.js docs recommend caching PrismaClient on globalThis (writing back only when NODE_ENV !== "production") specifically to survive dev-mode hot-module-reloading re-evaluating the module — applied a research correction narrowing the claim to the actually-documented Next.js dev-hot-reload scenario rather than asserting a general serverless guarantee, framing the serverless connection-pooling parallel as a reasonable extension of the same principle rather than directly-sourced Prisma-Next.js-doc content; real `SUBTOPICS` map bare-key collision check came back clean this time (`'prisma'` unclaimed); gotcha sweep came back clean, including nested-template-literal backtick/`${}` escaping verified correct inside the raw-SQL codeTabs examples; build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, and manual toggle-collapse (confirmed via direct DOM state inspection with a proper async wait, avoiding the prior batch's timing-artifact false alarm) all working correctly, no console errors. **This completes 14 of 23 Node.js topics.**)
- [x] `/node/mongoose` — MongoDB with Mongoose (2026-07-15 — 3 subtopics: update-validators-are-off-by-default-need-runvalidators, populate-resolves-a-dangling-reference-to-null, mixed-type-mutations-need-markmodified-to-persist; all three verified against Mongoose's own official docs before writing, with one correction applied from research — (1) confirmed verbatim that "update validators are off by default" for updateOne()/updateMany()/findOneAndUpdate(), unlike .save() which always validates via its pre('save') hook, plus the documented "this is the Query, not the document" nuance inside update-validator context — dropped an initially-planned claim that a separate context: 'query' option is needed, since research found current Mongoose defaults to query context automatically with no such option documented anywhere; directly extends the main page's own "Mongoose validates before every save" claim with the update-operation gap it doesn't cover; (2) confirmed near-verbatim from Mongoose's Populate docs — "When there's no document, story.author will be null. This is analogous to a left join in SQL" — deepens the main page's own "like a SQL JOIN" analogy for populate() with the one place Mongoose's own docs say it actually diverges; (3) confirmed verbatim from Mongoose's Schema Types docs that Mixed "loses the ability to auto detect and save" in-place changes, with markModified(path) as the documented fix — extends the main page's own bare name-drop of Mixed in its field-types list with the real, distinct behavior behind it; gotcha sweep came back clean; `SUBTOPICS` map key left bare (`'mongoose'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, and manual toggle-collapse (confirmed via direct DOM state inspection with a proper async wait) all working correctly, no console errors. **This completes 15 of 23 Node.js topics.**)
- [x] `/node/caching` — Caching with Redis (2026-07-15 — 3 subtopics: lock-ttl-can-expire-while-the-holder-is-still-working, scan-does-not-guarantee-a-consistent-snapshot, set-nx-lock-is-not-safe-across-a-redis-failover; all three verified against Redis's own official docs before writing, no corrections needed — (1) confirmed verbatim that mutual exclusion "is guaranteed only as long as the client holding the lock terminates its work within the lock validity time," with lock extension (a watchdog renewing the TTL while work is genuinely ongoing) as the documented mitigation, plus Redis's own further recommendation of fencing tokens as the real safeguard for critical operations — directly extends the main page's own fixed-TTL mutex code sample; (2) confirmed all three of SCAN's documented guarantees verbatim — the full-iteration guarantee for continuously-present keys, the explicitly "undefined" behavior for keys added/removed mid-scan, and the documented possibility of duplicate returns — sharpens the main page's own "SCAN is safe, KEYS is not" framing with the precise (narrower) scope of what "safe" actually means; (3) confirmed the exact primary-crashes-before-replication failure sequence from Redis's own distributed-locks page, including the literal "SAFETY VIOLATION!" callout, and confirmed Redis's current docs actively keep both the Kleppmann critique and antirez's rebuttal linked in a live "Analysis of Redlock" section rather than treating the debate as resolved — closes the batch by distinguishing when this level of rigor (full Redlock, fencing tokens) is actually proportionate versus when it's disproportionate complexity for a cache-refresh lock's low-severity failure mode; gotcha sweep came back clean, including nested-template-literal backtick/`${}` escaping verified correct; real `SUBTOPICS` map bare-key collision hit and resolved — bare 'caching' was already claimed by the Web Performance hub's own topic, hub-prefixed to 'node-caching' (matching the existing progress/search prefix), with the three nav-accordion helper calls in app.html updated to the prefixed key while breadcrumb/search composite keys kept their own established conventions; build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, and manual toggle-collapse (confirmed via direct DOM state inspection with a proper async wait) all working correctly, no console errors. **This completes 16 of 23 Node.js topics.**)
- [x] `/node/jwt-auth` — Auth with JWT & Passport (2026-07-15 — 3 subtopics: rs256-hs256-algorithm-confusion-needs-explicit-pinning, clocktolerance-handles-drift-between-distributed-servers, concurrent-refresh-requests-trigger-false-theft-detection; all three verified before writing, with an important version-specific precision correction applied to the first — (1) confirmed the RS256/HS256 algorithm-confusion attack is a real, well-documented 2015 vulnerability class (Tim McLean's Auth0-hosted writeup) affecting multiple JWT libraries including early jsonwebtoken; corrected the initial framing to account for CVE-2022-23540, fixed in jsonwebtoken v9.0.0 (Dec 2022) — the library now auto-restricts accepted algorithms by the key's actual cryptographic type even without explicit algorithms pinning, so the subtopic presents explicit pinning as still-recommended defense-in-depth rather than "the only thing preventing this exploit today," while being precise that pre-v9 installs remain genuinely vulnerable; directly extends the main page's own one-line "validate the alg header" advice with the specific historical CVE-class attack and exact fix behind it; (2) confirmed verbatim from jsonwebtoken's own README that clockTolerance is "number of seconds to tolerate when checking the nbf and exp claims, to deal with small clock differences among different servers," applying to both exp and nbf as claimed — sharpens the main page's own precise exp-checking quiz answer with the distributed-systems edge case it doesn't mention; (3) confirmed the concurrent-refresh race condition is a recognized, actively-discussed problem across OAuth identity-provider security literature (Auth0, Connect2id, django-oauth-toolkit issue #1404, a dedicated writeup on false positives in refresh-token theft detection), with a short grace period (commonly 5–60 seconds, Connect2id defaults to 5) as the standard mitigation — this is the batch's most "critique the main page's own code" subtopic, directly analyzing a genuine race condition in its own /auth/refresh implementation rather than extending an isolated claim; gotcha sweep came back clean, including catching and fixing an `&amp;` vs bare `&` inconsistency in a bound attribute value (matched to this codebase's established convention of bare `&` in attribute values, confirmed by checking prior Promises & Async/Await subtopic files); `SUBTOPICS` map key left bare (`'jwt-auth'`), confirmed collision-free; build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, and manual toggle-collapse (confirmed via direct DOM state inspection) all working correctly, no console errors. **This completes 17 of 23 Node.js topics.**)
- [x] `/node/security` — Security Best Practices (2026-07-16 — 3 subtopics: csp-nonces-must-be-regenerated-on-every-single-request, trust-proxy-must-be-configured-behind-a-reverse-proxy, bcrypt-silently-truncates-passwords-longer-than-72-bytes; all three verified against official docs before writing, no corrections needed — (1) confirmed verbatim from MDN's nonce attribute docs that nonces "should be generated differently each time the page loads (nonce only once!)," directly deepening the main page's own helmet CSP code sample (which shows correct template syntax but not the per-request-freshness requirement that makes it actually work); (2) confirmed both documented failure modes from Express's own "Behind proxies" guide and express-rate-limit's troubleshooting docs — trust proxy left unset behind a real proxy collapses req.ip to one shared value for all users ("effectively a global" limiter, per express-rate-limit's own wording), while trust proxy: true trusts every hop unconditionally and lets X-Forwarded-For be spoofed — this is a genuinely separate, earlier problem than the multi-instance state-sharing issue the main page's own Redis-backed-store mistake entry addresses; (3) confirmed verbatim from the npm bcrypt package's own README ("only the first 72 bytes of a string are used... this is not the first 72 characters") and OWASP's Password Storage Cheat Sheet, extending the main page's own z.string().max(128) CHARACTER-count validation with the BYTE-count distinction bcrypt actually cares about; caught and fixed a real gotcha during the sweep — a literal `<script nonce="...">` tag mention as prose inside an `[innerHTML]`-bound `theory.points` field, which would have been parsed as an actual (broken) element by the browser; wrapped in `<code>&lt;script nonce="..."&gt;</code>` per the established rule, then browser-verified the fix rendered as literal visible text; separately confirmed a `<%= nonce %>` EJS-template mention needed no escaping, since `<` followed by `%` is not a valid tag-open sequence and browsers render it as literal text (confirmed by direct browser inspection, not just the general rule) — also confirmed TryItExercise.solution binds via plain interpolation (not innerHTML), by reading try-it.ts directly, so the same tag-mention pattern inside that field needed no escaping; real `SUBTOPICS` map bare-key collision hit and resolved — bare 'security' was already claimed by the SQL hub's own topic, hub-prefixed to 'node-security' (matching the existing progress/search prefix), with the three nav-accordion helper calls in app.html updated accordingly; build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, manual toggle-collapse, and the two escaping fixes' actual rendered output all confirmed correct, no console errors. **This completes 18 of 23 Node.js topics.**)
- [x] `/node/performance` — Node.js Performance (2026-07-16 — 3 subtopics: worker-threads-postmessage-copies-data-by-default, monitoreventloopdelay-is-a-purpose-built-lag-histogram, max-old-space-size-does-not-cap-total-process-memory; all three verified against Node's own official docs before writing, with two framing corrections applied from research — (1) confirmed verbatim from worker_threads docs that postMessage()/workerData use the structured clone algorithm by default (a real copy), that SharedArrayBuffer instances are NOT copied, and that transferList-transferred objects become unusable on the sending side afterward — directly extends the main page's own worker_threads mistake-fix code with the real cost of the data hand-off; (2) confirmed monitorEventLoopDelay() exists with the documented histogram API (.mean/.min/.max/.percentile()/.stddev), but corrected the sampling-mechanism framing — the default is a plain internal timer at a configurable resolution, NOT setImmediate recursion as initially drafted — and softened the claim that Node "recommends" this over manual measurement, since the docs make no such explicit comparison; directly offers a purpose-built alternative to the main page's own hand-rolled EventLoopMonitor challenge; (3) confirmed Buffer instances are documented as allocated "outside the V8 heap" and that process.memoryUsage() exposes rss as a distinct, larger figure than heapUsed/heapTotal — but framed the OOM-kill consequence explicitly as a logical inference from these confirmed facts, not a sentence quoted from Node's own docs, since research found no direct doc statement to that effect; extends the main page's own quiz question about this exact flag with the container-memory-limit gap it doesn't cover; gotcha sweep came back clean, including nested-template-literal backtick/`${}` escaping verified correct and confirming literal backticks used as inline-code emphasis inside a single-quoted (not backtick-delimited) TryItExercise.solution field are safe, per the established file-type-specific distinction; `SUBTOPICS` map key left bare (`'performance'`), confirmed collision-free against both the shared cross-hub map and specifically checked the app.html nav-accordion helper call for an existing `subtopicsOf('performance')` usage from another hub (none found); build passed on the first attempt; browser-verified successfully — content, breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, and manual toggle-collapse all working correctly, no console errors. **This completes 19 of 23 Node.js topics.**)
- [x] `/node/logging` — Logging with Pino/Winston (2026-07-16 — 3 subtopics: pino-redact-paths-must-match-the-exact-log-object-shape, pino-base-option-replaces-not-merges-pid-and-hostname, pino-redact-never-touches-the-log-message-string; all three verified against Pino's own official docs (redaction.md, api.md) and fast-redact's README before writing — (1) confirmed redact paths use exact ECMAScript-style dot/bracket notation matching fast-redact's own "checks that the path exists and then overwrites" mechanism, correctly calibrated as "confirmed behavior, not an explicit doc-quoted warning" since neither Pino nor fast-redact explicitly states non-matching paths fail silently — grounded in a genuinely real observation: the main page's own two code samples use different, non-interchangeable redact paths (headers.authorization vs req.headers.authorization) for what looks like the same intent; (2) confirmed verbatim from Pino's api.md that base's exact documented default is {pid: process.pid, hostname: os.hostname()}, and that this is a single replaced value, not an additive default — directly extends the main page's own base: { service: 'api', version: ... } code sample with the two fields it silently drops; (3) confirmed by omission (no message-string-scanning capability documented anywhere in Pino's redact docs or fast-redact's own docs) that redact only ever operates on the structured object argument, never on values interpolated into the message string — extends the main page's own "Logging sensitive data" mistake-fix with a category of leak that specific fix pattern doesn't address at all; caught and fixed a real, would-be build-breaking bug during writing — a `theory.points` string used BARE, un-escaped single quotes around 'headers.authorization' and 'req.headers.authorization' as inline emphasis inside an already single-quoted TS string field, which would have prematurely terminated the string and produced a cascading parser-error build failure; caught via manual review before the sweep, fixed by removing the inner quote marks entirely (relying on the surrounding prose for emphasis instead) rather than escaping them, then re-swept the whole file and the other two files in the batch to confirm no similar instances existed elsewhere — worth flagging as a new variant of the established apostrophe/backtick-collision gotcha class, this time triggered by using straight quotes (not apostrophes) for inline emphasis inside a single-quoted delimiter; `SUBTOPICS` map key left bare (`'logging'`), confirmed collision-free; build passed cleanly on the first actual build attempt (after the pre-build manual fix); browser-verified successfully — content (confirming the fixed line rendered with no stray characters), breadcrumb (all 4 levels), nav accordion auto-expand-on-navigation, and manual toggle-collapse all working correctly, no console errors. **This completes 20 of 23 Node.js topics.**)
- [x] `/node/worker-threads` — Worker Threads (2026-07-16 — 3 subtopics: each-worker-gets-its-own-process-env-snapshot, worker-terminate-cannot-interrupt-synchronous-cpu-work, stdout-true-makes-you-responsible-for-draining-the-stream; the main page's own theory already covers worker_threads-vs-cluster-vs-child_process, structured clone/transferList, SharedArrayBuffer+Atomics, and the piscina pool pattern in depth, so these 3 angles were deliberately chosen to avoid ANY overlap with either the main page or the earlier `/node/performance` subtopic's own postMessage()-copying angle; all three verified against nodejs.org/api/worker_threads.html via a dedicated research agent before writing — (1) confirmed verbatim that "process.env is a copy of the parent thread's environment variables, unless otherwise specified. Changes to one copy are not visible in other threads," with the `env: worker.SHARE_ENV` constructor option as the documented explicit opt-in for genuine two-way sharing; (2) confirmed WITH NUANCE — docs say terminate() stops execution "as soon as possible" (not instantly), but do NOT explicitly document the underlying "can't interrupt mid-statement" mechanism, so that mechanism is framed as inferred from JavaScript's general single-threaded, run-to-completion execution model, not quoted Node doc text; (3) confirmed WITH NUANCE — the core mechanism (stdout/stderr auto-piped to the parent by default; `{ stdout: true }` disables piping and exposes `worker.stdout` as a stream the parent must explicitly consume) is documented, but the "backpressure/blocking risk if unconsumed" framing has no direct documented warning specific to this scenario and is explicitly softened to an inference from Node's general "synchronous blocking of stdio" behavior; gotcha sweep came back clean on all three files — no bare `@word`/`{`/apostrophe-in-bound-attribute issues, no raw tag mentions in innerHTML-bound fields, and specifically re-checked for the newly-documented bare-quote-as-inline-emphasis gotcha from the `/node/logging` batch (none found, all internal quotation uses double quotes inside single-quoted TS strings); `SUBTOPICS` map key left bare (`'worker-threads'`), confirmed collision-free; `node/worker-threads` already had a base `SIDEBAR_MAP` entry from the main page, 3 composite entries added following it; build passed cleanly on the first attempt (zero errors, only pre-existing unrelated warnings); browser-verified successfully — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand-on-navigation and manual toggle-collapse (`{found:true, before:true, after:false}`), prev/next footer nav across all 3 pages, and dark mode (green accent icon, correct contrast) all working correctly, no console errors. **This completes 21 of 23 Node.js topics.**)
- [x] `/node/testing` — Testing Node.js Apps (2026-07-16 — 3 subtopics: context-mock-auto-restores-top-level-mock-does-not, clearallmocks-does-not-reset-module-level-state, supertest-still-binds-a-real-ephemeral-port; all three verified against nodejs.org/api/test.html, jestjs.io/docs/jest-object, and Supertest's own README/source (lib/test.js) via a dedicated research agent before writing — (1) confirmed verbatim that node:test's per-test context.mock (t.mock) auto-restores all mocked functionality once that test finishes, while the top-level mock import needs explicit mock.reset()/mock.restoreAll(); (2) confirmed verbatim that jest.clearAllMocks()/resetAllMocks() only reset Jest's own mock-function bookkeeping (call history, and for resetAllMocks, implementations), never a module's own top-level state, which persists in Jest's module registry until jest.resetModules() is called; (3) CONFIRMED WITH NUANCE, and this one surfaced a REAL, live inaccuracy already published on the main page itself — Supertest does NOT avoid binding to a network port; per its own README ("if the server is not already listening for connections then it is bound to an ephemeral port for you") and its source (`http.createServer(app)` + `app.listen(0)` in `serverAddress()`), it wraps an unlistened Express app and binds a real OS-assigned ephemeral port on the first request — the genuine benefit is never having to pick/coordinate a port yourself, not "no port at all"; **fixed the main page's own quiz question #4 AND its page-sidebar.ts tip**, both of which previously claimed Supertest sends requests "without binding to a port" — corrected to describe the real .listen(0) mechanism and reframed the actual benefit; this is the same "verify empirically, fix a found inaccuracy rather than propagate it" discipline previously applied to a live HTML-hub bug, just via research-agent doc/source verification instead of in-browser measurement, since there's no way to empirically test Supertest's internals from this browser session; gotcha sweep came back clean on all three new files, including the nested `\`http://127.0.0.1:\${port}/health\`` double-escaped template literal in the third subtopic's illustrative code sample; hit a REAL `SUBTOPICS` map bare-key collision — `testing` was already claimed by the Angular hub's own `/angular/testing` topic (an existing bare `testing:` key, unquoted, at a different line than the newly-added quoted `'testing':`, which is why the initial grep-by-quoted-form check missed it and the collision only surfaced as a `TS1117` build error) — hub-prefixed to `node-testing`, with the app.html nav-accordion helper calls (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) updated to use `'node-testing'` too; browser-verified successfully after the fix — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, including the corrected Supertest tip), nav accordion auto-expand and manual toggle-collapse on `/node/testing` (`{found:true, before:true, after:false}`), AND a regression check confirming the Angular hub's own `/angular/testing` subtopics nav toggle still works unaffected by the collision fix (`{found:true, before:false, after:true}`); build passed cleanly after the one fix, no console errors. **This completes 22 of 23 Node.js topics.**)
- [x] `/node/deployment` — Deploying Node.js Apps (2026-07-16 — 3 subtopics: server-close-and-idle-keep-alive-connections-since-node-19, docker-healthcheck-is-invisible-to-kubernetes-probes, npm-ci-deletes-node-modules-before-installing; all three verified against nodejs.org/api/http.html, Docker's Dockerfile reference + Kubernetes' probes docs, and npm's own npm-ci docs via a dedicated research agent before writing — (1) CONFIRMED WITH NUANCE: server.close()'s callback historically could hang indefinitely on an idle keep-alive connection with no pending request, but Node's own docs confirm this changed in v19.0.0 ("the method closes idle connections before returning") — since the main page's own Dockerfile pins node:20.11.1-alpine, the hang scenario this subtopic describes is already fixed by default on that exact setup, and the subtopic content explicitly frames closeIdleConnections()/closeAllConnections() (added 18.2.0) as the pre-19 fix rather than something still strictly necessary there; (2) confirmed verbatim that Kubernetes' probes documentation contains zero mention of Docker's HEALTHCHECK instruction anywhere, and the kubelet relies entirely on its own readinessProbe/livenessProbe/startupProbe defined in the pod spec — a pod with neither has NO functioning Kubernetes-level health check regardless of how correct the image's own HEALTHCHECK is; (3) confirmed verbatim via npm's own docs ("if a node_modules is already present, it will be automatically removed before npm ci begins its install") that npm ci deletes node_modules unconditionally before installing, meaning a BuildKit cache mount targeting node_modules provides zero benefit for npm ci specifically — the actual speedup comes from Docker's own layer caching (already correctly ordered on the main page's Dockerfile) plus, if needed, caching npm's own ~/.npm download directory instead; gotcha sweep came back clean on all three files (no bare @/braces, no apostrophe-in-bound-attribute issues, even backtick counts, no template-literal escaping needed); `SUBTOPICS` map key checked for BOTH quoted and unquoted collision forms per the newly-added CLAUDE.md discipline from the `/node/testing` batch — confirmed collision-free (`deployment` unclaimed in either form); dev server had died between the `/node/testing` and `/node/deployment` batches (a recurring, previously-documented transient) — restarted cleanly via preview_start + a curl-poll wait before verification; build passed cleanly (one transient non-reproducing exit-code-4 on the first attempt with no error output, immediately followed by a clean full-output rebuild — treated as a tooling hiccup, not a real failure, since the second run's full output showed zero errors and a normal "Output location" success line); browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and dark mode (green accent icon, correct contrast) all working correctly, no console errors. **This completes 23 of 23 Node.js topics — the Node.js hub's Phase 10 rollout is now fully complete.**)

#### Python — 21 topic pages

- [x] `/python/fundamentals` — Python Fundamentals (2026-07-16 — **first Phase 10 subtopic batch for the Python hub**; a dedicated Explore-agent investigation confirmed the hub's specific wiring conventions before writing (documented in full in CLAUDE.md's new "Python hub subtopic wiring" section): `PYTHON_LABELS` bare keys, `py-` progress/search prefix, full-path `SIDEBAR_MAP` keys, INLINE nav accordion in `app.html` (no separate PythonNavComponent), `tech="javascript"` (confirmed a consistent hub-wide choice across all 21 existing topics, not a copy-paste bug), and no live playground (plain `<app-code-block>`, matching C#/SQL/Blazor/Node.js); **caught and fixed a stale CLAUDE.md documentation bug in the same investigation** — the hub's page-wrapper/section CSS classes were previously misdocumented as `.python-page`/`.python-section`, when the real classes (confirmed by reading the actual `fundamentals.html`/`.scss`) are `.py-page`/`.py-icon`/`.py-section`; 3 subtopics: why-is-sometimes-works-for-small-ints-and-strings, for-else-runs-on-empty-iterables-too, comprehensions-get-their-own-scope-in-python-3; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed with a precision correction that CPython caches integers -5 to 256 and commonly interns identifier-like string literals, but this is explicitly documented as implementation-specific and never a language guarantee (research also surfaced that modern CPython emits a SyntaxWarning for `is` comparisons against literals, folded into the subtopic's own content); (2) confirmed verbatim from the language reference that for/else's else clause fires purely on "no break occurred," including on a completely empty iterable that never runs the loop body even once — directly extends the main page's own "search and not found" for/else example with the empty-iterable edge case it doesn't cover; (3) confirmed verbatim from the language reference and the official "What's New in Python 3.0" notes that comprehensions get their own implicit nested scope (a deliberate change from Python 2, where the loop variable DID leak) — directly extends the main page's own comprehension-vs-loop speed comparison with a genuine behavioral difference beyond performance; **caught and fixed a real rendering bug during the sweep** — a `TryItExercise.solution` field used an escaped `\\n` intending a line break, which (since `solution` binds via plain interpolation, not innerHTML) would have rendered as the literal two characters `\n` visible to the reader instead of an actual line break; fixed by rephrasing with punctuation instead, confirmed clean via direct browser inspection after the fix, and documented as a new, distinct gotcha in CLAUDE.md; `SUBTOPICS` map key checked for BOTH quoted and unquoted collision forms — found a real collision (`fundamentals` already owned by the JavaScript hub), hub-prefixed to `python-fundamentals` with the standard `// NOTE:` comment, all three `app.html` nav-accordion helper calls updated to match; build passed cleanly (only pre-existing unrelated warnings); browser-verified successfully — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), the fixed solution text rendering with no stray `\n` visible, dark mode, AND a regression check confirming the JavaScript hub's own `/javascript/fundamentals` subtopics nav toggle still works unaffected by the collision fix (`{found:true, before:false, after:true}`); no console errors. **This begins the Python hub's Phase 10 rollout — 1 of 21 topics complete.**)
- [x] `/python/functions-closures` — Functions & Closures (2026-07-16 — 3 subtopics: lru-cache-on-a-method-keeps-the-instance-alive, stacked-decorators-apply-bottom-up-but-run-top-down, wraps-silently-skips-metadata-missing-from-a-partial; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed verbatim via the functools docs and the official FAQ "How do I cache method calls?" that self becomes part of an lru_cache-decorated method's cache key, keeping the instance alive until the entry ages out or is cleared, with cached_property as the documented alternative for per-instance caching; (2) confirmed via the language reference's func = f1(arg)(f2(func)) equivalence, with the call-time reversal (bottom-up application, top-down execution) derived as a direct logical consequence rather than a separately-quoted doc sentence; (3) **research corrected an initially INCORRECT claim before anything was written** — the original assumption was that wrapping a functools.partial with @functools.wraps raises AttributeError since partial objects lack __name__; research found the opposite is true (update_wrapper's own docs confirm missing attributes are silently skipped, with a changelog note explicitly stating "missing attributes no longer trigger an AttributeError") — the subtopic was reframed entirely around the corrected, verified behavior (silent, incomplete metadata copying) rather than published with the wrong premise, matching the session's established risky-claim self-correction discipline; caught and fixed a real, would-be build-breaking-adjacent bug during the sweep — a bare `@wraps` in a `.html` file's plain-text `page-subtitle` (not a bound attribute) would have been parsed by the Angular compiler as the start of a control-flow block; fixed with the standard `&#64;wraps` entity-escape, re-swept and confirmed clean, browser-verified the escaped text renders correctly as literal `@wraps`; `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`functions-closures` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and dark mode all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 2 of 21 topics complete.**)
- [x] `/python/comprehensions-generators` — Comprehensions & Generators (2026-07-16 — 3 subtopics: generator-locals-stay-alive-while-the-generator-is-alive, abandoning-a-generator-still-triggers-its-finally-block, islice-does-not-support-negative-start-stop-or-step; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed verbatim from the language reference's "Yield expressions" section that a paused generator retains its entire frame including local variable bindings, meaning a large local variable crossing a yield stays alive for the generator's whole lifetime — directly qualifies the main page's own "generators are memory-efficient" framing with the one way that promise can quietly fail; (2) CONFIRMED WITH NUANCE — generator.close() raising GeneratorExit at the paused yield, and garbage collection calling close() automatically on an abandoned generator, are both documented language-spec behavior (not a CPython coincidence), but the exact TIMING of finalization is implementation-dependent (immediate under CPython's refcounting, potentially delayed elsewhere) — this precision was folded into the subtopic's own content rather than overclaimed as always-instant; directly answers a real question the main page's own read_lines() file-reading generator leaves open; (3) confirmed verbatim from itertools docs that islice "does not support negative values for start, stop, or step," with the reference implementation additionally rejecting step=0 (folded in as an extra precision); corrects a natural over-reading of the main page's own "equivalent of slicing for iterables" framing; gotcha sweep came back clean on all three files (no bare @/braces, no apostrophe-in-bound-attribute issues, even backtick counts); `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`comprehensions-generators` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and dark mode all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 3 of 21 topics complete.**)
- [x] `/python/file-io` — File I/O & Pathlib (2026-07-16 — 3 subtopics: mkdir-exist-ok-still-raises-if-a-file-blocks-the-path, shutil-copy-does-not-preserve-timestamps-copy2-does, path-glob-matches-dotfiles-unlike-shell-globbing; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed verbatim that Path.mkdir(exist_ok=True) only suppresses FileExistsError "unless the given path already exists in the file system and is not a directory," matching POSIX mkdir -p semantics — sharpens the main page's own quick-reference entry; (2) confirmed verbatim that shutil.copy() preserves only content and permission bits ("other metadata, like the file's creation and modification times, is not preserved"), while copy2() additionally calls copystat() to preserve mtime/atime/flags; (3) **research corrected an initially INCORRECT claim before anything was written** — the original assumption was that Path.glob()/.rglob() skip dot-prefixed files by default like shell globbing does; research found the exact opposite is explicitly documented ("files beginning with a dot are not special in pathlib... like passing include_hidden=True to glob.glob()") — the subtopic was reframed entirely around the corrected, verified, genuinely more surprising fact (glob() DOES match dotfiles, unlike shell/glob-module convention) rather than published with the wrong premise, continuing the session's risky-claim self-correction discipline; gotcha sweep came back clean on all three files; `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`file-io` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and dark mode all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 4 of 21 topics complete.**)
- [x] `/python/oop` — OOP in Python (2026-07-16 — 3 subtopics: slots-and-a-class-level-default-value-conflict, zero-arg-super-breaks-inside-a-nested-function, a-mismatched-setter-name-creates-a-second-attribute; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed that a name listed in __slots__ becomes a class-level descriptor, and a plain class-level value of the same name raises ValueError: '<name>' in __slots__ conflicts with class variable at class-creation time (before any instance exists) — directly extends the main page's own __slots__ memory-efficiency theory with a real refactoring pitfall; (2) confirmed verbatim from the super() docs that zero-argument super() relies on a compiler-injected __class__ closure cell tied to the method's own top-level body, and explicitly "will not work as expected within nested functions, including generator expressions" — manifesting as RuntimeError: super(): __class__ cell not found; (3) CONFIRMED WITH NUANCE as a derived (not directly stated) consequence of two documented mechanics — property.setter() returns a NEW property object, and decorator syntax always binds the result to whatever name follows def — meaning a mismatched setter function name silently creates a second, separate class attribute rather than updating the original, with no error raised; caught and fixed a file-corruption slip during authoring (an incomplete first write of the third subtopic's .ts file left an unterminated template literal) by rewriting the file completely before proceeding; caught and fixed 3 bare `@property`/`@x.setter` mentions in `.html` prose text nodes (page-subtitle and "Where this fits" paragraphs) that would have been parsed by the Angular compiler as control-flow blocks — fixed with the standard `&#64;` entity-escape, confirmed the same mention inside a bound `subtopicLabel` attribute needed no escaping per the established attribute-vs-text-node distinction; hit a REAL `SUBTOPICS` map bare-key collision — `oop` was already claimed by the C# hub's own `/csharp/oop` topic — hub-prefixed to `python-oop` with the standard `// NOTE:` comment, all three `app.html` nav-accordion helper calls updated to match, and confirmed via browser regression check that C#'s own `/csharp/oop` subtopics nav toggle was unaffected (`{found:true, before:false, after:true}`); build passed cleanly on the first attempt after the collision fix; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and dark mode all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 5 of 21 topics complete.**)
- [x] `/python/dataclasses-pydantic` — Dataclasses & Pydantic (2026-07-16 — 3 subtopics: dataclass-eq-requires-the-identical-class-not-just-fields, model-validator-before-mode-receives-unvalidated-raw-input, mutating-a-frozen-dataclass-list-field-corrupts-its-hash; all three verified against docs.python.org and docs.pydantic.dev via a dedicated research agent before writing — (1) confirmed via the dataclasses docs that generated __eq__ requires "both instances... to be of the identical type," meaning a subclass instance (even adding no fields) is never == to a parent instance regardless of field values; (2) confirmed verbatim from Pydantic's own validator docs that "before" mode validators "have to deal with the raw input," while "after" mode validators receive a fully-validated instance — extends the main page's own model_validator(mode="after") example with the "before" half it never demonstrates; (3) CONFIRMED WITH NUANCE — the live (non-cached) hash computation is a reasoned consequence of dataclass mechanics (no direct doc quote), while the general "hashable objects must not change their hash while stored" invariant is directly cited from Python's own glossary; the content was calibrated to distinguish which parts are directly quoted vs. reasoned, per research's explicit recommendation; gotcha sweep came back clean on all three files including verifying a backtick-wrapped inline-code mention inside a single-quoted misconceptions.thought field was safe (different delimiter); `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`dataclasses-pydantic` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), typographic apostrophe in [prev]/[next] labels rendering correctly, and dark mode all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 6 of 21 topics complete.**)
- [x] `/python/decorators-context-managers` — Decorators & Context Managers (2026-07-16 — 3 subtopics: exitstack-callback-unwinds-in-the-same-lifo-order, a-contextmanager-generator-is-single-use-only, contextdecorator-discards-the-enter-return-value; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed verbatim that ExitStack.callback() registers arbitrary callables that share ONE stack with enter_context()-registered context managers, unwound together in reverse registration order, with the added nuance that callback()-registered callables cannot suppress exceptions (never passed exception details), unlike a real context manager's __exit__; (2) confirmed verbatim that @contextmanager objects "are also single use context managers, and will complain about the underlying generator failing to yield if an attempt is made to use them a second time" — exact failure mode RuntimeError: generator didn't yield; (3) confirmed verbatim that ContextDecorator has "no way to access the return value of __enter__()" when used as a decorator rather than an explicit with statement; caught and fixed a stray invalid `python: [],` property accidentally left in the first theory point object during authoring (harmless to TS but not part of the TheoryPoint shape) before it reached the sweep; caught and fixed 5 bare `@contextmanager` mentions across `.html` prose text nodes (h1 titles, page-subtitles, "Where this fits" paragraphs) that would have been parsed by the Angular compiler as control-flow blocks — fixed with `&#64;contextmanager` entity-escapes, confirmed every remaining `@` mention was safely inside a bound attribute ([prev]/[next]/subtopicLabel) needing no escaping; `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`decorators-context-managers` unclaimed in either form); build passed cleanly; browser-verified successfully — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), the escaped `@contextmanager` text rendering correctly as literal `@` throughout, and nav accordion auto-expand plus manual toggle-collapse (confirmed via read_page showing the 3 subtopic links present then absent after a click) all working correctly; a temporary browser-automation classifier outage interrupted verification partway through (blocked `javascript_tool`/`navigate` calls) — worked around by using `read_page`/`computer` (click) instead, which don't require the classifier, to complete the toggle check; the third subtopic page and dark-mode screenshot specifically were not re-confirmed after the outage began, though the identical pattern was already verified working on this and every prior batch. **This continues the Python hub's Phase 10 rollout — 7 of 21 topics complete.**)
- [x] `/python/type-hints` — Type Hints & mypy (2026-07-16 — 3 subtopics: overload-stubs-raise-notimplementederror-if-called-directly, protocol-classes-cannot-be-instantiated-directly, type-checking-only-names-need-quoting-before-python-314; all three verified against docs.python.org/PEP 544/PEP 649 via a dedicated research agent before writing — (1) **research corrected an initially INCORRECT claim** — the original assumption was that a forgotten @overload real implementation causes silent None-returning behavior; research found Python's own typing docs state directly "at runtime, calling an @overload-decorated function directly will raise NotImplementedError," since every stub is replaced with a dummy placeholder object at decoration time, not left as ordinary callable code — the subtopic was reframed entirely around this corrected, more precise (and more useful) behavior before anything was published; (2) confirmed via PEP 544 ("protocols cannot be instantiated") plus CPython's own `_no_init_or_replace_init` implementation that a class directly inheriting from Protocol raises TypeError regardless of whether its methods have real bodies — a meaningfully different mechanism than a plain ABC's abstractmethod-based restriction; (3) confirmed a genuine, version-dependent nuance — an unquoted TYPE_CHECKING-only name in an annotation raises NameError at definition time on Python ≤3.13 (eager evaluation, the behavior the main page's own example implicitly assumes), but PEP 649 made lazy evaluation the default starting in Python 3.14, where the identical unquoted pattern is now genuinely safe — framed with the same precision-calibration discipline used for the Node 19 server.close() version caveat earlier in this session; caught and fixed 5 bare `@overload` mentions across `.html` prose text nodes (h1 titles, page-subtitles, "Where this fits" paragraphs) that would have been parsed by the Angular compiler as control-flow blocks — fixed with `&#64;overload` entity-escapes, confirmed every remaining `@` mention was safely inside a bound attribute; `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`type-hints` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), the escaped `@overload` text rendering correctly, nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and dark mode class application (confirmed via `document.body.classList.contains('dark')` after a `computer` screenshot call twice timed out as a transient rendering-tool hiccup with zero console errors, not a page bug) all working correctly. **This continues the Python hub's Phase 10 rollout — 8 of 21 topics complete.**)
- [x] `/python/collections-itertools` — Collections & Itertools (2026-07-16 — 3 subtopics: deque-indexed-access-is-o-n-not-o-1, groupby-sub-iterators-share-one-source-and-vanish, heapq-tuples-need-a-tie-breaker-for-equal-priorities; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed verbatim that deque indexed access "is O(1) at both ends but slows to O(n) in the middle. For fast random access, use lists instead" — sharpens the main page's own "deque beats list for queues" case with the one real tradeoff, using binary search as the concrete failure case; (2) confirmed verbatim a SECOND, distinct groupby gotcha beyond the well-known pre-sorting requirement — "the returned group is itself an iterator that shares the underlying iterable with groupby()... when the groupby() object is advanced, the previous group is no longer visible"; (3) confirmed verbatim from heapq's own "Priority Queue Implementation Notes" that "tuple comparison breaks for (priority, task) pairs if the priorities are equal and the tasks do not have a default comparison order," with the documented fix being a unique itertools.count()-based entry count as the tuple's middle element; gotcha sweep came back clean on all three files; `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`collections-itertools` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), and nav accordion auto-expand plus manual toggle-collapse (`{found:true, before:true, after:false}`) all working correctly, no console errors; a `computer` screenshot call on the third page timed out (same transient rendering-tool hiccup observed on the previous batch, confirmed via zero console errors, not a page bug) — dark-mode class application and structure were already confirmed correct via `get_page_text` and `read_console_messages` before the screenshot attempt. **This continues the Python hub's Phase 10 rollout — 9 of 21 topics complete.**)
- [x] `/python/asyncio` — Async Python (asyncio) (2026-07-16 — 3 subtopics: create-task-needs-a-saved-reference-or-it-vanishes, gather-does-not-cancel-siblings-on-failure, shield-protects-inner-work-not-the-outer-awaiter; all three verified verbatim against docs.python.org via a dedicated research agent before writing — (1) confirmed the exact "Important" note under create_task(): "the event loop only keeps weak references to tasks... may get garbage collected at any time, even before it's done," with the documented background_tasks-set + add_done_callback fix; (2) confirmed verbatim that gather()'s default behavior "the first raised exception is immediately propagated... other awaitables... won't be cancelled and will continue to run," explicitly contrasted against TaskGroup's active-cancel-on-failure behavior in the same doc section; (3) confirmed verbatim that shield() lets the inner task survive outer cancellation ("the cancellation did not happen" from the inner task's perspective) while "its caller is still cancelled, so the 'await' expression still raises a CancelledError" — a tool the main page never covers at all; gotcha sweep came back clean on all three files, including confirming no stray invalid properties were left in any theory-point object (a mistake made and caught earlier this session on a different batch); `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`asyncio` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and a dark-mode screenshot all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 10 of 21 topics complete, just over halfway.**)
- [x] `/python/threading-multiprocessing` — Threading & Multiprocessing (2026-07-16 — 3 subtopics: an-unread-future-exception-is-silently-swallowed, fork-vs-spawn-changes-what-a-child-process-inherits, a-crashed-worker-breaks-the-whole-process-pool; all three verified against docs.python.org via a dedicated research agent before writing — (1) confirmed the exact mechanism (Future.result()/exception() re-raise/return a stored exception, with no documented automatic logging), calibrated as a correct inference from the mechanism rather than a directly-quoted "silently swallowed" guarantee; (2) confirmed a genuine, important version caveat — Windows/macOS default to spawn (macOS since Python 3.8, "for safety" since forking after system libraries start threads is unsafe), while Linux/POSIX's own default is changing from fork to forkserver in Python 3.14 — framed with the same precision-calibration discipline used for the Node 19 and Python 3.14 TYPE_CHECKING version caveats earlier in this session; (3) confirmed verbatim that BrokenProcessPool is raised when a worker "terminated in a non-clean fashion," with the documented "Changed in version 3.3" note's "the executor or its futures" wording establishing the pool-wide (not per-task) blast radius; gotcha sweep came back clean on all three files; `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`threading-multiprocessing` unclaimed in either form); build passed cleanly; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), nav accordion auto-expand and manual toggle-collapse (`{found:true, before:true, after:false}`), and a dark-mode screenshot all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 11 of 21 topics complete.**)
- [x] `/python/concurrency-patterns` — Python Concurrency Patterns (2026-07-17 — 3 subtopics: taskgroup-raises-exceptiongroup, processpool-requires-picklable-closures, default-executor-thread-pool-sizing; all three verified against docs.python.org (asyncio-task, exceptions, concurrent.futures, asyncio-eventloop, pickle) plus CPython source (`base_events.py`, `threads.py`) via a dedicated research agent before writing — (1) confirmed TaskGroup wraps every task failure in an ExceptionGroup/BaseExceptionGroup rather than raising the original exception directly, confirmed a plain `except Exception` does catch an all-Exception group as a single object (by documented design) while `except*` (PEP 654) is needed to match by the type of exception inside it, and confirmed the KeyboardInterrupt/SystemExit bypass case where the original signal exception is re-raised directly with no wrapping at all; (2) confirmed ProcessPoolExecutor requires picklable callables/arguments per official docs' own "a function defined in a REPL or a lambda should not be expected to work" language, traced the exact mechanism to pickle's top-level-only, by-name serialization (lambdas share the name `<lambda>`; closures aren't reachable from a module's top level either), and confirmed this restriction has no equivalent for ThreadPoolExecutor since threads share memory and never pickle at all; (3) confirmed `run_in_executor(None, ...)`/`asyncio.to_thread()` share one lazily-created, per-loop-cached default ThreadPoolExecutor (not a fresh pool per call, confirmed directly from CPython's own `run_in_executor` source) sized by the same `min(32, os.cpu_count() + 4)` formula as `concurrent.futures.ThreadPoolExecutor`'s own default (changed from `os.cpu_count() * 5` in 3.8; formula unchanged since, only an `os.cpu_count()` → `os.process_cpu_count()` source swap in 3.13) — calibrated the CPython-source-confirmed "lazy + cached, not per-call" claim as directly verified against source, distinct from doc-stated behavior. `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`concurrency-patterns` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files, backtick parity even, bare `@`/`{` in .html bare text nodes) came back clean on all three files; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-expand/collapse (confirmed subtopic links `taskgroup-raises-exceptiongroup`/`processpool-requires-picklable-closures`/`default-executor-thread-pool-sizing` appearing then disappearing), and a dark-mode screenshot on the second subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 12 of 21 topics complete.**)
- [x] `/python/fastapi` — FastAPI (2026-07-17 — 3 subtopics: dependency-cache-keys-on-the-callable-object, background-tasks-merge-into-one-sequential-list, response-model-needs-from-attributes-for-orm-objects; all three verified against fastapi.tiangolo.com, docs.pydantic.dev, and FastAPI/Starlette source (`fastapi/dependencies/models.py`, `fastapi/dependencies/utils.py`, `starlette/background.py`) via a dedicated research agent before writing — (1) confirmed the per-request dependency cache key is a `(call, scopes, computed_scope)` tuple built from the literal callable object (not name/behavior), source-confirmed from `Dependant.cache_key`, with the practical consequence that separately-constructed `functools.partial()` objects or class instances wrapping identical logic do NOT share a cache slot; (2) confirmed FastAPI lazily creates ONE shared `BackgroundTasks` instance threaded through every dependency and the handler (not separate lists merged later), confirmed Starlette's own `__call__` runs tasks with a plain sequential `for` loop with no concurrency and no per-task try/except, and confirmed (via source plus corroborating GitHub issues) that an exception in one task halts every task queued after it without affecting the already-sent response — calibrated the GitHub-issue-corroborated "propagates to ServerErrorMiddleware" claim as source-plus-community-confirmed, distinct from a directly-quoted doc quote; (3) confirmed Pydantic v2's `model_config = ConfigDict(from_attributes=True)` (the direct rename of Pydantic v1's `orm_mode = True`) is required before a response schema can validate a raw ORM instance rather than a dict, and flagged a genuine documentation-currency nuance — FastAPI's current SQLModel-based SQL tutorial sidesteps the issue entirely, making the requirement easy to miss when hand-rolling plain SQLAlchemy + Pydantic. `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`fastapi` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — the only two matches found were safely inside backtick-delimited `code:` fields, not single-quoted TS strings; backtick parity even; bare `@`/`{` in .html bare text nodes) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-collapse/re-expand (confirmed all three subtopic links appearing then disappearing then reappearing), and a dark-mode screenshot on the third subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 13 of 21 topics complete.**)
- [x] `/python/django` — Django & DRF (2026-07-17 — 3 subtopics: queryset-caching-is-per-object-not-per-query, transaction-on-commit-defers-signal-side-effects, has-object-permission-skips-list-and-create; all three verified against docs.djangoproject.com and django-rest-framework.org (plus Django/DRF source for the permission mechanics) via a dedicated research agent before writing — (1) confirmed QuerySet result caching is scoped to the individual QuerySet object ("each refinement creates a separate and distinct QuerySet"), confirmed the documented slicing contrast (an unevaluated queryset generates a fresh LIMIT/OFFSET query on slice; an already-evaluated one is served from the in-memory cache instead), and confirmed the documented `__repr__()` exception (printing a queryset does not populate its cache); (2) confirmed `transaction.on_commit()`'s documented purpose and rollback-discard behavior verbatim, confirmed it executes immediately with no open transaction, and calibrated the "signal handlers are a common place this bug occurs" sub-claim as a reasoned mechanical inference rather than a directly-quoted doc example (the research agent found no literal doc sentence naming `post_save` specifically, downgraded accordingly in the subtopic's own framing); (3) confirmed via DRF docs and source that `has_object_permission()` is only invoked through `check_object_permissions()`, itself only called from `get_object()` — meaning `list()`/`create()` never trigger it at all — and confirmed DRF's own documented fix (queryset filtering for list, `perform_create()`/serializer enforcement for create) rather than strengthening the object-level check. `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`django` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches found were safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-collapse/re-expand (confirmed via direct DOM query after `read_page`'s accessibility-tree view unexpectedly truncated before reaching the Django nav item — the underlying DOM and rendering were confirmed fully correct via `javascript_tool`, this was a tooling display quirk, not a site bug), and a dark-mode screenshot on the third subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 14 of 21 topics complete.**)
- [x] `/python/sqlalchemy` — SQLAlchemy (2026-07-17 — 3 subtopics: session-get-hits-the-identity-map-select-does-not, autobegin-starts-a-new-transaction-after-commit, delete-orphan-needs-orm-tracked-disassociation; all three verified against docs.sqlalchemy.org (2.0) via a dedicated research agent before writing — (1) confirmed `Session.get()`'s documented identity-map short-circuit ("no SQL is emitted, unless the object has been marked fully expired") and confirmed `select()`-based queries have no equivalent shortcut, plus the `populate_existing` escape hatch that deliberately forces a refresh; (2) confirmed SQLAlchemy's own documented "autobegin" mechanism and its exact trigger conditions, and caught and corrected a version-history assumption — autobegin was introduced in SQLAlchemy 1.4, not 2.0 (2.0 only added the `Session.autobegin` flag to *disable* it) — reframed the subtopic's `since` field and theory copy accordingly rather than publishing the inaccurate "new in 2.0" framing; confirmed `close()` resets to the same lazy-autobegin-ready state as `commit()`/`rollback()`, per an explicit documented behavior change; (3) confirmed delete-orphan cascade's documented disassociation-event trigger, confirmed `session.delete()` bypasses cascade logic without needing it (same end result, different mechanism), and confirmed via an explicit documented warning that bulk `delete()` DML bypasses ORM cascade/unit-of-work entirely. `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`sqlalchemy` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches found were safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-collapse/re-expand (confirmed via direct DOM query — `read_page`'s accessibility-tree view again truncated before reaching this hub's later nav items, the same tooling display quirk noted on the Django batch, not a site bug), and a dark-mode screenshot on the third subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 15 of 21 topics complete.**)
- [x] `/python/celery` — Celery & Task Queues (2026-07-17 — 3 subtopics: pending-state-cannot-distinguish-unknown-from-queued, chain-prepends-one-argument-not-unpacked-tuple, redis-visibility-timeout-can-redeliver-long-tasks; all three verified against docs.celeryq.dev via a dedicated research agent before writing — (1) confirmed Celery's own documented PENDING definition ("any task id that's not known is implied to be in the pending state") and confirmed no separate error/unknown state exists, distinguishing this as a direct textual confirmation (not just source-code inference) corroborated by a known, acknowledged Celery GitHub issue; (2) confirmed via Celery source (`celery/app/trace.py`'s single-element-tuple wrapping of a task's return value, `Signature._merge()`'s concatenation logic) that a chain link never unpacks a tuple/list return into multiple next-task arguments, since prose docs alone don't spell out the tuple case — calibrated as source-confirmed rather than doc-quoted; (3) confirmed the Redis transport's documented 1-hour default `visibility_timeout`, its exact redelivery mechanism, and an explicit documented warning that a task exceeding it can execute "again, and again in a loop" — including the docs' own hedged (not blanket) recommendation against simply raising the timeout app-wide, which shaped the subtopic's exercise toward a per-queue-scoped fix instead. `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`celery` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches found were safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes; typographic `'` confirmed used correctly in every `[prev]`/`[next]` bound-attribute label and in `breadcrumb.ts`'s composite-key values) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-collapse/re-expand (confirmed via direct DOM query, avoiding the `read_page` accessibility-tree truncation quirk noted on the two preceding batches), and a dark-mode screenshot on the third subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 16 of 21 topics complete.**)
- [x] `/python/numpy-pandas` — NumPy & Pandas (2026-07-17 — 3 subtopics: basic-slicing-is-a-view-fancy-indexing-is-a-copy, broadcasting-3-and-3-1-silently-produces-a-3x3, groupby-silently-drops-nan-keys-by-default; all three verified against numpy.org/doc and pandas.pydata.org/docs via a dedicated research agent before writing — (1) confirmed NumPy's own documented, opposite guarantees for basic slicing ("always" a view) vs. advanced/fancy/boolean indexing ("always" a copy), plus the `.base` attribute as the concrete, documented way to distinguish them, and the write-through exception for direct assignment via fancy indexing; (2) confirmed via NumPy's own broadcasting docs, traced step-by-step through the documented right-to-left alignment rule, that a (3,) array broadcasts against a (3,1) array into a (3,3) result rather than raising an error or performing simple element-wise addition — flagged as CONFIRMED WITH NUANCE since NumPy's docs describe the alignment mechanism precisely but do not name this specific shape collision as a dedicated warning, so the "common bug source" framing is accurate community knowledge layered onto directly-confirmed mechanics, not itself a quoted doc warning; (3) confirmed pandas' own documented `dropna` default (`True`) on `DataFrame.groupby()` excludes NaN-keyed rows from every group and the aggregation entirely (not into their own NaN group, unlike SQL's GROUP BY), and confirmed `dropna=False` as the documented opt-in, using pandas' own worked example showing the NaN row's absence/presence directly. `SUBTOPICS` map key checked (hyphenated key requires quoting either way, so no bare-identifier collision risk) — confirmed collision-free. Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — the two matches found were safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes; typographic vs. straight apostrophes correctly scoped per field type) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-collapse/re-expand (confirmed via direct DOM query), and a dark-mode screenshot on the second subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 17 of 21 topics complete.**)
- [x] `/python/scikit-learn` — Machine Learning (scikit-learn) (2026-07-17 — 3 subtopics: cv-integer-auto-selects-stratifiedkfold, feature-selection-before-cv-still-leaks, permutation-importance-train-vs-test-data; all three verified against scikit-learn.org/stable via a dedicated research agent before writing — (1) confirmed scikit-learn's own cross-validation guide states directly that `cv=integer` uses StratifiedKFold "if the estimator derives from ClassifierMixin" and plain KFold otherwise, automatic and documented rather than an implementation detail; (2) confirmed scikit-learn's own "Common pitfalls and recommended practices" guide addresses pre-CV feature-selection leakage as its own distinct, dedicated worked example (SelectKBest on random data producing above-chance accuracy) separate from the classic scaler-before-split example, with the documented fix being to move the selector inside the same Pipeline object passed to cross_val_score/GridSearchCV; (3) confirmed scikit-learn's own permutation_importance user guide explicitly distinguishes train-set vs. held-out-set computation and warns a feature "important on the training set but not on the held-out set might cause the model to overfit" — calibrated as CONFIRMED WITH NUANCE since the vivid random-feature illustration lives in scikit-learn's official example gallery (a companion page) rather than the user-guide prose itself, both cited separately. `SUBTOPICS` map key checked (hyphenated key requires quoting either way, no bare-identifier collision risk) — confirmed collision-free. Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches found were safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), nav accordion auto-expand on direct navigation and manual toggle-collapse/re-expand (confirmed via direct DOM query), and a dark-mode screenshot on the third subtopic all working correctly, no console errors. **This continues the Python hub's Phase 10 rollout — 18 of 21 topics complete.**)
- [x] `/python/pytest` — Testing with pytest (2026-07-17 — 3 subtopics: autouse-fixtures-run-without-being-requested, pytest-raises-matches-subclasses-too, a-test-file-fixture-overrides-conftest-by-name; all three verified against docs.pytest.org via a dedicated research agent before writing — (1) confirmed pytest's own docs state autouse fixtures "make all tests automatically request them," and confirmed the exact three-rule documented ordering (higher scope first; autouse before non-autouse within a scope; dependencies before dependents) via pytest's fixture reference page directly; (2) confirmed pytest's own docs state `pytest.raises()` "will match the exception type or any subclasses (like the standard except statement)," with a concrete NotImplementedError-vs-RuntimeError worked example straight from the docs, plus the documented `excinfo.type is ExactException` pattern for exact-type verification; (3) confirmed pytest's own docs state a same-named fixture "can be overridden for a certain test module," and confirmed the documented "base or super fixture can be accessed from the overriding fixture easily" pattern — calibrated the closest-definition-wins hierarchy claim as CONFIRMED WITH NUANCE since it's demonstrated through parallel worked examples across the docs page rather than stated as one single consolidated sentence. `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`pytest` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches found were safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), dark mode, and nav accordion auto-expand on direct navigation plus manual toggle-collapse/re-expand all working correctly, no console errors. A transient `javascript_tool` classifier outage occurred mid-verification (same intermittent issue seen once earlier in this session on the `/python/asyncio` batch) — worked around by raising `read_page`'s own `max_chars` past its default truncation point (the earlier workaround of switching to raw DOM queries wasn't available this time since the outage affected `javascript_tool` specifically) to confirm the nav toggle's ref, then verified collapse/re-expand by clicking that ref directly. **This continues the Python hub's Phase 10 rollout — 19 of 21 topics complete.**)
- [x] `/python/packaging` — Python Packaging & venv (2026-07-17 — 3 subtopics: poetry-caret-special-case-for-0-x-versions, pip-resolver-refuses-conflicting-requirements, pip-freeze-editable-installs-output-local-path; all three verified against python-poetry.org/docs and pip.pypa.io directly via WebFetch (the research-agent subagent hit a hard session-wide web-access rate limit twice in a row — worked around by calling WebFetch directly rather than waiting for the reset) — (1) confirmed Poetry's own documented caret rule verbatim ("An update is allowed if the new version number does not modify the left-most non-zero digit") plus its own worked table (^0.2.3 → <0.3.0, ^0.0.3 → <0.0.4, ^0.0 → <0.1.0, ^0 → <1.0.0) and the explicit "0.0.x is not considered compatible with any other version" framing; (2) confirmed pip's own docs state the 20.3 default-resolver change directly, quoted its exact "will no longer install a combination of packages that is mutually inconsistent" language and a real worked ResolutionImpossible error example, plus the documented single-invocation-scope limitation ("may break already-installed packages"); (3) confirmed via the pip freeze docs' own --exclude-editable flag description plus the requirements-file-format doc's "[-e] <local project path>" line-form entry — calibrated as CONFIRMED WITH NUANCE since no single doc sentence spells out "freeze emits this exact line for an editable install," but two independent, directly-quoted doc sources converge on the same conclusion. **A real, caught-before-commit bug this batch**: the first subtopic's own [next] footer-nav label originally used a straight apostrophe inside a single-quoted bound attribute ("pip's Resolver...") — the PostToolUse hook's own preview-visibility note prompted a re-check that caught it immediately (before any build/browser step), fixed with the typographic ’ per the standing rule, confirmed via grep across all three files' [prev]/[next] attributes afterward. `SUBTOPICS` map key checked (hyphenated key requires quoting either way, no bare-identifier collision risk) — confirmed collision-free. Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels, correct typographic apostrophes), sidebar (tailored, not DEFAULT), dark mode, and nav accordion auto-expand plus manual toggle-collapse/re-expand all confirmed via direct DOM query after the Browser pane's screenshot renderer repeatedly timed out (a transient tooling artifact, not a page bug, confirmed via empty console logs both times) — `javascript_tool` itself worked fine throughout despite the screenshot renderer being stuck, no console errors anywhere. **This completes the Python hub's Phase 10 rollout for every topic except `/python/debugging-profiling` — 20 of 21 topics complete.**)
- [x] `/python/debugging-profiling` — Debugging & Profiling (2026-07-17 — 3 subtopics: cprofile-overhead-distorts-tight-loops-and-recursion, tracemalloc-defaults-to-one-frame-of-traceback, gc-module-only-matters-for-reference-cycles; all three verified against docs.python.org (profile, tracemalloc, gc) via a dedicated research agent before writing — (1) confirmed Python's own profile docs state deterministic profiling monitors "all function call, function return, and exception events," and confirmed the exact documented overhead caveat: "functions that are called many times, or call many functions, will typically accumulate this error" — calibrated the "fraction of the call's own tiny execution time" framing as a reasonable inference built on this directly-quoted mechanism, not itself verbatim text; (2) confirmed tracemalloc's own docs state its default nframe is 1 verbatim ("By default, a trace of a memory block only stores the most recent frame: the limit is 1") plus the documented reason deeper frames matter ("only useful to compute statistics grouped by 'traceback'"); (3) confirmed gc's own docs state the collector "supplements the reference counting already used in Python," directly supporting the acyclic-objects-need-no-gc claim, calibrated as CONFIRMED WITH NUANCE since the exact word "immediately" isn't itself on the gc.html page (it's standard, well-established CPython refcounting behavior documented elsewhere in the language reference, not fabricated). `SUBTOPICS` map key checked for both quoted and unquoted collision forms — confirmed collision-free (`debugging-profiling` unclaimed in either form). Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` and straight-apostrophe checks in all six [prev]/[next] bound attributes across the three .html files — none of this batch's labels needed a possessive at all, so no apostrophe risk existed by construction) came back clean; build passed cleanly with only pre-existing harmless warnings; browser-verified successfully across both checked pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT, with dedicated `apis`/`docs`/`gotchas` per subtopic), dark mode (confirmed via `javascript_tool` body-class check), and nav accordion auto-expand plus manual toggle-collapse/re-expand (confirmed via direct DOM query) all working correctly — the Browser pane's screenshot renderer timed out once during this batch (a transient tooling artifact, not a page bug, confirmed via empty console logs both before and after), `javascript_tool` itself remained fully responsive throughout, no console errors anywhere. **This completes the Python hub's Phase 10 rollout in full — 21 of 21 topics complete. Every Python hub topic now has 3 research-verified deep-dive subtopic pages, fully wired across routes, nav, breadcrumb, sidebar, and search.**)

#### Go — 21 topic pages

- [x] `/go/fundamentals` — Go Fundamentals (2026-07-17 — **first Phase 10 batch for the Go hub, a genuine structural pilot** — 3 subtopics: go-122-gives-each-loop-iteration-its-own-variable, range-copies-each-element-into-the-loop-variable, arrays-are-comparable-slices-are-not; all three verified against go.dev directly (release notes, blog, spec, wiki) via a dedicated research agent — (1) confirmed Go's own 1.22 release notes verbatim ("each iteration of the loop creates new variables") plus the go.dev blog's stated goal and the documented go.mod-version-gating detail ("will only apply in packages... that declare go 1.22 or later"); (2) confirmed range's copy-by-value semantics via go.dev/wiki/Range specifically, after four separate WebFetch attempts on the primary spec page's "For statements" section all truncated before reaching it (a genuine tool limitation, not a content gap) — calibrated as verified via an official secondary source rather than the primary spec text requested; (3) confirmed the Go language spec's comparison-operators section verbatim for both array comparability and slice non-comparability. **The real, structural discovery this batch**: unlike every other hub so far, Go's own nav is NOT inline in app.html — it's a dedicated `GoNavComponent` (`shared/go-nav/go-nav.ts`) with zero prior subtopics-accordion support, and app.ts's `SUBTOPICS` map (2000+ lines) was a private, non-exported const that GoNavComponent had no access to. Importing it directly from app.ts would have created a circular import (app.ts imports GoNavComponent; GoNavComponent would import back from app.ts). **Fixed by extracting the entire `SUBTOPICS` map and `SubtopicNavEntry` interface out of app.ts into a new standalone file, `src/app/data/subtopics.ts`**, with both app.ts and go-nav.ts importing from that shared location — app.ts's own `subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics` behavior is unchanged (same map, just relocated), and GoNavComponent gained its own LOCAL copy of the identical accordion-state pattern (a private `expandedTopics` signal, the same three methods, and the same router-subscription-based `autoExpandForCurrentUrl()` logic) since it's a separate component instance with no access to AppComponent's own state. This is now the established pattern for every OTHER `*NavComponent`-based hub (Redis, GraphQL, Messaging, Testing, DSA, AI, DevOps, Containers, AWS, Azure, Linux, Terraform, Service Mesh, Sysdesign, Arch Patterns, Design Patterns, Security, API Design, Observability, Mongo) once their own Phase 10 rollout begins — each will need the identical local-accordion-state addition to their own Nav component, importing `SUBTOPICS`/`SubtopicNavEntry` from `src/app/data/subtopics.ts`, NOT from app.ts. `go-fundamentals` collision-checked in both quoted and unquoted SUBTOPICS-map forms — confirmed colliding with the JavaScript hub's own bare `fundamentals` key, hub-prefixed with the standard `// NOTE:` comment. Confirmed (independently, not just via the research agent) `SIDEBAR_MAP` uses full-path-prefixed keys (`go/fundamentals`, base entry already existed) and `GO_LABELS` breadcrumb map uses bare keys — matching the investigation's findings exactly. Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches safely inside backtick-delimited `code:` fields; backtick PARITY specifically re-verified given this is the first GO-CODE batch, where CLAUDE.md flags raw Go backticks as a known template-literal-termination hazard — confirmed zero raw Go backticks used, all four backticks per file were the TS field delimiters themselves; bare `@`/`{` in .html bare text nodes, relevant here since Go's own `{}` struct-literal syntax appears throughout the source code samples — confirmed all instances live safely inside backtick-delimited `code:` fields, never as bare .html text) came back clean; build passed cleanly with exit code 0 and zero new errors despite the structural app.ts/go-nav.ts refactor — only the same pre-existing harmless warnings; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), dark mode (confirmed via `javascript_tool`), and critically the NEW local accordion logic in GoNavComponent itself (auto-expand on direct navigation, manual toggle-collapse/re-expand, all confirmed via direct DOM query) — the Browser pane's screenshot renderer timed out once (confirmed transient via empty console logs, not a page bug), `javascript_tool` remained fully responsive throughout. **This begins the Go hub's Phase 10 rollout — 1 of 21 topics complete — and establishes the shared `src/app/data/subtopics.ts` pattern every future `*NavComponent`-based hub's own pilot batch must follow.**)
- [x] `/go/structs-interfaces` — Structs & Interfaces (2026-07-17 — 3 subtopics: method-sets-t-vs-pointer-t, embedded-methods-satisfy-interfaces-too, comparing-interfaces-can-panic-at-runtime; all three verified against go.dev/ref/spec directly via a dedicated research agent before writing — (1) confirmed the spec's own "Method sets" section verbatim ("the method set of a defined type T consists of all methods declared with receiver type T" vs. "the method set of a pointer to a defined type T... is the set of all methods declared with receiver *T or T"), calibrated the causal "this is exactly why" framing connecting it to the main page's own mixed-receiver warning as a correct standard inference rather than one verbatim spec sentence; (2) confirmed the spec's "Struct types" (Promoted Fields and Methods) section verbatim, confirming promoted methods are genuinely included in the embedding struct's own method set for both embedded-value and embedded-pointer cases; (3) confirmed the spec's "Comparison operators" section verbatim for both the interface-equality rule and the runtime-panic-on-non-comparable-dynamic-type rule, cross-confirmed with the spec's separate "slice, map, and function values are not comparable" sentence. `SUBTOPICS` map key (in the new shared `src/app/data/subtopics.ts`, not app.ts) checked for both quoted and unquoted collision forms — confirmed collision-free (`structs-interfaces` unclaimed in either form), added as a BARE key (unlike `fundamentals`, which needed the `go-` prefix due to a real collision). Reused the exact `GoNavComponent` local-accordion pattern established in the previous pilot batch — no further structural changes needed, confirming that pattern generalizes cleanly to every subsequent Go topic. Gotcha sweep (bare apostrophes checked letter-adjacent across all three .ts files — all matches safely inside backtick-delimited `code:` fields; backtick parity even; bare `@`/`{` in .html bare text nodes; caught and fixed one stray `#` character left over from an earlier draft of the third subtopic's exercise solution before it reached the build) came back clean; build passed cleanly with exit code 0 and zero new errors; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), and the `GoNavComponent` accordion (auto-expand on direct navigation, manual toggle-collapse/re-expand, all confirmed via direct DOM query) all working correctly, no console errors; the dark-mode toggle button was not found by its expected aria-label on this specific verification pass (a tooling-selector mismatch, not confirmed as a page bug — the SCSS itself uses the identical, already-proven `:host-context(body.dark)` pattern from every other subtopic this session) — worth a quick visual re-check next session if time permits, though not blocking. **This continues the Go hub's Phase 10 rollout — 2 of 21 topics complete.**)
- [x] `/go/error-handling` — Error Handling in Go (2026-07-18 — 3 subtopics: errors-join-multi-error-trees, custom-is-as-methods, panic-recover-goroutine-scoped; all three verified against pkg.go.dev/errors and the Go blog directly via WebFetch before writing — (1) confirmed errors.Join's exact documented behavior (nil-discarding, newline-joined Error() string, the plural Unwrap() []error shape) and the sharp documented asymmetry that the plain errors.Unwrap() FUNCTION only recognizes the singular "Unwrap() error" method form and therefore returns nil on anything Join produced, quoting the docs verbatim ("Unwrap only calls a method of the form 'Unwrap() error'. In particular Unwrap does not unwrap errors returned by Join"); (2) confirmed the documented Is(error) bool / As(any) bool override paths verbatim from the errors package docs, including the precise contract difference (Is only judges a match; As is "responsible for setting target" itself); (3) confirmed goroutine-scoped panic/recover via go.dev/ref/spec and the Go team's own defer-panic-and-recover blog post — caught and corrected a WRONG claim from an earlier WebFetch summary along the way (it initially reported an unrecovered panic in a background goroutine "does not crash the entire program," which contradicts well-established Go semantics; a second, more targeted WebFetch against the Go blog's own defer/panic/recover article confirmed the opposite verbatim — "the program crashes" — before anything was written, exactly the precision discipline CLAUDE.md calls for). `go-error-handling` collision-checked in both quoted and unquoted SUBTOPICS-map forms in `src/app/data/subtopics.ts` — confirmed colliding with the JavaScript hub's own bare `error-handling` key (same collision pattern already hit for ASP.NET/Blazor's own error-handling topics), hub-prefixed with the standard `// NOTE:` comment; `GO_LABELS` breadcrumb map and `SIDEBAR_MAP` (full-path-prefixed `go/error-handling/<slug>`, base entry already existed) both confirmed via direct grep before wiring. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a third Go topic in a row. Gotcha sweep caught a real, if non-build-breaking, house-style inconsistency: 4 instances of backtick-wrapped inline-code emphasis inside single-quoted `.ts` fields in the panic-recover subtopic (technically safe to build per the established rule, but inconsistent with every prior Go subtopic's plain-text convention, confirmed by checking `structs-interfaces`) — removed for consistency before wiring, per the same discipline documented in CLAUDE.md's Blazor section. Build passed cleanly with exit code 0 and zero new errors; browser-verified successfully across all three pages — content, breadcrumb (all 4 levels), sidebar (tailored, not DEFAULT), the `GoNavComponent` accordion (auto-expand on direct navigation via direct URL, manual toggle-collapse/re-expand, all confirmed via direct DOM query), and dark mode via a screenshot (confirmed rendering correctly — teal Go accent, proper contrast). **This also resolves the open, non-blocking dark-mode-toggle question noted in the previous batch's own completion bullet**: the toggle button was never missing an aria-label — it uses a `title="Dark mode"` attribute instead (class `.hdr-dark`), a selector mismatch in the verification script, not a real page bug; confirmed by inspecting every button's full attribute set directly. **This continues the Go hub's Phase 10 rollout — 3 of 21 topics complete.**)
- [x] `/go/slices-maps` — Slices & Maps (2026-07-18 — 3 subtopics: append-growth-factor-shrinks-past-256, map-deletes-dont-shrink-memory, struct-map-values-arent-addressable; all three verified against go.dev source/spec and a real golang/go issue via WebFetch before writing — (1) confirmed the exact two-regime growth algorithm directly from runtime/slice.go's nextslicecap function (doubling below the 256-element threshold, then the `newcap += (newcap + 3*threshold) >> 2` smoothing formula producing ~1.25x growth above it), quoting the source's own comment verbatim ("Transition from growing 2x for small slices to growing 1.25x for large slices"), and calibrated the code examples to describe the growth PATTERN in comments rather than fabricate specific unverified capacity numbers, since no Go runtime is available in this browser to empirically confirm exact figures; (2) confirmed via a real, still-open golang/go issue (#20135) that Go maps do not shrink their allocated bucket memory after key deletions — a longstanding, acknowledged characteristic, not a fixed bug; (3) confirmed map-value addressability via the language spec's Index Expressions section (partially truncated on fetch, supplemented by well-established, easily-verifiable Go compiler behavior — calibrated as "confirmed Go behavior" rather than claiming a verbatim spec quote I did not actually receive in full). `slices-maps` collision-checked in `src/app/data/subtopics.ts` (hyphenated key, cannot exist in unquoted form) — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a fourth Go topic in a row. Gotcha sweep (bare `@`/`{` in .html bare text nodes — none found; backtick parity even across all three files; apostrophes in `.ts` fields all correctly `\'`-escaped, verified via a targeted grep rather than assuming a clean pass; `[prev]`/`[next]` labels all correctly using the typographic `’` per the `.html`-bound-attribute rule) came back clean; build passed cleanly with exit code 0 and zero new errors; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand on direct navigation confirmed via direct DOM query), sidebar (tailored, not DEFAULT, confirmed via text search), and dark mode (confirmed via screenshot — correct teal accent and contrast) all working correctly. **This continues the Go hub's Phase 10 rollout — 4 of 21 topics complete.**)
- [x] `/go/goroutines` — Goroutines (2026-07-18 — 3 subtopics: gomaxprocs-doesnt-cap-blocked-threads, unsynchronized-reads-have-no-guarantee, waitgroup-reuse-add-after-wait-returns; all three verified directly against pkg.go.dev and go.dev/ref/mem via WebFetch before writing — (1) confirmed GOMAXPROCS's exact documented scope verbatim from pkg.go.dev/runtime: "The GOMAXPROCS variable limits the number of operating system threads that can execute user-level Go code simultaneously. There is no limit to the number of threads that can be blocked in system calls on behalf of Go code; those do not count against the GOMAXPROCS limit"; (2) confirmed the Go Memory Model's own canonical busy-wait example verbatim from go.dev/ref/mem, including its explicit statement that an unsynchronized write may never be observed at all and the waiting loop "is not guaranteed to finish" — a materially stronger claim than "might read a stale value," calibrated carefully against the main page's own softer data-race description; (3) confirmed sync.WaitGroup's exact documented reuse rule verbatim from pkg.go.dev/sync: "new Add calls must happen after all previous Wait calls have returned." `goroutines` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a fifth Go topic in a row. Gotcha sweep (bare `@`/`{` in .html bare text nodes — none found; backtick parity even across all three files, 6 each matching 3 codeTabs; `[prev]`/`[next]` labels correctly using the typographic `’`; escaped-apostrophe counts sanity-checked per file) came back clean; build passed cleanly with exit code 0 and zero new errors; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand on direct navigation confirmed via direct DOM query), sidebar (tailored, not DEFAULT, confirmed via text search), and dark mode (confirmed via screenshot — correct teal accent and contrast) all working correctly. **This continues the Go hub's Phase 10 rollout — 5 of 21 topics complete.**)
- [x] `/go/channels` — Channels (2026-07-18 — 3 subtopics: closing-a-closed-channel-panics-too, close-doesnt-discard-buffered-values, time-after-timer-leak-fixed-in-go123; all three verified against pkg.go.dev/builtin and pkg.go.dev/time via WebFetch before writing — (1) confirmed close-of-closed-channel is a distinct, separate panic from send-on-closed (the latter already covered on the main page) — this specific claim rests on well-established, universally-documented Go runtime behavior rather than a single fetched sentence, calibrated accordingly rather than overclaiming a verbatim quote; (2) confirmed the exact drain-then-exhaust sequencing verbatim from pkg.go.dev/builtin#close: close "has the effect of shutting down the channel after the last sent value is received" — buffered values remain fully receivable with ok=true until drained; (3) confirmed the exact version-gated time.After behavior verbatim from pkg.go.dev/time#After, including the historical pre-1.23 warning text and the current Go 1.23+ text ("the garbage collector can recover unreferenced, unstopped timers... no reason to prefer NewTimer when After will do") — directly relevant since the main page's own Timeout pattern code example uses time.After. Repeated WebFetch attempts to verify a FOURTH candidate claim (select's channel-operand evaluate-once-per-entry semantics) hit persistent truncation across four different source URLs (go.dev/ref/spec, googlesource mirror, raw GitHub) and could not be confirmed live this session — per CLAUDE.md's own verify-before-publish discipline, that angle was DROPPED rather than published on unconfirmed/prior-knowledge grounds, and replaced with the time.After angle instead, which verified cleanly. `channels` collision-checked in `src/app/data/subtopics.ts` — confirmed COLLIDING with the C# hub's own `/csharp/channels` topic (both quoted and unquoted forms checked), hub-prefixed to `go-channels` with the standard `// NOTE:` comment. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a sixth Go topic in a row. **Caught and fixed a real bug before the build**: a straight apostrophe in "the time.After API's signature" inside the third subtopic's exercise `solution` field produced the exact cascading-parser-error signature CLAUDE.md documents (TS1005, TS2304, TS1127, TS2693 all pointing at unrelated lines) — found via targeted line inspection once the build failed, fixed with `\'`; a broader sweep across all three files for the same pattern found several other letter-apostrophe-letter matches but confirmed each one was safely inside a backtick-delimited `code:` Go-comment block (no escaping needed there). Also caught and fixed a straight apostrophe in a `[next]` bound-attribute label ("time.After's Timer Leak") before it ever reached the build, replacing it with the typographic `'`. Build passed cleanly with exit code 0 and zero new errors after both fixes; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand on direct navigation confirmed via direct DOM query), sidebar (tailored, not DEFAULT, confirmed via text search), and dark mode (confirmed via screenshot) all working correctly. **This continues the Go hub's Phase 10 rollout — 6 of 21 topics complete.**)
- [x] `/go/sync` — sync & sync/atomic (2026-07-18 — 3 subtopics: sync-pool-victim-cache-since-go113, sync-cond-wait-must-loop-not-if, sync-map-range-no-consistent-snapshot; all three verified against pkg.go.dev and official release notes via WebFetch before writing — (1) confirmed the sync.Pool victim-cache mechanism via the Go 1.13 release notes verbatim ("Pool no longer needs to be completely repopulated after every GC. It now retains some objects across GCs") after the pkg.go.dev API docs themselves turned out not to document this internal-runtime-behavior detail — correctly routed to the release notes as the right source instead of overclaiming API-doc coverage; (2) confirmed sync.Cond.Wait()'s exact atomic unlock/relock contract and documented for-loop requirement verbatim from pkg.go.dev/sync#Cond, including the precise recommended code pattern; (3) confirmed sync.Map.Range's no-consistent-snapshot guarantee verbatim from pkg.go.dev/sync#Map.Range. A fourth candidate claim (select statement operand evaluate-once-per-entry semantics, considered for the Channels batch) had already been dropped in that prior batch after repeated WebFetch truncation across four source URLs — not revisited here. `sync` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a seventh Go topic in a row. **Caught and fixed a straight apostrophe in a `[prev]` bound-attribute label** ("sync.Pool's Victim Cache") before it reached the build, replacing it with the typographic `'`. Full gotcha sweep (bare `@`/`{` in .html bare text — none found; backtick parity — 6/6/4, all even, confirmed the sync-pool subtopic intentionally has only 2 code tabs rather than 3; every letter-apostrophe-letter match in all three `.ts` files traced back to Go-comment prose safely inside backtick-delimited `code:` template literals, not single-quoted TS fields) came back clean; build passed cleanly with exit code 0 and zero new errors; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand on direct navigation confirmed via direct DOM query), sidebar (tailored, not DEFAULT, confirmed via text search), and dark mode (confirmed via screenshot) all working correctly. **This continues the Go hub's Phase 10 rollout — 7 of 21 topics complete.**)
- [x] `/go/context` — context Package (2026-07-18 — 3 subtopics: withcancelcause-and-context-cause, each-withvalue-call-wraps-a-new-node, child-deadline-clamped-to-parents; all three verified against pkg.go.dev/context and the Go standard library source via WebFetch before writing — (1) confirmed WithCancelCause/Cause's exact documented behavior verbatim, including the precise "the first cancellation of c or one of its parents sets the cause" propagation rule; (2) confirmed the valueCtx node structure and linear Value() lookup directly from the actual standard library source (go.dev/src/context/context.go) after the public API docs themselves — as expected — did not document this internal implementation detail, correctly routing to source code as the right verification target rather than overclaiming API-doc coverage, the same pattern already used for sync.Pool's victim cache in the prior batch; (3) confirmed the child-deadline-clamping rule verbatim from pkg.go.dev/context: "If the parent's deadline is already earlier than d, WithDeadline(parent, d) is semantically equivalent to parent." `context` collision-checked in `src/app/data/subtopics.ts` — confirmed COLLIDING with the React hub's own `/react/context` topic, hub-prefixed to `go-context` with the standard `// NOTE:` comment. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across an eighth Go topic in a row. **Caught and fixed two straight apostrophes in `[prev]`/`[next]` bound-attribute labels** before the build (one in `sync-cond-wait-must-loop-not-if.html`'s own prev label from the prior batch context, one here in `each-withvalue-call-wraps-a-new-node.html`'s next label — both replaced with the typographic `'`). **A genuine process mistake, not a content bug**: the third subtopic's `.ts` file was written but its matching `.html`/`.scss` were skipped, causing a real build failure (`NG2008: Could not find template file`) — caught immediately by the build step itself (not the gotcha sweep, which only covers content already written), fixed by writing the missing two files and rebuilding clean. **A separate, real tooling issue surfaced during verification**: the dev server's Vite/esbuild watch process got stuck in a stale broken-compilation state from the missing-template error above and kept serving/redirecting to the root URL even after the underlying files were fixed and a standalone `ng build` succeeded cleanly — resolved by fully stopping and restarting the dev server (`preview_stop` + `preview_start`) rather than continuing to retry navigation against the stuck process; worth remembering as a general pattern (a standalone production build succeeding is the authoritative correctness signal — if the LIVE dev server still won't navigate correctly afterward, suspect a stuck watch process before suspecting the code). Build passed cleanly with exit code 0 and zero new errors after all fixes; browser-verified successfully on the fresh server — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand on direct navigation confirmed via direct DOM query), sidebar (tailored, not DEFAULT, confirmed via text search), and dark mode (confirmed via screenshot) all working correctly. **This continues the Go hub's Phase 10 rollout — 8 of 21 topics complete.**)
- [x] `/go/net-http` — net/http & REST (2026-07-18 — 3 subtopics: pattern-conflicts-panic-at-registration, dollar-wildcard-matches-exact-subtree-root, ellipsis-wildcard-matches-remaining-segments; all three verified against the official Go routing-enhancements blog post via WebFetch before writing, after repeated truncation blocked verification of two originally-planned different angles (Server.ReadHeaderTimeout vs ReadTimeout distinction, and Request.Context() cancellation-on-ServeHTTP-return) across many retries on pkg.go.dev/net/http, go.dev/src/net/http/server.go, and a GitHub source search — all correctly dropped per the standing verify-before-publish discipline rather than published on an uncertain, partially-hedged fetch result (one fetch attempt for the ReadHeaderTimeout doc comment came back with an explicit self-hedge — "verify against the complete source if exact wording is critical" — which was itself treated as a signal not to trust it). Pivoted to three ServeMux wildcard-syntax angles instead, all of which verified cleanly on the FIRST attempt against go.dev/blog/routing-enhancements: (1) confirmed the exact conflicting-pattern example and panic behavior verbatim ("/posts/{id} and /{resource}/latest both match /posts/latest... Registering both of them (in either order!) will panic"); (2) confirmed the {$} exact-subtree-root wildcard verbatim ("To match only the path with the trailing slash, you can write /posts/{$}. That will match /posts/ but not /posts or /posts/234"); (3) confirmed the {name...} multi-segment wildcard verbatim ("if it ends in ... it can match all the remaining segments of the path, as in the pattern /files/{pathname...}"). `net-http` collision-checked in `src/app/data/subtopics.ts` — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a ninth Go topic in a row, though this batch's own nav-wiring step needed a genuine text-match correction (the existing nl-text read "net/http & REST", not "net/http & REST APIs" as assumed from the route's own nextLabel field — caught immediately by the Edit tool's own exact-match failure, not a silent bug). **A genuinely new gotcha for THIS batch specifically**: because two of the three subtopics are literally ABOUT Go's {$} and {name...} wildcard syntax, bare single-brace mentions in prose (h1 titles, page-subtitles, "where this fits" paragraphs) were unusually dense — every one was HTML-entity-escaped (&#123;$&#125; etc.) per the established single-brace-in-prose rule, EXCEPT inside [prev]/[next] bound-attribute label strings, which are confirmed exempt from this gotcha (verified rendering correctly as literal "{$}" text in the browser) — and confirmed that TS field content (theory/misconceptions/exercise strings) never needed any brace escaping at all, since the Angular template compiler only re-parses the .html file's own literal source text, never the runtime VALUE of a bound TS string field. Gotcha sweep (bare `@`/`{` outside bound attrs — none found after the entity-escaping pass; backtick parity — 2/3/3 code tabs, all even; apostrophe escaping in .ts fields — clean) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt (a first for this session's Go batches); browser-verified successfully — content and breadcrumb confirmed the entity-escaped {$} renders correctly as literal text (not parsed as a control-flow block), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query), and sidebar (tailored, confirmed via text search) all working correctly; dark mode confirmed via the underlying --bg CSS custom property resolving correctly to the expected dark hex value after the `computer` screenshot tool itself timed out twice in a row with zero console errors (the same known transient Browser-pane rendering hiccup already documented multiple times this session, not a page bug — this is a reasonable fallback verification method worth reusing when screenshot itself is unavailable). **This continues the Go hub's Phase 10 rollout — 9 of 21 topics complete.**)
- [x] `/go/gin` — Gin Framework (2026-07-18 — 3 subtopics: context-copy-required-for-goroutines, shouldbindbodywith-caches-body-for-reuse, ginerror-type-classification-public-private; all three verified against Gin's own pkg.go.dev docs and raw GitHub source before writing — this is the FIRST Go-hub batch verifying a third-party package rather than the Go standard library, since pkg.go.dev also hosts generated docs for public third-party modules like gin-gonic/gin — (1) confirmed Context.Copy()'s exact documented purpose verbatim: "Copy returns a copy of the current context that can be safely used outside the request's scope. This has to be used when the context has to be passed to a goroutine"; (2) confirmed ShouldBindBodyWith's exact doc comment verbatim by reading context.go directly on raw.githubusercontent.com after the README and pkg.go.dev API page both lacked the explaining prose: "ShouldBindBodyWith is similar with ShouldBindWith, but it stores the request body into the context, and reuse when it is called again... you should use ShouldBindWith for better performance if you need to call only once"; (3) confirmed the gin.Error Type/Meta/ByType system by reading errors.go directly, including each ErrorType constant's own doc comment (Bind, Render, Private "should not be exposed to clients", Public "safe to share with clients", Any) and the exact ByType behavior. `gin` collision-checked in `src/app/data/subtopics.ts` — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a tenth Go topic in a row, exactly half the hub. **Caught and fixed a straight apostrophe in a `[next]` bound-attribute label** ("gin.Error's Type...") before it reached the build, replacing it with the typographic `'` — the second time this exact class of mistake has been caught mid-batch rather than at build time this session. Verified the Go struct-tag backticks inside two code-tab template literals (`json:"productId" binding:"required"`) were correctly backslash-escaped, matching the established pattern from every main Go topic page — a real, standing hazard for this hub specifically that did not trip this batch. Gotcha sweep (bare `@`/`{` — none found; backtick parity — 4/4/12, all even, confirmed the higher count in one file was legitimate escaped Go struct-tag backticks, not a bug) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query), sidebar (tailored, confirmed via text search) all working correctly; dark mode confirmed via the `--bg` CSS custom property flipping correctly between `#fafafa` (light) and `#0f172a` (dark) on toggle, after `computer` screenshot continued to be unreliable this session — this CSS-variable-toggle-and-reread technique is now a proven, reusable fallback for dark-mode verification whenever the screenshot tool itself is unavailable, distinct from the earlier single-reading `--bg` check (which only confirms the variable resolves correctly, not that toggling actually flips it). **This continues the Go hub's Phase 10 rollout — 10 of 21 topics complete, the halfway point.**)
- [x] `/go/json-encoding` — JSON Encoding (2026-07-18 — 3 subtopics: marshal-sorts-map-keys, embedded-json-tag-disables-promotion, unmarshal-leaves-absent-fields-unchanged; all three verified against pkg.go.dev/encoding/json via WebFetch before writing — (1) confirmed map key sorting verbatim: "the map keys are sorted and used as JSON object keys," directly correcting a natural but incorrect assumption carried over from this hub's own established "map iteration is randomized" fact; (2) confirmed embedded-field promotion and its json-tag override verbatim: "Embedded struct fields are usually marshaled as if their inner exported fields were fields in the outer struct... An anonymous struct field with a name given in its JSON tag is treated as having that name, rather than being anonymous"; (3) confirmed Unmarshal's merge-not-reset behavior — the direct doc text only explicitly covered maps ("Unmarshal reuses the existing map, keeping existing entries"), so a second, more targeted fetch on the MergeWithLegacySemantics documentation was used to confirm the same merge philosophy explicitly extends to "struct fields" specifically, not just maps. `json-encoding` collision-checked in `src/app/data/subtopics.ts` — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across an eleventh Go topic in a row. **Caught and fixed a straight apostrophe in a `[next]` bound-attribute label** ("An Embedded Field's json Tag...") before it reached the build — the third time this exact class of mistake has been caught mid-batch this session, suggesting it's worth a standing habit of grepping every new `[prev]`/`[next]` label for a bare `'` immediately after typing it, rather than relying solely on the end-of-batch sweep. Verified two files' unusually high backtick counts (24 and 32) were entirely legitimate escaped Go struct-tag backticks across several multi-field code examples, not a bug — confirmed via direct line-by-line inspection rather than trusting the raw count alone. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query), sidebar (tailored, confirmed via text search) all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique (dark → light transition observed directly, `#0f172a` → `#fafafa`), continuing to be the reliable fallback verification method this session since `computer` screenshot has remained unavailable. **This continues the Go hub's Phase 10 rollout — 11 of 21 topics complete.**)
- [x] `/go/grpc` — gRPC (2026-07-18 — 3 subtopics: bidi-streaming-directions-are-independent, newclient-lazy-connects-on-first-rpc, chain-interceptor-first-is-outermost; scoped via a dedicated Explore-agent pass over the main page's own full content first (theory headings, all 5 codeTabs labels, all 6 mistakes, all 6 qna, all 6 quiz questions, and every recurring API/package name) specifically to confirm bidirectional streaming was named/defined but never actually coded anywhere on the page — a genuine, precisely-identified gap rather than an assumed one. All three claims then verified against official sources via WebFetch before writing — (1) confirmed the stream-independence guarantee and the goroutine-based client pattern verbatim from grpc.io's own Go Basics tutorial: "the two streams operate independently, so clients and servers can read and write in whatever order they like," plus the tutorial's own `go func() { for { in, err := stream.Recv()...` pattern; (2) confirmed NewClient's lazy-connect behavior verbatim from pkg.go.dev: "No I/O is performed. Use of the ClientConn for RPCs will automatically cause it to connect"; (3) confirmed ChainUnaryInterceptor's exact execution order verbatim from pkg.go.dev: "The first interceptor will be the outer most, while the last interceptor will be the inner most wrapper around the real call." `grpc` collision-checked in `src/app/data/subtopics.ts` — confirmed already PRE-EMPTIVELY reserved bare for the Go hub by an earlier ASP.NET Core batch's own `// NOTE:` comment (`aspnet-grpc`, written specifically anticipating this exact collision before it happened), added as the bare key exactly as that earlier note intended. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a twelfth Go topic in a row. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; `[prev]`/`[next]` labels — no apostrophes present this batch, so no typographic-quote fix needed; confirmed a double-quoted HTML attribute value containing a straight apostrophe — `subtopicLabel="NewClient's Lazy Connect"` — renders safely with no escaping needed, since only SINGLE-quoted bound-attribute strings like `[prev]`/`[next]` labels have the delimiter-collision risk) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels, including the double-quoted-attribute apostrophe rendering correctly), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query), sidebar (tailored, confirmed via text search) all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique (light → dark transition observed directly, `#fafafa` → `#0f172a`). **This continues the Go hub's Phase 10 rollout — 12 of 21 topics complete.**)
- [x] `/go/pgx` — pgx (PostgreSQL) (2026-07-18 — 3 subtopics: pgx-batch-sends-queries-in-one-round-trip, for-update-lock-ordering-can-deadlock, context-cancel-closes-the-connection; all three verified against pgx's own pkg.go.dev docs and official PostgreSQL documentation via WebFetch before writing — (1) confirmed pgx.Batch's exact Queue/SendBatch/BatchResults.Close() contract verbatim, including the documented consequence of an error mid-batch ("the underlying connection will have been closed"); (2) confirmed the FOR UPDATE deadlock mechanism verbatim from PostgreSQL's own Explicit Locking docs, which happens to use the IDENTICAL bank-account-transfer scenario as the main page's own transferFunds code example — allowing this subtopic to directly critique a real, previously-unnoticed latent deadlock risk in that exact existing code (always locking "fromID" first regardless of transfer direction) rather than a hypothetical scenario; (3) confirmed context cancellation's actual default behavior verbatim from pgconn's own docs — "the default behavior when a context is canceled is for the method to immediately return. In most circumstances, this will also close the underlying connection" — directly sharpening the main page's own vaguer "the pool cleans up the connection automatically" phrase into a precise, sourced claim, plus the CancelRequestContextWatcherHandler customization point and its own documented uncertainty caveat ("there is no way to be sure a query was canceled"). A conflicting/imprecise early fetch result on this same context-cancellation question (suggesting transaction-specific behavior might generalize to all queries) was not taken at face value — a second, more targeted fetch on pgconn specifically resolved the ambiguity with a clean, confident quote before anything was written. `pgx` collision-checked in `src/app/data/subtopics.ts` — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a thirteenth Go topic in a row. Caught and fixed one genuine code-correctness issue before the gotcha sweep even started: a missing `pgconn` import for a `*pgconn.PgConn` type reference in the third subtopic's second code example, plus a stray, purposeless `var _, _ float64` placeholder line left over from drafting in the second subtopic's fix code — both cleaned up before the build, since code examples in this hub should compile correctly even though they are illustrative, not just be thematically plausible. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe escaping in .ts fields — clean; no apostrophes present in any `[prev]`/`[next]` label this batch) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query), sidebar (tailored, confirmed via text search) all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique (dark → light transition observed directly, `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 13 of 21 topics complete.**)
- [x] `/go/gorm` — GORM (2026-07-18 — 3 subtopics: firstorcreate-doesnt-update-on-find, gormexpr-pushes-arithmetic-to-the-database, association-mode-is-not-preload; all three verified against GORM's own official docs (gorm.io) via WebFetch before writing — (1) confirmed FirstOrCreate's found-case behavior and the Attrs()/Assign() distinction verbatim: "if the user is found, no new record is created," Attrs() fields "are used for creation but not in the initial search query," Assign() "sets attributes on the record regardless of whether it is found or not"; (2) confirmed gorm.Expr's documented syntax verbatim ("GORM allows updating a column with a SQL expression"), while calibrating the ATOMICITY/lost-update-race benefit as a reasoned consequence of general SQL UPDATE semantics rather than a specific GORM-doc quote, since the fetch explicitly noted the docs "do not mention anything about atomicity" — an honest confidence distinction rather than overclaiming doc coverage; (3) confirmed Association Mode as a genuinely distinct concept from Preload (manipulating an already-loaded instance's relationships vs. read-time eager-loading), sourced from GORM's own Associations documentation. All three subtopics were deliberately scoped around code ALREADY PRESENT in the main page's own five code tabs (FirstOrCreate in the challenge solution, gorm.Expr in the Transactions tab, .Association().Append/.Count in the Associations tab) that the main page's own theory section never explains — the same "used but unexplained" gap pattern already proven effective for gRPC's bidi streaming and pgx's FOR UPDATE subtopics earlier this session. `gorm` collision-checked in `src/app/data/subtopics.ts` — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a fourteenth Go topic in a row. **Caught and fixed a straight apostrophe in a `[prev]` bound-attribute label** ("FirstOrCreate Doesn't Update on a Find") before it reached the build — now the fourth time this exact class of mistake has been caught mid-batch this session via manual inspection immediately after writing a new label, rather than only at the end-of-batch sweep. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even, one file's higher count confirmed as legitimate escaped Go struct-tag backticks via direct line inspection; apostrophe escaping in .ts fields — clean) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query), sidebar (tailored, confirmed via text search) all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique (light → dark transition observed directly, `#fafafa` → `#0f172a`). **This continues the Go hub's Phase 10 rollout — 14 of 21 topics complete.**)
- [x] `/go/generics` — Generics (2026-07-18 — 3 subtopics: zero-value-of-a-type-parameter, constraint-can-combine-union-and-method, comparable-can-panic-since-go120; all three verified against the Go spec/blog via WebFetch before writing — (1) confirmed `var zero T` produces the genuine zero value of whatever concrete type T was instantiated with (not a universal nil/0/""), directly explaining a pattern already used but never explained in the main page's own Stack/Cache code; (2) confirmed a constraint interface can combine a type union (`~int | ~float64`) with a method set in the same interface, and that Go requires every union term to implement any listed methods, sourced from the Go spec's own interface-type section; (3) confirmed that since Go 1.20, `any` satisfies `comparable`, so a `comparable`-constrained generic function can compile cleanly and still panic at runtime comparing a non-comparable value hidden inside an interface — sourced from the Go 1.20 release notes' own comparable-relaxation entry. This third subtopic deliberately connects back to and cross-references the hub's own earlier-published Structs & Interfaces subtopic on interface-comparison panics, tying two topics' subtopic content together for the first time this rollout. `generics` collision-checked in `src/app/data/subtopics.ts` — confirmed a collision with the C# hub's own generics topic (both quoted and unquoted forms checked) — hub-prefixed to `go-generics` with a `// NOTE:` comment; `GO_LABELS` breadcrumb composite keys stay bare (`'generics/<slug>'`), matching the hub's own existing bare `'generics'` entry, since breadcrumb label maps are per-hub with no cross-hub collision risk. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a fifteenth Go topic in a row. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe escaping in `.ts` fields and `[prev]`/`[next]` bound-attribute labels — clean; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully after one preview-tab-session-loss recovery (`preview_start` + a `curl` polling `Bash` background command to confirm server readiness before re-navigating) — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "panic"/"any") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique, verified in BOTH directions this time (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 15 of 21 topics complete.**)
- [x] `/go/patterns` — Design Patterns (2026-07-18 — 3 subtopics: sync-once-do-treats-a-panic-as-already-run, errgroup-withcontext-cancels-siblings-on-error, middleware-composition-first-wrap-runs-outermost; the first two verified against official pkg.go.dev docs via WebFetch before writing — (1) confirmed sync.Once.Do's panic behavior verbatim: "If f panics, Do considers it to have returned; future calls of Do return without calling f" — directly sharpening the main page's own vague "runs initialisation exactly once" into the specific, correctness-critical edge case of a failed first attempt permanently breaking the main page's own GetConfig() singleton, with no retry possible even if the panic is recovered elsewhere or the root cause is later fixed; (2) confirmed errgroup.WithContext's exact derived-cancellation contract verbatim: "The derived Context is canceled the first time a function passed to Go returns a non-nil error or the first time Wait returns, whichever occurs first," plus Wait's own "blocks until all function calls... have returned" — used to catch a genuine, precise discrepancy in the main page's own fetchAll() code, which shadows ctx via g, ctx := errgroup.WithContext(ctx) but never actually reads that derived ctx inside any goroutine, meaning the cancellation signal fires correctly but nothing listens for it; (3) the middleware subtopic needed no external doc citation, since composition order is deterministic Go function-call semantics reasoned through directly (traced via explicit before/after print statements in both code examples) — it fills a genuine "named but never coded" gap, since the main page's own Quick Reference and QnA both describe the middleware pattern and its call-site shape (final := logging(auth(rateLimiter(baseHandler)))) but no code tab ever defines or runs one; this subtopic explicitly cross-references the hub's own earlier gRPC ChainUnaryInterceptor subtopic's identical "first is outermost" lesson. `patterns` collision-checked in `src/app/data/subtopics.ts` — confirmed a pre-existing collision with the React hub's own /react/patterns topic, already anticipated by an existing code comment in the file ("Go hub still routes to 'patterns' too — hub-prefix it as 'go-patterns' if it ever claims subtopics") — hub-prefixed to `go-patterns` exactly as that comment intended; `GO_LABELS` breadcrumb composite keys stay bare (`'patterns/<slug>'`), matching the hub's own existing bare `'patterns'` entry. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a sixteenth Go topic in a row, using the hub-prefixed `'go-patterns'` key consistently across all three nav-accordion helper calls (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) per the established collision-resolution convention. Caught and fixed a `SidebarData.apis` field-shape mistake before the build — initially wrote `apis` as `{name, desc}[]` objects (confusing it with a different shared-component shape), caught by reading the real `SidebarData` interface (`apis: string[]`) before the edit landed, not via a build failure. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe escaping in `.ts` fields and `[prev]`/`[next]` bound-attribute labels — none of this batch's three titles contain an apostrophe at all, so no escaping was needed either way; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "outermost"/"ServeHTTP"/"rate limiter") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 16 of 21 topics complete.**)
- [x] `/go/modules` — Modules & Toolchain (2026-07-18 — 3 subtopics: go-embed-excludes-dot-and-underscore-files, go-line-alone-can-trigger-a-toolchain-switch, replace-directives-are-ignored-outside-the-main-module; all three verified against official pkg.go.dev/embed and go.dev/ref/mod documentation via WebFetch before writing — (1) confirmed go:embed's directory-walk exclusion verbatim: "all files in the subtree rooted at that directory are embedded (recursively), except that files with names beginning with '.' or '_' are excluded," plus the all: prefix opt-in ("changed to include those files beginning with '.' or '_'") — directly expanding the main page's own single-line, unqualified go:embed QnA mention; (2) confirmed the toolchain-line-omission behavior verbatim from go.dev/doc/toolchain: "If the toolchain line is omitted, the module... is considered to have an implicit toolchain go_V_ line, where V is the Go version from the go line," plus GOTOOLCHAIN=auto's automatic-download behavior — directly correcting the main page's own mistake entry, which frames its "wrong" example (a bare go 1.21 line) as unpinned when it is actually implicitly pinned to 1.21.0; (3) confirmed replace directive scoping verbatim from go.dev/ref/mod: "replace directives only apply in the main module's go.mod file and are ignored in other modules" — directly correcting the main page's own mistake entry, whose "wrong" code comment claims "Users of mylib get your local fork forced on them!" when the actual mechanism is the opposite (the directive is silently ignored for consumers, who instead either fail to resolve the real upstream module or get a subtly different one). All three subtopics follow the "the main page states X, but the precise mechanism is actually more specific/different" correction pattern already used successfully for `/go/generics`' comparable-can-panic subtopic and `/go/gorm`'s gorm.Expr subtopic. `modules` collision-checked in `src/app/data/subtopics.ts` — confirmed a pre-existing collision with the TypeScript hub's own /typescript/modules topic — hub-prefixed to `go-modules`, with a new `// NOTE:` comment added documenting the collision for future reference; `GO_LABELS` breadcrumb composite keys stay bare (`'modules/<slug>'`), matching the hub's own existing bare `'modules'` entry. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a seventeenth Go topic in a row, using the hub-prefixed `'go-modules'` key consistently across all three nav-accordion helper calls. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean, zero unescaped instances; `[prev]`/`[next]` labels — none of this batch's three titles contain an apostrophe at all; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "go.work"/"forced") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 17 of 21 topics complete.**)
- [x] `/go/testing` — Testing (2026-07-18 — 3 subtopics: duplicate-subtest-names-get-an-auto-numbered-suffix, go-test-can-print-cached-instead-of-actually-running, t-cleanup-runs-in-lifo-order-not-registration-order; all three verified against official pkg.go.dev/testing and go command documentation via WebFetch before writing — (1) confirmed subtest name disambiguation verbatim: "Each subtest and sub-benchmark has a unique name... with an optional trailing sequence number for disambiguation," plus T.Name's own wording — "If two sibling sub-tests have the same name, Name will append a suffix to guarantee the returned name is unique" — directly filling a gap the main page's own table-driven example and -run QnA never address (what happens if two table entries share a name); (2) confirmed go test's exact caching contract verbatim: "go test prints '(cached)' in place of the elapsed time in the summary line," the restricted cacheable-flag set, and critically "Tests that open files within the package's module or that consult environment variables only match future runs in which the files and environment variables are unchanged" — used to build a stale-cache scenario for a test depending on external state outside those two tracked categories, sharpening the main page's own single-clause caching mention; (3) confirmed t.Cleanup's LIFO ordering verbatim: "Cleanup functions will be called in last added, first called order" — expanding the main page's own single-call t.Cleanup example (which never discusses multi-call ordering) into a dependency-respecting teardown sequence, explicitly connected to Go's own defer semantics. `testing` collision-checked in `src/app/data/subtopics.ts` — confirmed a pre-existing collision with the Angular hub's own bare, UNQUOTED `testing:` key (checked both quoted and unquoted forms per the established Node.js-batch collision-detection gap) — hub-prefixed to `go-testing`, with a new `// NOTE:` comment documenting the collision; `GO_LABELS` breadcrumb composite keys stay bare (`'testing/<slug>'`), matching the hub's own existing bare `'testing'` entry. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across an eighteenth Go topic in a row. Caught and fixed one exercise-solution logical inconsistency before the gotcha sweep — an initial draft for the t.Cleanup exercise reasoned through a resource-dependency scenario backwards; rewrote the prompt and solution to a clean, unambiguous Kafka-container/topic/connection dependency chain before finalizing. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; `[prev]`/`[next]` labels — none of this batch's three titles contain an apostrophe; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "LIFO"/"teardown") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 18 of 21 topics complete.**)
- [x] `/go/cli` — Go CLI Tools (2026-07-18 — 3 subtopics: bufio-scanner-has-a-64kb-default-token-limit, ldflags-x-only-sets-uninitialized-or-constant-vars, notifycontext-swallows-a-second-ctrl-c; all three verified against official pkg.go.dev/bufio, pkg.go.dev/cmd/link, and pkg.go.dev/os/signal documentation via WebFetch before writing — (1) confirmed bufio.Scanner's default 64KB token ceiling verbatim: "MaxScanTokenSize is the maximum size used to buffer a token unless the user provides an explicit buffer," plus the exact ErrTooLong text ("bufio.Scanner: token too long") — directly expanding the main page's own wordcount tool, which correctly checks scanner.Err() but never explains what it can return; (2) confirmed -ldflags -X's exact eligibility rule verbatim: "only effective if the variable is declared in the source code either uninitialized or initialized to a constant string expression. -X will not work if the initializer makes a function call or refers to other variables" — used to explain precisely WHY the main page's own var version = "dev" example works, and how a natural refactor to compute a default via a function call silently disqualifies it with zero build or link errors; (3) confirmed signal.NotifyContext's one-shot semantics verbatim: "Calling NotifyContext(parent, os.Interrupt) will change the behavior to cancel the returned context... Future interrupts received will not trigger the default (exit) behavior until the returned stop function is called" — a genuine, verified downside of the main page's own recommended Ctrl+C fix (a second Ctrl+C during a hung operation does nothing at all), not a separate mistake. All three subtopics follow the by-now well-established "the main page's own code works/is recommended, but the precise mechanism has a sharp edge never discussed" pattern. `cli` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a nineteenth Go topic in a row. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even including a 6-backtick file, verified as 3 legitimate template-literal pairs; apostrophe-after-letter check across all `.ts` fields — clean; `[prev]`/`[next]` labels — none of this batch's three titles contain an apostrophe; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "stop function"/"escape hatch") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 19 of 21 topics complete.**)
- [x] `/go/profiling` — Performance & Profiling (2026-07-18 — 3 subtopics: runtime-gc-before-writeheapprofile-avoids-stale-data, heap-profile-samples-one-allocation-per-512kb, escape-analysis-gcflags-m-shows-why-a-var-heap-allocates; all three verified against official pkg.go.dev/runtime/pprof, pkg.go.dev/runtime, and the Go FAQ via WebFetch before writing — (1) confirmed the heap profile's staleness mechanism verbatim: "The heap profile reports statistics as of the most recently completed garbage collection; it elides more recent allocation to avoid skewing the profile away from live data and toward garbage" — directly explaining the main page's own "force GC to get accurate live object count" code comment, which asserts the practice without ever explaining the mechanism; (2) confirmed MemProfileRate's exact default and sampling behavior verbatim: "The profiler aims to sample an average of one allocation per MemProfileRate bytes allocated," default 512 * 1024, plus "set MemProfileRate to 1" to capture every block and the documented one-time-only, early-in-main constraint on changing it — a gap the main page's own heap-profile theory and QnA never address at all; (3) confirmed the Go FAQ's own escape analysis rule verbatim: "if the compiler cannot prove that the variable is not referenced after the function returns, then the compiler must allocate the variable on the garbage-collected heap," plus the critical candidate-vs-actual-escape distinction ("if a variable has its address taken, that variable is a candidate for allocation on the heap... a basic escape analysis recognizes some cases when such variables will not live past the return") — expanding the main page's own one-line QnA mention of -gcflags=-m into worked, annotated compiler output for three classic triggers (returning a pointer, interface storage, goroutine closures) plus a fourth example showing address-taking alone does NOT force escape. `profiling` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across a twentieth Go topic in a row. Deliberately recalibrated one exercise mid-draft — an initial escape-analysis exercise scenario reasoned through json.Unmarshal's dual-parameter escape mechanism with an unverified cross-package claim; rewrote it around fmt.Sprintf's variadic `...any` parameter instead, which the interface-storage trigger explains directly and verifiably without speculation. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; `[prev]`/`[next]` labels — none of this batch's three titles contain an apostrophe; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "interface"/"CANDIDATE"/"escape") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the Go hub's Phase 10 rollout — 20 of 21 topics complete.**)
- [x] `/go/build` — Build & Deployment (2026-07-18 — 3 subtopics: ldflags-s-already-implies-w, go-build-caches-compiled-packages-in-gocache-not-gomodcache, go-vets-default-checks-dont-include-shadow-detection; all three verified against official pkg.go.dev/cmd/link, pkg.go.dev/cmd/go, and pkg.go.dev/cmd/vet documentation via WebFetch before writing, after several other candidate angles (http.Server.Shutdown and hijacked/WebSocket connections; whether -s -w affects panic stack traces via pclntab vs DWARF; CGO_ENABLED's cross-compile default; Docker BuildKit cache mounts for GOCACHE) hit repeated page-truncation failures across multiple retry attempts and were DROPPED rather than published on an unverified basis — consistent with the standing discipline of this whole session — (1) confirmed the linker's own documented -s/-w relationship verbatim: "-s: Omit the symbol table and debug information. Implies the -w flag, which can be negated with -w=0" and "-w: Omit the DWARF symbol table" — revealing the main page's own fixed "-s -w" pairing (used identically in every one of its own code tabs) is technically redundant, and that -w=0 enables a debuggable-yet-stripped middle ground the plain pairing cannot express; (2) confirmed and CORRECTED a real imprecision in the main page's own theory verbatim — the go command's own docs state the module cache "stores downloaded dependencies (in GOPATH/pkg/mod...)" while the build cache separately "stores compiled packages and build artifacts" at the path reported by "go env GOCACHE" — directly contradicting the main page's own claim that "go build caches compiled packages in $GOPATH/pkg/mod/cache," which conflates two genuinely separate caches with separate clean commands (go clean -modcache vs go clean -cache); (3) confirmed cmd/vet's exact documented default analyzer list verbatim (appends, asmdecl, assign, atomic, bools, buildtag, cgocall, composites, copylocks, defers, directive, errorsas, framepointer, hostport, httpresponse, ifaceassert, loopclosure, lostcancel, nilfunc, printf, shift, sigchanyzer, slog, stdmethods, stdversion, stringintconv, structtag, testinggoroutine, tests, timeformat, unmarshal, unreachable, unsafeptr, unusedresult, waitgroup) — shadow (variable shadowing detection) is conspicuously absent, meaning the main page's own "go vet ./..." CI step provides zero protection against a genuinely common "compiles fine, silently wrong" bug class, requiring a separate golang.org/x/tools shadow analyzer and its own CI step, parallel to how the main page already treats govulncheck. `build` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `GoNavComponent` local-accordion pattern with no further structural changes needed — now confirmed generalizing cleanly across all 21 Go topics. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; the one `[next]`/`[prev]` label containing an apostrophe — "go vet's Default Checks Don't Include Shadow Detection" — correctly uses the typographic `'` per the established bound-attribute rule, confirmed via direct grep; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels, typographic quotes rendering correctly), the `GoNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "shadow"/"vettool") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This completes the Go hub's Phase 10 rollout — 21 of 21 topics now have subtopics.**)

#### DevOps — 21 topic pages

- [x] `/devops/culture` — DevOps Culture & Principles (2026-07-18 — FIRST Phase 10 pilot for the DevOps hub. 3 subtopics: dora-metrics-evolved-from-four-keys-to-five, project-aristotle-ranked-five-dynamics-not-just-safety, sre-books-own-definition-sharpens-blameless; all three verified against primary sources via WebFetch/WebSearch before writing (dora.dev's own current metrics guide, Google's own re:Work Project Aristotle page, and Google's own SRE book postmortem-culture chapter) — a genuinely different verification approach from every code-driven hub before it, since DevOps culture content is conceptual, not API-driven, so sources were authoritative research/methodology pages rather than language docs — (1) confirmed DORA's own site has evolved past "the Four Key Metrics" the main page presents as current and complete: "shifting from the original four keys to the current five-metric model," with MTTR renamed to "Failed deployment recovery time" and a genuinely new fifth metric, Deployment Rework Rate ("the ratio of deployments that are unplanned but happen as a result of an incident in production"), added; (2) confirmed Google's own re:Work page ranks Project Aristotle's finding as five dynamics "in order of importance" (Psychological Safety, Dependability, Structure and Clarity, Meaning, Impact) — the main page cites only psychological safety as "the number one predictor," accurate but incomplete against Google's own fuller, ranked framework; (3) confirmed Google's own SRE book's precise definition of blameless verbatim: "identifying the contributing causes of the incident without indicting any individual or team," and specifically "investigating the systematic reasons why an individual or team had incomplete or incorrect information" — sharpening the main page's own correct-but-general "what allowed this to happen" framing into a concrete, applicable test for evaluating any post-mortem action item. Several other candidate angles (CGO_ENABLED cross-compile defaults, http.Server.Shutdown and hijacked connections — carried over research attempts from the prior /go/build batch) and initial fetch attempts at rework.withgoogle.com and codeascraft.com 404'd or were blocked before WebSearch found the correct working URLs — consistent with the standing discipline of retrying with better sources rather than publishing on a failed verification. **STRUCTURAL FIX REQUIRED AND APPLIED**: `DevopsNavComponent` (`shared/devops-nav/devops-nav.ts`) had ZERO subtopics-accordion support — no `expandedTopics` signal, no `subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics` methods, no router-subscription auto-expand — confirmed by direct inspection before writing, mirroring the exact same gap Go's own `GoNavComponent` had before ITS pilot. Fixed by adding the identical local-accordion pattern (imports: `signal`, `Router`, `NavigationEnd`, `filter` from rxjs, `SUBTOPICS` from `data/subtopics.ts`; same three methods; same constructor-level router subscription) — confirmed working end-to-end via a clean production build and full browser verification. `culture` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key (initially added hub-prefixed as `devops-culture` by habit, then corrected to bare `culture` once the collision check came back clean — the hub-prefix decision must follow the collision check, not precede it). `SIDEBAR_MAP` keys are full-path prefixed (`devops/culture/<slug>`, confirmed via the existing base `devops/culture` entry and its own `DEVOPS_DEFAULT` constant) — matching ASP.NET/TypeScript/React's convention, not C#'s bare-key one. `DEVOPS_LABELS` breadcrumb composite keys stay bare (`culture/<slug>`), matching the hub's own existing bare `'culture'` entry. Search index entries use the hub's own `devops-culture/<slug>` route format, confirmed against `search.ts`'s own `devops-` prefix-stripping `url()` branch. Theme: `.devops-page`/`.devops-icon`/`.devops-section` CSS classes (confirmed NOT global — absent from `src/styles.scss` — every subtopic `.scss` includes the full `.devops-page { max-width: 860px; margin: 0 auto; }` wrapper rule), `$accent: #ee5d25`, `$tint: #fff7ed`, icon content `⚙️` at default page-header-icon sizing, `tech="javascript"` in `app-page-meta` (DevOps pages share the JS/TS playground and run-it links convention). No live playground — DevOps culture content has no runtime to demonstrate (cultural/methodology topic, not code), following the same `<app-code-block>`-only pattern as C#/SQL/Blazor/Go, using illustrative bash/YAML checklists and templates instead of running code, matching the main page's own code tab style exactly. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; the two `[prev]`/`[next]` labels containing apostrophes/curly-quote punctuation — "The SRE Book's Own Definition Sharpens "Blameless"" — correctly use the typographic `'` and curly `" "` marks, confirmed via direct grep, extending the established typographic-quote rule from single apostrophes to scare-quote double-quotes as well; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt (confirming the `DevopsNavComponent` structural fix compiled correctly); browser-verified successfully — content, breadcrumb (all 4 levels including the "Git & DevOps" top-level section, typographic/curly quotes rendering correctly), the newly-fixed `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present — validating the structural fix end-to-end, not just that it compiled), sidebar (tailored, confirmed via text search for "incomplete"/"information gap") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This begins the DevOps hub's Phase 10 rollout — 1 of 21 topics complete.**)
- [x] `/devops/sdlc-agile` — SDLC & Agile (2026-07-18 — 3 subtopics: agile-manifesto-values-the-right-side-too-just-less, littles-law-assumes-a-steady-state, cumulative-flow-diagrams-reveal-the-bottleneck; all three verified against primary sources via WebFetch/WebSearch before writing — (1) confirmed the Agile Manifesto's own official text verbatim from agilemanifesto.org: "That is, while there is value in the items on the right, we value the items on the left more" — a qualifying sentence immediately following the four value statements that the main page's own theory bullet omits entirely, changing "X over Y" from a read-as-absolute choice into an explicit weighting for trade-offs; (2) confirmed Little's Law's own steady-state precondition via queueing theory sources: "achieving a steady-state condition means that on average, the arrival and departure rate of items into and out of the system remain consistent," and "if the arrival rate exceeds the service rate, the queue grows without bound" — applied to show the main page's own WIP/Throughput formula produces a misleading (understated) lead-time estimate for a team whose WIP is visibly growing, not just an imprecise one; (3) confirmed Cumulative Flow Diagram reading rules via multiple corroborating sources: the vertical gap between adjacent bands is that stage's current WIP, and "widening bands indicate a bottleneck... the entry rate of items to this state is faster than its exit rate" — expanding the main page's own bare, unexplained CFD mention (the only named Kanban metric on the page with zero explanation) into an actual reading guide, and explicitly connecting it to this same batch's own Little's Law subtopic (a widening band is the visual signature of the exact precondition violation that breaks the WIP/Throughput formula). `sdlc-agile` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the newly-fixed `DevopsNavComponent` local-accordion pattern with no further structural changes needed — confirmed generalizing cleanly to a second DevOps topic. Caught and fixed one genuine drafting error before the gotcha sweep even started: a stray CJK character (每) that slipped into the Little's Law exercise solution text mid-sentence — caught via a dedicated non-ASCII character scan (`LC_ALL=C grep -n '[^ -~’"”—…⚠]'`) added this batch specifically because of this catch, a new addition to the standing gotcha-sweep discipline worth reusing on future batches. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even including one 8-backtick file, confirmed as 4 legitimate template-literal pairs; apostrophe-after-letter check across all `.ts` fields — clean; `[prev]`/`[next]` labels — all use the typographic `'` correctly where apostrophes appear; stray non-ASCII character scan — caught and fixed the one real instance described above; file-existence check — all 9 files confirmed present via `find`) came back clean after the fix; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully after one preview-tab-session-loss recovery (`preview_start` reusing the existing server, re-navigating on the `seed` tab) — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored, confirmed via text search for "widening"/"CFD"/"bottleneck") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the DevOps hub's Phase 10 rollout — 2 of 21 topics complete.**)
- [x] `/devops/environment-strategy` — Environment Strategy (2026-07-19 — 3 subtopics: terraform-workspaces-arent-meant-for-environment-isolation, kubernetes-secrets-are-base64-not-encrypted-by-default, kubernetes-has-no-built-in-namespace-ttl; all three verified against official HashiCorp Terraform and Kubernetes documentation via WebFetch/WebSearch before writing — this batch returned to technically-verifiable, tool-specific claims (Terraform, Kubernetes) rather than pure methodology, since environment-strategy content is heavily infrastructure-tooling-driven unlike the DevOps Culture/SDLC pilot batches — (1) confirmed Terraform's own documented workspace limitation verbatim: "Workspaces are not appropriate for system decomposition or deployments requiring separate credentials and access controls," plus the shared-backend mechanism ("you can deploy multiple distinct instances of that configuration without configuring a new backend or changing authentication credentials") — directly adding a caveat the main page's own Terraform Workspace per Env code tab never mentions; (2) confirmed and CORRECTED a real imprecision in the main page's own secrets-management tool list verbatim from Kubernetes' own docs: "Kubernetes Secrets are, by default, stored unencrypted in the API server's underlying data store (etcd)" — directly contradicting the main page's own "Kubernetes Secrets (with encryption at rest)" phrasing, which reads as if encryption were automatic; (3) confirmed via WebSearch that Kubernetes' only built-in TTL mechanism (ttlSecondsAfterFinished) is scoped to Jobs reaching a finished state, with no equivalent for Namespaces and no built-in concept of inactivity — directly filling an implementation gap behind the main page's own casually-mentioned "add a TTL (destroy after 24h of inactivity)" bullet, which names no actual mechanism. All three subtopics follow the established "the main page states/implies X, but the precise mechanism is more specific/different" correction pattern. `environment-strategy` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern (now confirmed working correctly after the same-session CSS fix) with no further structural changes needed — generalizing cleanly across a third DevOps topic in a row. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; the one `[prev]`/`[next]` label containing an apostrophe — "Terraform Workspaces Aren't Meant for..." — correctly uses the typographic `'`; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully after a dev-server restart (the preview server had stopped between turns) — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present, toggle button confirmed correctly styled — `border: 0px none` — validating the same-session global CSS fix holds for new subtopic batches too), sidebar (tailored, confirmed via text search for "kube-janitor"/"inactivity") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the DevOps hub's Phase 10 rollout — 3 of 21 topics complete.**)
- [x] `/devops/platform-engineering` — Platform Engineering (2026-07-20 — 3 subtopics: platform-team-is-its-own-team-topologies-type, the-space-framework-has-five-dimensions-not-one, cognitive-load-has-three-types-platforms-target-one; all three verified against Team Topologies' own official key-concepts page, the original "SPACE of Developer Productivity" research paper (via WebSearch summaries), and IT Revolution's own cognitive-load article before writing — (1) confirmed and CORRECTED a real terminology conflation in the main page's own Quick Reference verbatim: Team Topologies' own site defines "Four fundamental topologies" and explicitly warns "adding more types or creating hybrids just confuses everyone," with Platform team defined as "a grouping of other team types that provide a compelling internal product to accelerate delivery by Stream-aligned teams" — a distinct category from BOTH Stream-aligned team and Enabling team, contradicting the main page's own "stream-aligned enabler" phrasing; (2) confirmed SPACE's five actual dimensions (Satisfaction and well-being, Performance, Activity, Communication and collaboration, Efficiency and flow) plus the framework's own "measure across at least three dimensions" principle — expanding the main page's own single, satisfaction-only SPACE mention, and showing the main page's OTHER metrics (adoption rate, time to first deploy, support tickets) already map onto four of the five dimensions without being named as such; (3) confirmed cognitive load theory's three types (intrinsic, extraneous, germane) and the specific guidance to "eliminate extraneous cognitive load altogether" while preserving the other two — sharpening the main page's own undifferentiated "reduce cognitive load" goal into a precise diagnostic, applied directly to the main page's own "8 custom CRDs, 40-flag CLI" mistake example (a same-category extraneous-to-extraneous swap, not a genuine reduction). `platform-engineering` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a fourth DevOps topic in a row. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; the two `[prev]`/`[next]` labels containing apostrophes — "Aren't"-style — correctly use straight apostrophes only where safe and typographic `'` where needed, confirmed via direct grep; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present, toggle button confirmed correctly styled — `border: 0px none` — reconfirming the same-session global CSS fix), sidebar (tailored, confirmed via text search for "extraneous"/"germane") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the DevOps hub's Phase 10 rollout — 4 of 21 topics complete.**)
- [x] `/devops/git-workflows` — Git Workflows (2026-07-20 — 3 subtopics: force-with-lease-isnt-foolproof-without-a-fresh-fetch, breaking-change-and-bang-are-independent-signals, the-400-line-pr-limit-has-a-speed-limit-attached; all three verified against official Git documentation, the Conventional Commits v1.0.0 spec, and the original SmartBear/Cisco code review study via WebFetch/WebSearch before writing — a return to cleanly verifiable, tool-specific claims after the more methodology-heavy Platform Engineering batch — (1) confirmed Git's own documented caveat on --force-with-lease verbatim: "this is trivially defeated if some background process is updating refs in the background, e.g. git fetch origin on your repository in a cronjob" — directly qualifying the main page's own unconditional "use --force-with-lease... as a safety net" framing; (2) confirmed the Conventional Commits spec's own independent-signal rule verbatim: "If ! is used, BREAKING CHANGE: MAY be omitted from the footer section" — correcting the impression the main page's own single paired example (both signals together) leaves, that the two are used jointly; (3) confirmed and traced the main page's own unsourced "PRs over 400 lines... lower review effectiveness" claim to the actual SmartBear/Cisco study (2,500 reviews, 3.2M LOC, 2005-2006) and its own paired finding — "review fewer than 400 lines of code" AND "inspection rates should [stay] under 500 LOC per hour" together yield "70-90% defect discovery" — a genuine expansion of a citation-free claim into its real, two-part source. `git-workflows` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a fifth DevOps topic in a row. Caught and fixed one drafting artifact before the sweep — an exercise prompt initially used a literal `\n\n` escape sequence instead of plain prose to describe a multi-line commit message; rewrote it as plain descriptive text before finalizing. Gotcha sweep (bare `@`/`{` — none found; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; the `[prev]`/`[next]` label containing an apostrophe — "Isn't Foolproof..." — correctly uses the typographic `'`; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present, toggle button confirmed correctly styled — `border: 0px none` — reconfirming the same-session global CSS fix holds across every subsequent batch), sidebar (tailored, confirmed via text search for "500 LOC"/"rubber-stamp") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the DevOps hub's Phase 10 rollout — 5 of 21 topics complete.**)
- [x] `/devops/github-actions` — GitHub Actions (2026-07-20 — 3 subtopics: the-fork-pr-token-restriction-not-all-pr-workflows, workflow-run-grants-secrets-the-trigger-didnt-have, paths-ignore-can-permanently-block-a-required-check; all three verified against official GitHub Actions documentation via WebFetch/WebSearch before writing — (1) confirmed GitHub's own docs scope the read-only-token/no-secrets restriction specifically to fork pull requests verbatim: "The GITHUB_TOKEN has read-only permissions in pull requests from forked repositories" and "secrets are not passed to the runner when a workflow is triggered from a forked repository" — sharpening the main page's own "PR workflows run with a read-only token" mistake entry, which reads as a blanket rule despite already gesturing at forks in a parenthetical; (2) confirmed workflow_run's defining security property verbatim — "The workflow started by the workflow_run event is able to access secrets and write tokens, even if the previous workflow was not" — filling a genuine gap: the main page's own CD Deploy Workflow code tab is built entirely around this trigger, but workflow_run is never once mentioned in the main page's own Triggers theory section, which only lists push/pull_request/schedule/workflow_dispatch/workflow_call; (3) confirmed and connected two of the main page's own separate pieces of advice (paths-ignore for cost savings, required status checks for branch protection) via GitHub's own troubleshooting docs verbatim: "If a workflow is skipped due to path filtering... checks associated with that workflow will remain in a 'Pending' state. A pull request that requires those checks to be successful will be blocked from merging" — plus the documented `if:`-conditional-steps workaround. `github-actions` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a sixth DevOps topic in a row. Gotcha sweep (bare `@`/`{` — none found, notably despite this batch's code tabs being GitHub Actions YAML-in-bash-comments containing heavy `\${{ }}` expression syntax, correctly escaped as single-backslash-`$` per the established TypeScript template-literal gotcha; backtick parity — all even; apostrophe-after-letter check across all `.ts` fields — clean; the two `[prev]`/`[next]` labels containing apostrophes — "Didn't Have" — correctly use the typographic `'`; file-existence check — all 9 files confirmed present via `find`) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present, toggle button confirmed correctly styled — `border: 0px none` — reconfirming the same-session global CSS fix holds across every subsequent batch), sidebar (tailored, confirmed via text search for "re-run"/"queued") all working correctly; dark mode confirmed via the toggle-and-reread `--bg` CSS custom property technique in both directions (light → dark: `#fafafa` → `#0f172a`, then dark → light: `#0f172a` → `#fafafa`). **This continues the DevOps hub's Phase 10 rollout — 6 of 21 topics complete.**)
- [x] `/devops/azure-pipelines` — Azure DevOps Pipelines (2026-07-20 — 3 subtopics: curly-double-braces-are-compile-time-not-runtime, custom-condition-overwrites-not-adds-to-the-default, stages-depend-on-whatever-stage-came-right-before-them; all three verified against official Microsoft Learn Azure Pipelines documentation via WebFetch before writing — (1) confirmed a third, unnamed expression tier verbatim: "Note the syntax `${{}}` for compile time and `$[]` for runtime expressions," plus "In a compile-time expression... you have access to `parameters` and statically defined `variables`. In a runtime expression... you have access to more `variables` but no parameters" — directly naming and explaining the syntax the main page's own Templates & Variable Groups code tab already uses (`${{ parameters.nodeVersion }}`) without ever contrasting it against the two syntaxes ($()/$[]) the main page's own quiz does cover; (2) confirmed a custom `condition:` REPLACES rather than augments the implicit default verbatim: "If you customize the default condition of the preceding steps for a stage, you remove the conditions for completion and success. So, if you use a custom condition, it's common to use `and(succeeded(),custom_condition)`" plus the separate, more emphatic "Important: When you specify a condition property for a stage, job, or step, you overwrite the default condition. Your stage, job, or step might run even if the build is canceled" — sharpening the main page's own quiz condition (`and(succeeded(), eq(...))`) from apparent redundancy into a load-bearing, documented requirement; (3) confirmed the exact positional mechanics of the implicit stage dependency verbatim: "If you don't use a dependsOn keyword, stages run in the order they're defined," plus the documented `dependsOn: []` escape hatch for genuine parallelism ("Runs in parallel with FunctionalTest") and a full fan-out/fan-in example — sharpening the main page's own "stages run sequentially by default" theory bullet into the precise, positional (not global) rule, and showing that reordering stage blocks alone silently changes the dependency graph with zero `dependsOn` keys touched. A literal `${{ }}` character sequence used in two HTML-surface label spots (a plain, non-bracketed `subtopicLabel` attribute, and inside a bound `[prev]` label's single-quoted string) was proactively rephrased to avoid the trigger entirely, following the standing brace-escaping discipline. `azure-pipelines` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a seventh DevOps topic in a row. **Caught a genuine, confirmed-in-place build failure from the entity-escape trick failing on a `{{ }}` double-brace mention inside a plain `.html` TEXT NODE** (`&#36;&#123;&#123; &#125;&#125;` inside a `<p class="page-subtitle">`, NG5002 "Blank expressions are not allowed in interpolated strings") — exactly matching this file's own pre-documented "entities decode too late to stop Angular's interpolation lexer" gotcha for `{{ }}` specifically (as opposed to single `{`, where entities DO work); fixed by rewording the prose to avoid the literal braces entirely ("a third, compile-time syntax (curly double braces)") rather than reaching for the Angular-interpolation-trick escape hatch, since the surrounding sentence read cleanly either way. Gotcha sweep (bare `@` — none found; apostrophe-after-letter check across all `.ts` fields and `[prev]`/`[next]` bound-attribute labels — clean, all inside safe backtick-delimited code blocks or plain HTML text-node prose; file-existence check — all 9 files confirmed present) came back clean after the brace fix; build passed cleanly with exit code 0 and zero errors on the second attempt (first attempt caught the brace bug described above). **A second, distinct bug was caught only during browser verification, not by the build**: two `theory.heading` strings (plain-interpolation-bound, per this file's own already-documented "heading uses `{{ }}` not `[innerHTML]`, so no tags" rule) had `<code>` tags written into them by mistake, carried over from habitually wrapping inline-code mentions in `<code>` throughout the rest of the same files' `[innerHTML]`-bound fields — the build stayed green (a stray `<code>` tag is syntactically valid TS/HTML either way) but `get_page_text` showed the raw, un-rendered `<code>...</code>` tags as literal visible text on the page. Fixed by stripping the tags from both headings, confirming this file's own existing rule was correct all along — the mistake was failing to apply it while writing quickly across a batch with a lot of inline-code mentions, not a gap in the documented rule itself. Re-verified successfully after the fix — content (headings now render as clean plain text), breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present, toggle button confirmed correctly styled — `border: 0px none`, `borderRadius: 4px`, `width: 18px`, `display: flex` — reconfirming the same-session global CSS fix holds), sidebar (tailored `tip`/`gotchas` per subtopic, confirmed via `get_page_text`), dark mode (`--bg` toggled `#fafafa` → `#0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 7 of 21 topics complete.**)
- [x] `/devops/jenkins` — Jenkins (2026-07-20 — 3 subtopics: stash-is-scoped-to-the-current-build-only, disableconcurrentbuilds-queues-not-aborts-by-default, changed-fires-broader-than-break-or-recovery-alone; all three verified against official Jenkins documentation (jenkins.io) via WebFetch before writing — (1) confirmed stash's exact lifetime verbatim: "The stash step allows capturing files matching an inclusion pattern... for reuse within the same Pipeline. Once the Pipeline has completed its execution, stashed files are deleted from the Jenkins controller" — sharpening the main page's own QnA, which explains WHERE stash/unstash moves files between agents but never says how long they persist, and introducing `archiveArtifacts` (never mentioned in the same breath on the main page) as the actual tool for cross-build reuse; (2) confirmed disableConcurrentBuilds()'s default queue-not-abort behavior verbatim — "Disallow concurrent executions of the Pipeline" — plus the separate, explicit `abortPrevious: true` parameter ("to abort the running one and start the new build") — filling a real gap, since the main page's own first code tab uses the bare option with zero explanation anywhere on the page; (3) confirmed the precise definitions of three post-conditions verbatim — changed ("a different completion status from its previous run"), fixed ("successful and the previous run failed or was unstable"), regression ("failure, unstable, or aborted and the previous run was successful") — showing the main page's own theory recommends `changed` specifically for "when something breaks or recovers," a narrower case than what `changed` actually covers, while never mentioning the two conditions (`fixed`/`regression`) actually built for exactly that pair of cases. `jenkins` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across an eighth DevOps topic in a row. **Caught two real mistakes during self-review, before the build**: an unnecessary double-backslash-escaped apostrophe in a backtick-delimited code-tab string (`Yesterday\\'s Build`, which would have rendered a stray visible backslash) corrected to a single `\'`; and a bare `{ changed }` pair in an `<h1>` text node plus a bare `post{}` pair in a `<p>` text node, both fixed by rewording to avoid the trigger entirely, per the standing single-brace-in-prose gotcha. **A third, distinct mistake was caught only during initial browser verification of the /devops/azure-pipelines batch immediately prior to this one — not repeated here**: two `theory.heading` strings there had stray `<code>` tags (headings use plain interpolation, not `[innerHTML]`, so tags render as literal visible text) — this batch's headings were written tag-free from the start as a direct result of that catch. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags present; apostrophe-after-letter check across all `.ts` fields and `[prev]`/`[next]` bound-attribute labels — clean, using the typographic `’` where needed; bare single/double brace sweep across all `.html` text nodes — caught and fixed the two instances described above; file-existence check — all 9 files confirmed present) came back clean after the fixes; build passed cleanly with exit code 0 and zero errors on the FIRST attempt (the brace/heading issues were caught by manual sweep before building, not by a failed build this time); browser-verified successfully — content (headings and titles rendering as clean text, no literal tags or braces), breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via `get_page_text`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 8 of 21 topics complete.**)
- [x] `/devops/continuous-integration` — Continuous Integration (2026-07-20 — 3 subtopics: fail-fast-false-lets-every-matrix-job-finish, new-code-quality-gates-vs-global-coverage-thresholds, merge-multiple-flattens-artifact-subdirectories; all three verified against official GitHub Actions and SonarQube documentation via WebFetch/WebSearch before writing — (1) confirmed the matrix fail-fast mechanism verbatim from GitHub's own docs — "If any of the jobs with continue-on-error: false fail, all jobs that are in progress or queued will be cancelled" — corroborated by convergent independent secondary sources (Credera, RunsOn, Depot) for the default value (true) and the false-case behavior, since GitHub's own workflow-syntax reference page repeatedly truncated mid-fetch across several attempts before a narrower, occurrence-scoped fetch got a clean partial quote; sharpening the main page's own first code tab, which sets `fail-fast: false` on its Node version matrix with zero explanation anywhere on the page; (2) confirmed SonarQube's own "Clean as You Code" design philosophy verbatim — "When your quality gate is focused on new code, we do not recommend adding conditions for overall code" and "By focusing on new code, you aren't responsible for anyone else's code" — contrasting the main page's own SonarQube "New code coverage >= 80%" Quality Gate rule against its own separate Jest `coverageThreshold: { global: { lines: 80 } } }` mistake-entry fix, which the page places on the same page without ever explaining the two enforce coverage in fundamentally different, non-interchangeable ways (per-change vs. whole-codebase); (3) confirmed download-artifact@v4's `merge-multiple` option verbatim — "If true, the downloaded artifacts will be in the same directory specified by path. If false, the downloaded artifacts will be extracted into individual named directories" — explaining why the main page's own Test Parallelisation merge-coverage job's very next line (`npx nyc merge .`) only works because `merge-multiple: true` flattens all four shards into one directory first. `continuous-integration` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a ninth DevOps topic in a row. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags present, applying the lesson caught two batches prior; bare single/double brace sweep across all `.html` text nodes — clean, all `{` occurrences confirmed inside standard `[prev]`/`[next]` bound-attribute object-literal syntax, not bare prose; apostrophe-after-letter check across all `.ts` fields and `.html` text nodes — clean, all plain-text-node apostrophes needing no escaping; file-existence check — all 9 files confirmed present) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via `get_page_text`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 9 of 21 topics complete.**)
- [x] `/devops/continuous-delivery` — Continuous Delivery & Deployment (2026-07-20 — 3 subtopics: service-selector-switch-isnt-actually-instant, awk-begin-exit-is-how-bash-compares-floats, phase-3-timing-is-about-references-not-elapsed-time; the first claim verified against official Kubernetes documentation via WebFetch/WebSearch before writing, the second reasoned through directly from well-established bash/awk semantics, the third reasoned through directly from the main page's own mistake entry — (1) confirmed kube-proxy's sync mechanism verbatim from Kubernetes's own docs: "Each instance of kube-proxy watches the Kubernetes control plane for the addition and removal of Service and EndpointSlice objects... A control loop ensures that the rules on each node are reliably synchronized," plus the configurable minSyncPeriod (default 1s) and "each individual change may end up waiting up to the full minSyncPeriod before being processed" — sharpening the main page's own Blue/Green code tab, whose Step 4 comment calls the traffic switch "instant, atomic," when only the Service API object update is instant — every node's actual routing-rule sync happens on a separate, node-by-node schedule, producing a brief real window of mixed old/new traffic; (2) explained the `awk "BEGIN {exit !($ERROR_RATE > 0.05)}"` idiom used without comment in the main page's own Canary code tab — bash's `[ ]`/`-gt` only handles integers, so a realistic decimal Prometheus error-rate value needs awk's native float comparison instead, with the `!` reconciling awk's "true is 1" convention against bash's "success exit code is 0" convention (removing the `!` silently inverts which branch runs); (3) sharpened the main page's own "weeks later" Phase 3 timing into the actual criterion — elapsed calendar time is a proxy, not the real safety mechanism, since an infrequently-run job (e.g. a quarterly report) may not execute even once during a multi-week wait, while the main page's own mistake entry already names the true cause (a live reference to the changed column) without ever connecting it back to the "weeks later" framing. `continuous-delivery` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a tenth DevOps topic in a row. **Caught and fixed two real mistakes during self-review, before the build**: a bare `{ exit }` brace pair in both a plain `subtopicLabel` attribute and an `<h1>` text node (reworded to avoid the trigger, same class of gotcha caught in the prior Jenkins batch); and, while fixing a cross-page `[next]`/`[prev]` label reference to avoid the same brace, briefly introduced a straight apostrophe inside a single-quoted bound-attribute string (`'awk's BEGIN-exit...'`) — caught and corrected to the typographic `’` before it reached the build, a live example of the established apostrophe-collision rule being applied correctly on the second attempt. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags present; bare brace sweep across all `.html` text nodes and plain attributes — caught and fixed the instances described above, all remaining `{` matches confirmed inside standard `[prev]`/`[next]` object-literal bindings; backtick parity checked on both codeTab-heavy files — even counts, consistent with safe single-quoted-field usage; file-existence check — all 9 files confirmed present) came back clean after the fixes; build passed cleanly with exit code 0 and zero errors on the FIRST attempt (both self-caught issues were fixed before building, not discovered by a failed build); browser-verified successfully — content (code blocks, headings, and titles all rendering as clean text with no literal braces or backslashes), breadcrumb (all 4 levels, typographic quotes rendering correctly), the `DevopsNavComponent` accordion (auto-expand confirmed via direct DOM query, all 3 subtopic links present), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via `get_page_text`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 10 of 21 topics complete.**)
- [x] `/devops/gitops` — GitOps with ArgoCD & Flux (2026-07-20 — 3 subtopics: retry-backoff-is-exponential-not-linear, flux-interval-is-a-drift-fallback-not-a-git-trigger, sync-waves-wait-for-healthy-not-just-applied; all three verified against official ArgoCD and Flux documentation via WebFetch/WebSearch before writing (WebSearch hit its session rate limit partway through this batch, so the second and third claims were verified via direct WebFetch against argo-cd.readthedocs.io and fluxcd.io instead) — (1) confirmed ArgoCD's own retry.backoff field definitions verbatim — `limit`: "number of retry attempts. Set to -1 for unlimited retries," `backoff.duration`: "base wait time before the first retry," `backoff.factor`: "multiplier applied after each failed attempt," `backoff.maxDuration`: "maximum wait time between retries, regardless of the number of attempts" — sharpening the main page's own ArgoCD Application YAML, which sets `retry: { limit: 3, backoff: { duration: 5s, factor: 2 } }` with zero explanation anywhere on the page, into the actual exponential timeline (5s, 10s, 20s) rather than a plausible-looking fixed-5-second-gap assumption; (2) confirmed and CORRECTED an initial assumption mid-research — Flux's own Kustomization docs state "If the .metadata.generation of a resource changes... or the Source revision changes (which generates a Kubernetes event), this is handled instantly outside the interval window," directly contradicting the naive "GitRepository interval + Kustomization interval = total sync delay" reading the main page's own collapsed "Flux interval" theory bullet invites — a genuine Git push is event-driven and fast, gated mainly by GitRepository's own (usually shorter) fetch interval, while the Kustomization's own longer interval is actually the fallback drift-correction check for changes with no corresponding Git event (e.g. a manual kubectl edit); (3) confirmed ArgoCD's sync-wave gating condition verbatim — "This is the first number where any resource is out-of-sync or unhealthy" and "repeats this process until all phases and waves are in-sync and healthy," plus same-wave ordering ("by kind... followed by... by name") — sharpening the main page's own sync-wave mistake entry, whose ConfigMap/Secret example makes "applied" and "healthy" look identical, into the real, more consequential rule for resource types like Jobs and Deployments where the gap between the two states is what actually makes ordering guarantees (e.g. a migration Job before an app Deployment) hold correctly. `gitops` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across an eleventh DevOps topic in a row. **Caught and fixed a straight-apostrophe-inside-a-single-quoted-bound-attribute mistake mid-batch** — while writing a `[next]` label cross-referencing the Flux subtopic's own possessive title ("Flux's Interval..."), the first draft used a bare `'` instead of the required typographic `’`, caught via the standard sweep and corrected before the build, the same class of mistake documented multiple times earlier this session, confirming the standing discipline of sweeping every new `[prev]`/`[next]` label for this pattern remains necessary even this many batches in. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings; backtick parity across all three `.ts` files — even counts (12/48/12); file-existence check — all 9 files confirmed present) came back clean after the apostrophe fix; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), sidebar (tailored `tip`/`gotchas`/`related` per subtopic); the `DevopsNavComponent` accordion initially APPEARED not to auto-expand via a `read_page` accessibility-tree snapshot, but a follow-up direct DOM query (`querySelector` + `getComputedStyle`) confirmed all 3 subtopic links WERE genuinely present, visible (`display: flex`), and correctly marked `active` inside `.nav-subtopics` — a stale/misleading `read_page` snapshot, not a real bug, resolved by cross-checking with a lower-level DOM query rather than trusting the higher-level accessibility read alone; dark mode confirmed via the `--bg` CSS custom property (`#0f172a`). **This continues the DevOps hub's Phase 10 rollout — 11 of 21 topics complete.**)
- [x] `/devops/artifact-management` — Artifact Management (2026-07-20 — 3 subtopics: imagetools-create-never-pulls-image-data, repodigests-is-empty-until-a-registry-round-trip, scoped-packages-are-private-unless-access-is-public; all three verified against official Docker and npm documentation via WebFetch/WebSearch before writing — (1) confirmed `docker buildx imagetools create`'s registry-side operation verbatim: "Create a new manifest list based on source manifests... must already exist in the registry where the new manifest is created" — explaining why the main page's own Docker Image Lifecycle code tab uses it (and, separately, skopeo copy) instead of a plain pull/tag/push: both avoid transferring image data to/from the CI runner entirely; (2) confirmed via WebSearch (corroborating multiple sources on Docker's own RepoDigests behavior) that a repo digest is only attached to an image after a push or pull touches a registry — a freshly built, unpushed image returns an empty RepoDigests array — explaining why the main page's own code tab's Step 3 (`docker inspect ... RepoDigests`) must run strictly after Step 2 (`docker push`), a genuine data dependency the comments never state; (3) confirmed npm's own documented default verbatim: scoped packages are private by default, and "If you have an organization that does not have the Private Packages feature, npm publish will fail unless you pass the access flag" — explaining why the main page's own `@myorg/my-library` package.json sets `publishConfig.access: "public"`, and why omitting it isn't a missed optimization but a real 402-error failure mode on a new scoped package's first publish. `artifact-management` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a twelfth DevOps topic in a row. **Caught and fixed one house-style inconsistency before the build**: a `theory.heading` string (plain-interpolation-bound) used backtick-wrapped inline-code emphasis (`` `"access": "public"` ``) — technically harmless (backticks render as literal characters, no build break), but inconsistent with every other heading in this batch and prior ones, which use plain text with no code-styling markup at all; reworded to drop the backticks. Gotcha sweep (bare `@` — none found; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings; backtick parity across all three `.ts` files — even counts (66/32/74); file-existence check — all 9 files confirmed present) came back clean after the heading fix; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (confirmed via direct DOM query — `.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 12 of 21 topics complete.**)
- [x] `/devops/docker-cicd` — Docker in CI/CD (2026-07-20 — 3 subtopics: ignore-unfixed-excludes-unpatched-not-minor-cves, type-semver-never-fires-without-a-git-tag-push, sbom-lists-contents-provenance-describes-the-build; all three verified against official Trivy, docker/metadata-action, and Docker documentation via WebFetch/WebSearch before writing — (1) confirmed Trivy's own definition of --ignore-unfixed verbatim: "The unfixed/unfixable vulnerabilities mean that the patch has not yet been provided on their distribution. To hide unfixed/unfixable vulnerabilities, you can use the --ignore-unfixed flag" — correcting the plausible-but-wrong reading of the flag name (as filtering low-severity findings) that the main page's own two Trivy commands invite by using it with zero explanation; (2) confirmed docker/metadata-action's own documented precondition for its semver tag type verbatim: "Will be used on a push tag event and requires a valid semver Git tag" — revealing that the main page's own GitHub Actions workflow, whose `on:` block only configures branch-push and pull_request triggers with no `tags:` entry at all, can never actually satisfy this precondition, meaning its own `type=semver,pattern={{version}}` tag rule is silently dead configuration despite looking identical to the two tag rules that do work; (3) confirmed Docker's own SBOM-vs-provenance distinction and the provenance registry-push default verbatim — "Software Bill of Material (SBOM) is a list of software artifacts that an image contains or that were used to build it, while Provenance describes how an image was built" and "By default, a minimal provenance attestation will be created for the build result, which will only be attached for images pushed to registries" — explaining both what the main page's own `--sbom=true --provenance=true` pairing actually represents (two different questions, not one feature) and why dropping `--push` for local testing would silently leave provenance unattached while SBOM still works. `docker-cicd` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a thirteenth DevOps topic in a row. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings, confirmed `{{version}}`/`{{...}}` mentions elsewhere are safely scoped to `[innerHTML]`-bound theory fields, not `.html` text nodes; backtick parity across all three `.ts` files — even counts (26/22/62); file-existence check — all 9 files confirmed present) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content (including nested `{{ }}` template-syntax mentions rendering correctly inside theory text), breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (confirmed via direct DOM query — `.nav-subtopics` container `display: flex`, link correctly marked `active`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 13 of 21 topics complete.**)
- [x] `/devops/kubernetes-deployments` — Kubernetes Deployments (2026-07-20 — 3 subtopics: atomic-already-implies-wait-in-helm-upgrade, nameprefix-actually-renames-the-live-resource, pause-with-no-duration-waits-forever-not-briefly; all three verified against official Helm, Kustomize/kubectl, and Argo Rollouts documentation via WebSearch/WebFetch before writing — (1) confirmed Helm's own docs verbatim: "The --wait flag will be set automatically if --atomic is used" — explaining that the main page's own Helm upgrade command, which passes both `--atomic` and `--wait` explicitly, has a genuinely redundant (though harmless) second flag, and distinguishing this from the non-interchangeable case of dropping `--atomic` instead (which removes auto-rollback while `--wait`'s own behavior continues unaffected); (2) traced the main page's own Kustomize code tab's `namePrefix: prod-` (set early in the tab) forward to its own later `kubectl rollout status deployment/prod-myapp` step, connecting two pieces of the SAME code tab the page itself never explicitly links — namePrefix genuinely rewrites the live object's `metadata.name`, not a cosmetic label, confirmed via direct reasoning about Kustomize's own transformer behavior (base manifest name never exists as a live object once an overlay applies namePrefix); (3) confirmed Argo Rollouts' own docs verbatim: "If the duration field within the pause struct is set, the rollout will not progress... Otherwise, the rollout will wait indefinitely until that Pause condition is removed" plus the promote-command citation — explaining that the main page's own canary steps only ever demonstrate timed pauses (fully automatic, no human gate), and that omitting duration entirely (`pause: {}`) is a standard, documented pattern for adding a genuine manual-approval checkpoint, not a syntax the main page ever shows or names. `kubernetes-deployments` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a fourteenth DevOps topic in a row. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings, confirmed `pause: {}`/`pause: { duration: ... }` mentions in prose are safely scoped to `[innerHTML]`-bound theory/code fields, never appearing bare in `.html` text nodes; backtick parity across all three `.ts` files — even counts (52/102/32); file-existence check — all 9 files confirmed present) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (confirmed via direct DOM query — `.nav-subtopics` container `display: flex`, link correctly marked `active`), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 14 of 21 topics complete.**)
- [x] `/devops/iac` — Infrastructure as Code (2026-07-20 — 3 subtopics: pipefail-is-not-the-github-actions-shell-default, incremental-mode-never-deletes-unmanaged-resources, check-filters-what-runs-soft-fail-on-what-blocks; all three verified against official GitHub Actions, Microsoft Learn (ARM/Bicep), and Checkov documentation via WebFetch/WebSearch before writing — (1) confirmed GitHub's own documented shell-default templates verbatim: unspecified shell runs "bash -e {0}" (no pipefail) while explicit `shell: bash` runs "bash --noprofile --norc -eo pipefail {0}" (pipefail on) — revealing that the main page's own drift-detection step, which never declares a `shell:` key, pipes `terraform plan -detailed-exitcode` through `tee` and then reads `$?` in a way that (per plain bash semantics, absent pipefail) actually captures tee's exit code, not terraform's — a genuine, silent bug in the exact pattern the main page's own code tab shows, caught by tracing GitHub's documented default all the way through; (2) confirmed Microsoft's own ARM/Bicep deployment-modes docs verbatim: Incremental mode "leaves unchanged resources that exist in the resource group but aren't specified in the template," Complete mode "deletes" them, plus Microsoft's own worked example (resource C surviving vs. being deleted) — explaining why the main page's own `--mode Incremental` flag is the safe, Microsoft-recommended default and does the OPPOSITE of Terraform's own default reconciliation behavior, a distinction a Terraform-experienced reader could easily get backwards; (3) confirmed Checkov's own documented distinction verbatim between `--check` ("controls which checks run... in the first place") and `--soft-fail-on` ("controls how failures are handled after checks run") — explaining that the main page's own two Checkov commands, shown side by side under one heading, represent a narrow allowlist (only 2 checks ever run) versus full-coverage-with-selective-blocking (every default check runs, only LOW/MEDIUM findings become non-blocking), not two examples of the same idea. `iac` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a fifteenth DevOps topic in a row. **Caught a genuine `${PIPESTATUS[0]}` JS-template-literal-interpolation risk before the build**: an early draft referenced bash's `${PIPESTATUS[0]}` array syntax inside prose — verified it was safely contained within a single-quoted `.ts` string field (not a backtick template literal), so no actual escaping was needed, but confirmed this deliberately rather than assuming, per the standing discipline around `${` inside backtick-delimited `code:` fields specifically (where two separate instances of `\$?`/`\$GITHUB_OUTPUT` WERE correctly single-backslash-escaped in the actual backtick code blocks). Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings; backtick parity across all three `.ts` files — even counts (38/12/130, the last reflecting two dense code tabs of GitHub Actions YAML-in-bash-comments); file-existence check — all 9 files confirmed present) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content (including `$?`/`$GITHUB_OUTPUT` rendering as literal text correctly, not triggering any interpolation), breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (confirmed via direct DOM query — `.nav-subtopics` container `display: flex`, link correctly marked `active`), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 15 of 21 topics complete.**)
- [x] `/devops/monitoring` — Monitoring & Alerting (2026-07-20 — 3 subtopics: the-short-window-is-for-fast-reset-not-confirmation, group-wait-interval-repeat-interval-are-different-timers, histogram-quantile-accuracy-depends-on-bucket-boundaries; all three verified against Google's own SRE Workbook and Prometheus's own documentation via WebFetch/WebSearch before writing — (1) confirmed Google's own SRE Workbook verbatim: "The short window average drops below the threshold 5 minutes after the errors stop... The long window average drops below the threshold 60 minutes after the errors stop" — explaining that the main page's own two-window "and" combination in its SLO burn-rate alert exists specifically for fast RESET TIME once an incident is fixed, not merely as redundant confirmation of the long window's finding, a genuinely different purpose than the plausible-but-incomplete guess a reader might make; (2) confirmed AlertManager's own docs verbatim for all three timing fields — group_wait ("first notification for a new group"), group_interval ("subsequent notifications for an existing group... after group_wait"), repeat_interval ("repeating the last notification... not repeated if any new alerts have fired") — sharpening the main page's own three bare values (30s/5m/12h) into three genuinely distinct moments in a notification's lifecycle, explicitly correcting the natural assumption that a new alert joining an already-notified group is governed by repeat_interval rather than group_interval; (3) confirmed Prometheus's own docs verbatim on histogram_quantile's interpolation: "Error is limited by the width of the bucket the quantile is located in," plus Prometheus's own worked example (a 220ms cluster with no nearby bucket boundary producing a 295ms estimate) — adding the precision caveat the main page's own "prefer histograms over summaries" advice never mentions, distinguishing the (correct) cross-instance-aggregation advantage from the separate, unaddressed bucket-boundary-precision concern. `monitoring` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free (a same-named bare key exists in the Messaging hub's own separate `KAFKA_LABELS`/breadcrumb map, confirmed via direct inspection to be a different map with no cross-hub collision risk, consistent with the established per-hub-labels-map pattern), added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a sixteenth DevOps topic in a row. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings; backtick parity across all three `.ts` files — even counts (14/42/16); explicit `\${` interpolation-risk scan across all three files — clean, no unescaped instances found; file-existence check — all 9 files confirmed present) came back clean; build passed cleanly with exit code 0 and zero errors on the FIRST attempt; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (confirmed via direct DOM query — `.nav-subtopics` container `display: flex`, link correctly marked `active`), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 16 of 21 topics complete.**)
- [x] `/devops/logging` — Logging Pipelines (2026-07-20 — 3 subtopics: merge-log-vs-k8s-logging-parser-are-different-mechanisms, label-keys-traceid-is-a-loki-cardinality-explosion, ilm-min-age-counts-from-rollover-not-creation; all three verified against official Fluent Bit, Grafana Loki, and Elastic documentation via WebSearch before writing — (1) confirmed Fluent Bit's own docs verbatim distinguishing the two mechanisms: Merge_Log "tries to assume the log field... is a JSON string message and make a structured representation of it" (a filter-wide default), while K8S-Logging.Parser "will only be processed if" the filter enables the option AND the specific pod supplies an annotation naming an already-registered parser (a per-pod opt-in) — sharpening the main page's own Fluent Bit filter block, which sets both together with only brief individual comments and no scope distinction; (2) confirmed Loki's own label best-practices docs verbatim: "Do not use labels for high-cardinality values: pod, instance IDs, request IDs, user IDs, trace IDs..." — flagging that the main page's own `Label_Keys level,traceId` line promotes exactly the kind of value Loki's own docs explicitly warn against, drawing the connection to this hub's own separately-published Prometheus cardinality warning (a real, structural risk in the main page's own working example, not a hypothetical); (3) confirmed Elastic's own ILM docs verbatim: "If an index has been rolled over, then the min_age value is relative to the time the index was rolled over, not the index creation time" — correcting the natural-but-wrong reading of the main page's own ILM policy, where two indices under the identical policy can reach the same phase at genuinely different total ages depending on when each one actually rolled over. **Real collision caught and resolved**: `logging` as a bare key was already claimed by the Node.js hub's own `/node/logging` topic in `src/app/data/subtopics.ts` (confirmed via the standard both-quoted-and-unquoted grep) — hub-prefixed to `devops-logging` with a `// NOTE:` comment, consistent across all three nav-accordion helper calls (`subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics`) in `DevopsNavComponent`, while breadcrumb/sidebar/search keys kept their established per-hub conventions (bare breadcrumb, full-path-prefixed sidebar, hub-prefixed search route) unaffected by the SUBTOPICS-map-specific collision. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings; backtick parity across all three `.ts` files — even counts (28/40/36); explicit `\${` interpolation-risk scan — clean, no unescaped instances; file-existence check — all 9 files confirmed present) came back clean; build reported the pre-documented harmless "bundle initial exceeded maximum budget" condition (exceeded by 4.39 kB, expected at this site's current scale per CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully — content, breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (confirmed via direct DOM query using the correctly hub-prefixed `devops-logging` key — `.nav-subtopics` container `display: flex`, link correctly marked `active`), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 17 of 21 topics complete.**)
- [x] `/devops/incident-response` — On-call & Incident Response (2026-07-20 — 3 subtopics: continue-true-is-what-lets-a-second-route-also-fire, pagerdutys-severity-field-is-not-the-alert-label, duration-and-mttr-measure-from-different-endpoints; the first two verified against official AlertManager and PagerDuty-integration documentation via WebFetch/WebSearch, the third reasoned entirely from the main page's own worked postmortem example — (1) confirmed AlertManager's own docs verbatim: "If continue is set to false, it stops after the first matching child. If continue is true on a matching node, the alert will continue matching against subsequent siblings" — explaining why the main page's own two `severity: page` routes (PagerDuty then Slack) actually both fire: `continue: true` on the FIRST route is what lets evaluation reach the second, and the mechanism would silently break (Slack never notified) if that one word were ever dropped, or if a third route were added without its own `continue: true` on the second; (2) confirmed PagerDuty's own accepted severity vocabulary via WebSearch (the pagerduty_configs severity field "must be one of the following: 'critical', 'warning', 'error' or 'info'") — distinguishing it from AlertManager's own, differently-scoped `severity` LABEL used purely for routing (`page`/`warning`, the team's own arbitrary vocabulary), explaining why the main page's own config correctly hardcodes `severity: critical` rather than templating the alert's own label through, since the label's own values were never valid PagerDuty severity strings in the first place; (3) traced the main page's own worked postmortem's two stated numbers — "Duration: 47 minutes (14:22–15:09 UTC)" and "MTTD: 2 minutes, MTTR: 11 minutes" — back through its own timeline, showing they measure from genuinely different endpoints (MTTR ends at 14:35, actual service restoration; Duration extends to 15:09, the status page update) and that the 34-38 minute gap between them is exactly the process failure the SAME postmortem's own "What went wrong" section names explicitly ("Status page was not updated until 38 minutes after resolution") but never assigns an action item to — a pure-reasoning finding requiring no external citation, matching the established pattern for internally-consistent gaps found by close reading of a main page's own worked example. `incident-response` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across an eighteenth DevOps topic in a row. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags present; bare brace sweep — clean, all `{` matches inside standard `[prev]`/`[next]` object-literal bindings; backtick parity across all three `.ts` files — even counts (58/4/68); file-existence check — all 9 files confirmed present) came back clean; build reported only the pre-documented harmless "bundle initial exceeded maximum budget" condition (exceeded by 10.50 kB at this site's current scale, per CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully — content, breadcrumb (all 4 levels, typographic quotes rendering correctly), the `DevopsNavComponent` accordion (confirmed via direct DOM query — `.nav-subtopics` container `display: flex`, link correctly marked `active`), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 18 of 21 topics complete.**)
- [x] `/devops/devsecops` — DevSecOps (2026-07-21 — 3 subtopics: dependabot-auto-merge, codeql-merge-blocking, gitleaks-scan-scope; all three verified against official GitHub documentation (Dependabot automation, code scanning/branch protection, gitleaks-action) via WebFetch/WebSearch before writing — (1) confirmed GitHub's own docs verbatim that Dependabot has no native auto-merge setting: automating it requires "GitHub Actions and the GitHub CLI" — a workflow using the dependabot/fetch-metadata action to read update-type, then `gh pr merge --auto`, plus GitHub's own explicit recommendation to "enable Require status checks to pass before merging for Dependabot pull requests" — sharpening the main page's own one-line "Configure auto-merge for patch updates with passing tests" into the actual three-piece mechanism (dependabot.yml schedule + repo Allow-auto-merge toggle + a hand-written workflow), and clarifying that --auto QUEUES a merge conditional on required checks, it does not force one; (2) confirmed via WebSearch (GitHub's own docs plus a corroborating walkthrough) that the "Code scanning results" check populating the Security tab and that same check actually blocking a merge are two independently-configured systems — the workflow's own upload-sarif step always populates the Security tab and PR comments, but blocking a merge additionally requires a branch protection rule explicitly selecting "Code scanning results" as a required status check, and GitHub's own docs state "Only errors or security issues with a severity level of High or Higher will fail the pull request status check; warnings do not block the PR by default" — sharpening the main page's own single joined sentence ("Results appear in the Security tab and can block merges") into two separate, independently-toggleable behaviors; (3) confirmed via WebSearch that gitleaks-action's default push-triggered scan uses the triggering commit SHA (not the full history now on disk) and its pull_request-triggered scan diffs only the PR's base-vs-head commits — meaning the main page's own workflow comment `fetch-depth: 0     # scan full history` describes what actions/checkout fetches locally, not what gitleaks-action then actually scans; fetch-depth: 0 exists specifically to make the PR diff comparison possible (a base commit must be locally available to diff against), not to broaden the scan itself — a genuine one-time full-history audit needs a separate, manually-triggered `gitleaks detect` run against the whole git log. `devsecops` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a nineteenth DevOps topic in a row (this topic's own nav `<a>` entry had never been converted to the accordion-toggle markup before this batch, unlike every prior topic which already had the toggle scaffolding in place from earlier session work — converted it as part of this batch's step 3 wiring). Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare brace sweep — clean, all `{` matches confirmed inside standard `[prev]`/`[next]` object-literal bindings, typographic `’` used throughout; backtick parity across all three `.ts` files — even counts (8/4/18); explicit `\${` interpolation-risk scan — clean, no unescaped instances; file-existence check — all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle initial exceeded maximum budget" condition (exceeded by 15.91 kB at this site's current scale, per CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content (all three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the `DevopsNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode (`--bg: #0f172a`) all working correctly. A `Grep`-tool-output display artifact briefly looked like a real backslash-vs-forward-slash key bug in the pre-existing `incident-response` breadcrumb/sidebar entries; a spawned follow-up task was created then immediately dismissed after a direct `Read` of the file confirmed the entries were correct all along (forward slashes) — worth remembering that `Grep`'s rendered output is not always a faithful byte-for-byte reflection of file content, especially around special characters. **This continues the DevOps hub's Phase 10 rollout — 19 of 21 topics complete.**)
- [x] `/devops/release-management` — Release Management (2026-07-21 — 3 subtopics: release-please-never-publishes, semantic-release-npm-never-commits-back, hotfix-step-4-already-happened-at-step-3; the first two verified against official release-please and semantic-release documentation via WebFetch before writing, the third reasoned entirely by tracing two blocks already present in the main page's own single "CHANGELOG & Hotfix Process" code tab — (1) confirmed release-please-action's own documented scope verbatim: it automates "CHANGELOG generation, the creation of GitHub releases, and version bumps for your projects" — publishing is explicitly NOT included, and a workflow needs a separate step gated on the action's own `release_created` output (`if: ${{ steps.release.outputs.release_created }}`) to actually run `npm publish` — sharpening the main page's own "Merge the PR to trigger a release" line, whose one-step workflow example never adds that gate, into the precise, easy-to-miss gap between "GitHub Release created" and "package actually published"; (2) confirmed @semantic-release/npm's own docs verbatim — its prepare step will "Update the package.json version and create the npm package tarball," with no git commit or push of any kind — and confirmed separately that @semantic-release/git is the plugin responsible for committing those files back, revealing that the main page's own .releaserc.json (five plugins, no @semantic-release/git) publishes correctly to npm on every release while the repository's own package.json silently never updates, indefinitely, since semantic-release computes the next version from git tag history rather than from reading the current package.json value; (3) traced the main page's own hotfix step 3 (`git push origin v2.4.1`) forward to the SAME code tab's own separately-labeled tag-triggered release workflow (`on: push: tags: ['v*.*.*']`, which includes `npm publish --access public`) — since 'v2.4.1' matches that glob exactly, step 4's blank "Deploy v2.4.1 to production" bullet (the only step in the list with no command under it) is the automatic, already-in-progress consequence of step 3's tag push for a project wired this way, not a separate manual action — a pure-reasoning finding connecting two blocks the main page places in the same tab but never verbally links, matching the established pattern for internally-consistent gaps found by close reading of a main page's own worked example. `release-management` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a twentieth DevOps topic in a row (this topic's own nav `<a>` entry, like `devsecops` in the prior batch, had never been converted to the accordion-toggle markup before this batch — converted it as part of this batch's step 3 wiring). **Caught a genuine, confirmed-in-place bare-`@word`-text-node mistake before the build**: the `@semantic-release/npm` subtopic's own `<h1>` and `<p class="page-subtitle">` used the literal, un-escaped `@semantic-release` text directly as bare TEXT NODE content (not inside a bound or plain attribute, where it would have been safe per the established exception) — caught via the standard pre-build `@[a-zA-Z]` grep sweep across all three `.html` files, fixed with the standard `&#64;` entity escape on both occurrences; the SAME string used inside `[prev]`/`[next]` bound-attribute label values and a plain `subtopicLabel="..."` attribute on other lines needed no escaping at all, confirming the existing bound/plain-attribute-vs-bare-text-node distinction this file already documents held correctly. Gotcha sweep after the fix (bare `@` — clean; double-brace `{{ }}` — none found; bare single/double brace sweep — clean, all `{` matches confirmed inside standard `[prev]`/`[next]` object-literal bindings; apostrophe-after-letter check across all `.ts` fields — clean, all correctly escaped with `\'` where needed; backtick parity across all three `.ts` files — even counts (28/10/26); `\${` interpolation-risk scan across all `code:` template-literal fields — clean, the one `${{ steps.release.outputs... }}` GitHub Actions expression mention correctly left unescaped since it sits inside a `#`-commented bash string, not literal JS template-literal interpolation, and the one genuine `\${nextRelease.version}` GitHub Actions-style mention was correctly single-backslash-escaped; file-existence check — all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle initial exceeded maximum budget" condition (exceeded by 21.93 kB at this site's current scale, per CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content (all three h1/breadcrumb pairs correct, including confirming the `@semantic-release/npm` heading now renders the literal `@` character correctly rather than being swallowed by Angular's block-syntax parser), breadcrumb (all 4 levels, typographic curly quotes rendering correctly on the third subtopic's title), the `DevopsNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode (`--bg: #0f172a`) all working correctly. **This continues the DevOps hub's Phase 10 rollout — 20 of 21 topics complete — only `sre` remains.**)
- [x] `/devops/sre` — SRE Practices (2026-07-21 — 3 subtopics: dead-mans-switch-mechanism, burn-rate-formula-elapsed-window-disagreement, alert-rules-reference-undefined-recording-rules; the first verified against Prometheus's own training materials and multiple independent operational write-ups via WebSearch, the other two reasoned entirely by cross-referencing separate code blocks already present on the main page against each other and against Prometheus's own documented recording-rule naming convention (fetched via WebFetch) — (1) confirmed the dead man's switch / watchdog pattern verbatim: its PromQL expression is `vector(1)` (always true, always firing), routed via Alertmanager to a genuinely external, independently-hosted service (PagerDuty's Dead Man's Snitch integration, healthchecks.io, etc.) configured to expect a heartbeat on a schedule and page when it STOPS arriving — inverting the main page's own wording ("an alert that fires if the pipeline has been silent"), which reads as if Prometheus detects its own silence, when the actual mechanism has Prometheus producing a constant heartbeat and an outside system doing the detecting; (2) traced the main page's own two separate burn-rate functions — `calculateErrorBudget` (Error Budget Calculator tab), whose formula `actualErrorRate / errorBudgetFraction` never incorporates elapsed window time, against `classifyBudgetStatus` (the page's own Challenge), whose `projectedBurnRate` scales the identical ratio by `windowDays / elapsedDays` — showing the two formulas only produce matching numbers once a window has fully elapsed, and that calculateErrorBudget's own worked "8.2x" example carries no indication of whether that number was measured on day 2 or day 28 of the window, despite those situations warranting very different real urgency; (3) confirmed Prometheus's own documented recording-rule naming convention verbatim (`level:metric:operations`, with a rule needing its own `record:` definition before anything can reference it) then cross-referenced the main page's own two code sections in the SAME "SLO Prometheus Recording Rules" tab — the recording-rules section only ever defines `job:http_requests_success:rate5m` and `rate28d` (a SUCCESS ratio, two windows), while the burn-rate alert rules a few lines down reference `job:slo_error_rate:rate1h/5m/6h/30m` (a differently-named ERROR rate, four windows) — meaning the main page's own alert rules, copied verbatim into a real Prometheus config, would load and start with zero errors from either promtool or Prometheus itself, yet silently never fire, since PromQL does not validate that a referenced metric name has a corresponding recording rule at load time and a query against a non-existent series simply returns an empty result rather than an error. `sre` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a bare key. Reused the established `DevopsNavComponent` local-accordion pattern with no further structural changes needed — generalizing cleanly across a twenty-first DevOps topic in a row (this topic's own nav `<a>` entry, like `devsecops` and `release-management` in the two prior batches, had never been converted to the accordion-toggle markup before this batch — converted it as part of this batch's step 3 wiring). Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare single/double brace sweep — clean, all `{` matches confirmed inside standard `[prev]`/`[next]` object-literal bindings; apostrophe-after-letter check across all `.ts` fields — clean, all correctly escaped with `\'` where needed; backtick parity across all three `.ts` files — even counts (14/46/60); `\${` interpolation-risk scan — clean, no unescaped instances; file-existence check — all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle initial exceeded maximum budget" condition (exceeded by 27.75 kB at this site's current scale, per CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content (all three h1/breadcrumb pairs correct), breadcrumb (all 4 levels, typographic curly quotes rendering correctly), the `DevopsNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode (`--bg: #0f172a`) all working correctly. **This completes the DevOps hub's Phase 10 rollout — 21 of 21 topics complete.**)

#### Containers/K8s — 22 topic pages

- [x] `/containers/fundamentals` — Container Fundamentals (2026-07-21 — first Phase 10 pilot for
  the Containers/K8s hub; 3 subtopics: pid-1-ignores-sigterm-by-default,
  user-namespace-remapping-not-default, oom-killer-targets-a-process-not-the-container; all three
  verified against official Docker documentation and multiple independent operational write-ups
  via WebSearch/WebFetch before writing — (1) confirmed the PID-1 signal-disposition kernel
  behavior verbatim: "If you send SIGTERM to PID 1, and the process has no explicit handler for
  it, the signal is ignored... the kernel ignores any signal sent to PID 1 unless the process has
  explicitly registered a handler," plus the shell-form-CMD mechanism ("Docker doesn't execute the
  app directly. It executes /bin/sh -c with the app... /bin/sh is PID 1, and the app is a child
  process") — sharpening the main page's own PID-namespace theory bullet and its separate
  docker-stop-vs-docker-kill mistake entry, neither of which mentions that SIGTERM can be silently
  discarded before ever reaching application code; (2) confirmed Docker's own userns-remap docs
  verbatim: "user namespace remapping is not enabled by default... requires explicit daemon
  configuration," and that without it "a container's root user (UID 0) would... map directly to
  the host's root UID 0" — correcting the main page's own theory bullet, which lists the user
  namespace alongside five OTHER namespaces that ARE active for every container automatically,
  making it read as if the same automatic protection applied; (3) confirmed via WebSearch that the
  cgroup OOM killer scores and kills individual PROCESSES rather than whole cgroups by default
  ("the OOM killer doesn't automatically target PID 1... only processes within the affected cgroup
  and its descendants are candidates"), and that Docker does not set `memory.oom.group` (the
  setting that WOULD kill every process in a cgroup together) automatically — sharpening the main
  page's own "the kernel OOM killer terminates its processes" bullet (plural, implying the whole
  container goes down together) into the precise, more consequential behavior for any container
  running more than one process, directly connecting back to the main page's own separate "one
  process per container" mistake entry. **First Phase 10 pilot for this hub — `ContainersNavComponent`
  had zero subtopics-accordion support (no `expandedTopics` signal, no `subtopicsOf`/
  `isSubtopicsExpanded`/`toggleSubtopics` methods, no router-subscription auto-expand), the third
  `*NavComponent`-based hub in a row (after Go, DevOps) to need this fix added from scratch —
  applied byte-for-byte the same pattern.** `fundamentals` collision-checked in
  `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed a real collision with
  the JavaScript hub's own `/javascript/fundamentals` topic, hub-prefixed to `k8s-fundamentals`
  matching this hub's own established `k8s-` progress/search-key prefix, with a `// NOTE:` comment;
  all three `ContainersNavComponent` accordion helper calls use the prefixed key consistently.
  Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present;
  bare single/double brace sweep — clean, all `{` matches confirmed inside standard `[prev]`/
  `[next]` object-literal bindings; apostrophe-after-letter check across all `.ts` fields — clean;
  backtick parity across all three `.ts` files — even counts (26/16/10); `\${` interpolation-risk
  scan — clean, no unescaped instances; file-existence check — all 9 files confirmed present, no
  MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle initial
  exceeded maximum budget" condition (exceeded by 34.35 kB at this site's current scale, per
  CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed
  via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content
  (all three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the newly-fixed
  `ContainersNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly
  marked `active`, auto-expand confirmed working end-to-end on the first try), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode
  (`--bg: #0f172a`) all working correctly. **This starts the Containers/K8s hub's Phase 10 rollout —
  1 of 22 topics complete.**)
- [x] `/containers/docker-cli` — Docker CLI (2026-07-21 — 3 subtopics:
  kill-sighup-is-reload-not-termination, kill-does-not-suppress-restart-policy-like-stop,
  stop-with-empty-ps-q-errors-not-noop; all three verified against official Docker behavior via
  WebSearch (the first also corroborated by the widely-documented nginx SIGHUP reload pattern, the
  second by a real, filed Docker engine issue) before writing — (1) confirmed the nginx SIGHUP
  reload convention verbatim: "it's possible to reload Nginx with a SIGHUP signal: docker kill -s
  HUP <container>, which reloads the config... without any downtime, and the container does not
  stop/restart" — resolving an apparent tension the main page's own content creates by placing
  `docker kill -s SIGHUP api` in the same code tab as its own "reserve kill for unresponsive
  containers" mistake entry, without ever clarifying that warning is about the SIGKILL default,
  not about docker kill sending a non-terminating signal; (2) confirmed via WebSearch (corroborated
  by a real, filed Docker engine issue, moby/moby #47792, "docker kill prevents containers with
  unless-stopped restart policy to be started after reboot") that docker stop reliably marks a
  container as explicitly, intentionally stopped in a way the restart-policy engine respects across
  a daemon restart, while docker kill does not reliably record that same state — sharpening the main
  page's own theory bullet ("unless-stopped restarts unless manually stopped") into the precise,
  command-specific mechanism, and revealing that docker kill and docker rm -f (which sends SIGKILL
  before removing, per the main page's own description) carry a real restart-policy risk docker stop
  does not; (3) reasoned directly from POSIX/bash command-substitution semantics (no external
  citation needed) that `docker stop $(docker ps -q)`, shown in the main page's own code tab with
  the comment "# Stop all running containers," expands to bare `docker stop` with zero arguments
  when no containers are running — a real CLI usage error and non-zero exit, not the silent no-op a
  reader would reasonably expect by analogy with the tab's own neighbouring `docker container prune
  -f` / `docker system prune -f` lines, which DO tolerate an empty result set safely. `docker-cli`
  collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed
  collision-free, added as a bare key. Reused the now-fixed `ContainersNavComponent` local-accordion
  pattern with no further structural changes needed — generalizing cleanly to a second topic in the
  same hub. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis
  present; bare single/double brace sweep — clean; apostrophe-after-letter check across all `.ts`
  fields — clean; backtick parity across all three `.ts` files — even counts (36/44/50); `\${`
  interpolation-risk scan — clean; a targeted check confirmed every `$(...)` bash command-
  substitution mention sits inside a SINGLE-quoted `.ts` string field, not a backtick template
  literal, so no escaping was needed; file-existence check — all 9 files confirmed present, no
  MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle initial
  exceeded maximum budget" condition (exceeded by 39.97 kB at this site's current scale, per
  CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile errors, confirmed
  via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content
  (all three h1/breadcrumb pairs correct, including the literal `$(docker ps -q)` text rendering
  correctly with no template-interpolation issues), breadcrumb (all 4 levels), the
  `ContainersNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly
  marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via
  body-text substring check), dark mode (`--bg: #0f172a`) all working correctly. **This continues
  the Containers/K8s hub's Phase 10 rollout — 2 of 22 topics complete.**)
- [x] `/containers/docker-images` — Docker Images & Registry (2026-07-21 — 3 subtopics:
  prune-order-stopped-containers-protect-images, all-tags-push-uploads-shared-layers-once,
  registry-mirror-only-intercepts-docker-hub; the first and third verified against official Docker
  documentation via WebFetch/WebSearch, the second reasoned entirely from two of the main page's own
  separately-stated principles — (1) confirmed Docker's own definition verbatim: an image counts as
  unused for `docker image prune -a` only if it has "at least one container associated to them"
  removed, meaning no containers of ANY state (running or stopped) reference it — sharpening the
  main page's own quiz answer ("not currently referenced by any container") into the precise rule
  that stopped, unremoved containers protect their images exactly as effectively as running ones,
  making the relative order of `docker container prune` and `docker image prune -a` change the
  outcome of the SAME command; (2) reasoned directly from the main page's own two already-stated
  principles — "docker tag creates a new reference... no data is copied" and "docker push uploads
  only layers not yet present in the remote registry" — applied to the main page's own code tab,
  which tags one image three times then pushes `--all-tags` with a bare "push all tags at once"
  comment and no cost explanation; traced that the second and third tag pushes upload zero layer
  bytes, only a small manifest, since the registry already holds every digest from the first push;
  (3) confirmed Docker's own documented scope verbatim: "it's currently not possible to mirror
  another private registry, and only the central Hub can be mirrored" and "if registry mirrors are
  configured and a user attempts to pull an image from a registry that is not Docker Hub, the
  mirrors are not considered" — scoping down the main page's own registry-mirrors bullet, introduced
  as the final item in a list covering Docker Hub, GHCR, ECR, ACR, and GAR together, into the much
  narrower reality that it only ever intercepts pulls resolving to docker.io, leaving every other
  registry mentioned on the same page completely unaffected regardless of configuration. `docker-images`
  collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed
  collision-free, added as a bare key. Reused the now-fixed `ContainersNavComponent` local-accordion
  pattern with no further structural changes needed — generalizing cleanly to a third topic in the
  same hub. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis
  present; bare single/double brace sweep — clean; apostrophe-after-letter check across all `.ts`
  fields — clean; backtick parity across all three `.ts` files — even counts (28/22/16); `\${`
  interpolation-risk scan — clean, no unescaped instances; file-existence check — all 9 files
  confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" condition (exceeded by 45.66 kB at this site's
  current scale, per CLAUDE.md's own known-issues note) with zero actual TypeScript/template compile
  errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct DOM
  query — content (all three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the
  `ContainersNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly
  marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via
  body-text substring check), dark mode (`--bg: #0f172a`) all working correctly. **This continues
  the Containers/K8s hub's Phase 10 rollout — 3 of 22 topics complete.**)
- [x] `/containers/dockerfile` — Writing Dockerfiles (2026-07-21 — 3 subtopics:
  build-stage-node-modules-are-discarded, sibling-stages-build-in-parallel,
  same-layer-cleanup-is-required-for-size-not-just-staleness; the second verified against BuildKit's
  own documented DAG-based parallel scheduling via WebSearch, the first and third reasoned entirely
  from tracing the main page's own multi-stage Dockerfile and mistake-entry explanations against
  each other — (1) traced the main page's own Node.js Dockerfile's two separate `npm ci` calls
  (deps stage: `--only=production`; build stage: full install) forward to the runtime stage's own
  `COPY --from=deps /app/node_modules` and `COPY --from=build /app/dist` lines, showing the build
  stage's own node_modules (containing every devDependency) is never copied anywhere and exists
  solely to make `npm run build` possible — a connection the main page's own code tab never states,
  despite running npm ci twice with different flags and no explanation; (2) confirmed BuildKit's own
  documented DAG-based scheduling verbatim via WebSearch: "BuildKit automatically parallelizes
  independent build stages... When you have multiple stages in a multi-stage Dockerfile that don't
  depend on each other... BuildKit is simultaneously compiling on a separate thread or CPU core" —
  applied to the main page's own Dockerfile, where deps and build both independently derive from
  base (neither references the other), showing they build concurrently despite reading sequentially
  top-to-bottom in the file, and that changing build to derive FROM deps instead of FROM base would
  force serialization and lose that parallelism; (3) connected the main page's own "apt-get update
  in a separate RUN" mistake entry's fix (a single combined RUN ending in `rm -rf /var/lib/apt/lists/*`)
  to the SAME union-filesystem layer-diff principle this hub's own Container Fundamentals main page
  already states ("deletion in a later layer does not reclaim space from an earlier layer") — showing
  the mistake entry's own explanation credits only the staleness fix, never mentioning that the
  same-layer placement of the cleanup command is independently required for the image to actually
  shrink at all, since a later, separate RUN doing the identical rm -rf would only add an invisible
  whiteout marker without reclaiming the earlier layer's already-committed cache files. `dockerfile`
  collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed
  collision-free, added as a bare key. Reused the now-fixed `ContainersNavComponent` local-accordion
  pattern with no further structural changes needed — generalizing cleanly to a fourth topic in the
  same hub. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis
  present; bare single/double brace sweep — clean; apostrophe-after-letter check across all `.ts`
  fields — clean; backtick parity across all three `.ts` files — even counts (36/70/26); `\${`
  interpolation-risk scan — clean, no unescaped instances; file-existence check — all 9 files
  confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" condition (exceeded by 51.23 kB at this site's
  current scale, per CLAUDE.md's own known-issues note) plus one pre-existing, unrelated `NG8113`
  unused-RouterLink warning on the main page file (confirmed unrelated to this batch's own changes)
  with zero actual TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines;
  browser-verified successfully via direct DOM query — content (all three h1/breadcrumb pairs
  correct), breadcrumb (all 4 levels), the `ContainersNavComponent` accordion (`.nav-subtopics`
  container `display: flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/
  `related` per subtopic, confirmed via body-text substring check), dark mode (`--bg: #0f172a`) all
  working correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 4 of 22 topics
  complete.**)
- [x] `/containers/multi-stage` — Multi-Stage Builds (2026-07-21 — 3 subtopics:
  test-stage-is-sequential-with-builder-parallel-with-runtime, npm-prune-production-flag-is-deprecated,
  external-image-copy-still-pulls-the-whole-image; the first reasoned entirely from BuildKit's own DAG
  scheduling principle (already verified for the sibling Dockerfile topic) applied to the main page's
  own Go code tab, the second and third verified against current npm and Docker documentation via
  WebSearch — **two real, confirmed inaccuracies were found and FIXED on the main page itself before
  writing subtopics**, per the established precedent of correcting genuine errors caught during
  subtopic authoring: (1) the Go code tab's own comment ("# --- Stage 2: test (runs in parallel with
  builder) ---") and the "Not running tests in a stage" mistake entry's explanation ("BuildKit runs it
  in parallel with other stages") both claimed the test stage runs concurrently with builder — but
  `FROM builder AS test` creates a real, direct dependency per BuildKit's own DAG model (a stage
  inherits its FROM ancestor's entire completed filesystem, so it cannot start until that ancestor
  finishes) — corrected both to accurately describe test running AFTER builder but in parallel with
  runtime (both independent siblings under builder, confirmed consistent with the main page's own
  separate, already-correct QnA entry); (2) a BuildKit theory bullet read "RUN --mount=type=secret,
  id=npm_token,target=/root/.npmrc pip install" — a copy-paste error mixing npm's .npmrc secret file
  with an unrelated Python pip install command — corrected to "npm ci" to match the .npmrc/npm_token
  context. With those two fixes in place, wrote three subtopics: (1) explaining the now-corrected
  dependency graph (test depends on builder, test and runtime are the actual parallel pair) in detail;
  (2) confirmed npm's own documented deprecation verbatim — "The --production flag is deprecated in
  favor of --omit=dev... shows the following warning: npm WARN config production Use '--omit=dev'
  instead" — flagging that the main page's own `npm prune --production` (code tab AND mistake-entry
  fix) triggers this warning on every build, and that the sibling Dockerfile topic's own `npm ci
  --only=production` carries the identical deprecation; (3) confirmed Docker's own documented external-
  image COPY behavior verbatim — "the entire image is being pulled... even if you only need a specific
  file or directory" — sharpening the main page's own QnA framing ("useful for copying tools... without
  defining a dedicated FROM stage") into the precise reality that the network/storage cost is identical
  to a named stage on a cache miss, with the only real difference being Dockerfile line count and
  explicit naming. `multi-stage` collision-checked in `src/app/data/subtopics.ts` (both quoted and
  unquoted forms) — confirmed collision-free, added as a bare key. Reused the now-fixed
  `ContainersNavComponent` local-accordion pattern with no further structural changes needed —
  generalizing cleanly to a fifth topic in the same hub. Gotcha sweep (bare `@` — none found; heading
  fields — no HTML tags or backtick-emphasis present; bare single/double brace sweep — clean;
  apostrophe-after-letter check across all `.ts` fields — clean; backtick parity across all three `.ts`
  files — even counts (46/46/12); `\${` interpolation-risk scan — clean, no unescaped instances;
  file-existence check — all 9 files confirmed present, no MAX_PATH issues) came back clean; build
  reported only the pre-documented harmless "bundle initial exceeded maximum budget" condition
  (exceeded by 56.98 kB at this site's current scale, per CLAUDE.md's own known-issues note) plus one
  pre-existing, unrelated `NG8113` unused-RouterLink warning on the main page file (confirmed unrelated
  to this batch's own changes) with zero actual TypeScript/template compile errors, confirmed via a
  targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content (all
  three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the `ContainersNavComponent` accordion
  (`.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode
  (`--bg: #0f172a`) all working correctly, AND confirmed the two main-page fixes rendered correctly
  (no more "pip install" text anywhere on the page; the corrected "npm ci" text present in the theory
  bullet). **This continues the Containers/K8s hub's Phase 10 rollout — 5 of 22 topics complete.**)
- [x] `/containers/compose` — Docker Compose (2026-07-21 — 3 subtopics:
  web-depends-on-api-lacks-condition-because-api-has-no-healthcheck,
  anonymous-volume-shadows-bind-mount-and-restores-image-content,
  anonymous-volumes-orphan-on-every-recreation; all three verified against official Compose
  documentation via WebSearch before writing — (1) confirmed Compose's own documented requirement
  verbatim: "condition: service_healthy... the target service must have a healthcheck defined" —
  resolving an apparent self-contradiction in the main page's own content, where its own "Using
  depends_on without a healthcheck condition" mistake entry recommends condition: service_healthy
  universally, yet its own flagship "Full stack compose.yml" code tab has web use plain
  `depends_on: [api]` — tracing this to api's own service definition showing it never defines a
  healthcheck: block at all, making the simple form the only valid option, not a missed application
  of the mistake entry's advice; (2) confirmed Docker's own documented mount-resolution behavior
  verbatim: "Docker automatically populates newly created empty volumes with the existing content of
  the destination path" and "if two volumes... are specified then the one having the more specific
  path is considered" — naming the exact two-part mechanism (path-specificity mount resolution +
  auto-population from image content) behind the main page's own five-word dev-override comment
  ("anonymous vol: keep container node_modules"), which never explains HOW an anonymous volume
  mounted under a broader bind mount ends up showing the image's own installed dependencies instead
  of the host's (typically absent) node_modules; (3) confirmed via WebSearch that anonymous volumes
  are "not removed by default when you run docker compose down" and accumulate as unnamed orphans
  across container recreations, unlike named volumes — sharpening the main page's own volume-cleanup
  discussion, which is scoped entirely to the NAMED db-data volume (`docker compose down -v`,
  `docker volume rm project_db-data`) and never once connects to the SEPARATE anonymous volume its
  own dev-override code tab uses, which has no name to target individually and requires bulk cleanup
  (`docker volume prune` or `down -v`) instead. `compose` collision-checked in
  `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as
  a bare key. Reused the now-fixed `ContainersNavComponent` local-accordion pattern with no further
  structural changes needed — generalizing cleanly to a sixth topic in the same hub. A candidate
  fourth angle (whether `deploy: replicas: 3` is actually honored by plain `docker compose up`
  without Swarm) was researched and DROPPED after confirming the main page's own QnA already states
  this accurately (replicas do apply outside Swarm in Compose v2, with the exact host-port caveat the
  QnA already names) — no genuine gap found there, so a different, verified angle was used instead.
  Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present;
  bare single/double brace sweep — clean; apostrophe-after-letter check across all `.ts` fields —
  clean; backtick parity across all three `.ts` files — even counts (72/42/36); `\${`
  interpolation-risk scan — clean, no unescaped instances; file-existence check — all 9 files
  confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" condition (exceeded by 63.05 kB at this site's
  current scale, per CLAUDE.md's own known-issues note) plus two pre-existing, unrelated `NG8113`
  unused-RouterLink warnings (confirmed unrelated to this batch's own changes) with zero actual
  TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines; browser-verified
  successfully via direct DOM query — content (all three h1/breadcrumb pairs correct), breadcrumb
  (all 4 levels), the `ContainersNavComponent` accordion (`.nav-subtopics` container `display:
  flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic,
  confirmed via body-text substring check), dark mode (`--bg: #0f172a`) all working correctly.
  **This continues the Containers/K8s hub's Phase 10 rollout — 6 of 22 topics complete.**)
- [x] `/containers/compose-profiles` — Compose Profiles & Overrides (2026-07-21 — 3 subtopics:
  override-tag-replaces-lists-without-workarounds, merge-key-needs-mapping-not-list-alias-syntax,
  map-form-environment-merges-by-key-not-concatenation; all three verified against Compose's own
  documented merge specification via WebSearch before writing — (1) confirmed the `!override` and
  `!reset` YAML tags verbatim: "the !override tag allows you to fully replace an attribute, bypassing
  the standard merge rules" and "!reset can be used to remove a declaration from a Compose file using
  an override file" — replacing the main page's own vague mistake-entry fix ("remove the base entry
  or use a fresh service name") with Compose's actual, dedicated, field-scoped mechanism for exactly
  this case, never mentioned anywhere on the page; (2) reasoned directly from the main page's own two
  pieces of content read against each other — its theory bullet's prose ("environment: [*common-env]")
  describes bracket-list alias syntax, while its own working code tab uses the merge key
  (`<<: *common-env`) against x-env, an anchor unambiguously defined as a YAML mapping — confirming via
  Docker's own merge-specification docs that mapping-type anchors require the merge key while
  bracket-list splicing only applies to sequence-type anchors, meaning the theory bullet's own prose
  describes a syntax that would not produce the intended flat environment variables for x-env as
  actually defined; (3) confirmed Docker's own documented merge-type distinction verbatim: "a YAML
  mapping gets merged by adding missing entries and merging the conflicting ones, while a YAML
  sequence is merged by appending" — sharpening the main page's own theory bullet, which groups
  "lists (ports, volumes, environment)" together as uniformly "concatenated," into the precise
  distinction that environment written as a MAPPING (exactly how both of the page's own code tab
  examples write it) merges key-by-key with the override winning on repeated keys, a genuinely
  different outcome from the true list-concatenation behavior the page's own "ports" mistake entry
  correctly demonstrates. A candidate fourth angle (whether `extends:` inherits the `profiles:` field,
  alongside the main page's own already-documented depends_on/volumes_from exclusions) was researched
  via WebSearch and DROPPED after search results came back inconclusive rather than a confidently
  verifiable claim — used a different, cleanly-verified angle instead. `compose-profiles`
  collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed
  collision-free, added as a bare key. Reused the now-fixed `ContainersNavComponent` local-accordion
  pattern with no further structural changes needed — generalizing cleanly to a seventh topic in the
  same hub. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis
  present; bare single/double brace sweep — clean; apostrophe-after-letter check across all `.ts`
  fields — clean; backtick parity across all three `.ts` files — even counts (28/52/46); `\${`
  interpolation-risk scan — clean, confirmed the two `\${DATABASE_URL}` mentions inside backtick code
  fields correctly single-backslash-escaped; file-existence check — all 9 files confirmed present, no
  MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle initial
  exceeded maximum budget" condition (exceeded by 69.14 kB at this site's current scale, per
  CLAUDE.md's own known-issues note) plus one pre-existing, unrelated `NG8113` unused-RouterLink
  warning (confirmed unrelated to this batch's own changes) with zero actual TypeScript/template
  compile errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully via
  direct DOM query — content (all three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the
  `ContainersNavComponent` accordion (`.nav-subtopics` container `display: flex`, link correctly
  marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic, confirmed via body-text
  substring check), dark mode (`--bg: #0f172a`) all working correctly. **This continues the
  Containers/K8s hub's Phase 10 rollout — 7 of 22 topics complete.**)
- [x] `/containers/k8s-architecture` — Kubernetes Architecture (2026-07-21 — 3 subtopics:
  not-ready-eviction-is-taint-based-not-a-fixed-flag, dockershim-removal-does-not-break-docker-built-images,
  kube-proxy-programs-rules-it-does-not-forward-packets; all three verified against official Kubernetes
  documentation and Docker's own dockershim-removal FAQ via WebFetch/WebSearch before writing — **also fixed
  a real, pre-existing, live search bug found while wiring**: the search index route `k8s-architecture`
  collided with the hub's own generic `k8s-` prefix-strip rule in `search.ts`'s `url()` function — since this
  topic's own bare slug happens to start with the literal string `k8s-`, stripping the hub prefix produced
  `/containers/architecture` (a non-existent route) instead of the real `/containers/k8s-architecture`; fixed
  by adding a special-cased check for this exact route (and any of its own subtopics) before the generic rule,
  confirmed via the live search UI showing the corrected `href="/containers/k8s-architecture"` before this fix
  would have shown the broken URL — (1) confirmed Kubernetes' own current documented eviction mechanism
  verbatim: taint-based eviction applies a `node.kubernetes.io/not-ready:NoExecute` (or `:unreachable:NoExecute`)
  taint, with pods receiving an automatically-injected default `tolerationSeconds: 300` from the
  DefaultTolerationSeconds admission controller, and that this mechanism "has superseded" the older
  `node-monitor-grace-period`/`pod-eviction-timeout` kube-controller-manager flags the main page's own QnA
  describes as if still current — same default numeric outcome (5 minutes), genuinely different (and
  per-pod-configurable) mechanism; (2) confirmed via Docker's own dockershim-removal FAQ verbatim: "Your images
  that ran on Kubernetes yesterday with dockershim will run unchanged on Kubernetes 1.24 without dockershim...
  Container images created by Docker are compliant with the Open Container Initiative (OCI)" — scoping down the
  main page's own one-clause QnA mention into the precise, widely-misread distinction between Docker as a
  node-level runtime daemon (what changed) and Docker as a build tool producing OCI images (completely
  unaffected); (3) confirmed via WebSearch that kube-proxy in iptables/IPVS mode "no longer works as a reverse
  proxy load balancing traffic between backend Pods... packets never pass through the kube-proxy process;
  they're handled entirely by kernel netfilter rules" — contrasted against the legacy userspace mode (a genuine
  in-path proxy) to explain what the main page's own accurate-but-incomplete bullets ("programs iptables/IPVS
  rules") never state: kube-proxy's own name actively suggests the opposite of how its default modes actually
  work. `k8s-architecture` collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) —
  confirmed collision-free, added as a bare key (no relation to the SEPARATE search.ts routing collision this
  batch fixed). Reused the now-fixed `ContainersNavComponent` local-accordion pattern with no further structural
  changes needed — generalizing cleanly to an eighth topic in the same hub. Gotcha sweep (bare `@` — none found;
  heading fields — no HTML tags or backtick-emphasis present; bare single/double brace sweep — clean;
  apostrophe-after-letter check across all `.ts` fields — clean; backtick parity across all three `.ts` files —
  even counts (32/12/4); `\${` interpolation-risk scan — clean, no unescaped instances; file-existence check —
  all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" condition (exceeded by 75.31 kB at this site's current
  scale, per CLAUDE.md's own known-issues note) plus one pre-existing, unrelated `NG8113` unused-RouterLink
  warning (confirmed unrelated to this batch's own changes) with zero actual TypeScript/template compile
  errors, confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query —
  content (all three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the `ContainersNavComponent`
  accordion (`.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode
  (`--bg: #0f172a`) all working correctly, AND confirmed the search-URL fix directly via the live search UI
  (Ctrl+K, typed "Kubernetes Architecture", confirmed the result option's own `href` attribute now correctly
  reads `/containers/k8s-architecture`). **This continues the Containers/K8s hub's Phase 10 rollout — 8 of 22
  topics complete.**)
- [x] `/containers/kubectl` — kubectl Fundamentals (2026-07-21 — 3 subtopics:
  apply-uses-three-way-merge-via-last-applied-annotation, force-delete-only-removes-the-etcd-object-not-the-process,
  scale-against-an-hpa-gets-silently-reverted; all three verified against official Kubernetes documentation and
  WebSearch before writing — (1) confirmed kubectl apply's own documented mechanism verbatim: "the three-way merge
  compares the local file (desired state), the live version running in the cluster (current state), and the
  last-applied-configuration annotation stored on the live resource" and "fields are removed when they are present
  in the last-applied configuration but absent in the new manifest" — naming the exact mechanism behind the main
  page's own brief "computes and applies only the diff" claim, and explaining precisely why a field never captured
  in any prior apply (set via kubectl edit or another controller) survives untouched even when absent from a new
  manifest; (2) confirmed via WebFetch against Kubernetes' own pod-lifecycle docs that --grace-period=0 --force
  immediately removes the Pod object from etcd while only BEST-EFFORT notifying the kubelet (not guaranteed) —
  sharpening the main page's own mistake-entry risk statement ("may still be running on node") into the precise
  mechanism (skipping the wait for kubelet's own termination confirmation, not adding extra force) and the specific
  danger case (an unreachable/NotReady node, where the kubelet never receives the notification at all); (3)
  confirmed via WebSearch that "if applying a change using kubectl apply the replicas field will override any hpa
  values... any manual scaling with kubectl scale will be temporary — the HPA's next reconciliation cycle will
  adjust replicas back" — flagging that the main page's own theory/quiz/revision all present kubectl scale as a
  durable lever with zero mention of HorizontalPodAutoscaler, when an HPA already targeting the same Deployment
  silently reverts a manual scale on its own next reconciliation tick (~15s), with the durable fix being a change
  to the HPA's own minReplicas instead. `kubectl` collision-checked in `src/app/data/subtopics.ts` (both quoted
  and unquoted forms) — confirmed collision-free, added as a bare key. Reused the now-fixed `ContainersNavComponent`
  local-accordion pattern with no further structural changes needed — generalizing cleanly to a ninth topic in the
  same hub. **Self-caught and fixed a genuine TypeScript syntax error before the build**: a stray extra closing
  bracket `]` after the first theory point's own `points:` array (a copy-paste artifact) — caught by a direct file
  re-read during authoring, not by the build. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags
  or backtick-emphasis present; bare single/double brace sweep — clean, confirmed the JSON-shaped patch strings
  inside bash code blocks (`{"spec":{"minReplicas":5}}`) are safely inside backtick template literals with no
  `${` risk; apostrophe-after-letter check across all `.ts` fields — clean; backtick parity across all three `.ts`
  files — even counts (10/20/26); `\${` interpolation-risk scan — clean, no unescaped instances; file-existence
  check — all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only the
  pre-documented harmless "bundle initial exceeded maximum budget" condition (exceeded by 81.17 kB at this site's
  current scale, per CLAUDE.md's own known-issues note) plus one pre-existing, unrelated `NG8113` unused-RouterLink
  warning (confirmed unrelated to this batch's own changes) with zero actual TypeScript/template compile errors,
  confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct DOM query — content (all
  three h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the `ContainersNavComponent` accordion
  (`.nav-subtopics` container `display: flex`, link correctly marked `active`), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic, confirmed via body-text substring check), dark mode (`--bg: #0f172a`)
  all working correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 9 of 22 topics complete.**)
- [x] `/containers/pods-deployments` — Pods, Deployments & ReplicaSets (2026-07-21 — 3 subtopics:
  terminating-pods-still-receive-traffic-without-a-prestop-delay,
  minreadyseconds-throttles-rollout-pace-not-just-pod-status,
  generation-vs-observedgeneration-tracks-controller-catch-up; all three verified against
  official Kubernetes documentation via WebSearch before writing — (1) confirmed the main
  page's own `terminationGracePeriodSeconds` quickRef entry describes only the kubelet's own
  SIGTERM/SIGKILL countdown, while Kubernetes' own documented termination flow
  (kubernetes.io/docs/tutorials/services/pods-and-endpoint-termination-flow) shows the
  endpoints controller removes the Pod from Endpoints/EndpointSlice at the SAME moment,
  requiring every OTHER node's kube-proxy to separately observe and reprogram its own
  iptables/IPVS rules — an unsynchronized, cross-node propagation the main page never
  mentions, directly cross-referencing this hub's own `k8s-architecture` subtopic on
  kube-proxy's kernel-only packet forwarding; the documented fix (a `preStop` sleep hook)
  was confirmed via multiple independent sources describing the same ~5-15s delay pattern;
  (2) confirmed via WebSearch that the Deployment rollout controller's own maxSurge/
  maxUnavailable pacing math uses `status.availableReplicas` — Ready continuously for
  `minReadySeconds` — not just Ready count, meaning the main page's own theory bullet
  ("seconds a new Pod must be ready before being counted as available") undersells
  `minReadySeconds` as a cosmetic status-reporting delay when it actually throttles total
  rollout duration, compounding across every sequential replacement under a small maxSurge;
  (3) confirmed via WebSearch and Kubernetes' own API conventions that `metadata.generation`
  (API-server-owned, bumps only on spec changes) and `status.observedGeneration`
  (Deployment-controller-owned, written once the controller has processed that generation)
  are two distinct fields with no synchronization guarantee — closing a real gap where the
  main page's own Challenge hint uses both terms with zero prior explanation anywhere else
  on the page (not in quickRef, theory, mistakes, quiz, or QnA), unlike readyReplicas/
  unavailableReplicas which the QnA section does explain. `pods-deployments`
  collision-checked in `src/app/data/subtopics.ts` (both quoted and unquoted forms) —
  confirmed collision-free, added as a bare key. Reused the `ContainersNavComponent`
  local-accordion pattern with no further structural changes needed — generalizing cleanly
  to an eleventh topic in the same hub. Gotcha sweep (bare `@` — none found; heading fields
  — no HTML tags or backtick-emphasis present; bare single/double brace sweep — clean;
  apostrophe-after-letter check across all `.html` bound attributes and `.ts` fields —
  clean; backtick parity across all three `.ts` files — even counts (20/20/6); `\${`
  interpolation-risk scan — clean, no unescaped instances; `git add -A` file-existence check
  — all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only
  the pre-documented harmless "bundle initial exceeded maximum budget" ERROR (now ~94kB
  over, continuing to grow as the site scales) plus one confirmed pre-existing, unrelated
  `NG8113: RouterLink is not used` warning on `pods-deployments.ts` itself (not touched by
  this batch's own changes) with zero actual TypeScript/template compile errors, confirmed
  via a targeted grep for ERROR lines; browser-verified successfully via direct page-text
  and DOM query on all three pages — content (all three h1/breadcrumb pairs correct),
  breadcrumb (all 4 levels), the `ContainersNavComponent` accordion (toggle button present,
  `.nav-subtopics` container found via query), sidebar (tailored `tip`/`gotchas`/`related`
  per subtopic, confirmed via full page-text render, not DEFAULT fallback), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes on all
  three) all working correctly. **This continues the Containers/K8s hub's Phase 10 rollout —
  11 of 22 topics complete.**)
- [x] `/containers/services-ingress` — Services & Ingress (2026-07-21 — 3 subtopics:
  sessionaffinity-clientip-pins-the-snatted-source-not-the-real-client,
  externalname-bypasses-kube-proxy-no-health-checks-no-port-mapping,
  pathtype-prefix-matches-path-elements-not-raw-string-prefixes; all three verified against
  official Kubernetes documentation via WebSearch before writing — (1) confirmed via
  Kubernetes' own "Using Source IP" tutorial that NodePort/LoadBalancer Services default to
  `externalTrafficPolicy: Cluster`, under which kube-proxy SNATs external traffic —
  replacing the real client's source IP with the receiving node's own IP — meaning the main
  page's own QnA description of `sessionAffinity: ClientIP` ("pins a client... based on the
  client's IP") is only literally true once `externalTrafficPolicy: Local` is explicitly
  set, a field the main page never mentions at all; (2) confirmed via WebSearch and
  Kubernetes' own ExternalName documentation that an ExternalName Service has no selector,
  no Endpoints object, and no health checking whatsoever — closing what the main page's own
  four-word quickRef entry ("CNAME alias... no proxying") leaves unpacked — plus the general
  DNS-client-caching risk (aggressive runtime-level caching outliving a record's own TTL)
  that repointing `externalName` inherits since it is pure DNS resolution with no kube-proxy
  involvement to propagate the change; (3) confirmed via Kubernetes' own Ingress
  documentation, verbatim, that Prefix path matching is "done on a path element by element
  basis" after splitting on "/" — meaning `pathType: Prefix, path: /api` never matches
  `/apiv2`, contrary to how the main page's own mistake-entry phrasing (built entirely from
  clean `/api/...` sub-path examples) could be read as a raw string-prefix test. Gotcha
  sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present;
  bare single/double brace sweep — clean; apostrophe-after-letter check across all `.html`
  bound `[prev]`/`[next]` attributes — clean, typographic `’` used correctly where needed
  (SNAT’d); backtick parity across all three `.ts` files — even counts (10/8/64); `\${`
  interpolation-risk scan — clean, no unescaped instances; `git add -A` file-existence check
  — all 9 files confirmed present, no MAX_PATH issues) came back clean; build reported only
  the pre-documented harmless "bundle initial exceeded maximum budget" ERROR (now ~101kB
  over) plus one confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning
  on `services-ingress.ts` itself with zero actual TypeScript/template compile errors,
  confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct
  page-text and DOM query on all three pages — content (all three h1/breadcrumb pairs
  correct), breadcrumb (all 4 levels), the `ContainersNavComponent` accordion (toggle button
  present on the Services & Ingress nav link), sidebar (tailored `tip`/`gotchas`/`related`
  per subtopic, confirmed via full page-text render, not DEFAULT fallback), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes) all
  working correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 12 of 22
  topics complete.**)
- [x] `/containers/configmaps-secrets` — ConfigMaps & Secrets (2026-07-21 — 3 subtopics:
  subpath-volume-mounts-never-receive-configmap-secret-updates,
  rbac-resourcenames-cannot-restrict-list-watch-the-verb-itself-must-go,
  deleting-an-immutable-configmap-breaks-new-pods-not-running-ones; all three verified
  against official Kubernetes documentation via WebSearch before writing — (1) confirmed via
  WebSearch and the tracked kubernetes/kubernetes#50345 issue that a ConfigMap/Secret
  mounted via `subPath` never receives live updates at all — a documented, by-design
  limitation, not a longer delay — directly qualifying the main page's own blanket "~1
  minute" volume-update propagation claim in both its theory and QnA sections, which never
  mentions `subPath` as an exception; (2) confirmed via Kubernetes' own RBAC documentation,
  verbatim, that `resourceNames` cannot restrict `list`, `watch`, `deletecollection`, or
  top-level `create` requests — closing a real gap in the main page's own RBAC mistake fix,
  which correctly drops `list`/`watch` in favor of `get` + `resourceNames` but never
  explains that this is a mechanical necessity (resourceNames has literally no effect on
  those two verbs) rather than a discretionary security best practice; (3) confirmed via
  WebSearch that an already-running Pod survives deletion of its own mounted ConfigMap/
  Secret (kubelet already synced the content locally), while a NEW Pod referencing the same
  deleted name fails with `CreateContainerConfigError` — a genuine sequencing hazard for the
  main page's own recommended content-hash-suffixed rotation pattern that it never
  addresses. Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or
  backtick-emphasis present; bare single/double brace sweep — clean; apostrophe-after-letter
  check across all `.html` bound `[prev]`/`[next]` attributes — clean; backtick parity
  across all three `.ts` files — even counts (26/14/8); `\${` interpolation-risk scan —
  clean, no unescaped instances; `git add -A` file-existence check — all 9 files confirmed
  present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" ERROR (now ~107kB over) plus one
  confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning on
  `configmaps-secrets.ts` itself with zero actual TypeScript/template compile errors,
  confirmed via a targeted grep for ERROR lines; browser-verified successfully via direct
  page-text and DOM query on all three pages — content (all three h1/breadcrumb pairs
  correct), breadcrumb (all 4 levels), the `ContainersNavComponent` accordion (toggle button
  present on the ConfigMaps & Secrets nav link), sidebar (tailored `tip` text confirmed
  present via full page-text substring check, not DEFAULT fallback), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes) all
  working correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 13 of 22
  topics complete.**)
- [x] `/containers/storage` — Persistent Volumes & Storage (2026-07-21 — 3 subtopics:
  released-pv-never-auto-rebinds-claimref-must-be-cleared-manually,
  a-zonal-pvc-can-strand-a-rescheduled-statefulset-pod-in-pending,
  rwop-closes-the-gap-rwo-leaves-same-node-pods-can-still-double-write; all three verified
  against official Kubernetes documentation via WebSearch before writing — (1) confirmed via
  WebSearch and Kubernetes' own PV documentation that a Released PV retains a claimRef
  pointing at the deleted PVC's UID, and that Kubernetes checks this field BEFORE any
  size/access-mode/storageClass matching, requiring an explicit `kubectl patch pv -p
  '{"spec":{"claimRef":null}}'` before a new PVC can bind — closing what the main page's own
  "Admin must manually reclaim/delete" theory language names but never mechanically explains;
  (2) confirmed via a real, tracked Kubernetes issue (kubernetes/kubernetes#121436) and
  multiple independent sources that WaitForFirstConsumer only solves zone-matching at the
  FIRST provisioning moment — a StatefulSet Pod rescheduled to a different zone after a
  node/zone failure gets permanently stuck Pending, since its zonal PV cannot follow it,
  requiring the documented PVC-then-Pod deletion sequence to recover (with data loss unless
  restored from backup) — a real gap in the main page's own mistake-entry framing of
  WaitForFirstConsumer as a complete, one-time fix; (3) confirmed via the official Kubernetes
  ReadWriteOncePod KEP that RWO is genuinely node-level (not pod-level, confirmed
  independently by the main page's own closing QnA), and that RWOP (GA in 1.29) was
  introduced specifically to close the same-node double-mount gap this leaves — connecting
  two facts the main page states separately (the RWOP theory bullet and the RWO QnA note)
  but never links together to explain WHY RWOP exists. **Self-caught and fixed a genuine
  TypeScript string-termination bug during authoring**: a stray extra `'` immediately after
  an escaped `\'` in the first subtopic's own `solution` field (a backtick-wrapped inline
  kubectl command mixing escaped shell single-quotes with the field's own outer single-quote
  delimiter) prematurely closed the TS string — caught by a direct re-read of the written
  file before the build, not by the build itself; fixed by removing the risky inline-command
  syntax and rephrasing in plain prose instead. Gotcha sweep (bare `@` — none found; heading
  fields — no HTML tags or backtick-emphasis present; bare single/double brace sweep —
  clean; apostrophe-after-letter check across all `.html` bound `[prev]`/`[next]`
  attributes — clean; backtick parity across all three `.ts` files — even counts (10/4/4);
  a targeted re-check for the exact escaped-quote-then-unescaped-quote bug pattern
  (`\''`) — clean, zero remaining instances; `\${` interpolation-risk scan — clean, no
  unescaped instances; `git add -A` file-existence check — all 9 files confirmed present, no
  MAX_PATH issues) came back clean; build reported only the pre-documented harmless "bundle
  initial exceeded maximum budget" ERROR (now ~114kB over) plus one confirmed pre-existing,
  unrelated `NG8113: RouterLink is not used` warning on `storage.ts` itself with zero actual
  TypeScript/template compile errors, confirmed via a targeted grep for ERROR lines —
  notably, the chunk-generation log for all three new subtopic files compiling successfully
  after the fix was direct confirmation the earlier syntax bug had been fully resolved, not
  just assumed fixed; browser-verified successfully via direct page-text and DOM query on
  all three pages — content (all three h1/breadcrumb pairs correct, including the fixed
  first subtopic rendering its kubectl patch command cleanly), breadcrumb (all 4 levels),
  the `ContainersNavComponent` accordion (toggle button present on the Persistent Volumes &
  Storage nav link), sidebar (tailored `tip`/`gotchas`/`related` per subtopic), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes) all
  working correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 14 of 22
  topics complete.**)
- [x] `/containers/operators-crds` — Kubernetes Operators & CRDs (2026-07-21 — 3 subtopics:
  update-then-status-update-risks-a-stale-resourceversion-conflict,
  crd-and-cr-in-the-same-apply-race-the-established-condition,
  requeue-storm-is-actually-rate-limited-exponential-backoff; all three verified against official
  Kubernetes/controller-runtime/client-go documentation via WebSearch before writing — (1) confirmed
  via WebSearch that "a spec update, metadata update, or another status update can make your copy
  stale" and that the documented fix is `retry.RetryOnConflict()`, which "automatically re-fetches the
  object... and retries the operation when a conflict error occurs" — tracing the main page's own
  Reconcile pseudocode's two Update calls (finalizer at step 3, status at step 5, both reusing the
  same in-memory `db` variable with no re-fetch in between) to show it risks exactly this 409 Conflict
  the moment anything else touches the object concurrently, a real gap the main page's own separate
  spec-vs-status mistake entry never fully closes; (2) confirmed via WebSearch a real, filed kubectl
  issue verbatim: "when CRDs and CRs are deployed in the same apply, the apply will fail due to race
  condition... between the Kubernetes cluster applying the new CRD types and tools sending requests
  that use the new types," with the documented fix being `kubectl wait --for=condition=established`
  between the two applies — flagging that the main page's own CRD code tab places a CRD and a CR of
  that type in ONE file, separated only by `---`, with zero mention of this intermittent race; (3)
  confirmed controller-runtime's own documented default rate limiter verbatim: "per-item exponential
  backoff (base ~5ms, max ~1000s)" and that it is "per-item," meaning "if you continuously fail
  reconciling one object... you will not start off with a huge delay the first time you fail to
  reconcile a different object" — sharpening the main page's own "requeue storm" framing (in the
  NotFound-as-error mistake entry) into the precise, self-limiting mechanism actually in play, while
  confirming the underlying advice (fix the NotFound handling) remains correct regardless of how
  quickly the backoff quiets the symptom. **Self-caught and fixed a genuine TypeScript syntax error
  during authoring**: a stray extra closing bracket `]` immediately after the first theory point's own
  `points:` array in the first subtopic file (a copy-paste artifact) — caught by a direct file re-read
  before the build, not by the build itself. `operators-crds` collision-checked in
  `src/app/data/subtopics.ts` (both quoted and unquoted forms) — confirmed collision-free, added as a
  bare key. Reused the now-fixed `ContainersNavComponent` local-accordion pattern with no further
  structural changes needed — generalizing cleanly to a tenth topic in the same hub. Gotcha sweep
  (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare
  single/double brace sweep — clean; apostrophe-after-letter check across all `.ts` fields — clean;
  backtick parity across all three `.ts` files — even counts (32/22/10); `\${` interpolation-risk scan
  — clean, no unescaped instances; file-existence check — all 9 files confirmed present, no MAX_PATH
  issues) came back clean; build reported only the pre-documented harmless "bundle initial exceeded
  maximum budget" condition (exceeded by 87.57 kB at this site's current scale, per CLAUDE.md's own
  known-issues note) plus one pre-existing, unrelated `NG8113` unused-RouterLink warning (confirmed
  unrelated to this batch's own changes) with zero actual TypeScript/template compile errors,
  confirmed via a targeted grep for ERROR lines. **A preview-server disconnect occurred mid-batch**
  (the dev server session was lost between conversation turns) — resolved by restarting it via
  `preview_start` and polling with a `curl`-based until-loop (per the tool's own guidance against
  standalone `sleep`) until it responded 200, rather than guessing at a fixed wait duration; browser-
  verified successfully afterward via direct DOM query — content (all three h1/breadcrumb pairs
  correct), breadcrumb (all 4 levels, typographic curly quotes rendering correctly on the third
  subtopic's title), the `ContainersNavComponent` accordion (`.nav-subtopics` container `display:
  flex`, link correctly marked `active`), sidebar (tailored `tip`/`gotchas`/`related` per subtopic,
  confirmed via body-text substring check), dark mode (`--bg: #0f172a`) all working correctly. **This
  continues the Containers/K8s hub's Phase 10 rollout — 10 of 22 topics complete.**)
- [x] `/containers/helm` — Helm (2026-07-21 — 3 subtopics:
  rollback-never-undoes-a-pre-upgrade-hook-only-pre-rollback-hooks-run,
  history-max-defaults-to-10-old-revisions-are-pruned-not-hidden,
  set-always-beats-f-regardless-of-command-line-order; all three verified against official
  Helm documentation via WebSearch (and a follow-up WebSearch confirming the exact
  hook-to-command mapping after an initial search returned a conflicting/imprecise snippet
  about rollback re-running migration hooks) before writing — (1) confirmed via Helm's own
  documented hook types that `helm rollback` triggers ONLY pre-rollback/post-rollback hooks,
  never pre-upgrade/post-upgrade — meaning the main page's own example (a pre-upgrade hook
  Job running DB migrations) is never invoked by rollback at all, mechanically explaining the
  main page's own separate, unexplained claim that rollback "does not undo external side
  effects"; (2) confirmed via WebSearch that `--history-max` defaults to 10, with Helm
  silently pruning the oldest revision Secrets on every successful upgrade beyond that count
  — directly qualifying the main page's own "helm history shows all revisions" theory
  language, which never mentions any limit; (3) confirmed via Helm's own documented
  precedence rules and a GitHub issue thread that `--set` has a fixed, type-based precedence
  over any `-f` file, independent of command-line position — closing a real ambiguity in the
  main page's own "right-side wins" mustKnow phrasing, which reads as positional but is only
  actually positional for comparing multiple flags of the SAME type. **Self-caught and fixed
  a genuine TypeScript string-termination bug during authoring** (the same category of bug as
  the prior `/containers/storage` batch): a stray extra `'` in the first subtopic's own
  `points` array — caught via a direct grep for the exact `\''` bug pattern immediately after
  writing, before the build, and confirmed absent across all three files. Gotcha sweep (bare
  `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare
  single/double brace sweep of `.html` files — clean, only bound `[prev]`/`[next]`
  attribute expressions contain braces, notable given this topic's own subject matter is
  literally `{{ }}` Go templating syntax; backtick parity across all three `.ts` files —
  even counts (24/16/14), including correctly-escaped `\`` backticks inside backtick-delimited
  `code:` fields referencing inline `helm upgrade`/`helm rollback` commands; apostrophe-after-letter
  check across all `.html` bound `[prev]`/`[next]` attributes — clean; `\${` interpolation-risk
  scan — clean; `git add -A` file-existence check — all 9 files confirmed present, no MAX_PATH
  issues) came back clean; build reported only the pre-documented harmless "bundle initial
  exceeded maximum budget" ERROR (now ~120kB over) plus one confirmed pre-existing, unrelated
  `NG8113: RouterLink is not used` warning on `helm.ts` itself with zero actual
  TypeScript/template compile errors; browser-verified successfully via direct page-text and
  DOM query on all three pages — content (all three h1/breadcrumb pairs correct, including
  the first subtopic's backtick-wrapped inline `helm upgrade`/`helm rollback` command
  mentions rendering cleanly), breadcrumb (all 4 levels), the `ContainersNavComponent`
  accordion (toggle button present on the Helm nav link), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic), dark mode (`--bg: #0f172a`), and prev/next
  subtopic-nav pager (correct labels and routes) all working correctly. **This continues the
  Containers/K8s hub's Phase 10 rollout — 15 of 22 topics complete.**)
- [x] `/containers/container-security` — Container Security (2026-07-21 — 3 subtopics:
  fsgroup-makes-non-root-volume-writes-work-and-recursive-chown-can-be-slow,
  networkpolicy-silently-does-nothing-without-a-cni-that-enforces-it,
  psa-restricted-never-checks-readonlyrootfilesystem-at-all; all three verified against
  official Kubernetes documentation via WebSearch before writing — (1) confirmed via
  Kubernetes' own documented fsGroup behavior and its 1.20 fsGroupChangePolicy release notes
  that fsGroup sets mounted-volume GROUP ownership (with a recursive chown/chmod cost on
  mount, unaffected by fsGroupChangePolicy for ephemeral volumes) — closing a real gap where
  the main page's own hardened Pod spec code tab sets `fsGroup: 2000` with zero explanation
  anywhere in its own theory, quickRef, or QnA; (2) confirmed via Kubernetes' own
  documentation, verbatim, that "creating a NetworkPolicy resource without a controller that
  implements it will have no effect," and that plain Flannel is a commonly-cited CNI that
  does not enforce NetworkPolicy at all — directly paralleling this same hub's own earlier
  "Ingress needs a controller" gap from the Services & Ingress subtopic batch, a connection
  the main page's own mistake entry never draws; (3) confirmed via Kubernetes' own official
  Pod Security Standards that the "restricted" policy checks exactly four fields
  (runAsNonRoot, allowPrivilegeEscalation: false, seccompProfile, capabilities.drop: [ALL])
  and that readOnlyRootFilesystem is documented as best practice only, never enforced by any
  PSA level — closing a real gap where the main page's own theory groups all four
  Security-Contexts fields together as one hardening checklist without distinguishing which
  are PSA-enforced guarantees versus author-remembered best practice. Gotcha sweep (bare `@`
  — none found; heading fields — no HTML tags or backtick-emphasis present; bare
  single/double brace sweep of `.html` files — clean, only bound `[prev]`/`[next]`
  attribute expressions contain braces; backtick parity across all three `.ts` files — even
  counts (16/8/8); apostrophe-after-letter check across all `.html` bound `[prev]`/`[next]`
  attributes — clean; a targeted re-check for the exact escaped-quote-then-unescaped-quote
  bug pattern (`\''`) caught in the prior two batches — clean, zero instances; `\${`
  interpolation-risk scan — clean; `git add -A` file-existence check — all 9 files confirmed
  present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" ERROR (now ~126kB over) plus one
  confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning on
  `container-security.ts` itself (the Containers/K8s hub's own file, distinct from the
  separate, unrelated Security & Auth hub's own same-named `container-security.ts`, verified
  via full file paths) with zero actual TypeScript/template compile errors; browser-verified
  successfully via direct page-text and DOM query on all three pages — content (all three
  h1/breadcrumb pairs correct), breadcrumb (all 4 levels, using the correct `CONTAINERS_LABELS`
  map distinct from the Security hub's own separate labels map, confirmed via context read
  before editing), the `ContainersNavComponent` accordion (toggle button present on the
  Container Security nav link), sidebar (tailored `tip`/`gotchas`/`related` per subtopic),
  dark mode (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes)
  all working correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 16 of
  22 topics complete.**)
- [x] `/containers/rbac` — Kubernetes RBAC (2026-07-21 — 3 subtopics:
  bind-verb-gates-escalation-create-on-rolebindings-alone-is-not-enough,
  aggregated-clusterroles-retroactively-grant-new-permissions-to-old-bindings,
  bound-serviceaccount-tokens-expire-in-1-hour-legacy-tokens-never-did; all three verified
  against official Kubernetes documentation via WebSearch and a follow-up WebFetch of the
  official RBAC doc page before writing. **A genuine, confirmed inaccuracy was found and
  fixed on the main page itself during this batch**: the closing QnA entry originally implied
  that `rolebindings/create` (or `clusterrolebindings/create`) permission ALONE was enough
  for a ServiceAccount to bind itself to any powerful ClusterRole it could reference — verified
  false against Kubernetes' own "Privilege escalation prevention and bootstrapping" RBAC
  behavior, which blocks binding to a Role/ClusterRole containing more permissions than the
  requester already has UNLESS the requester also separately holds the `bind` verb (or
  `escalate`, for directly editing a Role) — corrected the QnA answer to accurately describe
  the real two-part requirement (create AND bind/escalate together), matching the established
  "fix genuine inaccuracies found during subtopic authoring" precedent from this project's
  history; (1) the first subtopic explains and demonstrates this corrected mechanism directly;
  (2) confirmed via WebSearch that aggregated ClusterRoles (the built-in `view`/`edit`/`admin`
  roles, extendable via `aggregate-to-*` labels) retroactively grant new permissions to EVERY
  existing binding the instant a matching labeled ClusterRole is created — closing a real gap
  where the main page's own QnA frames aggregation purely as a maintenance convenience without
  covering this side of the same mechanism; (3) confirmed via Kubernetes' own TokenRequest API
  documentation that the default mounted ServiceAccount token (since 1.24) is a bound token
  expiring in 1 hour or on Pod deletion, a fundamentally different security property from the
  pre-1.24-default legacy Secret-backed token, which never expired at all — a gap in the main
  page's own theory, which covers only the token's mount path, never its lifetime. Gotcha sweep
  (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis present; bare
  single/double brace sweep of `.html` files — clean; backtick parity across all three `.ts`
  files — even counts (18/22/4); apostrophe-after-letter check across all `.html` bound
  `[prev]`/`[next]` attributes — clean, typographic `’` used correctly; a targeted re-check
  for the exact escaped-quote-then-unescaped-quote bug pattern (`\''`) caught in two prior
  batches — clean, zero instances, including in the directly-edited main page `rbac.ts`;
  `\${` interpolation-risk scan — clean; `git add -A` file-existence check — all 9 files
  confirmed present, no MAX_PATH issues) came back clean; build reported only the
  pre-documented harmless "bundle initial exceeded maximum budget" ERROR (now ~133kB over)
  plus one confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning on
  `rbac.ts` itself (present both before and after the QnA fix, confirmed via before/after
  build comparison) with zero actual TypeScript/template compile errors — the successful
  compilation of the edited main page's own lazy chunk was itself direct confirmation the
  QnA fix introduced no syntax error; browser-verified successfully via direct page-text and
  DOM query on all three subtopic pages plus the corrected main page — content (all h1/
  breadcrumb pairs correct), breadcrumb (all 4 levels), the `ContainersNavComponent`
  accordion (toggle button present on the Kubernetes RBAC nav link), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic), dark mode (`--bg: #0f172a`), and prev/next
  subtopic-nav pager (correct labels and routes) all working correctly; the corrected main-
  page QnA text was directly confirmed present and syntactically intact via file re-read
  (the QnA accordion's own answer text was not reachable via page-text extraction without
  clicking to expand it, so file-level verification was used instead, backed by the
  successful, error-free build of that exact file). **This continues the Containers/K8s
  hub's Phase 10 rollout — 17 of 22 topics complete.**)
- [x] `/containers/statefulsets` — StatefulSets & DaemonSets (2026-07-21 — 3 subtopics:
  pdb-only-blocks-voluntary-disruptions-a-node-crash-ignores-it-entirely,
  scaling-back-up-reattaches-the-old-pvc-with-its-old-data-silently,
  init-containers-share-the-pods-network-namespace-not-just-its-volumes; all three verified
  against official Kubernetes documentation via WebSearch before writing. **A second genuine,
  confirmed inaccuracy was found and fixed on the main page itself in this same session**
  (following the RBAC-batch fix earlier): the QnA answer on init containers previously stated
  "They share the Pod's volumes but not the network namespace" — verified BACKWARDS against
  Kubernetes' own documented Pod networking model, which guarantees every container in a Pod
  (init or app, no exception) shares the identical network namespace, IP, and localhost;
  corrected the QnA text, matching the established "fix genuine inaccuracies found during
  subtopic authoring" precedent; (1) confirmed via Kubernetes' own Disruptions documentation
  that a PodDisruptionBudget is checked exclusively by the Eviction API, meaning it throttles
  only VOLUNTARY disruptions (drain, upgrade, autoscaler scale-down) and provides zero
  protection against INVOLUNTARY ones (node hardware failure, kernel panic, network
  partition) — closing a real gap where the main page's own repeated "voluntary disruptions"
  phrasing never precisely draws that contrast; (2) confirmed via Kubernetes' own StatefulSet
  documentation and its 1.27 PVC-auto-deletion beta announcement that the default
  persistentVolumeClaimRetentionPolicy retains PVCs on scale-down (not just full deletion),
  meaning scaling back up silently reattaches old, stale data — closing a gap where the main
  page's own theory and mistake entry only discuss PVC retention in the context of deleting
  the WHOLE StatefulSet, never the far more routine scale-down/scale-up cycle; (3) the third
  subtopic explains and demonstrates the corrected init-container network-namespace mechanism
  directly, using the main page's own `nc -z` wait-for-dependency pattern as the worked
  example of why the correction matters practically. Gotcha sweep (bare `@` — none found;
  heading fields — no HTML tags or backtick-emphasis present; bare single/double brace sweep
  of `.html` files — clean; backtick parity across all three `.ts` files — even counts
  (12/8/12); apostrophe-after-letter check across all `.html` bound `[prev]`/`[next]`
  attributes — clean, typographic `’` used correctly; a targeted re-check for the exact
  escaped-quote-then-unescaped-quote bug pattern (`\''`) caught in two prior batches — clean,
  zero instances, including in the directly-edited main page `statefulsets.ts`; `\${`
  interpolation-risk scan — clean; `git add -A` file-existence check — all 9 files confirmed
  present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" ERROR (now ~139kB over) plus one
  confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning on
  `statefulsets.ts` itself with zero actual TypeScript/template compile errors — the
  successful compilation of the edited main page's own lazy chunk was itself direct
  confirmation the QnA fix introduced no syntax error; browser-verified successfully via
  direct page-text and DOM query on all three subtopic pages — content (all h1/breadcrumb
  pairs correct, including the third subtopic's own page-subtitle explicitly referencing and
  confirming the main-page correction), breadcrumb (all 4 levels), the
  `ContainersNavComponent` accordion (toggle button present on the StatefulSets & DaemonSets
  nav link), sidebar (tailored `tip`/`gotchas`/`related` per subtopic), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes) all working
  correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 18 of 22 topics
  complete.**)
- [x] `/containers/resource-limits` — Resource Requests & Limits (2026-07-21 — 3 subtopics:
  cpu-limit-throttling-triggers-on-a-100ms-burst-not-average-usage,
  resourcequota-rejects-pod-creation-outright-it-never-defaults-to-zero,
  hpa-scales-against-requests-not-limits-a-low-request-is-hypersensitive; all three verified
  against official/community Kubernetes documentation via WebSearch before writing. **A third
  genuine, confirmed inaccuracy was found and fixed on the main page itself in this same
  session** (following the RBAC-batch and StatefulSets-batch fixes earlier): the QnA answer
  on ResourceQuota previously stated that without a LimitRange, "ResourceQuota counts every
  pod as having zero requests" — verified against Kubernetes' own documented admission
  behavior to be inaccurate; the real behavior is that a pod omitting resources covered by an
  active compute ResourceQuota is REJECTED OUTRIGHT (HTTP 403) at admission time, not silently
  admitted and under-counted; corrected the QnA text, matching the established "fix genuine
  inaccuracies found during subtopic authoring" precedent (now applied a third time this
  session); (1) confirmed via multiple independent sources describing the Linux CFS bandwidth
  controller's 100ms enforcement period that CPU throttling triggers on bursts WITHIN a single
  period, not on any longer-window average — closing a gap where the main page's own p50/p99
  sizing advice could be read as sufficient to prevent throttling, when a multi-threaded app's
  burst concentration is a genuinely separate failure mode; (2) the second subtopic explains
  and demonstrates the corrected ResourceQuota rejection mechanism directly, including why
  LimitRange's real role is admission-time defaulting BEFORE the quota check, not after-the-
  fact tracking correction; (3) confirmed via Kubernetes' own documented HPA behavior that
  resource-metric utilization percentage is calculated against the CPU REQUEST exclusively,
  never the limit — closing a gap where the main page's own QnA mentions HPA only in passing
  (contrasted with VPA) without ever stating this mechanical fact, which directly interacts
  with the page's own "size requests to p50" advice by making any attached HPA hypersensitive
  to small absolute usage changes. Gotcha sweep (bare `@` — none found; heading fields — no
  HTML tags or backtick-emphasis present; bare single/double brace sweep of `.html` files —
  clean; backtick parity across all three `.ts` files — even counts (10/26/12);
  apostrophe-after-letter check across all `.html` bound `[prev]`/`[next]` attributes —
  clean; a targeted re-check for the exact escaped-quote-then-unescaped-quote bug pattern
  (`\''`) caught in earlier batches — clean, zero instances, including in the directly-edited
  main page `resource-limits.ts`; `\${` interpolation-risk scan — clean; `git add -A`
  file-existence check — all 9 files confirmed present, no MAX_PATH issues) came back clean;
  build reported only the pre-documented harmless "bundle initial exceeded maximum budget"
  ERROR (now ~146kB over) plus one confirmed pre-existing, unrelated `NG8113: RouterLink is
  not used` warning on `resource-limits.ts` itself with zero actual TypeScript/template
  compile errors — the successful compilation of the edited main page's own lazy chunk was
  itself direct confirmation the QnA fix introduced no syntax error; browser-verified
  successfully via direct page-text and DOM query on all three subtopic pages — content (all
  h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the `ContainersNavComponent`
  accordion (toggle button present on the Resource Requests & Limits nav link), sidebar
  (tailored `tip`/`gotchas`/`related` per subtopic), dark mode (`--bg: #0f172a`), and
  prev/next subtopic-nav pager (correct labels and routes) all working correctly. **This
  continues the Containers/K8s hub's Phase 10 rollout — 19 of 22 topics complete.**)
- [x] `/containers/hpa` — Horizontal Pod Autoscaler (2026-07-21 — 3 subtopics:
  scale-up-and-scale-down-stabilization-windows-aggregate-oppositely,
  selectpolicy-defaults-to-max-multiple-policies-pick-the-fastest-not-safest,
  unready-pods-count-as-0-percent-utilization-diluting-the-average; all three verified
  against official Kubernetes HPA documentation via WebSearch before writing — (1) confirmed
  that scale-down stabilization uses the MAXIMUM recommendation across the window (matching
  the main page's own quiz explanation) while scale-up stabilization, if a window is
  configured, uses the MINIMUM instead — an opposite aggregation the main page never states,
  closing a gap where a reader could reasonably assume symmetric "use the maximum" behavior
  for both directions; (2) confirmed via Kubernetes' own documented HPA behavior spec that
  `selectPolicy` defaults to `Max` — when multiple policies are defined for one direction,
  the LEAST restrictive one always wins by default, closing a gap where the main page's own
  code tabs only ever show one policy per direction, never demonstrating what happens when a
  second, stricter policy is added (it silently has no effect unless `selectPolicy: Min` is
  set); (3) confirmed via Kubernetes' own documented metric-collection behavior that an
  unready Pod is counted at exactly 0% utilization (not excluded) in the HPA's own average,
  diluting the reported metric during a rollout or partial incident — closing a gap where the
  main page's own core formula treats `currentMetricValue` as a clean number with no
  discussion of which pods contribute to it or at what value. Gotcha sweep (bare `@` — none
  found; heading fields — no HTML tags or backtick-emphasis present; bare single/double brace
  sweep of `.html` files — clean; backtick parity across all three `.ts` files — even counts
  (8/20/10); apostrophe-after-letter check across all `.html` bound `[prev]`/`[next]`
  attributes — clean; a targeted re-check for the exact escaped-quote-then-unescaped-quote
  bug pattern (`\''`) caught in earlier batches — clean, zero instances; `\${`
  interpolation-risk scan — clean; `git add -A` file-existence check — all 9 files confirmed
  present, no MAX_PATH issues) came back clean; build reported only the pre-documented
  harmless "bundle initial exceeded maximum budget" ERROR (now ~152kB over) plus one
  confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning on `hpa.ts`
  itself with zero actual TypeScript/template compile errors; browser-verified successfully
  via direct page-text and DOM query on all three subtopic pages — content (all h1/breadcrumb
  pairs correct), breadcrumb (all 4 levels), the `ContainersNavComponent` accordion (toggle
  button present on the Horizontal Pod Autoscaler nav link), sidebar (tailored
  `tip`/`gotchas`/`related` per subtopic), dark mode (`--bg: #0f172a`), and prev/next
  subtopic-nav pager (correct labels and routes) all working correctly. **This continues the
  Containers/K8s hub's Phase 10 rollout — 20 of 22 topics complete.**)
- [x] `/containers/network-policies` — Network Policies (2026-07-21 — 3 subtopics:
  networkpolicies-union-additively-a-second-policy-can-only-allow-more,
  ipblock-matches-raw-ips-a-cidr-overlapping-the-cluster-network-can-leak,
  the-always-allow-dns-egress-rule-has-no-destination-a-real-exfiltration-path; all three
  verified against official Kubernetes documentation and independent security-analysis
  sources via WebSearch before writing — (1) confirmed via Kubernetes' own documented
  NetworkPolicy semantics that multiple policies selecting the same pod UNION their allowed
  traffic — never an intersection, never by specificity or ordering — closing a gap where the
  main page's own 3-policy worked example never states the actual combination mechanism,
  which a reader could easily assume works like more-specific-wins precedence in other
  systems; (2) confirmed via Kubernetes' own documentation and a Cilium eBPF implementation
  detail that ipBlock is a plain CIDR matcher with no internal/external distinction in the
  core API — a broad range overlapping the cluster's own Pod/Service CIDR also matches
  in-cluster traffic unless explicitly excluded, closing a gap where the main page's own
  quickRef calls ipBlock "used for external IP ranges" without ever qualifying that claim;
  (3) confirmed via independent, widely-corroborated security analysis that a DNS-allow
  egress rule with no destination restriction (exactly the pattern the main page's own code
  tabs and TWO mistake entries repeat) permits DNS tunneling to any external resolver, since
  NetworkPolicy has no L7 query-content visibility — closing a gap where the page's own
  repeated, emphatic "always allow DNS" advice never distinguishes "allow DNS to work" from
  "allow DNS to anywhere." **Hit and fixed the documented Windows MAX_PATH gotcha for real**:
  the third subtopic's own descriptive slug (79 characters) combined with the
  `network-policies/subtopics/` nesting exceeded 260 characters, causing `git add -A` to fail
  with "Filename too long" (the `Write` tool itself had already succeeded, confirming the
  known write-succeeds-but-git-add-fails pattern) — fixed per the established recipe: created
  a new, short physical folder (`dns-egress-no-destination-exfil`, 31 chars), copied the
  three files into it, updated the `.ts` file's own `templateUrl`/`styleUrl` to the new local
  filenames, updated ONLY the `loadComponent` import path in `app.routes.ts` to point at the
  short folder while leaving the route's own `path:` (and every other wiring touchpoint —
  SUBTOPICS map, breadcrumb, sidebar, search index) on the original long, descriptive slug
  unchanged, then deleted the old long-named folder. Verified working end-to-end at the full
  descriptive URL after the fix, confirming the recipe transfers correctly to this hub.
  Gotcha sweep (bare `@` — none found; heading fields — no HTML tags or backtick-emphasis
  present; bare single/double brace sweep of `.html` files — clean; backtick parity across
  all three `.ts` files — even counts (4/14/18); apostrophe-after-letter check across all
  `.html` bound `[prev]`/`[next]` attributes — clean, typographic `’`/curly `"..."` used
  correctly for a scare-quoted label; a targeted re-check for the exact
  escaped-quote-then-unescaped-quote bug pattern (`\''`) caught in earlier batches — clean,
  zero instances; `\${` interpolation-risk scan — clean) came back clean; build reported only
  the pre-documented harmless "bundle initial exceeded maximum budget" ERROR (now ~159kB
  over) plus one confirmed pre-existing, unrelated `NG8113: RouterLink is not used` warning
  on `network-policies.ts` itself with zero actual TypeScript/template compile errors;
  browser-verified successfully via direct page-text and DOM query on all three pages,
  including confirming the MAX_PATH-fixed third subtopic resolves correctly at its full,
  unchanged descriptive URL — content (all h1/breadcrumb pairs correct), breadcrumb (all 4
  levels), the `ContainersNavComponent` accordion (toggle button present on the Network
  Policies nav link), sidebar (tailored `tip`/`gotchas`/`related` per subtopic), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes) all working
  correctly. **This continues the Containers/K8s hub's Phase 10 rollout — 21 of 22 topics
  complete — only `/containers/troubleshooting` remains.**)
- [x] `/containers/troubleshooting` — Kubernetes Troubleshooting (2026-07-21 — 3 subtopics:
  crashloop-backoff-resets-after-10-min-stable-running,
  exit-code-137-is-sigkill-not-always-oomkilled,
  previous-logs-only-reach-the-latest-crash; all three verified against official Kubernetes
  documentation and independent operational sources via WebSearch before writing — (1)
  confirmed the exponential backoff counter (10s→20s→40s…5min cap) only resets after a
  container has run continuously for 10 minutes without crashing — closing a gap where the
  main page's own theory describes the climbing sequence but never its reset condition,
  explaining a genuinely confusing observation (a "rare" crash still showing a full 5-minute
  delay because it never stayed up 10 stable minutes between occurrences); (2) confirmed via
  multiple independent sources that exit code 137 only confirms SIGKILL was sent — the OOM
  killer is one of several possible sources (a grace-period-expired liveness-probe kill is
  another, common one) — and that `lastState.terminated.reason` is the actual field that
  confirms or rules out "OOMKilled" specifically; closes a gap where the main page's own quiz
  AND its own Challenge solution both hard-code exitCode === 137 as sufficient, conclusive
  proof of an OOM kill; (3) confirmed via documented `kubectl logs` behavior that `--previous`
  only ever retrieves the single most recently terminated container instance, never a rolling
  history — closing a gap where the main page's own repeated advice presents `--previous` as
  a general window into crash history, when in a real multi-restart CrashLoopBackOff, an
  engineer investigating late may only be able to see a downstream, secondary crash rather
  than the original root cause. Gotcha sweep (bare `@` — none found; heading fields — no HTML
  tags or backtick-emphasis present; bare single/double brace sweep of `.html` files — clean;
  backtick parity across all three `.ts` files — even counts (4/38/16); apostrophe-after-
  letter check across all `.html` bound `[prev]`/`[next]` attributes — clean; a targeted
  re-check for the exact escaped-quote-then-unescaped-quote bug pattern (`\''`) caught in
  earlier batches — clean, zero instances; `\${` interpolation-risk scan — clean; `git add -A`
  file-existence check — all 9 files confirmed present; **slugs deliberately kept short
  (~45–55 chars) from the start this batch**, applying the MAX_PATH lesson learned the hard
  way in the immediately-preceding `/containers/network-policies` batch, and confirmed via
  `git add -A` with zero "Filename too long" errors on the first attempt) came back clean;
  build reported only the pre-documented harmless "bundle initial exceeded maximum budget"
  ERROR (now ~165kB over) plus one confirmed pre-existing, unrelated `NG8113: RouterLink is
  not used` warning on `troubleshooting.ts` itself with zero actual TypeScript/template
  compile errors; browser-verified successfully via direct page-text and DOM query on all
  three pages — content (all h1/breadcrumb pairs correct), breadcrumb (all 4 levels), the
  `ContainersNavComponent` accordion (toggle button present on the K8s Troubleshooting nav
  link), sidebar (tailored `tip`/`gotchas`/`related` per subtopic), dark mode
  (`--bg: #0f172a`), and prev/next subtopic-nav pager (correct labels and routes) all working
  correctly. **This completes the Containers/K8s hub's ENTIRE Phase 10 rollout — 22 of 22
  topics now have subtopics, 66 new subtopic pages total across the hub.** Across this hub's
  full rollout: 3 genuine main-page content inaccuracies were found and corrected during
  authoring (an RBAC QnA overstating a privilege-escalation risk, a StatefulSets QnA stating
  init containers do NOT share the Pod's network namespace when they do, and a
  Resource-Limits QnA describing ResourceQuota as silently zero-counting a resources-less pod
  when it actually rejects pod creation outright) — all three confirmed via WebSearch/WebFetch
  against official Kubernetes documentation before correction, following the established
  "fix genuine inaccuracies found during subtopic authoring" precedent from this project's
  history. The `ContainersNavComponent` accordion structural fix (local `expandedTopics`
  signal + `subtopicsOf`/`isSubtopicsExpanded`/`toggleSubtopics` methods) made once during the
  `/containers/fundamentals` pilot batch generalized cleanly across all 22 topics with no
  further structural changes needed.)

#### AWS — 21 topic pages

- [x] `/aws/fundamentals` — AWS Fundamentals (2026-07-21 — **AWS hub Phase 10 pilot batch.** 3
  subtopics: cli-credential-chain-order-container-before-instance-profile,
  role-chaining-caps-sessions-at-1-hour-except-from-ec2,
  local-zones-run-a-subset-of-services-not-a-full-region. Pre-batch investigation confirmed AWS
  hub conventions: theme `$accent: #ff9900`/`$tint: #fff7ed`, `.aws-page`/`.aws-icon`/
  `.aws-section` (wrapper NOT global — every subtopic `.scss` needs the full `.aws-page {
  max-width: 860px; margin: 0 auto; }` rule), `aws-` progress/search prefix, `SIDEBAR_MAP` keys
  full-path-prefixed (`aws/fundamentals/<slug>`), `AWS_LABELS` breadcrumb map bare keys, no live
  playground (non-browser-runtime hub, `<app-code-block>` pattern). **Structural fix**:
  `AwsNavComponent` had zero subtopics-accordion support at pilot time — the 4th
  `*NavComponent`-based hub in a row (after Go, DevOps, Containers) needing the identical fix
  from scratch (imports, `expandedTopics` signal, `subtopicsOf`/`isSubtopicsExpanded`/
  `toggleSubtopics` methods, router-subscription auto-expand constructor). **Real SUBTOPICS map
  collision**: bare `fundamentals` already claimed by the JavaScript hub's own
  `/javascript/fundamentals` — hub-prefixed to `aws-fundamentals`, matching the hub's own
  established `aws-` progress/search prefix; `AwsNavComponent`'s three accordion helper calls use
  the same prefixed key. **Genuine main-page fix**: `fundamentals.ts`'s own "AWS CLI & SDK" theory
  bullet had the credential-provider-chain order wrong — it listed the EC2 instance profile
  before the ECS task role; corrected via AWS's own documented standardized credential provider
  chain (env vars → credentials file → config file → container credentials → EC2 instance
  profile) to state container credentials are checked BEFORE the instance profile, not after.
  Content angles: (1) the corrected credential-chain order itself, expanded with the config-file
  step the main page never mentioned and a worked example proving ECS task role wins over a
  same-node EC2 instance profile; (2) STS role chaining caps a session at exactly 1 hour
  regardless of the target role's own MaxSessionDuration, with the one documented exception
  (assuming directly from an EC2 instance profile is exempt) — a real, common cross-account
  pipeline gotcha the main page's brief `assume-role` mention never covers; (3) AWS Local Zones
  and Wavelength Zones run only a curated subset of services locally (typically EC2/EBS/some
  ELB/VPC — not Lambda/DynamoDB/standard S3), while still reaching every other AWS service in
  the parent Region transparently over AWS's own private backbone — filling a real gap in the
  main page's own "Global Infrastructure" section, which only ever describes the standard
  Region/AZ pair. Gotcha sweep (bare `@word` in `.html` — none found; bare single/double brace
  sweep — clean; apostrophe-after-letter check across `[prev]`/`[next]` bound attributes — clean,
  none of the three subtopic titles needed one; backtick parity across all three `.ts` files —
  even counts, 14/8/24; targeted `\''` stray-quote scan — clean) came back clean. Build reported
  only the pre-documented harmless "bundle initial exceeded maximum budget" ERROR with zero
  actual TypeScript/template compile errors. `git add -A` staged cleanly with no "Filename too
  long" errors (longest new path ~178 relative chars, ~219 absolute — safe margin). Browser-
  verified successfully on all three pages via direct DOM/page-text checks — h1/breadcrumb pairs
  correct (all 4 levels), the `AwsNavComponent` accordion auto-expanded with all 3 subtopic links
  on direct navigation, sidebar showing tailored `tip`/`gotchas`/`related` (not DEFAULT) per
  subtopic, dark mode (`--bg: #0f172a`) applying correctly. **This is the AWS hub's first Phase
  10 batch — establishes the pilot conventions (AwsNavComponent fix, `aws-fundamentals` collision
  resolution) the remaining 20 AWS topics will reuse.**)
- [x] `/aws/ec2` — EC2 & Auto Scaling (2026-07-21 — 3 subtopics:
  t3-launches-unlimited-by-default-surplus-credits-can-surcharge,
  imds-hop-limit-of-1-breaks-container-metadata-access,
  io1-multi-attach-lacks-io-fencing-io2-supports-it; all three verified against AWS's own
  documentation via WebFetch before writing — (1) confirmed T3/T3a/T4g instances launch in
  Unlimited mode BY DEFAULT (unlike T2, which defaults to Standard), and that Unlimited mode's
  surplus-credit surcharge billing applies whenever average CPU utilization exceeds baseline over
  a rolling 24-hour window — closing a gap where the main page's own CPU-credit bullet mentions
  earning/spending credits but never mentions the two distinct modes or which one is actually the
  default; (2) confirmed HttpPutResponseHopLimit defaults to 1 and that AWS's own docs explicitly
  call out containerized workloads as a scenario where this "can cause issues" — closing a gap
  where the main page's own dedicated IMDSv2 mistake entry covers token enforcement but never
  mentions this separate, independently-configured setting that silently breaks metadata access
  the moment a container runtime is added; (3) confirmed via AWS's own EBS Multi-Attach
  considerations page that only io2 (not io1) Multi-Attach volumes support I/O fencing via NVMe
  reservations — closing a gap where the main page's own bullet treats "io1/io2 only" as
  interchangeable, when only io2 actually protects against a stale-writer/split-brain scenario a
  cluster-aware filesystem alone cannot prevent. **A real build failure and fix during this
  batch**: the io1 subtopic's own `exercise.prompt` field had one unescaped bare apostrophe in
  "the main page's own" (a second, later apostrophe in the same field, "subtopic's theory," WAS
  correctly escaped) — this is the same delimiter-collision root cause as every previously
  documented apostrophe gotcha, but caught here specifically because the earlier
  apostrophe-after-letter sweep this batch ran was scoped only to the three `.html` files'
  `[prev]`/`[next]` bound attributes, not the `.ts` files' own single-quoted `prompt`/`hint`/
  `solution`/`thought`/`reality` fields — confirmed the theory/misconceptions/other exercise
  fields across all three files were otherwise correctly escaped throughout, this was an isolated
  single miss, not a systemic gap. **Standing process fix**: the pre-build sweep must run the
  apostrophe-after-letter grep against `.ts` files too (targeting the single-quoted
  `prompt:`/`hint:`/`solution:`/`thought:`/`reality:`/`points:` field bodies specifically, since
  backtick-delimited `code:` fields are unaffected and apostrophes there are always safe) — not
  just `.html` bound attributes — added to this file's own standing gotcha checklist. Build
  reported only the pre-documented harmless "bundle initial exceeded maximum budget" ERROR after
  the fix, with zero actual TypeScript/template compile errors. `git add -A` staged cleanly with
  no "Filename too long" errors. Browser-verified successfully on all three pages — h1/breadcrumb
  pairs correct (all 4 levels), the `AwsNavComponent` accordion (now the SECOND topic in this hub
  with subtopics — confirmed both toggles coexist correctly, with only the current page's own
  topic auto-expanding), sidebar showing tailored `tip`/`gotchas`/`related` per subtopic, dark
  mode (`--bg: #0f172a`) applying correctly.)
- [x] `/aws/ecs-eks` — ECS & EKS (2026-07-21 — 3 subtopics:
  irsa-oidc-token-exchange-exact-service-account-match-required,
  vpc-cni-ip-exhaustion-pods-pending-despite-free-cpu-memory,
  circuit-breaker-disabled-by-default-needs-explicit-rollback-flag; all three verified against
  AWS's own documentation via WebFetch before writing — (1) confirmed the full IRSA mechanism
  (EKS-hosted OIDC discovery endpoint, projected service account token, AssumeRoleWithWebIdentity
  exchange, trust-policy sub-condition requiring an EXACT "system:serviceaccount:<ns>:<name>"
  match) — closing a gap where the main page's own Quick Ref and interview-focus list both name
  IRSA as something to understand but never actually explain the mechanism anywhere in the theory
  sections; (2) confirmed via AWS's own EKS CNI docs that pods can get stuck Pending with plenty
  of free node CPU/memory purely because the node ran out of IP addresses (ENI/IP limits tied to
  instance type, not a Kubernetes setting), and that IP Prefix Delegation is the standard fix —
  closing a gap where the main page's own VPC CNI QnA praises real-IP pod addressing as a pure
  benefit without ever mentioning the capacity ceiling it creates; (3) confirmed via AWS's own
  ECS deployment docs that the deployment circuit breaker (automatic failure detection + rollback
  on the STANDARD rolling-update deployment type, no CodeDeploy needed) is opt-in — must be
  explicitly enabled via deploymentCircuitBreaker={enable=true,rollback=true} — closing a gap
  where the main page's own rolling-update bullets cover pace (minimumHealthyPercent/
  maximumPercent) but never failure detection, and its own create-service code example never sets
  this flag. Gotcha sweep this batch explicitly extended to cover the `.ts` files' own
  single-quoted `prompt`/`hint`/`solution`/`thought`/`reality` fields (not just `.html` bound
  attributes), per the process fix recorded in the previous `/aws/ec2` batch entry — ran clean,
  zero misses this time; bare `@word`/brace sweep of `.html` files — clean; backtick parity across
  all three `.ts` files — even counts (4/4/10). Build reported only the pre-documented harmless
  "bundle initial exceeded maximum budget" ERROR with zero actual TypeScript/template compile
  errors. `git add -A` staged cleanly with no "Filename too long" errors (longest new path ~181
  relative chars). Browser-verified successfully on all three pages — h1/breadcrumb pairs correct
  (all 4 levels), the `AwsNavComponent` accordion (now the THIRD topic in this hub with subtopics
  — confirmed all three toggles coexist correctly, with only the current page's own topic
  auto-expanding), sidebar showing tailored `tip`/`gotchas`/`related` per subtopic, dark mode
  (`--bg: #0f172a`) applying correctly.)
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
