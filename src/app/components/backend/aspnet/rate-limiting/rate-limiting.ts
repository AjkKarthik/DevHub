import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-rate-limiting',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './rate-limiting.html',
  styleUrl: './rate-limiting.scss',
})
export class AspnetRateLimiting {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware',       route: '/aspnet/middleware' },
    { label: 'Authentication',   route: '/aspnet/authentication' },
  ];

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
        '<strong>Sliding window</strong>: divides the window into segments and tracks requests per segment. Smooths out the boundary burst by distributing the quota over rolling time. More accurate than fixed window but slightly more memory-intensive.',
        '<strong>Token bucket</strong>: tokens are added at a fixed replenishment rate; each request consumes a token. When the bucket is empty, requests are rejected. Allows bursts up to the bucket capacity — ideal for APIs that should allow temporary spikes but throttle sustained abuse.',
        '<strong>Concurrency limiter</strong>: limits the number of <em>simultaneous</em> requests rather than rate. Useful for CPU/IO-bound operations to prevent resource exhaustion. The permit is released when the handler completes — not time-based.',
        'Choosing the right algorithm: use <strong>fixed window</strong> for simplicity with predictable traffic; <strong>sliding window</strong> to prevent boundary bursts; <strong>token bucket</strong> for burst-friendly throttling; <strong>concurrency</strong> for resource protection on slow operations.',
        'Algorithms can be combined on the same endpoint: apply a concurrency limiter at the endpoint level for resource protection AND a rate limiter at the group level for overall throughput control. Both limits are evaluated independently.',
      ],
    },
    {
      heading: 'Partitioned Limiters',
      points: [
        'A single global limit penalises well-behaved users when one client misbehaves. <strong>Partitioned limiters</strong> create per-partition quotas — each partition gets its own independent limit.',
        'Common partition keys: user ID (from JWT claims), API key, IP address, or tenant. Partition by authenticated user first; fall back to IP for anonymous traffic.',
        'Use <code>RateLimitPartition.GetFixedWindowLimiter(partitionKey, factory)</code> inside <code>AddPolicy()</code> — the factory receives the <code>HttpContext</code> and returns a limiter for that partition key.',
        'Partitions are created lazily and cached in memory by the partition key. For IP-based partitioning, be aware that many users behind a NAT or corporate proxy share the same IP — too strict a per-IP limit will affect legitimate users.',
        '<code>RateLimitPartition.GetNoLimiter(key)</code> creates an unrestricted partition for specific users (admins, internal services). This lets you exempt privileged keys from limits within a partitioned policy without using DisableRateLimiting().',
        'Memory management: partitions accumulate in memory as new keys appear. The rate limiter automatically evicts stale partitions after the window expires. For high-cardinality keys (user IDs), use a bounded store or Redis-backed solution to prevent unbounded memory growth.',
      ],
    },
    {
      heading: 'Applying and Customising Limits',
      points: [
        'Apply limits globally via <code>UseRateLimiter()</code> with a default policy, per-group via <code>MapGroup("/api").RequireRateLimiting("default")</code>, or per-endpoint with <code>.RequireRateLimiting("upload")</code> for expensive operations.',
        'Return a proper 429 Too Many Requests with a <code>Retry-After</code> header: configure <code>OnRejected</code> in <code>AddRateLimiter()</code>. Without it, the default rejection returns 503 Service Unavailable.',
        'Mark endpoints that should bypass rate limiting with <code>.DisableRateLimiting()</code> — useful for health checks, metrics endpoints, and internal service-to-service calls.',
        'The <code>QueueLimit</code> option buffers requests when the limit is hit instead of immediately rejecting. Queued requests wait for a permit to become available. A small queue (10-20) smooths over brief spikes without turning rate limiting into a bottleneck.',
        'Set <code>QueueProcessingOrder = QueueProcessingOrder.NewestFirst</code> to process more recent requests first (drop older waiting requests). Use <code>OldestFirst</code> (default) for FIFO fairness.',
        'Use <code>opts.GlobalLimiter</code> for a limiter that applies to every request regardless of endpoint policy — useful for a hard global ceiling on total concurrent requests. Global and endpoint limiters evaluate independently; both must succeed for a request to proceed.',
      ],
    },
    {
      heading: 'Rate Limiting in Distributed Deployments',
      points: [
        'Built-in .NET rate limiting is <strong>per-process</strong>. In a 3-pod deployment, each pod has its own counters — effectively tripling the global limit. A "100 req/min" limit becomes "300 req/min" across the cluster.',
        'For distributed rate limiting, use a shared counter backed by Redis. The <code>AspNetCoreRateLimit</code> NuGet package or a custom implementation using Redis <code>INCR</code> + <code>EXPIRE</code> are common solutions.',
        'A simpler alternative for distributed deployments: put rate limiting in the API Gateway (Kong, APIM, AWS API Gateway, Nginx) and use ASP.NET Core\'s built-in limiter only for per-pod concurrency control.',
        'Redis-based sliding window algorithm: ZADD the current timestamp to a sorted set keyed by user+endpoint, ZREMRANGEBYSCORE to remove entries older than the window, then ZCARD to get the current count. This is an atomic sliding window with O(log N) operations.',
        'Sticky sessions (load balancer affinity) route each user to the same pod — making per-process limiters effectively per-user. This is a lightweight alternative to Redis counters but breaks if the pod restarts or the load balancer redistributes connections.',
        'Monitor rate limiting effectiveness with metrics: count of 429 responses per endpoint, queue depth, rejection rate by partition key. These reveal which clients are being throttled and whether limits are set appropriately.',
      ],
    },
    {
      heading: 'Security Patterns & Best Practices',
      points: [
        'Rate limiting login endpoints is critical: brute-force attacks try thousands of passwords per second. Limit by IP and by username separately — an attacker can rotate IPs but still exhaust per-username limits. Return 429 with Retry-After; log failed attempts.',
        'Apply stricter limits to expensive operations: AI inference, report generation, file uploads, email sending. These consume disproportionate resources and are common DDoS vectors. A concurrency limiter is often more effective than a rate limiter for these.',
        'Use different limits for authenticated vs anonymous users: authenticated users with a valid identity can be trusted more than anonymous IP traffic. Give authenticated users 10× the anonymous limit, and exempt internal service accounts entirely.',
        '<strong>Do not rely on rate limiting as the only defence.</strong> It is a resource protection tool, not an authentication or authorization mechanism. A sophisticated attacker with many IPs can still exhaust resources within each limit. Use it in combination with authentication, input validation, and abuse detection.',
        'Include a <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, and <code>X-RateLimit-Reset</code> headers in responses to help clients self-throttle before hitting the limit. Set these in <code>OnRejected</code> and in a custom middleware that reads the limiter lease.',
        'Test rate limiting behaviour in integration tests: send N+1 requests and assert the (N+1)th returns 429 with the Retry-After header. Use WebApplicationFactory and a deterministic clock (override TimeProvider) for reliable tests without sleeping.',
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
    {
      q: 'What does RateLimitPartition.GetNoLimiter() do?',
      options: [
        'Disables rate limiting globally for all users',
        'Creates an unrestricted partition for a specific key — exempts those users from limits',
        'Returns null and causes the request to be rejected',
        'Sets the limit to the maximum integer value',
      ],
      answer: 1,
      explanation: 'GetNoLimiter(key) creates a partition that allows unlimited requests for that key. Useful for exempting admin users, internal service accounts, or monitoring agents within a partitioned policy without using DisableRateLimiting() at the endpoint level.',
    },
    {
      q: 'What is the sliding window advantage over fixed window rate limiting?',
      options: [
        'Sliding window uses less memory',
        'Sliding window prevents boundary bursts by distributing quota across rolling time segments',
        'Sliding window works with Redis; fixed window does not',
        'Sliding window allows more total requests',
      ],
      answer: 1,
      explanation: 'Fixed window allows a burst at the boundary: 100 requests at 00:59 + 100 at 01:01 = 200 in 2 seconds. Sliding window divides the window into segments (e.g. 4 × 15s) and tracks each — preventing the boundary burst. The trade-off is slightly more memory usage to track segment counters.',
    },
    {
      q: 'Which approach enables true distributed rate limiting across multiple ASP.NET Core pods?',
      options: [
        'UseRateLimiter() automatically synchronizes across pods via SignalR',
        'Setting GlobalLimiter in RateLimiterOptions applies cluster-wide limits',
        'A Redis-backed counter or API Gateway rate limiting enforces shared limits across pods',
        'Sticky sessions combined with UseRateLimiter() guarantees exact limits',
      ],
      answer: 2,
      explanation: 'Built-in .NET rate limiting is per-process. True distributed enforcement requires a shared counter — typically Redis with INCR + EXPIRE for atomic operations. Alternatively, delegate rate limiting to the API Gateway (Kong, Azure APIM, AWS API Gateway) and use built-in limiting only for per-pod concurrency control.',
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
    {
      q: 'How do I test rate limiting in integration tests without sleeping?',
      a: 'Override TimeProvider in your WebApplicationFactory to use a controllable clock. Send N+1 requests synchronously and assert the (N+1)th returns 429 with a Retry-After header. Advance the fake clock to simulate window expiry and verify the limit resets. This gives deterministic tests without wall-clock delays.',
    },
    {
      q: 'Should I use different limits for authenticated versus anonymous users?',
      a: 'Yes — authenticated users carry a verified identity, so they can be trusted with higher limits (e.g. 200/min vs 10/min for anonymous). In a partitioned policy, check httpCtx.User.Identity.IsAuthenticated: use the user ID as partition key with a generous limit, and fall back to IP with a strict limit for anonymous traffic. Exempt internal service accounts with GetNoLimiter().',
    },
    {
      q: 'What response headers should I include in rate limit responses to help clients?',
      a: 'Include X-RateLimit-Limit (the policy limit), X-RateLimit-Remaining (remaining requests in current window), X-RateLimit-Reset (Unix timestamp when the window resets), and Retry-After (seconds until retry is safe) on 429 responses. These headers allow well-behaved API clients to self-throttle before hitting the limit. Set them in OnRejected and optionally in a middleware for non-rejected responses.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Returning 503 instead of 429 on rejection',
      wrong: `// Default rejection status is 503 — misleading
builder.Services.AddRateLimiter(opts =>
{
    opts.AddFixedWindowLimiter("api", o => { o.PermitLimit = 100; });
    // No RejectionStatusCode — returns 503!
});`,
      right: `builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    opts.AddFixedWindowLimiter("api", o => { o.PermitLimit = 100; });
    opts.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.StatusCode = 429;
        if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            ctx.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString();
        await ctx.HttpContext.Response.WriteAsync("Rate limit exceeded.", ct);
    };
});`,
      explanation: 'ASP.NET Core returns 503 Service Unavailable by default when a rate limit is hit. 503 implies the server is down — clients may stop retrying entirely. 429 Too Many Requests is the correct semantic, and the Retry-After header tells clients when to safely retry.',
    },
    {
      title: 'Using a global counter instead of partitioned limits',
      wrong: `// One global limit blocks ALL users when one misbehaves
opts.AddFixedWindowLimiter("global", o =>
{
    o.PermitLimit = 1000;
    o.Window = TimeSpan.FromMinutes(1);
});`,
      right: `// Per-user partitioned limit — abuse only affects the abuser
opts.AddPolicy("per-user", httpCtx =>
{
    var key = httpCtx.User.FindFirstValue(ClaimTypes.NameIdentifier)
              ?? httpCtx.Connection.RemoteIpAddress?.ToString() ?? "anon";
    return RateLimitPartition.GetFixedWindowLimiter(key,
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
        });
});`,
      explanation: 'A single global counter is exhausted by one abusive client, blocking all legitimate users. Partitioned limiters give each user an independent quota. Abuse by one client stays isolated to their partition.',
    },
    {
      title: 'Assuming built-in rate limiting works across Kubernetes pods',
      wrong: `// In a 3-pod deployment this is NOT "100 per minute globally"
opts.AddFixedWindowLimiter("api", o =>
{
    o.PermitLimit = 100;   // Per pod! 300/min across the cluster
    o.Window = TimeSpan.FromMinutes(1);
});`,
      right: `// Option 1: rate limit at API Gateway level (Kong, APIM, etc.)
// Option 2: Redis-backed distributed limiter
// Option 3: use built-in limiter only for per-pod concurrency control
opts.AddConcurrencyLimiter("per-pod-concurrency", o =>
{
    o.PermitLimit = 20; // Local resource protection only
});
// Document clearly that this is per-pod, not cluster-wide`,
      explanation: 'Built-in .NET rate limiting is per-process. Each pod maintains independent counters. In a 3-pod deployment a "100 req/min" limit effectively becomes 300 req/min cluster-wide. Use an API Gateway or Redis-backed solution for true distributed enforcement.',
    },
    {
      title: 'Not applying rate limiting to authentication endpoints',
      wrong: `app.MapPost("/login", HandleLogin);   // No rate limiting — brute force target
app.MapPost("/register", HandleRegister); // Same issue`,
      right: `opts.AddPolicy("login-limit", httpCtx =>
    RateLimitPartition.GetFixedWindowLimiter(
        httpCtx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(10),
        }));

app.MapPost("/login", HandleLogin).RequireRateLimiting("login-limit");
app.MapPost("/register", HandleRegister).RequireRateLimiting("login-limit");`,
      explanation: 'Login and registration endpoints are prime brute-force targets. Without rate limiting, an attacker can attempt thousands of passwords per second. Apply strict per-IP limits (5 attempts per 10 minutes) to these endpoints and log all rejections.',
    },
    {
      title: 'Placing UseRateLimiter() after UseAuthorization()',
      wrong: `app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();    // Too late — auth middleware already ran`,
      right: `app.UseAuthentication();
app.UseRateLimiter();    // Before authorization
app.UseAuthorization();
app.MapControllers();`,
      explanation: 'UseRateLimiter() should run after UseAuthentication() (so the user identity is available for per-user partitioning) but before UseAuthorization(). Placing it after UseAuthorization() means the expensive authorization logic runs before rate limiting can short-circuit the request.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core rate limiting (AddRateLimiter) provides four algorithms — fixed window, sliding window, token bucket, and concurrency — applied globally or per-endpoint via named policies.',
    mustKnow: [
      'Four algorithms: fixed window (simple), sliding window (no boundary burst), token bucket (burst-friendly), concurrency (simultaneous cap)',
      'Partitioned limiters key by user ID or IP so one abusive client cannot exhaust the shared quota',
      'RejectionStatusCode = 429 and OnRejected for Retry-After header — default is 503',
      'UseRateLimiter() order: after UseAuthentication(), before UseAuthorization()',
      '.NET rate limiting is per-process — not distributed across Kubernetes pods by default',
      'DisableRateLimiting() on health checks and internal endpoints; GetNoLimiter() for privileged keys',
    ],
    interviewFocus: [
      'Fixed vs sliding window boundary burst and when to choose each algorithm',
      'Why partitioned limits are better than global limits for fairness',
      'Distributed rate limiting approaches: Redis counter, API Gateway, sticky sessions trade-offs',
      'Correct OnRejected setup: 429 status, Retry-After header, JSON body',
    ],
  };
}
