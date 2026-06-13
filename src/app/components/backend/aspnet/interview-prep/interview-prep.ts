import { Component, signal, computed } from '@angular/core';

interface InterviewQuestion { q: string; a: string; topic: string; level: 'junior' | 'mid' | 'senior'; }

const QUESTIONS: InterviewQuestion[] = [
  // ── Fundamentals ─────────────────────────────────────────────────────────
  { q: 'What is middleware in ASP.NET Core and how does the pipeline work?', level: 'junior', topic: 'Fundamentals',
    a: 'Middleware is a component in the HTTP request pipeline. Each piece of middleware can inspect or modify the request and response, then either call the next middleware (app.Use) or terminate the pipeline (app.Run). The pipeline is built in Program.cs with the order of registration determining execution order — critical for auth, error handling, and routing.' },
  { q: 'What is the difference between app.Use(), app.Run(), and app.Map()?', level: 'junior', topic: 'Fundamentals',
    a: 'app.Use() adds middleware that can call the next component. app.Run() adds a terminal middleware — it never calls next. app.Map() branches the pipeline on a URL prefix permanently; app.UseWhen() branches conditionally and rejoins the main pipeline after.' },
  { q: 'What is the Kestrel web server and why does ASP.NET Core use it?', level: 'junior', topic: 'Fundamentals',
    a: 'Kestrel is the cross-platform, high-performance HTTP server built into ASP.NET Core. It runs on Linux, macOS, and Windows. In production, Kestrel typically sits behind a reverse proxy (Nginx, IIS, Kubernetes ingress) that handles TLS termination, load balancing, and request buffering.' },
  { q: 'What is WebApplication.CreateBuilder() and what does it set up?', level: 'junior', topic: 'Fundamentals',
    a: 'It creates a WebApplicationBuilder pre-configured with: the default DI container, configuration sources (appsettings.json, environment variables, user secrets, command-line args), Kestrel, logging (console, debug, EventSource), and routing. Call builder.Build() to get the WebApplication and add middleware.' },

  // ── DI ────────────────────────────────────────────────────────────────────
  { q: 'What are the three service lifetimes in ASP.NET Core DI?', level: 'junior', topic: 'DI',
    a: 'Singleton: one instance for the app lifetime — thread-safe services, caches. Scoped: one instance per HTTP request — ideal for DbContext and unit-of-work objects. Transient: new instance every time resolved — lightweight, stateless services. Injecting a shorter-lived service into a longer-lived one (captive dependency) causes bugs.' },
  { q: 'What is a "captive dependency" and why is it dangerous?', level: 'mid', topic: 'DI',
    a: 'A captive dependency occurs when a Singleton holds a reference to a Scoped or Transient service. The Scoped service is captured for the Singleton\'s lifetime, so it is never released per request. In strict mode ASP.NET Core throws InvalidOperationException at startup. Fix: inject IServiceScopeFactory and create a scope manually inside the Singleton method.' },
  { q: 'What is the Options pattern and when would you use it?', level: 'mid', topic: 'DI',
    a: 'The Options pattern binds strongly-typed classes to configuration sections using services.Configure<TOptions>(). It supports validation (ValidateDataAnnotations, ValidateOnStart) and three interfaces: IOptions<T> (singleton, no hot reload), IOptionsSnapshot<T> (scoped, re-reads per request), IOptionsMonitor<T> (singleton with OnChange notification for hot reload).' },

  // ── Routing ───────────────────────────────────────────────────────────────
  { q: 'What is endpoint routing and how does it differ from conventional routing?', level: 'junior', topic: 'Routing',
    a: 'Endpoint routing separates route matching (UseRouting) from execution (UseEndpoints/MapControllers). It happens earlier in the pipeline so middleware added between UseRouting and UseEndpoints — like auth — can inspect the matched endpoint and its metadata before execution. Conventional routing uses templates defined in MapControllerRoute; attribute routing uses [Route] on controllers/actions.' },
  { q: 'What is MapGroup() and what problem does it solve?', level: 'mid', topic: 'Routing',
    a: 'MapGroup() creates a route group with a shared prefix. All routes added to the group inherit the prefix, plus any filters, auth policies, or metadata applied to the group. This eliminates repetition and makes it easy to apply RequireAuthorization() or AddEndpointFilter() to many routes at once.' },
  { q: 'How do route constraints work and what are they for?', level: 'junior', topic: 'Routing',
    a: 'Route constraints restrict which URL segments a route matches. {id:int} only matches integers, {slug:regex(^[a-z-]+$)} matches slugs. They are for routing decisions, not validation — a route with {id:int} simply does not match "abc"; it falls through to the next route. Business validation (range, existence) should still happen in the handler.' },

  // ── Minimal APIs ──────────────────────────────────────────────────────────
  { q: 'Minimal APIs vs controller-based APIs — when do you choose each?', level: 'mid', topic: 'Minimal APIs',
    a: 'Minimal APIs are preferred for greenfield microservices, small APIs, and performance-critical endpoints — less ceremony, AOT-friendly. Controller-based APIs suit large teams (convention-driven organisation), complex action filter chains, or when migrating from legacy ASP.NET. Both support the same DI, auth, filters, and middleware. For new projects, Minimal APIs are the modern default.' },
  { q: 'What is the difference between Results.Ok(data) and TypedResults.Ok(data)?', level: 'mid', topic: 'Minimal APIs',
    a: 'Results.Ok returns IResult — an opaque interface that OpenAPI cannot inspect statically. TypedResults.Ok<T> returns a concrete Ok<T> type that the OpenAPI source generator (dotnet-openapi / Swashbuckle) can infer without ProducesResponseType attributes, giving accurate Swagger documentation automatically.' },

  // ── EF Core ───────────────────────────────────────────────────────────────
  { q: 'What does AsNoTracking() do and when should you always use it?', level: 'junior', topic: 'EF Core',
    a: 'AsNoTracking() returns entities without attaching them to the change tracker. EF skips creating state snapshots, which reduces memory and CPU overhead. Always use it for read-only queries where you will not call SaveChanges — list endpoints, reports, projections. Omit it when you need to track changes and later call SaveChanges.' },
  { q: 'What is the N+1 query problem and how do you fix it in EF Core?', level: 'mid', topic: 'EF Core',
    a: 'N+1 occurs when you load a list of N entities then loop over them accessing a navigation property that triggers N additional SQL queries. Fix: use .Include() for eager loading, or project to a DTO with a single query using .Select(). Using .AsSplitQuery() is an alternative for complex includes that produce cartesian explosions.' },
  { q: 'What are EF Core migrations and how do they work?', level: 'junior', topic: 'EF Core',
    a: 'Migrations are C# snapshots of model changes. dotnet ef migrations add generates a Migration class with Up() and Down() methods as SQL. dotnet ef database update applies pending migrations. In production, never run migrations automatically at app startup in multi-instance deployments — use a one-shot migration job or run them via CI before deployment.' },
  { q: 'When would you use Dapper instead of EF Core?', level: 'mid', topic: 'EF Core',
    a: 'Dapper is a micro-ORM for raw SQL. Use it when: you need fine-grained SQL control (complex reporting queries, stored procedures), EF Core\'s query translation is suboptimal, you are working with an existing schema that does not map cleanly to entity classes, or you need maximum performance for bulk read operations (Dapper has less overhead than EF Core).' },

  // ── Auth & Security ───────────────────────────────────────────────────────
  { q: 'What is the difference between authentication and authorization?', level: 'junior', topic: 'Auth',
    a: 'Authentication answers "who are you?" — it validates credentials and populates HttpContext.User with claims. Authorization answers "what can you do?" — it checks the user\'s claims/roles against endpoint policies. UseAuthentication() must come before UseAuthorization() in the pipeline. [Authorize] requires the user to be authenticated; [Authorize(Policy="X")] additionally checks a named policy.' },
  { q: 'How does JWT authentication work in ASP.NET Core?', level: 'mid', topic: 'Auth',
    a: 'The client presents a signed JWT in the Authorization header. AddJwtBearer() configures the server to: extract the token from the header, validate the signature using the issuer\'s signing key, check claims (iss, aud, exp). On success, it creates a ClaimsPrincipal and sets HttpContext.User. The token is never stored server-side — it is self-contained.' },
  { q: 'What are ASP.NET Core authorization policies and how do you define them?', level: 'mid', topic: 'Auth',
    a: 'Policies are named sets of requirements. Define with services.AddAuthorization(o => o.AddPolicy("Admin", p => p.RequireRole("Admin").RequireClaim("dept"))). Apply with [Authorize(Policy="Admin")] or .RequireAuthorization("Admin") on a route. For complex logic, implement IAuthorizationRequirement and IAuthorizationHandler.' },
  { q: 'What is Data Protection and why must you configure key persistence in production?', level: 'senior', topic: 'Auth',
    a: 'Data Protection generates and rotates cryptographic keys used to protect cookies, anti-forgery tokens, and other tokens. By default, keys are stored in memory — lost on restart, causing all existing cookies/tokens to become invalid. In production configure persistent key storage (Azure Blob, file system, Redis) and key protection (Azure Key Vault). In multi-instance deployments all instances must share the same key ring.' },

  // ── Performance ───────────────────────────────────────────────────────────
  { q: 'What is socket exhaustion and how does IHttpClientFactory prevent it?', level: 'mid', topic: 'Performance',
    a: 'Creating new HttpClient() per request creates a new socket pool per instance. Old sockets linger in TIME_WAIT for ~4 minutes, exhausting the OS port limit under load. IHttpClientFactory manages a pool of HttpMessageHandler instances with a controlled lifetime (default 2 min), reusing sockets safely across short-lived HttpClient instances.' },
  { q: 'What is response compression and what are the caveats?', level: 'junior', topic: 'Performance',
    a: 'AddResponseCompression()/UseResponseCompression() compresses responses with Brotli or Gzip, reducing bandwidth. Caveats: never enable over HTTP with HTTPS content that reflects user input (BREACH attack); do not compress already-compressed formats (JPEG, video); the CPU cost of compression can outweigh bandwidth savings for small payloads (<1 KB).' },
  { q: 'What are ObjectPool<T> and ArrayPool<T> and when should you reach for them?', level: 'senior', topic: 'Performance',
    a: 'Both eliminate heap allocations in hot paths. ObjectPool<T> reuses expensive objects (StringBuilder, MemoryStream) — borrow with Get(), return with Return(). ArrayPool<T>.Shared.Rent(n) returns a buffer from a thread-safe pool; always Return() in a finally block. Use them when profiling shows allocation pressure in high-throughput endpoints, not prematurely.' },
];

@Component({
  selector: 'app-aspnet-interview-prep',
  standalone: true,
  imports: [],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class AspnetInterviewPrep {
  levels  = ['all', 'junior', 'mid', 'senior'];
  topics  = ['All', ...new Set(QUESTIONS.map(q => q.topic))];

  activeLevel = signal<string>('all');
  activeTopic = signal<string>('All');
  openIndex   = signal<number | null>(null);

  filtered = computed(() => {
    let q = QUESTIONS;
    if (this.activeLevel() !== 'all') q = q.filter(x => x.level === this.activeLevel());
    if (this.activeTopic() !== 'All') q = q.filter(x => x.topic === this.activeTopic());
    return q;
  });

  toggle(i: number) { this.openIndex.update(n => n === i ? null : i); }
}
