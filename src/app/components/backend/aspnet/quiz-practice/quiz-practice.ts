import { Component, signal, computed } from '@angular/core';

interface PracticeQuestion { q: string; options: string[]; answer: number; explanation: string; topic: string; }

type QuizPhase = 'setup' | 'quiz' | 'result';

const QUESTIONS: PracticeQuestion[] = [
  // ── Middleware ──────────────────────────────────────────────────────────────
  {
    q: 'In which order must these middleware calls appear in Program.cs?',
    options: [
      'UseAuthorization → UseAuthentication → UseRouting',
      'UseRouting → UseAuthentication → UseAuthorization',
      'UseAuthentication → UseRouting → UseAuthorization',
      'Order does not matter for these three',
    ],
    answer: 1,
    explanation: 'UseRouting matches the request to an endpoint; UseAuthentication populates HttpContext.User; UseAuthorization checks the matched endpoint\'s requirements. Wrong order causes 401/403 errors on endpoints that should be protected.',
    topic: 'Middleware',
  },
  {
    q: 'What is the difference between app.Use() and app.Run()?',
    options: [
      'app.Run() is async; app.Use() is synchronous',
      'app.Use() can call the next middleware; app.Run() is terminal and never calls next',
      'app.Use() only works for GET requests',
      'app.Run() registers a singleton service',
    ],
    answer: 1,
    explanation: 'app.Use() receives a RequestDelegate "next" that it can call to pass the request downstream. app.Run() is a terminal delegate — it ends the pipeline without calling any further middleware.',
    topic: 'Middleware',
  },
  {
    q: 'What does app.UseWhen() do compared to app.Map()?',
    options: [
      'They are identical',
      'UseWhen branches the pipeline conditionally; after the branch the main pipeline continues. Map branches permanently.',
      'Map is for HTTP verbs; UseWhen is for path prefixes',
      'UseWhen only works in Development environment',
    ],
    answer: 1,
    explanation: 'UseWhen creates a sub-pipeline that rejoins the main pipeline after the branch. Map creates a permanent branch — requests that match never return to the original pipeline.',
    topic: 'Middleware',
  },

  // ── DI & Lifetime ───────────────────────────────────────────────────────────
  {
    q: 'A Singleton service injects a Scoped service. What happens?',
    options: [
      'Works fine — the Scoped service is re-created per request',
      'The Scoped service is captured for the Singleton\'s lifetime, causing a "captive dependency" — InvalidOperationException at startup in strict mode',
      'The Singleton becomes Scoped automatically',
      'Works only in Development environment',
    ],
    answer: 1,
    explanation: 'Singletons live for the app lifetime. Injecting a Scoped service into one "captures" it — the same Scoped instance is reused across all requests, which is unsafe. ASP.NET Core throws in Development and may silently misbehave in Production.',
    topic: 'DI & Lifetime',
  },
  {
    q: 'What is the difference between IOptions<T>, IOptionsSnapshot<T>, and IOptionsMonitor<T>?',
    options: [
      'They are interchangeable aliases',
      'IOptions<T> is Singleton (no hot reload); IOptionsSnapshot<T> is Scoped (re-reads per request); IOptionsMonitor<T> is Singleton with OnChange notification',
      'IOptionsSnapshot<T> is the only one that supports validation',
      'IOptionsMonitor<T> only works with Azure App Configuration',
    ],
    answer: 1,
    explanation: 'IOptions<T> reads config once at startup and never updates. IOptionsSnapshot<T> re-reads per request (useful for multi-tenant or reloadable config). IOptionsMonitor<T> stays Singleton but calls OnChange when config changes on disk.',
    topic: 'DI & Lifetime',
  },
  {
    q: 'When should you use AddTransient vs AddScoped for a service?',
    options: [
      'AddTransient for services that hit a database; AddScoped for in-memory services',
      'AddTransient for lightweight stateless services injected in multiple places; AddScoped for services that must be shared within a single request (e.g. unit of work)',
      'They are equivalent — use either',
      'AddTransient is only for background tasks',
    ],
    answer: 1,
    explanation: 'Transient creates a new instance every time the service is resolved. If the same service is needed in two places within one request and needs to share state, Scoped ensures they get the same instance. Transient is correct for lightweight, purely stateless services.',
    topic: 'DI & Lifetime',
  },

  // ── Routing ─────────────────────────────────────────────────────────────────
  {
    q: 'What does the route constraint {id:int} do?',
    options: [
      'Casts the parameter to int in the query string',
      'Restricts routing to only match if the segment can be parsed as an integer — non-integer requests fall through to the next route',
      'Makes the parameter optional',
      'Applies a range validation (0–int.MaxValue)',
    ],
    answer: 1,
    explanation: 'Route constraints filter which URLs the route matches — they do not validate business rules. {id:int} only routes the request if the segment parses as an integer. The parameter still needs its own validation for range/domain rules.',
    topic: 'Routing',
  },
  {
    q: 'What is the purpose of MapGroup() in Minimal APIs?',
    options: [
      'Group routes for grouping in Swagger UI only',
      'Share a URL prefix, filters, and authorization policies across multiple endpoints without repeating them',
      'Execute endpoints in parallel',
      'Create a versioned API group',
    ],
    answer: 1,
    explanation: 'MapGroup("/api/v1").RequireAuthorization() applies auth to all child routes. AddEndpointFilter on the group applies to all. It eliminates repetition and keeps the Program.cs readable.',
    topic: 'Routing',
  },

  // ── Minimal APIs ─────────────────────────────────────────────────────────────
  {
    q: 'What is the advantage of TypedResults.Ok(data) over Results.Ok(data)?',
    options: [
      'TypedResults is faster at runtime',
      'TypedResults returns a concrete type (Ok<T>) that OpenAPI/Swagger can statically infer — no need for ProducesResponseType attributes',
      'TypedResults validates the response against a schema',
      'They are completely equivalent',
    ],
    answer: 1,
    explanation: 'Results.Ok(data) returns IResult — the type is opaque to OpenAPI. TypedResults.Ok(data) returns Ok<T> — a concrete type that the OpenAPI source generator can infer without extra metadata.',
    topic: 'Minimal APIs',
  },
  {
    q: 'How does a Minimal API handler receive the current user\'s identity?',
    options: [
      'Via a static HttpContext.Current property',
      'By injecting ClaimsPrincipal as a parameter (bound automatically from HttpContext.User when UseAuthentication runs)',
      'Via IHttpContextAccessor in the constructor',
      'Only through [Authorize] attribute — no programmatic access',
    ],
    answer: 1,
    explanation: 'Minimal API parameter binding automatically maps ClaimsPrincipal to HttpContext.User. You can also inject HttpContext directly. This is cleaner than IHttpContextAccessor which is designed for use outside the request pipeline.',
    topic: 'Minimal APIs',
  },

  // ── EF Core ──────────────────────────────────────────────────────────────────
  {
    q: 'What does AsNoTracking() do and when should you use it?',
    options: [
      'Disables SQL query logging',
      'Returns entities without attaching them to the change tracker — queries are faster for read-only scenarios',
      'Prevents lazy loading',
      'Disables migration tracking',
    ],
    answer: 1,
    explanation: 'Change tracking adds overhead per entity (snapshots for comparison). When you only read data and will not call SaveChanges, AsNoTracking() can reduce memory and CPU usage significantly, especially for large result sets.',
    topic: 'EF Core',
  },
  {
    q: 'What is a "N+1 query problem" in EF Core?',
    options: [
      'Running one query then N additional queries — usually caused by lazy loading navigation properties inside a loop',
      'Having more than one DbContext per request',
      'Using Include() on more than one navigation property',
      'A migration adding N columns in a single operation',
    ],
    answer: 0,
    explanation: 'If you load Orders then iterate and access order.Customer inside a loop without eager loading, EF fires one SQL per Customer — N additional queries. Fix with .Include(o => o.Customer) or explicit projection.',
    topic: 'EF Core',
  },
  {
    q: 'What happens if you call SaveChanges() without modifying any tracked entities?',
    options: [
      'Throws InvalidOperationException',
      'Executes an empty transaction — safe but wasteful; nothing is actually written',
      'Automatically detects and applies pending migrations',
      'Reloads all entities from the database',
    ],
    answer: 1,
    explanation: 'EF Core checks the change tracker. If no entities are modified/added/deleted, it optimises to a no-op (0 rows affected). It is still safe to call, but unnecessary round-trips should be avoided.',
    topic: 'EF Core',
  },

  // ── Auth & Security ──────────────────────────────────────────────────────────
  {
    q: 'Why should UseAuthentication() always come before UseAuthorization()?',
    options: [
      'It is just a convention with no functional impact',
      'UseAuthentication populates HttpContext.User — UseAuthorization reads it to evaluate policies. Without User set, all policies see an anonymous user.',
      'UseAuthorization registers the JWT validation handler',
      'The order only matters for controller-based APIs, not Minimal APIs',
    ],
    answer: 1,
    explanation: 'Authentication resolves WHO the user is (fills HttpContext.User with claims). Authorization decides WHAT they can do (reads those claims). If authorization runs first, User is empty and every protected endpoint returns 401.',
    topic: 'Auth & Security',
  },
  {
    q: 'What is the purpose of Data Protection in ASP.NET Core?',
    options: [
      'Encrypting files on disk',
      'Protecting short-lived tokens (cookies, anti-forgery, OAuth state) using app-managed keys stored securely',
      'Database column encryption',
      'Only used for HTTPS certificate management',
    ],
    answer: 1,
    explanation: 'The Data Protection API replaces machineKey from classic ASP.NET. It protects cookies, anti-forgery tokens, and temporary tokens using rotating keys. It must be configured for key persistence in distributed/container environments.',
    topic: 'Auth & Security',
  },

  // ── Async ────────────────────────────────────────────────────────────────────
  {
    q: 'What is the risk of using async void in ASP.NET Core?',
    options: [
      'It uses more memory than async Task',
      'Exceptions thrown in async void cannot be caught by the caller and typically crash the process or are swallowed',
      'async void methods cannot be called from controllers',
      'async void methods run synchronously',
    ],
    answer: 1,
    explanation: 'async void cannot be awaited — the caller fires and forgets. Any exception propagates to the synchronization context, which in ASP.NET Core crashes the process. Always use async Task or async Task<T>. The only exception is event handlers.',
    topic: 'Async',
  },
  {
    q: 'What does CancellationToken.ThrowIfCancellationRequested() do?',
    options: [
      'Cancels the HTTP response',
      'Throws OperationCanceledException if the token has been cancelled — allows clean early exit from long-running operations',
      'Sends a 499 Client Closed Request response',
      'Rolls back the current database transaction',
    ],
    answer: 1,
    explanation: 'When a client disconnects, ASP.NET Core cancels the CancellationToken passed to the action. Checking ThrowIfCancellationRequested() (or passing the token to EF/HttpClient calls) allows the request to abort cleanly rather than continuing work for a client that has already gone.',
    topic: 'Async',
  },

  // ── Performance ──────────────────────────────────────────────────────────────
  {
    q: 'What is the correct way to reuse a StringBuilder in a high-throughput endpoint?',
    options: [
      'Declare a static StringBuilder field',
      'Use ObjectPool<StringBuilder> — borrow with Get(), return with Return() in a finally block',
      'Create new StringBuilder() every request — it is stack-allocated anyway',
      'Use string.Concat() — it is optimised by the JIT',
    ],
    answer: 1,
    explanation: 'A static StringBuilder would be a shared-state race condition. new StringBuilder() allocates on the heap every time. ObjectPool<StringBuilder> reuses instances (pool clears on return), eliminating allocations in hot paths.',
    topic: 'Performance',
  },
  {
    q: 'IAsyncEnumerable<T> vs List<T> return type from an endpoint — what is the difference?',
    options: [
      'IAsyncEnumerable<T> loads all rows then streams them; List<T> is lazy',
      'IAsyncEnumerable<T> streams rows to the client as they are produced from the database, avoiding buffering the entire result set in memory',
      'They are equivalent — the serializer handles both the same way',
      'IAsyncEnumerable<T> is not supported in Minimal APIs',
    ],
    answer: 1,
    explanation: 'With List<T>, EF loads all rows into memory before sending the response. With IAsyncEnumerable<T> (AsAsyncEnumerable()), rows are written to the response as they are read from the database — critical for large datasets.',
    topic: 'Performance',
  },
];

@Component({
  selector: 'app-aspnet-quiz-practice',
  standalone: true,
  imports: [],
  templateUrl: './quiz-practice.html',
  styleUrl: './quiz-practice.scss',
})
export class AspnetQuizPractice {
  topics  = [...new Set(QUESTIONS.map(q => q.topic))];
  counts  = [5, 10, 15, 20];

  selectedTopic = signal<string>('All');
  selectedCount = signal<number>(10);
  phase         = signal<QuizPhase>('setup');
  questions     = signal<PracticeQuestion[]>([]);
  index         = signal<number>(0);
  picked        = signal<number | null>(null);
  answered      = signal<boolean>(false);
  scores        = signal<boolean[]>([]);

  poolSize(topic: string) {
    return topic === 'All' ? QUESTIONS.length : QUESTIONS.filter(q => q.topic === topic).length;
  }

  current   = computed(() => this.questions()[this.index()]);
  isLast    = computed(() => this.index() === this.questions().length - 1);
  score     = computed(() => this.scores().filter(Boolean).length);
  percentage = computed(() => Math.round((this.score() / this.questions().length) * 100));

  resultMessage = computed(() => {
    const p = this.percentage();
    if (p === 100) return 'Perfect score! 🎉';
    if (p >= 80)   return 'Great work — solid ASP.NET Core knowledge!';
    if (p >= 60)   return 'Good effort — review the topics you missed.';
    return 'Keep practising — each topic page has a quiz section too.';
  });

  breakdown = computed(() => {
    const qs = this.questions();
    const sc = this.scores();
    const topicMap = new Map<string, { correct: number; total: number }>();
    qs.forEach((q, i) => {
      const entry = topicMap.get(q.topic) ?? { correct: 0, total: 0 };
      entry.total++;
      if (sc[i]) entry.correct++;
      topicMap.set(q.topic, entry);
    });
    return [...topicMap.entries()].map(([topic, v]) => ({ topic, ...v }));
  });

  start() {
    const pool = this.selectedTopic() === 'All'
      ? [...QUESTIONS]
      : QUESTIONS.filter(q => q.topic === this.selectedTopic());
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, this.selectedCount());
    this.questions.set(shuffled);
    this.index.set(0);
    this.picked.set(null);
    this.answered.set(false);
    this.scores.set([]);
    this.phase.set('quiz');
  }

  pick(i: number) {
    if (this.answered()) return;
    this.picked.set(i);
    this.answered.set(true);
    const correct = i === this.current().answer;
    this.scores.update(s => [...s, correct]);
  }

  next() {
    if (this.isLast()) { this.phase.set('result'); return; }
    this.index.update(n => n + 1);
    this.picked.set(null);
    this.answered.set(false);
  }

  tryAgain()    { this.start(); }
  newSettings() { this.phase.set('setup'); }
}
