import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'dotnet publish',             type: 'keyword', desc: 'Compiles and publishes the app to a folder or container image.' },
  { name: '--self-contained',           type: 'keyword', desc: 'Bundles the .NET runtime; no runtime required on the target machine.' },
  { name: '--runtime',                  type: 'keyword', desc: 'Target RID (e.g. linux-x64, win-x64) for self-contained publish.' },
  { name: 'PublishAot=true',            type: 'keyword', desc: 'Enables Native AOT — compiles to a single native binary, no JIT.' },
  { name: 'ForwardedHeaders',           type: 'keyword', desc: 'Middleware that reads X-Forwarded-For/Proto from a reverse proxy.' },
  { name: 'UseForwardedHeaders()',      type: 'method',  desc: 'Apply forwarded-header middleware — call before UseAuthentication.' },
  { name: 'ASPNETCORE_ENVIRONMENT',     type: 'keyword', desc: 'Environment variable that sets the hosting environment (Development/Production).' },
  { name: 'ASPNETCORE_HTTP_PORTS',      type: 'keyword', desc: '.NET 8+ — set to "8080" to configure Kestrel port without a full URL.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Publish types: FDD, SCD, and AOT',
    points: [
      '<strong>Framework-Dependent Deployment (FDD)</strong>: smallest output, requires .NET runtime installed on the host. Default publish mode.',
      '<strong>Self-Contained Deployment (SCD)</strong>: bundles the runtime; larger but no prerequisite — ideal for Docker or environments without a pre-installed runtime.',
      '<strong>Native AOT</strong> (.NET 8+ for broader scenarios): compiles to a native binary — fast startup, tiny memory, but no runtime code generation (no reflection-based serialisation without source gen).',
    ],
  },
  {
    heading: 'Multi-stage Dockerfile',
    points: [
      'Stage 1 (SDK image): copy <code>.csproj</code> files first and <code>dotnet restore</code> — creates a layer cached unless dependencies change. Then copy source and <code>dotnet publish</code>.',
      'Stage 2 (ASP.NET runtime image): copy only the published output from stage 1. The final image contains no SDK, no source, and no build artefacts — typically ~200 MB vs ~800 MB for SDK.',
      'Run as a non-root user (<code>adduser</code> + <code>USER appuser</code>) and add a <code>HEALTHCHECK</code> instruction for orchestrator probes.',
    ],
  },
  {
    heading: 'Reverse proxy: ForwardedHeaders',
    points: [
      'When deployed behind Nginx, a load balancer, or Kubernetes ingress, the app sees the proxy\'s IP. Add <code>UseForwardedHeaders()</code> with <code>ForwardedHeaders.XForwardedFor | XForwardedProto</code> to restore the original scheme and remote IP.',
      '<strong>Call it before UseAuthentication()</strong> — auth redirects need the correct scheme (https). Wrong order breaks OAuth/OIDC flows.',
      'Restrict trusted proxies to known IP ranges via <code>KnownNetworks</code> / <code>KnownProxies</code>. Never clear both and trust all — it allows IP spoofing via <code>X-Forwarded-For</code>.',
    ],
  },
  {
    heading: 'Environment-based configuration',
    points: [
      '<code>ASPNETCORE_ENVIRONMENT</code> controls which <code>appsettings.{Env}.json</code> file is layered over the base config. In containers set it as an environment variable.',
      'Use double-underscore (<code>__</code>) as the hierarchy separator in environment variable names: <code>ConnectionStrings__Default</code> maps to <code>ConnectionStrings:Default</code>.',
      'Never store real secrets in appsettings files. Use environment variables in containers or a secrets manager (Azure Key Vault, AWS Secrets Manager, k8s Secrets) in production.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'dotnet publish flags',
    language: 'csharp',
    code: `# Framework-dependent (smallest, needs runtime on host)
dotnet publish -c Release -o ./publish

# Self-contained for Linux x64
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish

# Single-file self-contained
dotnet publish -c Release -r linux-x64 --self-contained true \\
  -p:PublishSingleFile=true -o ./publish

# Native AOT (.csproj: <PublishAot>true</PublishAot>)
dotnet publish -c Release -r linux-x64 -o ./publish

# ── .csproj for AOT ──────────────────────────────────────────────────────────
# <PropertyGroup>
#   <PublishAot>true</PublishAot>
#   <InvariantGlobalization>true</InvariantGlobalization>
# </PropertyGroup>

# Docker build and run
docker build -t myapi:latest .
docker run -d -p 8080:8080 \\
  -e ASPNETCORE_ENVIRONMENT=Production \\
  -e ConnectionStrings__Default="Server=db;..." \\
  myapi:latest`,
  },
  {
    label: 'Multi-Stage Dockerfile',
    language: 'csharp',
    code: `FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore layer (cached unless .csproj changes)
COPY ["MyApi/MyApi.csproj", "MyApi/"]
RUN dotnet restore "MyApi/MyApi.csproj"

# Build and publish
COPY . .
WORKDIR "/src/MyApi"
RUN dotnet publish "MyApi.csproj" -c Release -o /app/publish --no-restore

# ── Runtime image ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Non-root user
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD curl -f http://localhost:8080/health/live || exit 1

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "MyApi.dll"]`,
  },
  {
    label: 'ForwardedHeaders (Nginx/k8s)',
    language: 'csharp',
    code: `// Program.cs — MUST come before UseAuthentication()

builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    // Clear defaults and trust your internal proxy CIDR only
    opts.KnownNetworks.Clear();
    opts.KnownProxies.Clear();
    opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
});

app.UseForwardedHeaders();   // first
app.UseAuthentication();
app.UseAuthorization();

// Nginx upstream config:
// proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
// proxy_set_header X-Forwarded-Proto $scheme;`,
  },
  {
    label: 'Environment Config',
    language: 'csharp',
    code: `// appsettings.json (base — no secrets)
// { "Logging": { "LogLevel": { "Default": "Information" } } }

// appsettings.Production.json (layered on top)
// { "Logging": { "LogLevel": { "Default": "Warning" } } }

// Environment variables (__ = : hierarchy separator)
// ConnectionStrings__Default  →  ConnectionStrings:Default
// Logging__LogLevel__Default  →  Logging:LogLevel:Default

// Docker Compose
// services:
//   api:
//     environment:
//       - ASPNETCORE_ENVIRONMENT=Production
//       - ConnectionStrings__Default=Server=db;Database=app;...

// Validate required config at startup (fail-fast)
var connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");

// Environment-specific middleware
if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}`,
  },
  {
    label: 'Native AOT Setup',
    language: 'csharp',
    code: `// Requirements:
//   - Minimal APIs (MVC controllers not fully AOT-ready as of .NET 9)
//   - Source generators for JSON (no runtime reflection serialisation)

// MyApi.csproj
// <PropertyGroup>
//   <PublishAot>true</PublishAot>
//   <InvariantGlobalization>true</InvariantGlobalization>
// </PropertyGroup>

// Program.cs
var builder = WebApplication.CreateSlimBuilder(args);   // AOT-optimised host

builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default);
});

var app = builder.Build();
app.MapGet("/products", () => new[] { new Product(1, "Widget") });
app.Run();

// JSON source gen context (required for AOT)
[JsonSerializable(typeof(Product[]))]
[JsonSerializable(typeof(Product))]
internal partial class AppJsonContext : JsonSerializerContext { }

public record Product(int Id, string Name);

// Build: dotnet publish -c Release -r linux-x64
// ILC warns about reflection incompatible with AOT — fix before shipping.`,
  },
];

const challenge: Challenge = {
  title: 'Containerise a Minimal API',
  language: 'csharp',
  description: 'Create a production-ready Docker setup:\n1. Multi-stage Dockerfile (SDK build → ASP.NET runtime).\n2. Run as a non-root user.\n3. `GET /health/live` endpoint returning 200 OK.\n4. `HEALTHCHECK` instruction in the Dockerfile calling that endpoint.\n5. App reads connection string from `ConnectionStrings__Default` environment variable.',
  hints: [
    'mcr.microsoft.com/dotnet/sdk:9.0 for build, mcr.microsoft.com/dotnet/aspnet:9.0 for runtime',
    'COPY --from=build /app/publish . copies only published output',
    'ENV ASPNETCORE_HTTP_PORTS=8080 sets the port',
    'builder.Configuration.GetConnectionString("Default") reads ConnectionStrings__Default',
  ],
  starterCode: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();
var app = builder.Build();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.Run();`,
  solution: `# Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MyApi.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/health/live || exit 1
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "MyApi.dll"]

# Program.cs
var builder = WebApplication.CreateBuilder(args);
var connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default required.");
builder.Services.AddSqlite<AppDbContext>(connStr);
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("db");
var app = builder.Build();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.Run();`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the primary reason to use a multi-stage Docker build?',
    options: [
      'Multi-stage builds are required by Kubernetes',
      'The SDK image is much larger than the runtime image; only the published output is copied to the final stage',
      'Multi-stage builds enable parallel compilation',
      'Single-stage builds do not support health checks',
    ],
    answer: 1,
    explanation: 'The .NET SDK image is ~800 MB; the runtime image is ~200 MB. A multi-stage build discards the SDK after compilation, resulting in a much smaller deployable image.',
  },
  {
    q: 'Why must UseForwardedHeaders() be called before UseAuthentication()?',
    options: [
      'Forwarded headers must be set before SignalR negotiation',
      'Authentication middleware reads HttpContext.Request.Scheme for redirect URIs — it must reflect the original HTTPS scheme before auth runs',
      'Forwarded headers require a database connection',
      'UseAuthentication throws if called after UseForwardedHeaders',
    ],
    answer: 1,
    explanation: 'If the scheme is still "http" (as the proxy terminates TLS), auth redirect URIs will be http:// instead of https://, breaking OAuth flows and HTTPS-only cookies.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between --self-contained and PublishAot?',
    a: '--self-contained bundles the .NET runtime but still uses JIT compilation at runtime. PublishAot compiles the entire app to native code ahead of time — no JIT, faster startup, smaller memory, but no runtime code generation.',
  },
  {
    q: 'How do I handle database migrations in a containerised deployment?',
    a: 'Run migrations as an init container or startup job before the main API starts. Avoid running migrations in the app startup path — it serialises restarts and fails if multiple replicas start simultaneously.',
  },
  {
    q: 'What is ASPNETCORE_HTTP_PORTS vs ASPNETCORE_URLS?',
    a: 'ASPNETCORE_HTTP_PORTS (introduced in .NET 8) is simpler — set it to "8080" and Kestrel listens on http://+:8080. ASPNETCORE_URLS takes a full URL like "http://+:8080". Both work; HTTP_PORTS is preferred for containers.',
  },
];

@Component({
  selector: 'app-aspnet-deployment',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './deployment.html',
  styleUrl: './deployment.scss',
})
export class AspnetDeployment {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
