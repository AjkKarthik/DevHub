import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-deployment',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
    BeforeAfterComponent, CommonMistakesComponent, PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './deployment.html',
  styleUrl: './deployment.scss',
})
export class AspnetDeployment {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware', route: '/aspnet/middleware' },
    { label: 'Configuration & Options', route: '/aspnet/configuration' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'dotnet publish',             type: 'keyword', desc: 'Compiles and publishes the app output to a folder or container image.', since: '.NET 5+' },
    { name: '--self-contained',           type: 'keyword', desc: 'Bundles the .NET runtime in the output; no runtime required on the target machine.', since: '.NET 5+' },
    { name: '--runtime (-r)',             type: 'keyword', desc: 'Target RID (linux-x64, win-x64, osx-arm64) — required for self-contained publish.', since: '.NET 5+' },
    { name: 'PublishAot=true',            type: 'keyword', desc: 'Native AOT — compiles to a single native binary; no JIT at runtime. Fastest startup and lowest memory.', since: '.NET 8+' },
    { name: 'UseForwardedHeaders()',      type: 'method',  desc: 'Applies X-Forwarded-For/Proto headers from a reverse proxy. Must run before UseAuthentication.', since: 'Core 1+' },
    { name: 'ASPNETCORE_ENVIRONMENT',     type: 'keyword', desc: 'Controls which appsettings.{Env}.json is layered and how IsDevelopment()/IsProduction() behave.', since: 'Core 1+' },
    { name: 'ASPNETCORE_HTTP_PORTS',      type: 'keyword', desc: '.NET 8+ shorthand — set to "8080" to configure Kestrel port without a full URL string.', since: '.NET 8+' },
    { name: 'WebApplicationFactory',      type: 'class',   desc: 'Runs the real app in-process for integration tests — same pipeline as production.', since: 'Core 2.1+' },
    { name: 'UseHsts()',                  type: 'method',  desc: 'Adds Strict-Transport-Security header so browsers enforce HTTPS for subsequent requests.', since: 'Core 2.1+' },
    { name: 'KnownNetworks / KnownProxies', type: 'keyword', desc: 'Restrict ForwardedHeaders to trusted proxy IPs to prevent X-Forwarded-For spoofing.', since: 'Core 2.1+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Publish types — FDD, SCD, single-file, and Native AOT',
      points: [
        '<strong>Framework-Dependent Deployment (FDD)</strong>: smallest output (~2 MB); requires .NET runtime installed on the host. Default publish mode. Used in Docker (runtime image has the runtime) and Azure App Service (runtime pre-installed).',
        '<strong>Self-Contained Deployment (SCD)</strong>: bundles the entire runtime into the output (~60–90 MB). No runtime prerequisite — ideal for edge devices, bare-metal servers, and environments you cannot control. Add <code>-r linux-x64 --self-contained true</code>.',
        '<strong>Single-file</strong>: <code>-p:PublishSingleFile=true</code> packs all assemblies into one executable for cleaner deployment. Still requires the runtime unless combined with <code>--self-contained</code>. Native libraries are extracted to a temp folder on first run.',
        '<strong>Native AOT</strong> (.NET 8+ for broad scenarios): compiles the entire app to a platform-native binary — no JIT at runtime. Startup: &lt;10 ms, memory: &lt;20 MB. Constraints: no reflection-based serialisation (requires JSON source generators), limited middleware ecosystem, no dynamic <code>Assembly.Load</code>.',
        'Publish command pattern: <code>dotnet publish -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=true -o ./publish</code>. Always add <code>--no-restore</code> when the restore step is already cached (e.g., in CI) to skip redundant network calls.',
      ],
    },
    {
      heading: 'Multi-stage Dockerfiles — small images, secure builds',
      points: [
        '<strong>Stage 1 (SDK image)</strong>: copy <code>.csproj</code> files first then <code>dotnet restore</code> — this layer is cached and reused as long as dependencies do not change. Copying source then restoring invalidates the cache on every code change.',
        '<strong>Stage 2 (runtime image)</strong>: copy only the published output from stage 1 with <code>COPY --from=build /app/publish .</code>. The final image contains no SDK, no source code, no build artefacts — ~200 MB vs ~800 MB for the SDK image.',
        'Run as a <strong>non-root user</strong>: <code>RUN adduser --disabled-password appuser && chown -R appuser /app; USER appuser</code>. Running as root inside a container is a security risk — if the app is compromised, the attacker gains root access to the container filesystem.',
        'Add a <code>HEALTHCHECK</code> instruction: <code>CMD curl -f http://localhost:8080/health/live || exit 1</code>. Docker and orchestrators use it to determine container health; without it, a process crash is the only signal. Non-root images may need to install <code>curl</code> or switch to a <code>/bin/sh</code>-based check.',
        'Use <code>ENV ASPNETCORE_HTTP_PORTS=8080</code> and <code>EXPOSE 8080</code>. Running on port 8080 (not 443) in the container is correct — TLS termination belongs at the ingress/load balancer, not inside the container.',
      ],
    },
    {
      heading: 'Reverse proxy and ForwardedHeaders',
      points: [
        'When behind Nginx, an Azure Application Gateway, an AWS ALB, or a Kubernetes ingress, the app receives requests from the proxy\'s IP, not the client\'s. The original client IP and HTTPS scheme travel in <code>X-Forwarded-For</code> and <code>X-Forwarded-Proto</code> headers.',
        'Call <code>app.UseForwardedHeaders()</code> with <code>ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto</code> to rewrite <code>HttpContext.Connection.RemoteIpAddress</code> and <code>Request.Scheme</code> from these headers — this makes the rest of the pipeline see the real client context.',
        '<strong>Call it before UseAuthentication()</strong>. Auth middleware reads <code>Request.Scheme</code> for redirect URIs in OAuth/OIDC flows. If the scheme is still "http" when auth runs, redirect URIs will be http:// instead of https:// — breaking secure cookies and OIDC callbacks.',
        '<strong>Restrict trusted proxies</strong>: clear <code>opts.KnownNetworks</code> and <code>opts.KnownProxies</code> and add only your internal proxy CIDR (<code>opts.KnownNetworks.Add(new IPNetwork(...))</code>). Trusting all proxies lets any client forge an X-Forwarded-For header and spoof their IP address.',
        'Nginx configuration must set <code>proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;</code> and <code>proxy_set_header X-Forwarded-Proto $scheme;</code>. Without these headers being forwarded, UseForwardedHeaders has no data to read.',
      ],
    },
    {
      heading: 'Environment-based configuration and secrets',
      points: [
        '<code>ASPNETCORE_ENVIRONMENT</code> controls which <code>appsettings.{Env}.json</code> is layered over the base config and how <code>app.Environment.IsProduction()</code> behaves. Set it as a container environment variable — never hard-code environment-specific values in the image.',
        'Use double-underscore (<code>__</code>) as the hierarchy separator in environment variables: <code>ConnectionStrings__Default</code> maps to <code>ConnectionStrings:Default</code>. Single colon (<code>:</code>) does not work on Linux (reserved by shell). This is the standard pattern for Docker Compose and Kubernetes ConfigMaps/Secrets.',
        '<strong>Never store real secrets in appsettings.json or bake them into a Docker image.</strong> Use environment variables in containers (passed at runtime), Kubernetes Secrets (base64-encoded, mounted as env vars or volume files), or a managed secret service (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault).',
        'Fail-fast on missing required config: <code>var connStr = builder.Configuration.GetConnectionString("Default") ?? throw new InvalidOperationException("...");</code>. This crashes the app at startup (not at first use under load) and surfaces the misconfiguration immediately.',
        'For local development, use <code>dotnet user-secrets</code> to store secrets outside the project directory: <code>dotnet user-secrets set "ConnectionStrings:Default" "..."</code>. Secrets are stored in the user profile, never in the repo.',
      ],
    },
    {
      heading: 'Kestrel configuration and HTTPS in production',
      points: [
        'Kestrel is the default, cross-platform HTTP server embedded in ASP.NET Core. In production, always put a reverse proxy (Nginx, Caddy, Azure Front Door) in front of Kestrel for TLS termination, load balancing, and DDoS protection.',
        'Configure Kestrel limits in <code>appsettings.json</code> under <code>"Kestrel"</code>: <code>MaxConcurrentConnections</code>, <code>MaxRequestBodySize</code> (default 30 MB), <code>KeepAliveTimeout</code>, and <code>Http2.MaxStreamsPerConnection</code>. The defaults are conservative; tune for your load profile.',
        'For HTTPS in containers where you own TLS (e.g., internal services), mount a certificate volume and configure <code>Kestrel.Endpoints.Https.Certificate</code> in config. For public-facing endpoints, use the reverse proxy for TLS and run Kestrel on plain HTTP inside the cluster.',
        '<code>app.UseHsts()</code> adds the <code>Strict-Transport-Security</code> header — browsers remember to use HTTPS for subsequent visits even if the user types a plain URL. Enable only in production (it causes issues in dev with self-signed certificates).',
        '<code>app.UseHttpsRedirection()</code> in production redirects all HTTP requests to HTTPS. Skip this in containers when the proxy handles TLS — adding it means every internal health-check or service-to-service HTTP call gets a 301 redirect, creating unnecessary overhead.',
      ],
    },
    {
      heading: 'Kubernetes deployment patterns and health probes',
      points: [
        'A minimal Kubernetes deployment needs: a <code>Deployment</code> (manages pod replicas), a <code>Service</code> (stable DNS + load balancing), and optionally an <code>Ingress</code> (routes external HTTP traffic). Use <code>kubectl apply -f</code> with YAML manifests checked into source control.',
        'Database migrations in k8s: run as an <strong>init container</strong> that runs <code>dotnet ef database update</code> before the main API container starts. This ensures the schema is ready before the app receives traffic, and runs only on the pod that \'wins\' the race — other replicas wait for the init container to complete.',
        'Kubernetes uses <strong>liveness, readiness, and startup probes</strong> to manage pod lifecycle. Liveness: restart the pod if it is stuck. Readiness: remove the pod from load balancing if not yet ready. Startup: give slow-starting apps extra time before liveness kicks in. Wire these to your <code>/health/live</code> and <code>/health/ready</code> endpoints.',
        '<strong>Resource requests and limits</strong>: always set <code>resources.requests</code> (guaranteed) and <code>resources.limits</code> (capped). Without requests, pods land on overloaded nodes; without limits, one pod can starve others. A typical web API: requests 100m CPU / 128Mi RAM, limits 500m / 256Mi.',
        '<code>HorizontalPodAutoscaler (HPA)</code> scales the Deployment replica count based on CPU, memory, or custom metrics. Combine with <code>PodDisruptionBudget (PDB)</code> to guarantee a minimum number of available replicas during node maintenance — preventing outages during rolling updates.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'dotnet publish flags',
      language: 'csharp',
      code: `# Framework-dependent (smallest, needs runtime on host)
dotnet publish -c Release -o ./publish

# Self-contained for Linux x64
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish

# Single-file self-contained
dotnet publish -c Release -r linux-x64 --self-contained true \
  -p:PublishSingleFile=true -o ./publish

# Native AOT (.csproj must have <PublishAot>true</PublishAot>)
dotnet publish -c Release -r linux-x64 -o ./publish

# .csproj for Native AOT
# <PropertyGroup>
#   <PublishAot>true</PublishAot>
#   <InvariantGlobalization>true</InvariantGlobalization>
# </PropertyGroup>

# Docker build and run
docker build -t myapi:latest .
docker run -d -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Default="Server=db;Database=app;User=sa;Password=..." \
  myapi:latest`,
    },
    {
      label: 'Multi-Stage Dockerfile',
      language: 'csharp',
      code: `FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore layer cached unless .csproj changes
COPY ["MyApi/MyApi.csproj", "MyApi/"]
RUN dotnet restore "MyApi/MyApi.csproj"

# Build and publish
COPY . .
WORKDIR "/src/MyApi"
RUN dotnet publish "MyApi.csproj" -c Release -o /app/publish --no-restore

# ── Runtime image (no SDK, no source, ~200 MB vs ~800 MB) ────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Non-root user — reduces blast radius if container is compromised
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
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

    // Restrict to your known proxy CIDR — prevents IP spoofing
    opts.KnownNetworks.Clear();
    opts.KnownProxies.Clear();
    opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
});

app.UseForwardedHeaders();   // ← must be first
app.UseAuthentication();
app.UseAuthorization();

// Nginx upstream config (nginx.conf):
// proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
// proxy_set_header X-Forwarded-Proto $scheme;
// proxy_set_header Host               $host;
// proxy_pass http://localhost:8080;`,
    },
    {
      label: 'Environment Config & Secrets',
      language: 'csharp',
      code: `// appsettings.json (base — safe to commit; no secrets)
// { "Logging": { "LogLevel": { "Default": "Information" } } }

// appsettings.Production.json (committed, production-safe overrides)
// { "Logging": { "LogLevel": { "Default": "Warning" } } }

// Environment variables (double-underscore = colon hierarchy separator)
// ASPNETCORE_ENVIRONMENT          → Environment name
// ConnectionStrings__Default      → ConnectionStrings:Default
// Logging__LogLevel__Default      → Logging:LogLevel:Default

// docker-compose.yml
// services:
//   api:
//     environment:
//       - ASPNETCORE_ENVIRONMENT=Production
//       - ConnectionStrings__Default=Server=db;Database=app;...

// Fail-fast if required config is missing
var connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");

// HTTPS only in production
if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Local secrets (never in repo)
// dotnet user-secrets set "ConnectionStrings:Default" "..."`,
    },
    {
      label: 'Kubernetes Deployment YAML',
      language: 'csharp',
      code: `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapi
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapi
  template:
    metadata:
      labels:
        app: myapi
    spec:
      initContainers:
        - name: migrate
          image: myapi:latest
          command: ["dotnet", "MyApi.dll", "--migrate"]
          env:
            - name: ConnectionStrings__Default
              valueFrom:
                secretKeyRef:
                  name: myapi-secrets
                  key: connection-string
      containers:
        - name: myapi
          image: myapi:latest
          ports:
            - containerPort: 8080
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: Production
            - name: ConnectionStrings__Default
              valueFrom:
                secretKeyRef:
                  name: myapi-secrets
                  key: connection-string
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10`,
    },
    {
      label: 'Native AOT Setup',
      language: 'csharp',
      code: `// Requirements:
//   - Minimal APIs (MVC controllers not fully AOT-ready as of .NET 9)
//   - Source generators for JSON (no runtime reflection serialisation)
//   - No dynamic Assembly.Load or Activator.CreateInstance with unknown types

// MyApi.csproj
// <PropertyGroup>
//   <PublishAot>true</PublishAot>
//   <InvariantGlobalization>true</InvariantGlobalization>
// </PropertyGroup>

// Program.cs
var builder = WebApplication.CreateSlimBuilder(args);  // AOT-optimised host

builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default);
});

var app = builder.Build();
app.MapGet("/products", () => new[] { new Product(1, "Widget") });
app.Run();

// JSON source gen context — required; replaces runtime reflection
[JsonSerializable(typeof(Product[]))]
[JsonSerializable(typeof(Product))]
internal partial class AppJsonContext : JsonSerializerContext { }

public record Product(int Id, string Name);

// Build: dotnet publish -c Release -r linux-x64
// ILC compiler warns about reflection incompatible with AOT — fix all warnings before shipping.`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Single-stage Docker build vs multi-stage (image size)',
      before: `# Single-stage — final image includes SDK + source + build artefacts
FROM mcr.microsoft.com/dotnet/sdk:9.0
WORKDIR /app
COPY . .
RUN dotnet publish -c Release -o /app/publish
EXPOSE 8080
ENTRYPOINT ["dotnet", "/app/publish/MyApi.dll"]
# Final image: ~800 MB (SDK + build cache + source code inside the image)`,
      after: `# Multi-stage — final image contains only published output
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
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "MyApi.dll"]
# Final image: ~200 MB — no SDK, no source, no build artefacts`,
      note: 'The .NET SDK image is ~800 MB; the ASP.NET Core runtime image is ~200 MB. Multi-stage builds discard the SDK after compilation — only the published output lands in the deployable image, reducing pull time, attack surface, and storage cost.',
    },
    {
      title: 'Config secrets in appsettings vs environment variables / Key Vault',
      before: `// appsettings.Production.json — committed to source control
{
  "ConnectionStrings": {
    "Default": "Server=prod-sql;Database=app;User=sa;Password=SuperSecret123!"
  },
  "Jwt": {
    "Secret": "my-very-secret-key-do-not-share"
  }
}
// PROBLEM: secrets visible to anyone with repo access,
// appear in git history forever, rotate by editing code`,
      after: `// appsettings.json — no secrets (safe to commit)
{
  "ConnectionStrings": { "Default": "" }
}

// Secrets provided at runtime via environment variables:
// docker run -e ConnectionStrings__Default="Server=..." myapi

// Or via Azure Key Vault (no secrets ever touch the container):
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myvault.vault.azure.net/"),
    new DefaultAzureCredential());
// App reads config normally — Key Vault is just another config provider`,
      note: 'Secrets in appsettings files are committed to git and persist in history. They cannot be rotated without a code change. Environment variables are injected at runtime (not stored in the image), and managed secret services (Key Vault, Secrets Manager) provide rotation, audit logging, and fine-grained access control.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling db.Database.Migrate() in app startup on every pod',
      wrong: `// Program.cs — runs migration on EVERY pod start
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();   // ← race condition when 3 pods start simultaneously
}
app.Run();
// Pod A and Pod B both detect pending migrations → both apply them → DB corruption`,
      right: `// Run migrations as a Kubernetes init container (runs once, before pods start):
// initContainers:
//   - name: migrate
//     image: myapi:latest
//     command: ["dotnet", "MyApi.dll", "--migrate"]

// In Program.cs, check for the flag:
if (args.Contains("--migrate"))
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
    return;  // exit after migrating
}
app.Run();`,
      explanation: 'Running migrations on every pod startup creates a race condition on scale-out: two pods detect the same pending migration, both start applying it, and the second runner fails or corrupts the schema. Use a k8s init container (or a separate CI step) to run migrations exactly once before any app pod starts.',
    },
    {
      title: 'Placing UseForwardedHeaders() after UseAuthentication()',
      wrong: `// WRONG order — auth runs before X-Forwarded-Proto is applied
app.UseAuthentication();         // ← Request.Scheme is still "http"
app.UseAuthorization();
app.UseForwardedHeaders();       // ← too late; auth redirect already used http://`,
      right: `// CORRECT order — forwarded headers rewrite scheme before auth needs it
app.UseForwardedHeaders();       // ← first: rewrite scheme and IP
app.UseAuthentication();         // ← now sees https:// scheme correctly
app.UseAuthorization();`,
      explanation: 'OAuth and OIDC middleware read Request.Scheme when constructing callback/redirect URIs. If UseForwardedHeaders runs after authentication, the scheme is still "http" (as received from the proxy). Auth redirects use http:// instead of https://, breaking OIDC callbacks and secure-cookie issuance behind HTTPS-terminating proxies.',
    },
    {
      title: 'Trusting all proxies in ForwardedHeaders (IP spoofing risk)',
      wrong: `// BUG: clears known networks without adding trusted proxy — trusts ALL sources
builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    opts.KnownNetworks.Clear();   // now trusts ALL X-Forwarded-For headers
    opts.KnownProxies.Clear();    // ← attacker can set X-Forwarded-For: 127.0.0.1
});`,
      right: `builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    opts.KnownNetworks.Clear();
    opts.KnownProxies.Clear();
    // Add only your proxy's CIDR — internal cluster network
    opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
});`,
      explanation: 'Clearing KnownNetworks and KnownProxies without adding trusted entries makes ASP.NET Core trust X-Forwarded-For from any source. An attacker on the internet can set X-Forwarded-For: 127.0.0.1 and the app will believe the request came from localhost — bypassing IP-based allow lists or rate limiting. Always add only your known proxy CIDR.',
    },
    {
      title: 'Restoring NuGet packages on every Docker build layer',
      wrong: `# BUG: copying all source before restore — cache breaks on every code change
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .                         # ← copies everything including source
RUN dotnet restore               # ← cache miss on every single code change
RUN dotnet publish -c Release -o /app/publish`,
      right: `FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MyApi/MyApi.csproj", "MyApi/"]  # ← only project files first
RUN dotnet restore "MyApi/MyApi.csproj" # ← cached until .csproj changes
COPY . .                                # ← now copy source
RUN dotnet publish -c Release -o /app/publish --no-restore`,
      explanation: 'Docker layer caching invalidates a layer and all subsequent layers when any file in the COPY source changes. Copying all source before restore means restore runs on every build — even for a one-line code fix. Copy only .csproj files first (they change rarely), restore, then copy the full source. This keeps the restore layer cached for the vast majority of builds.',
    },
    {
      title: 'Using UseHttpsRedirection() in a container behind a TLS-terminating proxy',
      wrong: `// Container receives HTTP from the proxy — UseHttpsRedirection issues a 301
// Internal health checks, k8s probes, and service-to-service calls all get redirected
var app = builder.Build();
app.UseHttpsRedirection();   // ← redirects every internal HTTP request to HTTPS
// k8s liveness probe fails: probe sends http://10.x.x.x:8080/health/live → 301 → probe fails`,
      right: `// Apply HTTPS redirect only in environments that actually receive public HTTP
var app = builder.Build();
if (!app.Environment.IsDevelopment() && app.Configuration["ProxyHandlesTls"] != "true")
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
// Container behind ingress: proxy handles TLS, container runs plain HTTP internally
// No redirects to interrupt health probes or inter-service calls`,
      explanation: 'When a reverse proxy or ingress controller terminates TLS, your container only ever receives plain HTTP. UseHttpsRedirection redirects every HTTP request — including k8s readiness probes, liveness checks, and internal service calls — causing probe failures and 301 redirect loops. Disable it in containerised deployments where TLS is handled upstream.',
    },
  ];

  challenge: Challenge = {
    title: 'Containerise a Minimal API',
    language: 'csharp',
    description: `Create a production-ready Docker setup:
1. <strong>Multi-stage Dockerfile</strong> (SDK build stage → ASP.NET runtime stage).
2. Run as a <strong>non-root user</strong>.
3. Add a <code>GET /health/live</code> endpoint returning 200 OK and a <code>GET /health/ready</code> endpoint that checks the database.
4. Add a <code>HEALTHCHECK</code> instruction in the Dockerfile.
5. App reads the connection string from <code>ConnectionStrings__Default</code> environment variable and <strong>throws at startup</strong> if it is missing.`,
    hints: [
      'mcr.microsoft.com/dotnet/sdk:9.0 for build, mcr.microsoft.com/dotnet/aspnet:9.0 for runtime',
      'Copy .csproj first, restore, then copy source — preserves Docker layer cache',
      'ENV ASPNETCORE_HTTP_PORTS=8080 sets the listen port',
      'builder.Configuration.GetConnectionString("Default") ?? throw new InvalidOperationException(...)',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();
var app = builder.Build();
app.MapHealthChecks("/health/live");
app.Run();`,
    solution: `# ── Dockerfile ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MyApi.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD curl -f http://localhost:8080/health/live || exit 1
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "MyApi.dll"]

# ── Program.cs ────────────────────────────────────────────────────────
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

var connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");

builder.Services.AddSqlite<AppDbContext>(connStr);
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

// Liveness — no dependencies (is the process alive?)
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
    ResultStatusCodes = { [HealthStatus.Healthy] = 200 },
});

// Readiness — checks database connectivity
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = hc => hc.Tags.Contains("database") || hc.Name == "database",
});

app.Run();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary reason to use a multi-stage Docker build?',
      options: [
        'Multi-stage builds are required by Kubernetes',
        'The SDK image is much larger; only the published output is copied to the final stage',
        'Multi-stage builds enable parallel compilation across multiple CPUs',
        'Single-stage builds do not support HEALTHCHECK instructions',
      ],
      answer: 1,
      explanation: 'The .NET SDK image is ~800 MB; the ASP.NET Core runtime image is ~200 MB. Multi-stage builds discard the SDK and source code after compilation — only the ~2–20 MB published output lands in the deployable image, reducing pull time, registry cost, and attack surface.',
    },
    {
      q: 'Why must UseForwardedHeaders() be called before UseAuthentication()?',
      options: [
        'Forwarded headers must be configured before SignalR negotiation',
        'Auth middleware reads Request.Scheme for redirect URIs — it must see the real HTTPS scheme before auth runs',
        'ForwardedHeaders middleware requires the database connection to verify proxy origins',
        'UseAuthentication throws a MiddlewareOrderException if called before ForwardedHeaders',
      ],
      answer: 1,
      explanation: 'OAuth/OIDC middleware reads Request.Scheme when building redirect URIs. If the scheme is still "http" (as the proxy delivers it) when auth runs, callback URIs will use http:// — breaking OIDC flows and secure cookie issuance behind TLS-terminating proxies.',
    },
    {
      q: 'What does setting KnownNetworks.Clear() without adding any networks do in ForwardedHeadersOptions?',
      options: [
        'Disables forwarded header processing entirely',
        'Makes the middleware trust X-Forwarded-For headers from any source — enabling IP spoofing',
        'Restricts processing to localhost only',
        'Causes the app to throw at startup with a configuration error',
      ],
      answer: 1,
      explanation: 'Clearing KnownNetworks and KnownProxies without adding trusted entries makes ASP.NET Core accept X-Forwarded-For from ANY IP. An attacker can set X-Forwarded-For: 127.0.0.1 and the app thinks the request came from localhost — bypassing IP allow-lists and rate limiting. Always add your proxy CIDR after clearing.',
    },
    {
      q: 'What is the difference between self-contained deployment and Native AOT?',
      options: [
        'They are identical — both produce a single native binary with no runtime dependency',
        'Self-contained bundles the .NET runtime but still JITs at runtime; AOT compiles to native code with no JIT',
        'Self-contained is for Windows only; AOT works cross-platform',
        'AOT is slower than self-contained because it compiles ahead of time',
      ],
      answer: 1,
      explanation: 'Self-contained bundles the .NET runtime with the app — the JIT is still used at runtime. Native AOT compiles the entire application to platform-native machine code ahead of time — there is no JIT, no runtime code generation, and no .NET runtime required on the host. AOT has faster startup and lower memory but restricts reflection-based APIs.',
    },
    {
      q: 'Why should database migrations NOT run in app startup code (Program.cs) in a k8s deployment?',
      options: [
        'EF Core migrations do not work inside containers',
        'Multiple pods starting simultaneously can all detect the same pending migration and corrupt the schema',
        'Kubernetes blocks database connections during pod startup',
        'Migrations require a GUI tool and cannot run in a headless environment',
      ],
      answer: 1,
      explanation: 'When k8s scales from 0 to 3 pods simultaneously, all three run their startup code concurrently. If all three detect pending migrations and apply them, the second and third runners fail with table-already-exists errors (or worse, partially apply the same migration). Use a k8s init container or a CI deployment step to run migrations once before pods start.',
    },
    {
      q: 'What does ASPNETCORE_HTTP_PORTS=8080 configure?',
      options: [
        'The HTTPS certificate port for Kestrel',
        'The HTTP port Kestrel listens on — a simpler alternative to ASPNETCORE_URLS in containers',
        'The maximum number of concurrent HTTP connections',
        'The port exposed to the Docker host via port mapping',
      ],
      answer: 1,
      explanation: 'ASPNETCORE_HTTP_PORTS (introduced in .NET 8) is the simplest way to configure Kestrel\'s HTTP listen port in containers. Set it to "8080" and Kestrel listens on http://+:8080. It is equivalent to ASPNETCORE_URLS=http://+:8080 but cleaner for the common container use case.',
    },
    {
      q: 'Why should UseHttpsRedirection() be disabled in a container behind a TLS-terminating proxy?',
      options: [
        'Containers cannot make HTTPS connections',
        'The proxy terminates TLS so the container only receives HTTP — redirecting breaks health probes and inter-service calls',
        'UseHttpsRedirection conflicts with UseForwardedHeaders',
        'HTTPS redirect only works when ASPNETCORE_ENVIRONMENT=Development',
      ],
      answer: 1,
      explanation: 'When an ingress or load balancer terminates TLS, the container receives plain HTTP internally. UseHttpsRedirection issues a 301 for every HTTP request — including k8s liveness/readiness probes and internal service-to-service calls — causing probe failures and redirect loops. TLS handling belongs at the proxy; the container should serve plain HTTP internally.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between --self-contained and PublishAot?', a: '<code>--self-contained</code> bundles the .NET runtime and JIT compiler into the output — the runtime is shipped with the app but still compiles IL to machine code at runtime. <code>PublishAot=true</code> compiles everything ahead of time to a native binary — no JIT, no IL, no .NET runtime on the host. AOT startup is &lt;10 ms with ~20 MB memory; self-contained is ~100 ms with ~50 MB. AOT\'s constraint: no reflection-based serialisation, no dynamic code generation, limited middleware ecosystem.' },
    { q: 'How do I handle database migrations in a containerised deployment?', a: 'Run migrations as a Kubernetes init container or a separate CI/CD step before any app pod starts. In the init container, run <code>dotnet MyApi.dll --migrate</code> and have Program.cs exit immediately after applying migrations when that flag is present. This ensures migrations run exactly once, before traffic routes to the pods, and avoids race conditions between simultaneously starting replicas. Never rely on migrations completing in Program.cs startup when running more than one replica.' },
    { q: 'What is ASPNETCORE_HTTP_PORTS vs ASPNETCORE_URLS?', a: '<code>ASPNETCORE_HTTP_PORTS=8080</code> (introduced in .NET 8) is the simplest way to set the HTTP port — Kestrel listens on <code>http://+:8080</code>. <code>ASPNETCORE_URLS=http://+:8080</code> is the older, more flexible form that can specify full URLs including multiple endpoints. For containers, prefer <code>HTTP_PORTS</code> — it is cleaner and the standard in Microsoft\'s official container images.' },
    { q: 'How do I configure Kestrel to use HTTPS in a container?', a: 'For public-facing containers, TLS should terminate at the ingress/load balancer — the container runs plain HTTP internally. If you need end-to-end TLS (e.g., internal services requiring mTLS), mount a certificate as a Kubernetes Secret volume and configure <code>Kestrel:Endpoints:Https:Certificate:Path</code> and <code>:Password</code> in appsettings. For development, <code>dotnet dev-certs https --trust</code> installs a self-signed cert.' },
    { q: 'What are liveness vs readiness vs startup probes in Kubernetes?', a: '<strong>Liveness</strong>: "is the process alive?" — if it fails, k8s kills and restarts the pod. Wire to <code>/health/live</code> with no dependency checks (just return 200). <strong>Readiness</strong>: "is the pod ready to serve traffic?" — if it fails, the pod is removed from the Service load balancer but not killed. Wire to <code>/health/ready</code> which checks database/cache connectivity. <strong>Startup</strong>: gives slow-starting apps extra time before the liveness probe kicks in — prevents premature kills during a cold start with migrations or cache warming.' },
    { q: 'How should I pass secrets to a container without putting them in the image?', a: 'Three approaches in increasing security: (1) <strong>Environment variables</strong> at runtime: <code>docker run -e ConnectionStrings__Default="..."</code> or in docker-compose.yml — secrets are not in the image but visible in docker inspect. (2) <strong>Kubernetes Secrets</strong>: stored base64-encoded in the cluster, injected as env vars or mounted files — access controlled by RBAC. (3) <strong>Managed secret services</strong> (Azure Key Vault, AWS Secrets Manager): secrets never touch the container; the app uses a managed identity to fetch them at runtime — best for regulated environments.' },
    { q: 'Does Native AOT support Entity Framework Core?', a: 'Partially. EF Core added AOT compilation support in .NET 9 via source generators — you must use the <code>DbContext</code> source generator (<code>&lt;EfModelDiagnostics&gt;true&lt;/EfModelDiagnostics&gt;</code>) and avoid dynamic LINQ. Migrations, complex query translation, and some conventions may still fail. For data access in AOT scenarios, consider Dapper, raw ADO.NET, or simple SqlClient — they have no reflection requirements.' },
    { q: 'What Docker base images should I use for ASP.NET Core?', a: 'Use Microsoft\'s official images from <code>mcr.microsoft.com/dotnet/</code>: <code>dotnet/sdk:9.0</code> for the build stage, <code>dotnet/aspnet:9.0</code> for the runtime stage (ASP.NET Core dependencies included, ~200 MB). For minimal size, use <code>dotnet/runtime-deps:9.0-alpine</code> with a self-contained publish and a custom non-root user — produces ~100 MB images. The <code>chiseled</code> variants (Ubuntu Chiseled) strip OS components for extra security: <code>dotnet/aspnet:9.0-noble-chiseled</code>.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Multi-stage Dockerfiles keep images small by separating build from runtime; ForwardedHeaders must run before UseAuthentication to restore HTTPS scheme from proxies; trust only known proxy CIDRs to prevent IP spoofing; run migrations as init containers, not in startup code; and never store secrets in images or config files.',
    mustKnow: [
      'Multi-stage Docker: SDK image (~800 MB) for build, runtime image (~200 MB) for deploy — COPY --from=build only the published output',
      'Copy .csproj → restore → copy source — preserves Docker layer cache across code changes',
      'UseForwardedHeaders() BEFORE UseAuthentication() — auth needs the real HTTPS scheme for redirects',
      'Always set KnownNetworks to your proxy CIDR — clearing without restricting enables IP spoofing',
      'ASPNETCORE_HTTP_PORTS=8080 is the clean .NET 8+ way to set the container listen port',
      'Run db migrations in a k8s init container — concurrent pod startup can race and corrupt the schema',
      'Disable UseHttpsRedirection() in containers behind a TLS-terminating proxy — it breaks health probes',
    ],
    interviewFocus: [
      'Why use a multi-stage Dockerfile and what is the size difference between SDK and runtime images?',
      'Why must UseForwardedHeaders() come before UseAuthentication() in the middleware pipeline?',
      'What happens if you clear KnownNetworks in ForwardedHeadersOptions without adding trusted proxies?',
      'How should database migrations be handled in a Kubernetes deployment?',
      'What is the difference between self-contained deployment and Native AOT?',
    ],
  };
}
