import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-rate-limiting',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './rate-limiting.html',
  styleUrl: './rate-limiting.scss',
})
export class AspnetRateLimiting {

  quickRef: QuickRefItem[] = [
    { name: 'AddRateLimiter()',           type: 'method',  desc: 'Register rate limiting services and define named policies (.NET 7+)' },
    { name: 'UseRateLimiter()',           type: 'method',  desc: 'Middleware: enforce rate limits — add before UseAuthorization' },
    { name: 'AddFixedWindowLimiter()',    type: 'method',  desc: 'Allow N requests per fixed time window (e.g., 100 reqs/min)' },
    { name: 'AddSlidingWindowLimiter()', type: 'method',  desc: 'Smooth fixed window — segments prevent burst at window boundaries' },
    { name: 'AddTokenBucketLimiter()',   type: 'method',  desc: 'Tokens refilled over time — allows controlled bursts up to bucket size' },
    { name: 'AddConcurrencyLimiter()',   type: 'method',  desc: 'Limit simultaneous in-flight requests — throttles CPU/IO-bound work' },
    { name: 'RequireRateLimiting()',      type: 'method',  desc: 'Apply a named limiter to a minimal API endpoint or group' },
    { name: 'RateLimiterOptions.OnRejected', type: 'method', desc: 'Callback when a request is rejected — customize 429 response' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Four Rate Limiter Algorithms',
      points: [
        '<strong>Fixed window</strong>: allows N requests per time window. Simple but allows a burst at the window boundary — 100 requests at 00:59 and 100 more at 01:01 effectively sends 200 in 2 seconds.',
        '<strong>Sliding window</strong>: divides the window into segments and tracks requests per segment. Smooths out the boundary burst by distributing the quota over rolling time.',
        '<strong>Token bucket</strong>: tokens are added at a fixed replenishment rate; each request consumes a token. When the bucket is empty, requests are rejected. Allows bursts up to the bucket capacity — ideal for APIs that should allow temporary spikes but throttle sustained abuse.',
        '<strong>Concurrency limiter</strong>: limits the number of <em>simultaneous</em> requests rather than rate. Useful for CPU/IO-bound operations to prevent resource exhaustion. Released when the handler completes.',
      ],
    },
    {
      heading: 'Partitioned Limiters',
      points: [
        'A single global limit penalises well-behaved users when one client misbehaves. <strong>Partitioned limiters</strong> create per-partition quotas — each partition gets its own independent limit.',
        'Common partition keys: user ID (from JWT claims), API key, IP address, or tenant. Partition by authenticated user first; fall back to IP for anonymous traffic.',
        'Use <code>RateLimitPartition.GetFixedWindowLimiter(partitionKey, ...)</code> inside a <code>AddPartitionedRateLimiter</code> — the factory receives the <code>HttpContext</code> and returns a limiter for that partition key.',
      ],
    },
    {
      heading: 'Applying and Customising Limits',
      points: [
        'Apply limits globally via <code>UseRateLimiter()</code> with a default policy, per-group via <code>MapGroup("/api").RequireRateLimiting("default")</code>, or per-endpoint with <code>.RequireRateLimiting("upload")</code> for expensive operations.',
        'Return a proper 429 Too Many Requests with a <code>Retry-After</code> header: configure <code>OnRejected</code> in <code>AddRateLimiter()</code>. Without it, the default rejection returns 503 Service Unavailable.',
        'Mark endpoints that should bypass rate limiting with <code>.DisableRateLimiting()</code> — useful for health checks and metrics endpoints.',
      ],
    },
    {
      heading: 'Rate Limiting in Distributed Deployments',
      points: [
        'Built-in .NET rate limiting is <strong>per-process</strong>. In a 3-pod deployment, each pod has its own counters — effectively tripling the global limit. A "100 req/min" limit becomes "300 req/min" across the cluster.',
        'For distributed rate limiting, use a shared counter backed by Redis. The <code>AspNetCoreRateLimit</code> NuGet package or a custom implementation using Redis <code>INCR</code> + <code>EXPIRE</code> are common solutions.',
        'A simpler alternative for distributed deployments: put rate limiting in the API Gateway (Kong, APIM, AWS API Gateway, Nginx) and use ASP.NET Core\'s built-in limiter only for per-pod concurrency control.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fixed & Sliding Window',
      language: 'csharp',
      code: `builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Fixed window — 100 requests per minute
    opts.AddFixedWindowLimiter("fixed", o =>
    {
        o.PermitLimit    = 100;
        o.Window         = TimeSpan.FromMinutes(1);
        o.QueueLimit     = 10;       // queue 10 requests before rejecting
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Sliding window — 100 requests, window 1 min, 4 segments of 15s
    opts.AddSlidingWindowLimiter("sliding", o =>
    {
        o.PermitLimit    = 100;
        o.Window         = TimeSpan.FromMinutes(1);
        o.SegmentsPerWindow = 4;
        o.QueueLimit     = 5;
    });

    // Custom rejection response with Retry-After
    opts.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.StatusCode = 429;
        if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            ctx.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString();
        await ctx.HttpContext.Response.WriteAsync("Too many requests.", ct);
    };
});

app.UseRateLimiter();
app.MapGet("/data", GetData).RequireRateLimiting("fixed");`,
    },
    {
      label: 'Token Bucket',
      language: 'csharp',
      code: `builder.Services.AddRateLimiter(opts =>
{
    // Token bucket — allows bursts, throttles sustained rate
    opts.AddTokenBucketLimiter("token-bucket", o =>
    {
        o.TokenLimit          = 20;                  // max tokens (burst cap)
        o.ReplenishmentPeriod = TimeSpan.FromSeconds(1);
        o.TokensPerPeriod     = 5;                   // 5 tokens refilled/sec
        o.AutoReplenishment   = true;
        o.QueueLimit          = 0;                   // no queuing — reject immediately
    });
});

// Apply to an upload endpoint — allows burst but throttles sustained uploads
app.MapPost("/upload", ProcessUpload)
   .RequireRateLimiting("token-bucket")
   .DisableAntiforgery();`,
    },
    {
      label: 'Partitioned Limiter',
      language: 'csharp',
      code: `builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Per-user limit using JWT claim, fallback to IP for anonymous
    opts.AddPolicy("per-user", httpCtx =>
    {
        var userId = httpCtx.User.FindFirstValue(ClaimTypes.NameIdentifier);

        return userId is not null
            ? RateLimitPartition.GetFixedWindowLimiter(userId, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 60,
                    Window      = TimeSpan.FromMinutes(1),
                })
            : RateLimitPartition.GetFixedWindowLimiter(
                httpCtx.Connection.RemoteIpAddress?.ToString() ?? "anon",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window      = TimeSpan.FromMinutes(1),
                });
    });
});

app.MapGet("/api/data", GetData).RequireRateLimiting("per-user");`,
    },
    {
      label: 'Concurrency Limiter',
      language: 'csharp',
      code: `// Limit simultaneous requests — not rate, but concurrency
builder.Services.AddRateLimiter(opts =>
{
    opts.AddConcurrencyLimiter("expensive-op", o =>
    {
        o.PermitLimit = 5;    // max 5 simultaneous in-flight requests
        o.QueueLimit  = 10;   // queue 10 before rejecting
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});

// Useful for CPU/memory-intensive operations
app.MapPost("/reports/generate", async (ReportRequest req, CancellationToken ct) =>
{
    // Expensive operation — only 5 can run at the same time
    var report = await GenerateReportAsync(req, ct);
    return Results.Ok(report);
}).RequireRateLimiting("expensive-op");

// Global concurrency + per-endpoint rate limit
var api = app.MapGroup("/api").RequireRateLimiting("per-user");
api.MapPost("/reports", GenerateReport).RequireRateLimiting("expensive-op");`,
    },
  ];

  challenge: Challenge = {
    title: 'Login Endpoint Rate Limiting',
    language: 'csharp',
    description: 'Secure a login endpoint with strict rate limiting. Requirements: (1) Add a "login-limit" policy: maximum 5 attempts per 10 minutes per IP address. (2) When rejected, return 429 with a Retry-After header and a JSON body: { "error": "Too many login attempts. Try again later." }. (3) Apply the policy to POST /login. (4) All other API endpoints use a more lenient "api-limit": 200 requests/minute per authenticated user (or IP if anonymous). (5) GET /health is exempt from all rate limiting.',
    hints: [
      'Partition login-limit by IP: httpCtx.Connection.RemoteIpAddress?.ToString()',
      'RateLimitPartition.GetFixedWindowLimiter for per-IP limits',
      'opts.OnRejected for the custom JSON response',
      '.DisableRateLimiting() on the health endpoint',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: AddRateLimiter
// "login-limit": 5 per 10 min, per IP, reject 429 with JSON + Retry-After
// "api-limit": 200 per min, per user (or IP for anon)

var app = builder.Build();
// TODO: UseRateLimiter

// TODO: POST /login — apply "login-limit"
// TODO: GET /api/data — apply "api-limit"
// TODO: GET /health — no rate limit

app.Run();`,
    solution: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRateLimiter(opts =>
{
    opts.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.StatusCode = 429;
        ctx.HttpContext.Response.ContentType = "application/json";
        if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            ctx.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString();
        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Too many login attempts. Try again later." }, ct);
    };

    // Per-IP login throttle
    opts.AddPolicy("login-limit", httpCtx =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window      = TimeSpan.FromMinutes(10),
            }));

    // Per-user/IP general API limit
    opts.AddPolicy("api-limit", httpCtx =>
    {
        var key = httpCtx.User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? httpCtx.Connection.RemoteIpAddress?.ToString()
                  ?? "anon";
        return RateLimitPartition.GetFixedWindowLimiter(key,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window      = TimeSpan.FromMinutes(1),
            });
    });
});

var app = builder.Build();
app.UseRateLimiter();

app.MapPost("/login", (LoginRequest req) => Results.Ok("logged in"))
   .RequireRateLimiting("login-limit");

app.MapGet("/api/data", () => Results.Ok("data"))
   .RequireRateLimiting("api-limit");

app.MapGet("/health", () => Results.Ok("healthy"))
   .DisableRateLimiting();

app.Run();
record LoginRequest(string Username, string Password);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between a token bucket and a fixed window limiter?',
      options: [
        'Token bucket is per-user; fixed window is global',
        'Token bucket allows controlled bursts (up to bucket size); fixed window allows only steady requests within a window',
        'Fixed window uses Redis; token bucket is in-memory',
        'Token bucket is for concurrency; fixed window is for rate',
      ],
      answer: 1,
      explanation: 'A token bucket adds tokens at a steady rate but allows them to accumulate up to the bucket size — enabling a burst. A fixed window allows N requests in a time window with no burst concept. Token bucket is better for APIs with variable usage patterns; fixed window for strict per-period quotas.',
    },
    {
      q: 'Why should you partition rate limits by user ID rather than globally?',
      options: [
        'Global limits are not supported by .NET',
        'A global limit can be exhausted by one misbehaving client, blocking all well-behaved users',
        'User-ID partitioning is faster',
        'Global limits only work with Redis',
      ],
      answer: 1,
      explanation: 'A global counter means 10 abusive clients can hit the limit and block the remaining 990 legitimate users. Per-user partitioning ensures each user gets an independent quota — abuse by one client only affects that client.',
    },
    {
      q: 'What HTTP status code should rate limiting return?',
      options: ['400 Bad Request', '401 Unauthorized', '429 Too Many Requests', '503 Service Unavailable'],
      answer: 2,
      explanation: '429 Too Many Requests is the correct status for rate limiting. Include a Retry-After header indicating when the client may retry. ASP.NET Core returns 503 by default — override with opts.RejectionStatusCode = 429 or configure OnRejected.',
    },
    {
      q: 'What happens to .NET built-in rate limiting in a 3-pod Kubernetes deployment?',
      options: [
        'Each pod automatically synchronizes counters',
        'The limit is enforced globally via Kubernetes networking',
        'Each pod has independent counters — effectively tripling the limit cluster-wide',
        'Rate limiting is disabled automatically in Kubernetes',
      ],
      answer: 2,
      explanation: '.NET rate limiting is in-process. With 3 pods, each maintains its own counter — if the limit is 100/min, a single user could make 300 requests across the 3 pods. Use Redis-backed counters or API Gateway rate limiting for true distributed enforcement.',
    },
    {
      q: 'When should you use a concurrency limiter instead of a rate limiter?',
      options: [
        'For all endpoints by default',
        'For CPU/memory-intensive operations where you want to limit simultaneous in-flight requests',
        'When the operation is faster than 100ms',
        'For authentication endpoints only',
      ],
      answer: 1,
      explanation: 'Rate limiters control requests over time. A concurrency limiter controls how many requests can run simultaneously — ideal for operations that consume significant CPU, memory, or hold database connections for extended periods. It releases the permit when the handler completes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I add a Retry-After header to the rate limit rejection response?',
      a: 'Configure OnRejected in AddRateLimiter(): ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter) gives you a TimeSpan. Set ctx.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString(). Not all limiter types provide this metadata — FixedWindowRateLimiter and SlidingWindowRateLimiter do; TokenBucket and Concurrency do not by default.',
    },
    {
      q: 'Can I apply multiple rate limits to one endpoint?',
      a: 'Not natively — an endpoint can only have one RequireRateLimiting("policy"). To combine policies, create a composite policy using CreateChained() from the rate limiter extensions, or apply a stricter policy at the endpoint level and a broader policy at the group level — both are evaluated.',
    },
    {
      q: 'How do I rate limit by API key (not by JWT user)?',
      a: 'Use a partitioned policy and read the API key from a request header: var apiKey = httpCtx.Request.Headers["X-Api-Key"].FirstOrDefault() ?? "anonymous". Pass apiKey as the partition key to GetFixedWindowLimiter(). Combine with an API key validation middleware that rejects unknown keys before rate limiting.',
    },
    {
      q: 'What is the queue in rate limiter options?',
      a: 'QueueLimit lets requests wait rather than being immediately rejected when the limit is hit. Queued requests are held until a permit becomes available or the request is abandoned (client disconnects). Without a queue, requests above the limit are rejected immediately with 429. A small queue (10-20) smooths out brief spikes without holding requests too long.',
    },
    {
      q: 'How do I disable rate limiting for internal health checks?',
      a: 'Call .DisableRateLimiting() on the endpoint or group: app.MapGet("/health", HealthCheck).DisableRateLimiting(). This bypasses all rate limiting for that endpoint regardless of the global policy.',
    },
  ];
}
