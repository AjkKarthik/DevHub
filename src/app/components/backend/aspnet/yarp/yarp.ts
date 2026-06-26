import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-yarp',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './yarp.html',
  styleUrl: './yarp.scss',
})
export class AspnetYarp {

  quickRef: QuickRefItem[] = [
    { name: 'AddReverseProxy()',              type: 'method',   desc: 'Registers YARP services and loads route/cluster config.' },
    { name: 'MapReverseProxy()',              type: 'method',   desc: 'Adds the proxy middleware and maps routes to the request pipeline.' },
    { name: 'RouteConfig',                   type: 'class',    desc: 'Maps an incoming route pattern to a cluster. Has Match, ClusterId, Transforms.' },
    { name: 'ClusterConfig',                 type: 'class',    desc: 'Defines destination addresses and load-balancing for a backend cluster.' },
    { name: 'DestinationConfig',             type: 'class',    desc: 'Address (http/https URL) of a single backend instance in a cluster.' },
    { name: 'IProxyStatefulSessionFeature',  type: 'interface','desc': 'Sticky session support — routes repeated requests to the same destination.' },
    { name: 'RequestTransform',              type: 'class',    desc: 'Modifies request headers, path, or query before forwarding.' },
    { name: 'ResponseTransform',             type: 'class',    desc: 'Modifies response headers after the backend reply.' },
    { name: 'IProxyConfigProvider',          type: 'interface','desc': 'Implement to supply route/cluster config dynamically from a database or API.' },
    { name: 'LoadBalancingPolicy',           type: 'keyword',  desc: 'RoundRobin, LeastRequests, Random, PowerOfTwoChoices, FirstAlphabetical.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is YARP?',
      points: ['YARP (Yet Another Reverse Proxy) is a Microsoft-built, production-ready reverse proxy library for ASP.NET Core. Unlike Nginx or HAProxy, YARP runs in-process inside your .NET app — you can intercept and transform requests in C# with full access to DI, middleware, auth, and logging. It is used in production at Microsoft scale.'],
    },
    {
      heading: 'Routes and Clusters',
      points: ['A Route defines what incoming requests to match (path pattern, host, headers) and which cluster to forward them to. A Cluster defines the backend destinations (one or more URLs) and how to load-balance across them. Routes reference clusters by ClusterId. This is the core YARP data model — everything else builds on it.'],
    },
    {
      heading: 'Transforms',
      points: ['Transforms modify requests before forwarding or responses before returning. Built-in transforms include PathPrefix (strip or add a path prefix), RequestHeaderOriginalHost (preserve the original Host header), X-Forwarded headers, and header add/remove. Custom transforms implement IRequestTransform or IResponseTransform.'],
    },
    {
      heading: 'Dynamic Configuration',
      points: ['By default, YARP reads route/cluster config from appsettings.json and watches for changes. For fully dynamic config (from a database or service registry), implement IProxyConfigProvider and inject it. YARP polls the provider for changes and hot-reloads without restarting. This enables service-discovery-driven routing.'],
    },
    {
      heading: 'Middleware Integration',
      points: ['Because YARP is an ASP.NET Core middleware, you can place auth middleware, rate limiting, logging, and custom middleware before or after the proxy. MapReverseProxy() accepts a pipeline builder — add endpoint-specific middleware inside the proxy pipeline. This makes YARP a natural API gateway replacement for .NET-centric stacks.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Setup',
      language: 'csharp',
      code: `// NuGet: Yarp.ReverseProxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();`,
    },
    {
      label: 'appsettings.json',
      language: 'csharp',
      code: `{
  "ReverseProxy": {
    "Routes": {
      "products-route": {
        "ClusterId": "products-cluster",
        "Match": { "Path": "/api/products/{**catch-all}" },
        "Transforms": [
          { "PathPattern": "/products/{**catch-all}" }
        ]
      },
      "orders-route": {
        "ClusterId": "orders-cluster",
        "Match": {
          "Path": "/api/orders/{**catch-all}",
          "Headers": [{ "Name": "X-Api-Version", "Values": ["2"] }]
        }
      }
    },
    "Clusters": {
      "products-cluster": {
        "LoadBalancingPolicy": "RoundRobin",
        "Destinations": {
          "dest1": { "Address": "http://products-svc-1:8080/" },
          "dest2": { "Address": "http://products-svc-2:8080/" }
        }
      },
      "orders-cluster": {
        "Destinations": {
          "dest1": { "Address": "http://orders-svc:8080/" }
        }
      }
    }
  }
}`,
    },
    {
      label: 'Middleware Pipeline',
      language: 'csharp',
      code: `app.MapReverseProxy(proxyPipeline =>
{
    // Middleware runs inside the proxy pipeline — after route matched, before forwarding
    proxyPipeline.Use(async (ctx, next) =>
    {
        // Log the matched route
        var feature = ctx.Features.Get<IReverseProxyFeature>();
        Console.WriteLine(\`Proxying to cluster: \${feature?.Route.Config.ClusterId}\`);
        await next();
    });

    // Built-in: session affinity, load-balancing, health checks
    proxyPipeline.UseSessionAffinity();
    proxyPipeline.UseLoadBalancing();
    proxyPipeline.UsePassiveHealthChecks();
});`,
    },
    {
      label: 'Transforms',
      language: 'csharp',
      code: `builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddTransforms(ctx =>
    {
        // Strip /api prefix before forwarding
        ctx.AddPathRemovePrefix("/api");

        // Add a correlation ID header
        ctx.AddRequestTransform(async reqCtx =>
        {
            var correlationId = Guid.NewGuid().ToString();
            reqCtx.ProxyRequest.Headers.Add("X-Correlation-Id", correlationId);
            reqCtx.HttpContext.Items["CorrelationId"] = correlationId;
        });

        // Forward the original Host header
        ctx.AddOriginalHost(true);

        // Remove internal header before sending to backend
        ctx.AddRequestHeaderRemove("X-Internal-Auth");
    });`,
    },
    {
      label: 'Dynamic Config',
      language: 'csharp',
      code: `public class DbProxyConfigProvider(IServiceScopeFactory scopeFactory)
    : IProxyConfigProvider
{
    private volatile InMemoryConfig _config = new([], []);

    public IProxyConfig GetConfig() => _config;

    public async Task LoadAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var routes = await db.ProxyRoutes
            .Select(r => new RouteConfig { RouteId = r.Id, ClusterId = r.ClusterId,
                Match = new RouteMatch { Path = r.PathPattern } })
            .ToListAsync(ct);

        var clusters = await db.ProxyClusters
            .Select(c => new ClusterConfig { ClusterId = c.Id,
                Destinations = new Dictionary<string, DestinationConfig>
                { ["primary"] = new() { Address = c.Address } } })
            .ToListAsync(ct);

        var old = _config;
        _config = new InMemoryConfig(routes, clusters);
        old.SignalChange();
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to strip the route prefix before forwarding',
      wrong: `// Route matches /api/products/{**catch-all}
// Backend receives /api/products/123 — expects /products/123`,
      right: `"Transforms": [{ "PathPattern": "/products/{**catch-all}" }]
// or in code: ctx.AddPathRemovePrefix("/api")`,
      explanation: 'YARP forwards the full matched path by default. If the backend has a different base path, use a path transform to rewrite it before forwarding.',
    },
    {
      title: 'Not configuring health checks for destination failure',
      wrong: `"Clusters": { "api": { "Destinations": { "d1": { "Address": "http://api:80/" } } } }
// If api:80 goes down, requests fail with no automatic retry`,
      right: `"Clusters": { "api": {
    "HealthCheck": { "Passive": { "Enabled": true } },
    "Destinations": { "d1": { "Address": "http://api:80/" } }
}}`,
      explanation: 'Enable passive health checks so YARP marks failing destinations as unhealthy and stops routing to them until they recover.',
    },
    {
      title: 'Adding auth middleware after MapReverseProxy()',
      wrong: `app.MapReverseProxy();
app.UseAuthentication(); // too late — already proxied`,
      right: `app.UseAuthentication();
app.UseAuthorization();
app.MapReverseProxy();`,
      explanation: 'Middleware runs in order. Auth must run before the proxy middleware so it can reject unauthenticated requests before forwarding.',
    },
    {
      title: 'Using YARP as a security boundary without validating tokens',
      wrong: `// Simply proxying requests without verifying the caller is authenticated
app.MapReverseProxy(); // open to unauthenticated traffic`,
      right: `// Add RequireAuthorization() policy to routes or check auth in pipeline
app.MapReverseProxy().RequireAuthorization("RequireApiKey");`,
      explanation: 'A reverse proxy is not an authentication mechanism by itself. Always add auth middleware and policies to protect backend services from unauthenticated proxied requests.',
    },
  ];

  challenge: Challenge = {
    title: 'Gateway with Path Rewrite',
    language: 'csharp',
    description: `Configure YARP to:
1. Match requests to /gateway/products/{**rest} and forward to http://localhost:5100 with path rewritten to /products/{**rest}.
2. Match requests to /gateway/orders/{**rest} and forward to http://localhost:5200 with path rewritten to /orders/{**rest}.
3. Use RoundRobin load balancing on the products cluster (two destinations).`,
    hints: [
      'Use PathPattern transform: "/products/{**rest}"',
      'Two destinations in the products cluster with RoundRobin policy',
      'Define routes and clusters in the ReverseProxy config section',
    ],
    starterCode: `// appsettings.json — add ReverseProxy section
// Program.cs
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
var app = builder.Build();
app.MapReverseProxy();`,
    solution: `// appsettings.json
{
  "ReverseProxy": {
    "Routes": {
      "products": {
        "ClusterId": "products-cluster",
        "Match": { "Path": "/gateway/products/{**rest}" },
        "Transforms": [{ "PathPattern": "/products/{**rest}" }]
      },
      "orders": {
        "ClusterId": "orders-cluster",
        "Match": { "Path": "/gateway/orders/{**rest}" },
        "Transforms": [{ "PathPattern": "/orders/{**rest}" }]
      }
    },
    "Clusters": {
      "products-cluster": {
        "LoadBalancingPolicy": "RoundRobin",
        "Destinations": {
          "dest1": { "Address": "http://localhost:5100/" },
          "dest2": { "Address": "http://localhost:5101/" }
        }
      },
      "orders-cluster": {
        "Destinations": {
          "dest1": { "Address": "http://localhost:5200/" }
        }
      }
    }
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What are the two core configuration objects in YARP?',
      options: [
        'Middleware and Endpoints',
        'Routes and Clusters',
        'Transforms and Policies',
        'Destinations and Handlers',
      ],
      answer: 1,
      explanation: 'Routes define what to match and which cluster to forward to. Clusters define the backend destinations and load-balancing policy.',
    },
    {
      q: 'What does a PathPattern transform do?',
      options: [
        'Validates the path against a regex',
        'Rewrites the forwarded request path using a pattern',
        'Strips query strings from the path',
        'Encrypts the path before forwarding',
      ],
      answer: 1,
      explanation: 'PathPattern rewrites the request path before it is sent to the backend — used to strip a prefix (e.g., /api/products → /products).',
    },
    {
      q: 'How do you implement dynamic route/cluster configuration from a database?',
      options: [
        'Call LoadFromConfig with a database connection string',
        'Implement IProxyConfigProvider and inject it',
        'Use IConfiguration.Reload()',
        'Call MapReverseProxy() multiple times',
      ],
      answer: 1,
      explanation: 'Implement IProxyConfigProvider to supply route and cluster configs dynamically. YARP polls the provider for changes and hot-reloads configuration.',
    },
    {
      q: 'Where should authentication middleware be placed relative to MapReverseProxy()?',
      options: [
        'Inside the proxy pipeline builder lambda',
        'After app.MapReverseProxy()',
        'Before app.MapReverseProxy() in the main pipeline',
        'Authentication is not supported with YARP',
      ],
      answer: 2,
      explanation: 'Auth middleware (UseAuthentication, UseAuthorization) must run before MapReverseProxy() so requests can be rejected before being forwarded to the backend.',
    },
    {
      q: 'Which built-in load-balancing policy distributes load based on current request counts?',
      options: ['RoundRobin', 'Random', 'LeastRequests', 'FirstAlphabetical'],
      answer: 2,
      explanation: 'LeastRequests routes each new request to the destination currently handling the fewest in-flight requests — good for variable-duration backend operations.',
    },
    {
      q: 'How does YARP handle passive health checking for backend destinations?',
      options: [
        'YARP pings each destination every 30 seconds and marks unhealthy ones',
        'Passive health checking monitors real traffic — if a destination returns 5xx errors above a threshold, YARP marks it unhealthy and stops routing to it',
        'Passive health checking is not supported — YARP only supports active (probe) health checks',
        'YARP delegates health checking entirely to the load balancer policy',
      ],
      answer: 1,
      explanation: 'Passive health checking in YARP observes actual proxy responses. Configure ThresholdFailureRateDetector — if error responses exceed a threshold within a time window, the destination is marked unhealthy and excluded from routing. Active health checking sends scheduled probe requests to a health endpoint. Using both together provides the most robust failure detection.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does YARP compare to Ocelot?',
      a: 'YARP is Microsoft-built, actively maintained, and highly performant — it runs inside the ASP.NET pipeline with full DI access. Ocelot is community-maintained and simpler to configure via JSON but has less flexibility for custom transforms and middleware. YARP is the recommended choice for new .NET gateway projects.',
    },
    {
      q: 'Can YARP handle WebSocket proxying?',
      a: 'Yes. YARP transparently proxies WebSocket connections — if the backend returns 101 Switching Protocols, YARP upgrades the connection and tunnels the WebSocket frames bidirectionally.',
    },
    {
      q: 'How do I add rate limiting to proxied routes?',
      a: 'Add rate limiting middleware (UseRateLimiter()) before MapReverseProxy() and apply policies with .RequireRateLimiting("PolicyName") inside the proxy pipeline builder, or configure rate-limiting on the route metadata.',
    },
    {
      q: 'Does YARP support gRPC proxying?',
      a: 'Yes. YARP supports HTTP/2 and gRPC proxying when the backend accepts HTTP/2. Set the HttpVersion to "2" in the cluster\'s HttpClient options and ensure TLS or plaintext H2 is configured on both sides.',
    },
    {
      q: 'How do I add custom request headers to proxied requests in YARP?',
      a: 'Use the RequestHeaderTransform: in routes config, add "Transforms": [{ "RequestHeader": "X-Forwarded-App", "Set": "my-gateway" }]. For code-based transforms, use the pipeline builder in MapReverseProxy: proxy.UseAfterProxy((ctx, next) => { ctx.ProxyRequest?.Headers.Add("X-Custom", "value"); return next(ctx); }). For dynamic headers (e.g., from auth context), implement ITransformProvider and inject it.',
    },
    {
      q: 'How do I implement circuit breaking for YARP backend destinations?',
      a: 'YARP does not include a built-in circuit breaker, but integrates cleanly with Polly. Register an HttpMessageHandler on the cluster\'s HttpClient with a ResiliencePipelineBuilder: services.AddHttpClient("cluster-id").AddResilienceHandler("circuit-breaker", builder => { builder.AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage> { ... }); }). Passive health checking complements this — together they handle both rapid failure detection (circuit breaker) and graceful re-admission (health checks).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'YARP is an in-process .NET reverse proxy — Routes match requests, Clusters define backends, Transforms rewrite paths/headers, all fully extensible via C# middleware.',
    mustKnow: [
      'AddReverseProxy().LoadFromConfig() + app.MapReverseProxy() is the minimal setup',
      'Routes: match pattern + ClusterId. Clusters: destinations + load-balancing policy',
      'PathPattern transform rewrites the path before forwarding to the backend',
      'Auth middleware must come BEFORE MapReverseProxy() in the pipeline',
      'Dynamic config: implement IProxyConfigProvider for database or service-registry-driven routing',
      'Passive health checks mark failing destinations unhealthy automatically',
    ],
    interviewFocus: [
      'YARP vs Nginx/Ocelot — why in-process .NET proxy gives more flexibility',
      'Route → Cluster model and how they relate',
      'How transforms solve the path-prefix mismatch between gateway and backend',
      'Dynamic configuration for service-discovery-driven proxying',
    ],
  };
}
