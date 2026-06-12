import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Term { term: string; def: string; route?: string; }
interface LetterGroup { letter: string; terms: Term[]; }

@Component({
  selector: 'app-aspnet-glossary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './glossary.html',
  styleUrl: './glossary.scss',
})
export class AspnetGlossary {
  search      = signal('');
  activeLetter = signal<string | null>(null);
  alphabet    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  terms: Term[] = [
    { term: 'Action filter', def: 'A filter that runs before/after a controller action. Types: IActionFilter, IAsyncActionFilter. Part of the MVC filter pipeline (Authorization → Resource → Action → Exception → Result).', route: '/aspnet/filters' },
    { term: 'AOT (Native AOT)', def: 'Compiles IL to native code at publish time — no JIT at runtime. Faster startup, lower memory, but no runtime code generation. Requires source generators for JSON, reflection-free DI.', route: '/aspnet/deployment' },
    { term: 'AppHost (.NET Aspire)', def: 'A separate project that composes services, containers, and configuration for local development and deployment. Replaces docker-compose for .NET stacks.', route: '/aspnet/aspire' },
    { term: 'appsettings.json', def: 'The default configuration file for ASP.NET Core apps. Layered with environment-specific files (appsettings.Production.json). Never store secrets here.', route: '/aspnet/configuration' },
    { term: 'ArrayPool<T>', def: 'A thread-safe pool of reusable arrays. Rent(n) returns a buffer, Return(buffer) puts it back. Eliminates heap allocation in hot paths.', route: '/aspnet/performance' },
    { term: 'BackgroundService', def: 'Base class for long-running hosted services. Override ExecuteAsync(CancellationToken) and use PeriodicTimer for work loops. Registered via AddHostedService<T>().', route: '/aspnet/background-services' },
    { term: 'Bearer token', def: 'An opaque or JWT token passed in the Authorization: Bearer <token> header. Validated by AddJwtBearer() or a custom handler.', route: '/aspnet/authentication' },
    { term: 'Brotli', def: 'A compression algorithm producing smaller output than Gzip, preferred when the client advertises br in Accept-Encoding. Enabled via AddResponseCompression().', route: '/aspnet/performance' },
    { term: 'CancellationToken', def: 'Signal to abort an async operation. ASP.NET Core injects it into action parameters; it is cancelled when the client disconnects. Pass it to EF Core and HttpClient calls.', route: '/aspnet/background-services' },
    { term: 'CORS (Cross-Origin Resource Sharing)', def: 'Browser security mechanism requiring servers to declare which origins may access them. Configured with AddCors() / UseCors() / [EnableCors].', route: '/aspnet/cors' },
    { term: 'Data Protection', def: 'API for encrypting cookies, tokens, and anti-forgery payloads using rotating keys. Configure key storage for multi-instance deployments.', route: '/aspnet/web-security' },
    { term: 'DbContext', def: 'Entity Framework Core\'s unit-of-work and repository in one. Tracks entity changes, translates LINQ to SQL, and commits via SaveChangesAsync(). Always Scoped lifetime.', route: '/aspnet/ef-core-basics' },
    { term: 'Dependency Injection (DI)', def: 'The built-in IoC container. Services registered with AddSingleton / AddScoped / AddTransient are resolved via constructor injection into controllers, endpoints, and middleware.', route: '/aspnet/dependency-injection' },
    { term: 'Endpoint routing', def: 'ASP.NET Core\'s routing model that separates URL matching (UseRouting) from endpoint execution (MapControllers/MapGet). Middleware between the two can read matched endpoint metadata.', route: '/aspnet/routing' },
    { term: 'EF Core migrations', def: 'C# snapshots of model changes that EF applies as SQL DDL. Created with dotnet ef migrations add and applied with dotnet ef database update.', route: '/aspnet/ef-core-basics' },
    { term: 'ForwardedHeaders', def: 'Middleware that reads X-Forwarded-For and X-Forwarded-Proto from a reverse proxy, restoring the original client IP and HTTPS scheme. Must come before UseAuthentication.', route: '/aspnet/deployment' },
    { term: 'gRPC', def: 'A high-performance RPC framework using HTTP/2 and Protobuf binary serialisation. Defined by .proto files; supports unary and bidirectional streaming. Ideal for internal services.', route: '/aspnet/grpc' },
    { term: 'Health check', def: 'Endpoint reporting app/dependency status for orchestrator probes. /health/live (liveness — is process running?) and /health/ready (readiness — can serve traffic?).', route: '/aspnet/health-checks' },
    { term: 'Hub (SignalR)', def: 'Server-side class inheriting Hub that exposes methods clients can invoke. Hub.Clients provides access to all connected clients; Hub.Groups manages named groups.', route: '/aspnet/signalr' },
    { term: 'IHostedService', def: 'Interface for long-running background services. StartAsync/StopAsync are called by the host. BackgroundService is the standard base class.', route: '/aspnet/background-services' },
    { term: 'IHttpClientFactory', def: 'Factory for creating HttpClient instances that reuse underlying socket handlers, preventing socket exhaustion. Preferred over new HttpClient() always.', route: '/aspnet/http-clients' },
    { term: 'IOptions<T>', def: 'Singleton access to a bound configuration section. Does not reflect hot-reload changes. Use IOptionsSnapshot<T> (scoped) or IOptionsMonitor<T> (singleton with OnChange) for reloadable settings.', route: '/aspnet/configuration' },
    { term: 'JWT (JSON Web Token)', def: 'Self-contained token with header.payload.signature. Bearer auth scheme. Validated by AddJwtBearer(). Stateless — no server-side session. Revocation requires a token blocklist.', route: '/aspnet/authentication' },
    { term: 'Kestrel', def: 'The cross-platform HTTP server embedded in ASP.NET Core. Handles HTTP/1.1, HTTP/2, HTTP/3, and WebSockets. Runs behind a reverse proxy in production.', route: '/aspnet/hosting-startup' },
    { term: 'MapGroup()', def: 'Creates a route group with a shared prefix and shared metadata (auth, filters, tags). Groups keep Minimal API route registration DRY.', route: '/aspnet/minimal-apis' },
    { term: 'Middleware', def: 'Components forming the request pipeline. Each can inspect/modify the request and response, and optionally pass to the next component. Registered in Program.cs with app.Use*, app.Run, app.Map.', route: '/aspnet/middleware' },
    { term: 'Minimal APIs', def: 'Concise HTTP endpoint style using app.MapGet/Post/Put/Delete in Program.cs without controllers or attributes. Favoured for microservices and AOT.', route: '/aspnet/minimal-apis' },
    { term: 'NativeAOT', def: 'See AOT (Native AOT).' },
    { term: 'ObjectPool<T>', def: 'Reusable pool of expensive-to-construct objects (StringBuilder, MemoryStream). Get() borrows, Return() recycles. Reduces GC pressure in hot paths.', route: '/aspnet/performance' },
    { term: 'OpenAPI / Swagger', def: 'Machine-readable API description generated from routes and types. Swagger UI renders interactive docs. In .NET 9+ AddOpenApi() is built-in; earlier versions use Swashbuckle.', route: '/aspnet/openapi-swagger' },
    { term: 'Options pattern', def: 'Binding appsettings sections to strongly-typed classes via Configure<T>(). Supports validation (ValidateDataAnnotations, ValidateOnStart) and three lifetime interfaces.', route: '/aspnet/configuration' },
    { term: 'PeriodicTimer', def: '.NET 6+ timer for BackgroundService loops. WaitForNextTickAsync() returns true on each tick and false when the CancellationToken is cancelled. No Timer callbacks — no re-entrancy risk.', route: '/aspnet/background-services' },
    { term: 'Policy (authorization)', def: 'Named set of requirements. Defined with AddAuthorization(o => o.AddPolicy("X", ...)). Applied with [Authorize(Policy="X")] or .RequireAuthorization("X").', route: '/aspnet/authorization' },
    { term: 'Problem Details (RFC 7807)', def: 'Standard JSON error response format with type, title, status, detail. Returned by Results.Problem() and ValidationProblem(). Enabled globally with AddProblemDetails().', route: '/aspnet/error-handling' },
    { term: 'Rate limiting', def: 'Throttle requests per client/IP to prevent abuse. Configured with AddRateLimiter() and UseRateLimiter(). Built-in policies: Fixed Window, Sliding Window, Token Bucket, Concurrency.', route: '/aspnet/rate-limiting' },
    { term: 'Scoped lifetime', def: 'One service instance per HTTP request. Correct lifetime for DbContext, repositories, and request-specific state. Never inject into Singleton.', route: '/aspnet/dependency-injection' },
    { term: 'Secrets (user secrets)', def: 'Local development secret storage — not committed to git. Managed with dotnet user-secrets. In production use environment variables or a secrets manager.', route: '/aspnet/secrets' },
    { term: 'SignalR', def: 'Real-time bidirectional communication library. Negotiates WebSocket → SSE → long-polling. Hubs provide method-call abstraction. Scale out with Redis backplane.', route: '/aspnet/signalr' },
    { term: 'Singleton lifetime', def: 'One service instance for the app lifetime. Correct for stateless, thread-safe services. Never hold Scoped dependencies.', route: '/aspnet/dependency-injection' },
    { term: 'Transient lifetime', def: 'New service instance every time it is resolved. Suitable for lightweight, stateless services. Higher allocation rate than Scoped or Singleton.', route: '/aspnet/dependency-injection' },
    { term: 'TypedResults', def: 'Strongly-typed Minimal API result helpers (TypedResults.Ok<T>, TypedResults.NotFound) that OpenAPI can infer without ProducesResponseType attributes.', route: '/aspnet/minimal-apis' },
    { term: 'UseRouting / UseEndpoints', def: 'UseRouting matches the request to an endpoint (sets IEndpointFeature). UseEndpoints executes the matched endpoint. In .NET 7+ MapXxx calls make both implicit.', route: '/aspnet/routing' },
    { term: 'Validation (model binding)', def: 'Automatic validation via data annotations on request models. [ApiController] returns 400 with problem details on ModelState failure. Use FluentValidation for complex rules.', route: '/aspnet/model-binding' },
    { term: 'WebApplicationFactory', def: 'Integration-test host that boots the real ASP.NET Core app in-process. Use with HttpClient to test routes end-to-end without a real server.', route: '/aspnet/testing' },
    { term: 'Wwwroot', def: 'Static file root served by UseStaticFiles(). HTML, CSS, JS, and images go here. Not served if UseStaticFiles() is not in the pipeline.', route: '/aspnet/static-files' },
  ];

  groups = computed<LetterGroup[]>(() => {
    const q = this.search().toLowerCase().trim();
    const al = this.activeLetter();
    let filtered = q
      ? this.terms.filter(t => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
      : this.terms;
    if (al) filtered = filtered.filter(t => t.term.toUpperCase().startsWith(al));
    const map = new Map<string, Term[]>();
    for (const t of filtered) {
      const l = t.term[0].toUpperCase();
      const arr = map.get(l) ?? [];
      arr.push(t);
      map.set(l, arr);
    }
    return [...map.entries()].map(([letter, terms]) => ({ letter, terms }));
  });

  hasLetter(l: string) { return this.terms.some(t => t.term.toUpperCase().startsWith(l)); }

  toggleLetter(l: string) {
    this.activeLetter.update(cur => cur === l ? null : l);
  }

  totalCount = computed(() => this.groups().reduce((acc, g) => acc + g.terms.length, 0));
}
