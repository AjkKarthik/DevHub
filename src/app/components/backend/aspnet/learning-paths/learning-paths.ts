import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Stage { label: string; items: string[]; links?: { label: string; route: string }[]; }
interface Path { title: string; icon: string; desc: string; stages: Stage[]; }

@Component({
  selector: 'app-aspnet-learning-paths',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learning-paths.html',
  styleUrl: './learning-paths.scss',
})
export class AspnetLearningPaths {
  paths: Path[] = [
    {
      title: 'Complete Beginner',
      icon: '🌱',
      desc: 'No prior ASP.NET experience. You know C# basics.',
      stages: [
        { label: 'HTTP fundamentals', items: ['Request/response cycle', 'HTTP verbs and status codes', 'Headers, query strings, JSON'],
          links: [{ label: 'Hosting & Startup', route: '/aspnet/hosting-startup' }, { label: 'Routing', route: '/aspnet/routing' }] },
        { label: 'Build your first API', items: ['Minimal API with MapGet/MapPost', 'Returning Results.Ok / Results.NotFound', 'Reading route params and JSON body'],
          links: [{ label: 'Minimal APIs', route: '/aspnet/minimal-apis' }, { label: 'Model Binding', route: '/aspnet/model-binding' }] },
        { label: 'Connect a database', items: ['EF Core + SQLite', 'DbContext, DbSet, SaveChanges', 'Basic CRUD with LINQ'],
          links: [{ label: 'EF Core Basics', route: '/aspnet/ef-core-basics' }] },
        { label: 'First deployment', items: ['dotnet publish', 'Multi-stage Dockerfile', 'ASPNETCORE_HTTP_PORTS'],
          links: [{ label: 'Deployment', route: '/aspnet/deployment' }] },
      ],
    },
    {
      title: 'Backend Developer Path',
      icon: '🔧',
      desc: 'You can build basic APIs. Ready for production patterns.',
      stages: [
        { label: 'Request pipeline mastery', items: ['Middleware ordering (auth, routing, compression)', 'Custom middleware with InvokeAsync', 'Error handling — ProblemDetails, UseExceptionHandler'],
          links: [{ label: 'Middleware', route: '/aspnet/middleware' }, { label: 'Error Handling', route: '/aspnet/error-handling' }] },
        { label: 'DI & configuration', items: ['Service lifetimes (Singleton/Scoped/Transient)', 'Options pattern with validation', 'User secrets and environment variables'],
          links: [{ label: 'Dependency Injection', route: '/aspnet/dependency-injection' }, { label: 'Configuration', route: '/aspnet/configuration' }] },
        { label: 'Authentication & authorization', items: ['JWT Bearer setup', 'Claims-based identity', 'Authorization policies and requirements'],
          links: [{ label: 'Authentication', route: '/aspnet/authentication' }, { label: 'Authorization', route: '/aspnet/authorization' }] },
        { label: 'Data access patterns', items: ['EF Core relationships and eager loading', 'AsNoTracking for read-only queries', 'Raw SQL with ExecuteSqlRaw'],
          links: [{ label: 'EF Relationships', route: '/aspnet/ef-relationships' }, { label: 'EF Performance', route: '/aspnet/ef-performance' }] },
        { label: 'API documentation & contracts', items: ['OpenAPI / Swagger setup', 'TypedResults for accurate inference', 'API versioning strategies'],
          links: [{ label: 'OpenAPI', route: '/aspnet/openapi-swagger' }, { label: 'API Versioning', route: '/aspnet/api-versioning' }] },
      ],
    },
    {
      title: 'Senior / Architect Path',
      icon: '🏛️',
      desc: 'Proficient with ASP.NET Core. Ready for advanced patterns and production operations.',
      stages: [
        { label: 'Resilient HTTP clients', items: ['IHttpClientFactory vs new HttpClient', 'AddStandardResilienceHandler (Polly)', 'gRPC for internal services'],
          links: [{ label: 'HTTP Clients', route: '/aspnet/http-clients' }, { label: 'gRPC', route: '/aspnet/grpc' }] },
        { label: 'Background & real-time', items: ['BackgroundService + PeriodicTimer', 'Channel<T> work queues', 'SignalR groups and scale-out'],
          links: [{ label: 'Background Services', route: '/aspnet/background-services' }, { label: 'SignalR', route: '/aspnet/signalr' }] },
        { label: 'Security hardening', items: ['CORS, CSRF, HSTS, CSP', 'Rate limiting (Fixed/Sliding Window)', 'Data Protection key management'],
          links: [{ label: 'CORS', route: '/aspnet/cors' }, { label: 'Rate Limiting', route: '/aspnet/rate-limiting' }, { label: 'Web Security', route: '/aspnet/web-security' }] },
        { label: 'Observability & testing', items: ['Health checks (liveness vs readiness)', 'OpenTelemetry traces + metrics', 'Integration tests with WebApplicationFactory'],
          links: [{ label: 'Health Checks', route: '/aspnet/health-checks' }, { label: 'Testing', route: '/aspnet/testing' }] },
        { label: 'Performance engineering', items: ['BenchmarkDotNet, dotnet-counters, dotnet-trace', 'Response compression, ObjectPool, ArrayPool', 'Native AOT with source generators'],
          links: [{ label: 'Performance', route: '/aspnet/performance' }, { label: 'Deployment', route: '/aspnet/deployment' }] },
        { label: 'Cloud-native with .NET Aspire', items: ['AppHost composition', 'Service discovery, OTel dashboard', 'Deploy to Azure Container Apps with azd up'],
          links: [{ label: '.NET Aspire', route: '/aspnet/aspire' }] },
      ],
    },
    {
      title: 'Migration Path (classic ASP.NET → Core)',
      icon: '🔄',
      desc: 'Coming from ASP.NET MVC / Web API or .NET Framework.',
      stages: [
        { label: 'Understand what changed', items: ['WebApplication replaces Global.asax + Startup', 'Microsoft DI replaces Autofac-first thinking', 'appsettings.json replaces Web.config'],
          links: [{ label: 'Hosting & Startup', route: '/aspnet/hosting-startup' }, { label: 'Configuration', route: '/aspnet/configuration' }] },
        { label: 'Migrate controllers', items: ['[ApiController] attribute and automatic 400', 'IActionResult → Results.* (or keep IActionResult)', 'Route attribute parity — nothing changed'],
          links: [{ label: 'Controllers', route: '/aspnet/controllers' }, { label: 'Model Binding', route: '/aspnet/model-binding' }] },
        { label: 'Auth migration', items: ['Forms auth → Cookie auth', 'OWIN JWT → AddJwtBearer', 'Custom HttpModule → Middleware'],
          links: [{ label: 'Authentication', route: '/aspnet/authentication' }, { label: 'Middleware', route: '/aspnet/middleware' }] },
        { label: 'Data access migration', items: ['EF 6 → EF Core (breaking changes)', 'ObjectContext → DbContext', 'Migration reset or scaffold from existing DB'],
          links: [{ label: 'EF Core Basics', route: '/aspnet/ef-core-basics' }] },
        { label: 'Run side by side', items: ['Host behind IIS (in-process or out-of-process)', 'ForwardedHeaders when behind a proxy', 'Containerise for cloud-first deployment'],
          links: [{ label: 'Deployment', route: '/aspnet/deployment' }] },
      ],
    },
  ];
}
