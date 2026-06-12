import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AspnetTopic {
  title: string;
  description: string;
  route: string;
  badge: string;
  available: boolean;
  keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  Fundamentals: 'fundamentals',
  'Web API':    'webapi',
  Data:         'data',
  Security:     'security',
  Quality:      'quality',
  Reference:    'reference',
};

const GROUP_ORDER = ['All', 'Fundamentals', 'Web API', 'Data', 'Security', 'Quality', 'Reference'];

const ALL_TOPICS: AspnetTopic[] = [
  // ── Fundamentals ──
  { title: 'Hosting & Startup',        route: '/aspnet/hosting-startup',  badge: 'Fundamentals', available: true,
    description: 'WebApplication builder, Program.cs anatomy, Kestrel, environments, and the request lifecycle.',
    keyPoints: ['WebApplication.CreateBuilder() wires config, logging and DI', 'Environments: Development / Staging / Production', 'Kestrel is the cross-platform web server'] },
  { title: 'Middleware Pipeline',      route: '/aspnet/middleware',       badge: 'Fundamentals', available: true,
    description: 'app.Use/Run/Map, ordering rules, short-circuiting, and writing custom middleware.',
    keyPoints: ['Order matters — auth before endpoints', 'Run() terminates the pipeline', 'Custom middleware = class with InvokeAsync(HttpContext, RequestDelegate)'] },
  { title: 'Routing',                  route: '/aspnet/routing',          badge: 'Fundamentals', available: true,
    description: 'Endpoint routing, route templates, constraints, route groups, and link generation.',
    keyPoints: ['Route constraints: {id:int}, {slug:regex(...)}', 'MapGroup() shares prefixes & filters', 'Attribute routing vs conventional routing'] },
  { title: 'Configuration & Options',  route: '/aspnet/configuration',    badge: 'Fundamentals', available: true,
    description: 'appsettings.json, environment variables, user secrets, IOptions<T> pattern, and validation.',
    keyPoints: ['Providers layer: json → env vars → CLI args', 'IOptions vs IOptionsSnapshot vs IOptionsMonitor', 'ValidateDataAnnotations() + ValidateOnStart()'] },
  { title: 'Dependency Injection',     route: '/aspnet/dependency-injection', badge: 'Fundamentals', available: true,
    description: 'Service lifetimes (Singleton/Scoped/Transient), registration patterns, and captive dependency pitfalls.',
    keyPoints: ['Scoped = one instance per request', 'Never inject Scoped into Singleton (captive dependency)', 'TryAdd* avoids double registration in libraries'] },
  { title: 'Logging & Diagnostics',    route: '/aspnet/logging',          badge: 'Fundamentals', available: true,
    description: 'ILogger<T>, log levels, structured logging, scopes, and source-generated LoggerMessage.',
    keyPoints: ['Use structured templates, not string interpolation', 'LoggerMessage source-gen avoids allocation', 'Scopes attach request context to every log line'] },
  { title: 'Static Files & Uploads',   route: '/aspnet/static-files',     badge: 'Fundamentals', available: true,
    description: 'Serving static content, wwwroot, IFormFile uploads, streaming large files, and download responses.',
    keyPoints: ['UseStaticFiles serves wwwroot by convention', 'IFormFile buffers — stream large uploads instead', 'Always validate type/size before saving uploads'] },

  // ── Web API ──
  { title: 'Controllers & Actions',    route: '/aspnet/controllers',      badge: 'Web API', available: true,
    description: '[ApiController], action results, content negotiation, and returning typed results.',
    keyPoints: ['[ApiController] enables automatic 400 on invalid models', 'ActionResult<T> combines typing and status codes', 'ControllerBase, not Controller, for APIs'] },
  { title: 'Minimal APIs',             route: '/aspnet/minimal-apis',     badge: 'Web API', available: true,
    description: 'MapGet/MapPost, TypedResults, route groups, endpoint filters, and when to choose minimal over controllers.',
    keyPoints: ['TypedResults give compile-time checked responses', 'Endpoint filters replace action filters', 'Great for small services; controllers scale better for big teams'] },
  { title: 'Model Binding & Validation', route: '/aspnet/model-binding',  badge: 'Web API', available: true,
    description: '[FromBody]/[FromQuery]/[FromRoute], DataAnnotations, FluentValidation, and custom binders.',
    keyPoints: ['Binding sources are explicit in minimal APIs', 'One [FromBody] per action', 'Validation problem details return 400 automatically'] },
  { title: 'Filters & Endpoint Filters', route: '/aspnet/filters',        badge: 'Web API', available: true,
    description: 'Action/exception/result filters for controllers, endpoint filters for minimal APIs, and ordering.',
    keyPoints: ['Filters run inside the action invocation pipeline', 'Prefer middleware for cross-cutting non-MVC concerns', 'IEndpointFilter is the minimal-API equivalent'] },
  { title: 'Error Handling',           route: '/aspnet/error-handling',   badge: 'Web API', available: true,
    description: 'Exception handler middleware, ProblemDetails (RFC 9457), IExceptionHandler, and developer exception page.',
    keyPoints: ['AddProblemDetails() standardises error payloads', 'IExceptionHandler (.NET 8+) for typed exception mapping', 'Never leak stack traces in Production'] },
  { title: 'OpenAPI & Swagger',        route: '/aspnet/openapi-swagger',  badge: 'Web API', available: true,
    description: 'Built-in OpenAPI document generation (.NET 9+), Swagger UI / Scalar, XML comments, and typed operation metadata.',
    keyPoints: ['AddOpenApi()/MapOpenApi() is the built-in path (.NET 9+)', 'WithSummary/WithDescription enrich minimal endpoints', 'Generated specs drive typed clients (NSwag/Kiota)'] },
  { title: 'API Versioning',           route: '/aspnet/api-versioning',   badge: 'Web API', available: true,
    description: 'Asp.Versioning — URL segment vs header vs query versioning, deprecating versions, and version-aware OpenAPI docs.',
    keyPoints: ['URL-segment (/v1/) is the most explicit strategy', 'Mark old versions Deprecated before removal', 'One OpenAPI doc per version for clean clients'] },
  { title: 'HttpClient & Resilience',  route: '/aspnet/http-clients',     badge: 'Web API', available: true,
    description: 'IHttpClientFactory, typed clients, and Microsoft.Extensions.Resilience — retries, circuit breakers, timeouts.',
    keyPoints: ['Never new HttpClient() per request — socket exhaustion', 'Typed clients pair a client with one API', 'AddStandardResilienceHandler() = retry + breaker + timeout'] },
  { title: 'gRPC Services',            route: '/aspnet/grpc',             badge: 'Web API', available: true,
    description: 'Proto contracts, server & client implementation, streaming calls, gRPC-Web, and when to choose gRPC over REST.',
    keyPoints: ['Contract-first: .proto generates server base + clients', 'Four call types incl. bidirectional streaming', 'Best for internal service-to-service; REST for public APIs'] },

  // ── Data ──
  { title: 'EF Core Basics',           route: '/aspnet/ef-core-basics',   badge: 'Data', available: true,
    description: 'DbContext, DbSet, LINQ queries, change tracking, and SaveChanges.',
    keyPoints: ['DbContext is Scoped — one per request', 'AsNoTracking() for read-only queries', 'Use async EF APIs (ToListAsync) in web apps'] },
  { title: 'EF Relationships & Migrations', route: '/aspnet/ef-relationships', badge: 'Data', available: true,
    description: 'One-to-many, many-to-many, owned types, Fluent API configuration, and the migrations workflow.',
    keyPoints: ['dotnet ef migrations add / database update', 'Include()/ThenInclude() for eager loading', 'Beware N+1: project with Select() where possible'] },
  { title: 'EF Core Performance & Concurrency', route: '/aspnet/ef-performance', badge: 'Data', available: true,
    description: 'N+1 detection, AsNoTracking, split queries, compiled queries, transactions, and optimistic concurrency tokens.',
    keyPoints: ['Project with Select() instead of loading entities', 'AsSplitQuery() avoids cartesian explosion on includes', '[Timestamp]/rowversion catches conflicting updates'] },
  { title: 'Caching',                  route: '/aspnet/caching',          badge: 'Data', available: true,
    description: 'IMemoryCache, IDistributedCache (Redis), output caching, and HybridCache (.NET 9).',
    keyPoints: ['Output caching middleware caches whole responses', 'HybridCache solves cache stampede', 'Always set expirations — unbounded caches leak'] },

  // ── Security ──
  { title: 'Authentication',           route: '/aspnet/authentication',   badge: 'Security', available: true,
    description: 'Cookie auth, JWT bearer tokens, ASP.NET Core Identity, and external providers (OAuth/OIDC).',
    keyPoints: ['AddAuthentication().AddJwtBearer() for APIs', 'Identity handles users, passwords, lockout', 'Authentication = who you are'] },
  { title: 'Authorization',            route: '/aspnet/authorization',    badge: 'Security', available: true,
    description: 'Roles, claims, policy-based authorization, requirements/handlers, and resource-based auth.',
    keyPoints: ['Policies compose claims requirements', 'IAuthorizationHandler for custom rules', 'Authorization = what you may do'] },
  { title: 'CORS & Security Headers',  route: '/aspnet/cors',             badge: 'Security', available: true,
    description: 'CORS policies, preflight requests, HTTPS redirection, HSTS, and common security headers.',
    keyPoints: ['CORS is enforced by browsers, not the server', 'Named policies; avoid AllowAnyOrigin with credentials', 'UseHttpsRedirection + UseHsts in Production'] },
  { title: 'Rate Limiting',            route: '/aspnet/rate-limiting',    badge: 'Security', available: true,
    description: 'Built-in rate limiting middleware (.NET 7+) — fixed/sliding window, token bucket, concurrency, and per-user partitions.',
    keyPoints: ['AddRateLimiter + RequireRateLimiting per endpoint group', 'Token bucket allows controlled bursts', 'Partition by user/API key, not just globally'] },
  { title: 'Web Security Essentials',  route: '/aspnet/web-security',     badge: 'Security', available: true,
    description: 'OWASP for ASP.NET — CSRF/antiforgery, XSS, injection, open redirects, and the security headers that prevent them.',
    keyPoints: ['EF parameterises queries — string-built SQL reintroduces injection', 'Antiforgery tokens for cookie-auth form posts', 'CSP, X-Content-Type-Options, Referrer-Policy headers'] },
  { title: 'Secrets & Data Protection', route: '/aspnet/secrets',         badge: 'Security', available: true,
    description: 'User secrets, environment variables, Azure Key Vault, and the Data Protection API behind cookies and tokens.',
    keyPoints: ['Never commit secrets — user-secrets in dev, vault in prod', 'Data Protection keys must be shared across instances', 'IDataProtector for encrypting your own payloads'] },

  // ── Quality ──
  { title: 'Testing',                  route: '/aspnet/testing',          badge: 'Quality', available: true,
    description: 'Unit testing services, integration tests with WebApplicationFactory, and test doubles for EF Core.',
    keyPoints: ['WebApplicationFactory spins the real pipeline in-memory', 'Override DI registrations per test', 'SQLite in-memory for EF Core test isolation'] },
  { title: 'Background Services',      route: '/aspnet/background-services', badge: 'Quality', available: true,
    description: 'IHostedService, BackgroundService, periodic timers, and queued background work.',
    keyPoints: ['BackgroundService = long-running ExecuteAsync loop', 'Scoped services need a scope inside the worker', 'Honor the CancellationToken for clean shutdown'] },
  { title: 'SignalR',                  route: '/aspnet/signalr',          badge: 'Quality', available: true,
    description: 'Real-time hubs, clients, groups, and streaming over WebSockets with fallbacks.',
    keyPoints: ['Hub methods are called by name from clients', 'Groups broadcast to subsets of connections', 'Scale-out needs a backplane (Redis/Azure)'] },
  { title: 'Health Checks & Observability', route: '/aspnet/health-checks', badge: 'Quality', available: true,
    description: 'MapHealthChecks, readiness vs liveness, OpenTelemetry traces/metrics, and dashboards.',
    keyPoints: ['Liveness: is it running; readiness: can it serve', 'OpenTelemetry is the .NET-blessed observability path', 'Tag checks for k8s probe filtering'] },
  { title: 'Deployment',               route: '/aspnet/deployment',       badge: 'Quality', available: true,
    description: 'Docker images, publish trimming/AOT, IIS/Nginx reverse proxies, and environment configuration.',
    keyPoints: ['dotnet publish -c Release; multi-stage Dockerfiles', 'ForwardedHeaders middleware behind proxies', 'Native AOT for minimal APIs (.NET 8+)'] },
  { title: 'Performance & Diagnostics', route: '/aspnet/performance',     badge: 'Quality', available: true,
    description: 'Response compression, dotnet-counters/trace/dump, memory leaks, BenchmarkDotNet, and finding the slow path in production.',
    keyPoints: ['dotnet-counters monitor for live metrics', 'dotnet-trace + PerfView to find hot paths', 'Benchmark claims with BenchmarkDotNet, not Stopwatch'] },
  { title: '.NET Aspire',              route: '/aspnet/aspire',           badge: 'Quality', available: true,
    description: 'Cloud-native orchestration — AppHost, service discovery, built-in dashboard, integrations, and deploying Aspire apps.',
    keyPoints: ['AppHost composes services, databases, caches in C#', 'Dashboard gives logs/traces/metrics out of the box', 'Service discovery replaces hardcoded URLs'] },
  // ── Reference ──
  { title: 'Cheat Sheet',             route: '/aspnet/cheatsheet',       badge: 'Reference', available: true,
    description: 'Searchable quick-reference for middleware, minimal APIs, DI, auth, EF Core, HttpClient, and the CLI — all in one place.',
    keyPoints: ['7 tabbed sections covering the full stack', 'Filter by keyword within any section', 'Includes dotnet CLI commands'] },
  { title: 'Common Errors',           route: '/aspnet/errors',           badge: 'Reference', available: true,
    description: '13 real-world ASP.NET Core errors with cause, fix, and before/after code — startup, routing, auth, EF Core, async, and HTTP.',
    keyPoints: ['Tag-filtered error browser', 'Root cause + one-line fix per entry', 'Covers the most Googled runtime exceptions'] },
  { title: 'Quiz Practice',           route: '/aspnet/quiz-practice',    badge: 'Reference', available: true,
    description: '20 questions across 8 topics — pick a topic and count, answer, and see your score with explanations.',
    keyPoints: ['Setup → quiz → result flow', 'Explanations for every answer', 'Covers middleware to EF Core and SignalR'] },
  { title: 'Interview Prep',          route: '/aspnet/interview-prep',   badge: 'Reference', available: true,
    description: '22 interview questions from junior to senior — expand each to reveal a thorough model answer.',
    keyPoints: ['Filter by level and topic', 'Junior through senior tiers', 'Covers DI, routing, EF Core, auth, and performance'] },
  { title: 'Design Patterns',         route: '/aspnet/design-patterns',  badge: 'Reference', available: true,
    description: '12 expandable design patterns commonly used in ASP.NET Core apps — with summary, context, and annotated code.',
    keyPoints: ['Repository, CQRS/MediatR, Decorator DI, Options, and more', 'One-click expand/collapse per pattern', 'Production-ready code snippets'] },
  { title: 'Decision Guides',         route: '/aspnet/decision-guides',  badge: 'Reference', available: true,
    description: '8 side-by-side comparison tables for the toughest ASP.NET Core choices — with a clear rule of thumb for each.',
    keyPoints: ['Minimal APIs vs Controllers, Cookie vs JWT, REST vs gRPC', 'EF Core vs Dapper, IMemoryCache vs IDistributed', 'One decision rule per comparison'] },
  { title: 'Glossary',                route: '/aspnet/glossary',         badge: 'Reference', available: true,
    description: 'A–Z definitions for 45+ ASP.NET Core and .NET terms — search, filter by letter, and click through to topic pages.',
    keyPoints: ['45+ terms from AppHost to WebSockets', 'Letter filter + keyword search', 'Links to relevant topic pages'] },
  { title: 'Mini Projects',           route: '/aspnet/mini-projects',    badge: 'Reference', available: true,
    description: '4 step-by-step walkthroughs — Todo REST API, JWT auth, SignalR notifications, and a background order processor.',
    keyPoints: ['Concrete goals with code at each step', 'Covers CRUD, auth, real-time, and background work', 'Good for portfolio pieces or interview prep'] },
  { title: 'Learning Paths',          route: '/aspnet/learning-paths',   badge: 'Reference', available: true,
    description: '4 curated learning paths — complete beginner, backend developer, senior/architect, and migrating from classic ASP.NET.',
    keyPoints: ['Stage-by-stage progression with topic links', 'Paths for beginners through architects', 'Migration path from classic ASP.NET'] },
];

@Component({
  selector: 'app-aspnet-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class AspnetHome {
  activeFilter = signal<string>('All');
  expandedCard = signal<string | null>(null);

  topics = computed(() => {
    const f = this.activeFilter();
    return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f);
  });

  filters = GROUP_ORDER;

  counts = computed(() => {
    const map: Record<string, number> = { All: ALL_TOPICS.length };
    for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1;
    return map;
  });

  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;

  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'fundamentals'); }
  toggleCard(route: string, event: Event) {
    event.preventDefault();
    this.expandedCard.update(c => c === route ? null : route);
  }
}
