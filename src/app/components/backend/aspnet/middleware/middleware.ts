import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-middleware',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './middleware.html',
  styleUrl: './middleware.scss',
})
export class AspnetMiddleware {

  quickRef: QuickRefItem[] = [
    { name: 'app.Use()',        type: 'method',    desc: 'Adds inline middleware; call await next(ctx) to continue the pipeline or omit it to short-circuit.', since: 'Core 1+' },
    { name: 'app.Run()',        type: 'method',    desc: 'Adds a terminal delegate — never calls next; pipeline stops here. Code after Run() is dead.', since: 'Core 1+' },
    { name: 'app.Map()',        type: 'method',    desc: 'Permanently branches the pipeline when the request path starts with the given prefix. Branch does NOT rejoin main pipeline.', since: 'Core 1+' },
    { name: 'app.MapWhen()',    type: 'method',    desc: 'Permanently branches on an arbitrary predicate over HttpContext. Branch does NOT rejoin main pipeline.', since: 'Core 1+' },
    { name: 'app.UseWhen()',    type: 'method',    desc: 'Conditionally adds middleware that rejoins the main pipeline afterward (unless the branch short-circuits with a response).', since: 'Core 1+' },
    { name: 'RequestDelegate',  type: 'type',      desc: 'Func<HttpContext, Task> — the signature of every middleware component and the "next" delegate passed between components.', since: 'Core 1+' },
    { name: 'IMiddleware',      type: 'interface', desc: 'Resolved from DI per request; supports scoped constructor injection. Register in DI and activate with UseMiddleware<T>().', since: 'Core 1+' },
    { name: 'UseRouting()',     type: 'method',    desc: 'Must appear before UseCors(), UseAuthentication(), UseAuthorization(). Implicit in .NET 6+ minimal APIs.', since: 'Core 3+' },
    { name: 'UseExceptionHandler()', type: 'method', desc: 'Must be registered first — catches unhandled exceptions and writes a structured error response.', since: 'Core 1+' },
    { name: 'OnStarting()',     type: 'method',    desc: 'HttpResponse callback fired just before the first byte is written — the only safe place to modify response headers after await next().', since: 'Core 1+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The pipeline — request in, response out',
      points: [
        'Every HTTP request passes through a sequential chain of <strong>middleware</strong> components. Each component can inspect or modify the request, invoke the next component via <code>await next(context)</code>, then inspect or modify the response on the way back.',
        'Think of it as a nested stack: request flows inward (middleware 1 → 2 → 3 → endpoint), then response flows outward (endpoint → 3 → 2 → 1). This "Russian doll" structure lets each middleware do pre- and post-processing around all of its downstream components.',
        'A middleware that does <em>not</em> call <code>next</code> <strong>short-circuits</strong> the pipeline — no further middleware or endpoint handler runs, and the response is sent immediately. Authentication rejections, rate limit denials, and cache hits all use this pattern intentionally.',
        'The pipeline is built once at startup as a chain of <code>RequestDelegate</code> instances and reused for every request — middleware instances are effectively singleton-scoped. Keep constructor logic minimal; do real work inside <code>InvokeAsync</code>.',
        'Request body and response body are <code>Stream</code> objects. If you need to buffer them (e.g., for logging or anti-tampering), you must replace them with a <code>MemoryStream</code> before calling <code>next()</code> and restore the originals afterward. Buffering has memory and latency costs — only do it when necessary.',
      ],
    },
    {
      heading: 'app.Use, app.Run, and app.Map',
      points: [
        '<code>app.Use(async (ctx, next) => { ... })</code> adds a middleware that participates in the chain. You must call <code>await next(ctx)</code> to pass control forward. Omitting the call silently short-circuits — no downstream middleware, no endpoint, just whatever your middleware writes.',
        '<code>app.Run(async ctx => { ... })</code> is syntactic sugar for a terminal middleware — it never receives a <code>next</code> delegate and the pipeline ends here. Anything registered <em>after</em> <code>Run</code> is completely unreachable and never executes.',
        '<code>app.Map("/admin", adminApp => { ... })</code> permanently branches the pipeline: requests whose path starts with <code>/admin</code> enter the branch and never return to the main pipeline. The branch and main line are independent pipelines with independent middleware.',
        '<code>app.MapWhen(ctx => predicate, branchApp => { ... })</code> branches on any <code>HttpContext</code> predicate — header presence, query string, IP range, etc. Like <code>Map</code>, the branch does not rejoin the main pipeline.',
        '<code>app.UseWhen(ctx => predicate, branchApp => { ... })</code> creates a conditional branch that <em>does</em> rejoin the main pipeline afterward — unless the branch writes a response and short-circuits. This is useful for adding extra logging or validation on a subset of requests while letting all requests continue to endpoints.',
      ],
    },
    {
      heading: 'Ordering rules — why order is critical',
      points: [
        'Middleware order is critical and difficult to get right by inspection alone. The recommended built-in order: <strong>ExceptionHandler → HSTS → HttpsRedirection → StaticFiles → Routing → CORS → Authentication → Authorization → custom middleware → Endpoints</strong>.',
        'Exception handling must be registered <em>first</em> so it wraps the entire pipeline in a try/catch. If registered after any other middleware, exceptions thrown by earlier components escape the handler and surface as unformatted 500 errors.',
        '<strong>Authentication before Authorization</strong> is non-negotiable. Authentication populates <code>HttpContext.User</code> with claims from a token or cookie. Authorization then reads those claims to enforce policies. Reversing the order means authorization checks run without a populated <code>ClaimsPrincipal</code> and every request looks anonymous.',
        'Static files should be early in the pipeline — before authentication — so public assets are served without triggering authentication/authorization overhead. If your static files are protected, intentionally move <code>UseStaticFiles</code> after <code>UseAuthentication</code>.',
        '<code>UseCors</code> must come after <code>UseRouting</code> (so it knows which endpoint matched) but before <code>UseAuthorization</code> (so CORS pre-flight requests are not blocked by auth). In minimal API projects, using endpoint-level <code>.RequireCors()</code> makes ordering less fragile.',
      ],
    },
    {
      heading: 'Custom middleware — inline delegate vs class',
      points: [
        'For simple one-liners, use the <strong>inline delegate</strong> form: <code>app.Use(async (ctx, next) => { ... })</code>. Good for adding a single response header, quick logging, or feature flags that need no dependencies.',
        'For anything with injected dependencies, use the <strong>conventional class form</strong>: a class with a constructor receiving <code>RequestDelegate next</code> (and optionally singleton services) and an <code>InvokeAsync(HttpContext ctx)</code> method. Register with <code>app.UseMiddleware&lt;MyMiddleware&gt;()</code>.',
        'The conventional class is <strong>instantiated once</strong> (singleton lifecycle). Constructor parameters are resolved from the root container — singleton and transient services only. <strong>Scoped services</strong> (like <code>DbContext</code>) cannot go in the constructor or they are captured for the app lifetime.',
        'To use scoped services in conventional middleware, add them as <strong>parameters to <code>InvokeAsync</code></strong>: <code>public async Task InvokeAsync(HttpContext ctx, IMyService svc)</code>. ASP.NET Core resolves these from the request scope per invocation.',
        '<code>IMiddleware</code> is the alternative for scoped-friendly middleware: implement the interface, register the class in DI (e.g., <code>builder.Services.AddScoped&lt;MyMiddleware&gt;()</code>), and add with <code>app.UseMiddleware&lt;MyMiddleware&gt;()</code>. It is resolved from DI on every request — constructor injection can be scoped.',
      ],
    },
    {
      heading: 'Common built-in middleware and their purpose',
      points: [
        '<code>UseExceptionHandler(path)</code> catches unhandled exceptions from all downstream middleware and converts them to a structured error response (redirects to a path or writes ProblemDetails JSON). Pair with <code>app.UseStatusCodePages()</code> for custom 404/403 responses.',
        '<code>UseHsts()</code> adds the <code>Strict-Transport-Security</code> header, instructing browsers to always use HTTPS for your domain. <code>UseHttpsRedirection()</code> redirects HTTP requests to HTTPS. Both are no-ops in Development (where HSTS would poison the browser cache).',
        '<code>UseStaticFiles()</code> serves files from <code>wwwroot/</code> without touching the rest of the pipeline. It short-circuits if a matching file is found. <code>UseResponseCompression()</code> gzip/Brotli-compresses responses. <code>UseResponseCaching()</code> stores full HTTP responses and replays them without executing downstream middleware.',
        '<code>UseRouting()</code> matches incoming paths against registered endpoints and stores the result in <code>HttpContext.GetEndpointFeature()</code>. <code>UseCors</code>, <code>UseAuthentication</code>, and <code>UseAuthorization</code> all run between <code>UseRouting</code> and endpoint execution so they have access to the matched endpoint metadata.',
        '<code>UseRateLimiter()</code> (.NET 7+) enforces rate limit policies defined in <code>builder.Services.AddRateLimiter()</code>. Place it after <code>UseRouting</code> so policies can be matched per endpoint using <code>.RequireRateLimiting("policyName")</code> on the route definition.',
      ],
    },
    {
      heading: 'Response handling — OnStarting, buffering, and streaming',
      points: [
        'Once any byte is written to <code>HttpResponse.Body</code>, the HTTP status line and headers are flushed to the client and <strong>cannot be changed</strong>. Attempts to set <code>Response.StatusCode</code> after writing are silently ignored (or throw in strict mode).',
        '<code>context.Response.OnStarting(callback)</code> registers a callback that fires just before the first byte is written. This is the only safe place to add or modify response headers after calling <code>await next()</code>. Use it for X-Correlation-Id, cache-control overrides, or timing headers.',
        'To read or modify the <strong>response body</strong> in middleware (logging, compression, anti-tampering), swap <code>context.Response.Body</code> with a <code>MemoryStream</code> before calling <code>next()</code>: intercept the bytes, process them, write to the original stream, then restore. This is expensive — avoid unless truly necessary.',
        '<strong>Streaming responses</strong> (Server-Sent Events, chunked JSON, file downloads) disable response buffering by design. Middleware that buffers the response body will break streaming — check <code>context.Response.IsChunked</code> or response content type before buffering.',
        'For exception handling middleware, it is tempting to catch exceptions <em>after</em> <code>await next()</code>. This works only if the response body has not started streaming yet. Once streaming begins, the only way to signal an error is to close the connection abruptly — plan for this in long-running streaming endpoints.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pipeline order',
      language: 'csharp',
      code: `var app = builder.Build();

// 1. Exception handling — must be first to catch all downstream errors
if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
    app.UseExceptionHandler("/error");

// 2. Security headers
app.UseHsts();
app.UseHttpsRedirection();

// 3. Static files — before auth so public assets skip auth checks
app.UseStaticFiles();

// 4. Routing — must be before CORS, auth, and rate-limiting
app.UseRouting();

// 5. CORS — after routing (needs endpoint metadata), before auth
app.UseCors("AllowFrontend");

// 6. Rate limiting — after routing for per-endpoint policies (.NET 7+)
app.UseRateLimiter();

// 7. Auth — authn THEN authz, never reversed
app.UseAuthentication();
app.UseAuthorization();

// 8. Custom cross-cutting middleware
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<RequestTimingMiddleware>();

// 9. Endpoint execution
app.MapControllers();
app.MapGet("/ping", () => "pong");

app.Run();`,
    },
    {
      label: 'Inline middleware',
      language: 'csharp',
      code: `// ── Pre/post processing ──────────────────────────────────────────────
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();

    // Pre-processing: runs before downstream pipeline
    // Add response header safely via OnStarting (headers may not be sent yet)
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Elapsed-Ms"] = sw.ElapsedMilliseconds.ToString();
        return Task.CompletedTask;
    });

    await next(context);   // continue the pipeline

    // Post-processing: runs after endpoint returns (headers already sent!)
    // Only logging/metrics are safe here — do NOT set headers here
    app.Logger.LogInformation("{Method} {Path} → {Status} in {Ms}ms",
        context.Request.Method, context.Request.Path,
        context.Response.StatusCode, sw.ElapsedMilliseconds);
});

// ── Short-circuit (reject early without calling next) ─────────────────
app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.TryGetValue("X-Api-Key", out var key) || key != "secret")
    {
        ctx.Response.StatusCode = 401;
        await ctx.Response.WriteAsync("Unauthorized");
        return;   // ← short-circuit: next() is NOT called
    }
    await next(ctx);
});

// ── Terminal middleware (app.Run — nothing after this executes) ────────
app.Run(async ctx =>
{
    ctx.Response.StatusCode = 404;
    await ctx.Response.WriteAsync("Not found — this is the terminal catch-all");
});`,
    },
    {
      label: 'Class middleware',
      language: 'csharp',
      code: `// ── Conventional class middleware ────────────────────────────────────
// Constructor: singleton/transient services only
// InvokeAsync params: scoped services resolved per request
public class RequestTimingMiddleware(
    RequestDelegate next,
    ILogger<RequestTimingMiddleware> logger)     // singleton — OK in constructor
{
    public async Task InvokeAsync(HttpContext context, ICurrentUserService user)  // scoped — OK as param
    {
        var sw = Stopwatch.StartNew();
        await next(context);
        logger.LogInformation("[{User}] {Method} {Path} {Status} {Ms}ms",
            user.Name, context.Request.Method,
            context.Request.Path, context.Response.StatusCode,
            sw.ElapsedMilliseconds);
    }
}

// ── IMiddleware — DI-activated, supports scoped constructor deps ───────
public class ApiKeyMiddleware(IApiKeyValidator validator) : IMiddleware   // scoped — OK in ctor!
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (!validator.IsValid(context.Request.Headers["X-Api-Key"]))
        {
            context.Response.StatusCode = 401;
            return;
        }
        await next(context);
    }
}

// ── Registration ──────────────────────────────────────────────────────
builder.Services.AddScoped<ApiKeyMiddleware>();   // required for IMiddleware
// ...
app.UseMiddleware<RequestTimingMiddleware>();
app.UseMiddleware<ApiKeyMiddleware>();`,
    },
    {
      label: 'Branching',
      language: 'csharp',
      code: `// ── Map: permanent branch on path prefix ─────────────────────────────
app.Map("/admin", adminApp =>
{
    // Requests entering this branch NEVER return to the main pipeline
    adminApp.UseAuthentication();
    adminApp.UseAuthorization();
    adminApp.Run(async ctx => await ctx.Response.WriteAsync("Admin area"));
});

// ── MapWhen: permanent branch on arbitrary predicate ──────────────────
app.MapWhen(
    ctx => ctx.Request.Headers.ContainsKey("X-Debug"),
    debugApp => debugApp.Run(async ctx =>
        await ctx.Response.WriteAsJsonAsync(new {
            headers   = ctx.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
            timestamp = DateTime.UtcNow,
        })));

// ── UseWhen: conditional middleware that REJOINS main pipeline ─────────
// Adds tracing for ?trace=1 requests, then they continue to normal endpoints
app.UseWhen(
    ctx => ctx.Request.Query.ContainsKey("trace"),
    traceApp => traceApp.Use(async (ctx, next) =>
    {
        Console.WriteLine(\$"TRACE enter: {ctx.Request.Path}");
        await next(ctx);    // ← rejoins main pipeline
        Console.WriteLine(\$"TRACE exit:  {ctx.Response.StatusCode}");
    }));

app.MapGet("/hello", () => "Hello!");   // reached by all requests, incl. trace`,
    },
    {
      label: 'Response body buffering',
      language: 'csharp',
      code: `// ── Buffer response body to log or transform it ─────────────────────
// Only do this when you genuinely need the bytes — expensive!
app.Use(async (context, next) =>
{
    var originalBody = context.Response.Body;

    using var buffer = new MemoryStream();
    context.Response.Body = buffer;       // capture output

    await next(context);                  // run the rest of the pipeline

    buffer.Seek(0, SeekOrigin.Begin);
    var body = await new StreamReader(buffer).ReadToEndAsync();

    // Log, transform, or audit the response body here
    app.Logger.LogDebug("Response body: {Body}", body);

    buffer.Seek(0, SeekOrigin.Begin);
    await buffer.CopyToAsync(originalBody);   // flush to real stream
    context.Response.Body = originalBody;     // restore
});

// ── Adding headers after await next() — use OnStarting ───────────────
app.Use(async (context, next) =>
{
    var correlationId = Guid.NewGuid().ToString("N");

    // Register callback BEFORE calling next — fires just before first byte
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Correlation-Id"] = correlationId;
        return Task.CompletedTask;
    });

    await next(context);
    // ← Do NOT set headers here — they are already sent
});`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Inline middleware vs class middleware for shared state',
      before: `// Inline: accumulates complexity, no DI, hard to test
app.Use(async (ctx, next) =>
{
    var apiKey  = ctx.Request.Headers["X-Api-Key"];
    var isValid = apiKey == Environment.GetEnvironmentVariable("API_KEY");
    if (!isValid) { ctx.Response.StatusCode = 401; return; }
    await next(ctx);
});`,
      after: `// Class middleware with injected validator — testable, DI-friendly
public class ApiKeyMiddleware(IApiKeyValidator validator) : IMiddleware
{
    public async Task InvokeAsync(HttpContext ctx, RequestDelegate next)
    {
        if (!validator.IsValid(ctx.Request.Headers["X-Api-Key"]))
        { ctx.Response.StatusCode = 401; return; }
        await next(ctx);
    }
}
builder.Services.AddScoped<ApiKeyMiddleware>();
app.UseMiddleware<ApiKeyMiddleware>();`,
      note: 'Class middleware can inject services, be unit-tested in isolation, and have its logic extracted into a validator class. Inline middleware is fine for trivial one-liners but grows unwieldy when logic needs dependencies.',
    },
    {
      title: 'Setting response headers after await next() vs OnStarting',
      before: `// BUG: headers may already be sent after await next()
app.Use(async (ctx, next) =>
{
    await next(ctx);
    // If the endpoint started streaming, this is silently ignored
    ctx.Response.Headers["X-Request-Id"] = "abc123";
});`,
      after: `// Correct: register OnStarting BEFORE calling next()
app.Use(async (ctx, next) =>
{
    ctx.Response.OnStarting(() =>
    {
        ctx.Response.Headers["X-Request-Id"] = "abc123";
        return Task.CompletedTask;
    });
    await next(ctx);
    // Callback fired just before first byte — headers still modifiable
});`,
      note: 'OnStarting callbacks fire just before the HTTP response headers are flushed. This is the only reliable window to set headers after downstream middleware has run — especially important for streaming endpoints.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to call await next(context) in middleware',
      wrong: `app.Use(async (ctx, next) =>
{
    if (!IsAuthenticated(ctx)) { ctx.Response.StatusCode = 401; return; }
    // BUG: forgot await next(ctx) for authenticated users
    // Nothing downstream runs — the app returns an empty 200
});`,
      right: `app.Use(async (ctx, next) =>
{
    if (!IsAuthenticated(ctx)) { ctx.Response.StatusCode = 401; return; }
    await next(ctx);   // ← required to continue the pipeline
});`,
      explanation: 'Omitting await next(ctx) silently short-circuits the pipeline. All subsequent middleware, routing, and endpoints stop executing. The response is whatever your middleware wrote (often an empty 200 OK). This is a common source of "my endpoint is never called" bugs.',
    },
    {
      title: 'Setting response headers after await next() without OnStarting',
      wrong: `app.Use(async (ctx, next) =>
{
    await next(ctx);
    // BUG: if endpoint streamed a response, headers are already sent
    ctx.Response.Headers["X-Timing"] = "42ms"; // silently ignored or throws
});`,
      right: `app.Use(async (ctx, next) =>
{
    ctx.Response.OnStarting(() =>
    {
        ctx.Response.Headers["X-Timing"] = "42ms"; // fires before first byte
        return Task.CompletedTask;
    });
    await next(ctx);
});`,
      explanation: 'Once any byte is written to the response body, HTTP headers are already flushed to the client and cannot be modified. Register an OnStarting callback before calling next() — it fires just before the first byte and is always safe to modify headers.',
    },
    {
      title: 'Reversing UseAuthentication and UseAuthorization order',
      wrong: `app.UseAuthorization();     // BUG: runs before auth — user is always null
app.UseAuthentication();    // too late — claims not populated when authz ran`,
      right: `app.UseAuthentication();    // populates HttpContext.User with claims
app.UseAuthorization();     // reads HttpContext.User to enforce policies`,
      explanation: 'UseAuthentication() populates HttpContext.User from JWT tokens, cookies, or API keys. UseAuthorization() then reads that identity to evaluate policies. Reversing the order means authorization always sees an anonymous user — every [Authorize] attribute returns 401 or 403 regardless of credentials.',
    },
    {
      title: 'Injecting scoped services in the constructor of conventional middleware',
      wrong: `// BUG: DbContext is Scoped — captured as Singleton for app lifetime
public class LoggingMiddleware(RequestDelegate next, AppDbContext db)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        await db.Logs.AddAsync(...); // stale context — multiple request race
        await next(ctx);
    }
}`,
      right: `// Scoped services go in InvokeAsync parameters — resolved per request
public class LoggingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, AppDbContext db)
    {
        await db.Logs.AddAsync(...); // fresh DbContext each request
        await next(ctx);
    }
}`,
      explanation: 'Conventional middleware is resolved once at startup (singleton lifecycle). Injecting a Scoped service in the constructor captures a single instance for the entire app lifetime, causing stale data, concurrency exceptions, and change-tracking pollution. Add scoped services as InvokeAsync parameters instead — ASP.NET Core resolves them from the request scope.',
    },
    {
      title: 'Registering middleware after app.Run()',
      wrong: `app.Run(async ctx => await ctx.Response.WriteAsync("Hello")); // terminal

app.Use(async (ctx, next) =>   // BUG: unreachable — Run() ends the pipeline
{
    app.Logger.LogInformation("This never executes");
    await next(ctx);
});`,
      right: `// Register all non-terminal middleware BEFORE the terminal handler
app.Use(async (ctx, next) =>
{
    app.Logger.LogInformation("Executes for every request");
    await next(ctx);
});

app.Run(async ctx => await ctx.Response.WriteAsync("Hello")); // terminal — last`,
      explanation: 'app.Run() adds a terminal middleware that never calls next(). Any middleware registered after it is never invoked. The compiler and runtime give no warning — the code is simply unreachable. Always put terminal middleware last.',
    },
  ];

  challenge: Challenge = {
    title: 'Correlation ID middleware',
    language: 'csharp',
    description: `Build a <code>CorrelationIdMiddleware</code> that:<br/>
1. Reads the <code>X-Correlation-Id</code> request header, or generates a new <code>Guid</code> if absent.<br/>
2. Stores the ID in <code>HttpContext.Items["CorrelationId"]</code>.<br/>
3. Adds <code>X-Correlation-Id</code> to the response headers via <code>OnStarting</code>.<br/>
4. Logs "Request {id} starting" before calling next and "Request {id} finished in {ms}ms" after.<br/>
Register it before routing and verify the header appears on every response.`,
    hints: [
      'Use context.Request.Headers.TryGetValue("X-Correlation-Id", out var id) to read the header; fall back to Guid.NewGuid().ToString("N")',
      'Register the OnStarting callback BEFORE calling next() so headers can still be set',
      'Store the Stopwatch start before next() and compute elapsed after it returns',
      'Register with app.UseMiddleware<CorrelationIdMiddleware>() before app.UseRouting()',
    ],
    starterCode: `public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // TODO: read or generate correlation ID
        // TODO: store in context.Items
        // TODO: add to response headers (via OnStarting)
        // TODO: log start, call next, log finish with timing
        await _next(context);
    }
}`,
    solution: `public class CorrelationIdMiddleware(
    RequestDelegate next,
    ILogger<CorrelationIdMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var id = context.Request.Headers.TryGetValue("X-Correlation-Id", out var existing)
            ? existing.ToString()
            : Guid.NewGuid().ToString("N");

        context.Items["CorrelationId"] = id;

        // OnStarting fires just before first byte — safe to set headers here
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Correlation-Id"] = id;
            return Task.CompletedTask;
        });

        var sw = Stopwatch.StartNew();
        logger.LogInformation("Request {CorrelationId} starting", id);

        await next(context);

        logger.LogInformation("Request {CorrelationId} finished in {Ms}ms",
            id, sw.ElapsedMilliseconds);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between app.Use() and app.Run()?',
      options: [
        'app.Use() is for GET requests; app.Run() is for POST requests',
        'app.Use() passes control via next(); app.Run() is terminal and never calls next — pipeline ends here',
        'app.Use() runs synchronously; app.Run() runs asynchronously',
        'app.Use() is for production; app.Run() is for development only',
      ],
      answer: 1,
      explanation: 'app.Use() receives a next delegate and must call it to continue the pipeline — skipping next silently short-circuits. app.Run() is convenience for a terminal middleware that never receives a next delegate. Code registered after app.Run() is dead code — it never executes.',
    },
    {
      q: 'Why must UseAuthentication() come before UseAuthorization()?',
      options: [
        'UseAuthorization() throws if called first — it is a compile error',
        'Authentication establishes who the user is by populating HttpContext.User; authorization uses that identity to decide access — reversing them means authorization sees an anonymous user',
        'It is a convention with no functional impact',
        'UseAuthentication() registers the auth middleware factory; UseAuthorization() activates it',
      ],
      answer: 1,
      explanation: 'UseAuthentication() reads tokens or cookies and populates HttpContext.User with claims. UseAuthorization() then evaluates [Authorize] policies against those claims. With the order reversed, HttpContext.User is empty (anonymous) when authorization runs — every [Authorize] attribute rejects the request regardless of the credentials provided.',
    },
    {
      q: 'Which method branches the pipeline permanently (requests in the branch NEVER return to the main pipeline)?',
      options: [
        'app.UseWhen()',
        'app.MapWhen()',
        'app.Use()',
        'app.MapGet()',
      ],
      answer: 1,
      explanation: 'Both app.Map() and app.MapWhen() permanently branch the pipeline — requests matching the condition enter the branch and are handled there without returning to the main pipeline. app.UseWhen() creates a conditional branch that rejoins the main pipeline after it completes (unless the branch writes a response and short-circuits).',
    },
    {
      q: 'Why should exception-handling middleware be registered first in the pipeline?',
      options: [
        'It must run before routing resolves the endpoint',
        'It wraps the entire pipeline in a try/catch; registering later means exceptions from earlier middleware escape the handler',
        'ASP.NET Core enforces this with a build-time error',
        'Exception handling only catches errors from the final middleware',
      ],
      answer: 1,
      explanation: 'Middleware wraps downstream components via await next(). Exception handling works by wrapping next() in a try/catch. If registered after other middleware, exceptions thrown by those earlier components escape the handler and surface as unformatted 500 errors. First in registration = outermost wrapper = broadest error coverage.',
    },
    {
      q: 'How do you safely inject a Scoped service into conventional class-based middleware?',
      options: [
        'Register the service as Singleton so it matches the middleware lifetime',
        'Add the scoped service as a parameter to InvokeAsync() — ASP.NET Core resolves it from the request scope',
        'Use IServiceProvider in the constructor and call GetService<T>() in InvokeAsync',
        'Scoped services cannot be used in middleware at all',
      ],
      answer: 1,
      explanation: 'Conventional middleware is instantiated once (singleton-like). Constructor parameters are resolved from the root container — only singleton/transient services are safe there. For scoped services, add them as additional InvokeAsync parameters: ASP.NET Core resolves them from the per-request scope on each invocation, giving a fresh instance every time.',
    },
    {
      q: 'What is the only safe way to add a response header after calling await next(context)?',
      options: [
        'Set context.Response.Headers after await next() — ASP.NET Core will buffer them',
        'Register context.Response.OnStarting(callback) BEFORE calling next — the callback fires just before the first byte is sent',
        'Store the header value in context.Items and map it to a header in a separate pipeline stage',
        'You cannot add response headers after calling next() under any circumstances',
      ],
      answer: 1,
      explanation: 'Once any byte is written to the response body, the HTTP status line and headers are flushed to the client and cannot be changed. OnStarting(callback) registers a callback that fires just before the first byte is written — this is the only safe window to modify response headers after the pipeline has run, even with streaming endpoints.',
    },
    {
      q: 'What happens if you register middleware AFTER app.Run()?',
      options: [
        'It runs after the terminal handler returns',
        'It runs only for requests that the terminal handler rejects',
        'It is unreachable — app.Run() is terminal and no subsequent middleware ever executes',
        'ASP.NET Core throws a build error if middleware is placed after app.Run()',
      ],
      answer: 2,
      explanation: 'app.Run() adds a terminal RequestDelegate that never calls next(). Any middleware registered after it is completely unreachable — the compiler and runtime give no warning. Always place terminal handlers last in the pipeline.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What happens if I forget to call await next(context) in my middleware?', a: 'The pipeline short-circuits at your middleware. No subsequent middleware, routing, or endpoint handler runs. The response is whatever your middleware wrote — or an empty 200 OK if you wrote nothing. This is intentional for auth rejections and rate limiting, but accidental omission causes all downstream features to silently stop working. Always call <code>await next(ctx)</code> unless you are deliberately ending the pipeline.' },
    { q: 'Can middleware modify the response after next() returns?', a: 'Not headers or status code once writing has started — once <code>Response.Body</code> is written to, the HTTP response line and headers are already sent. The safe pattern is <code>context.Response.OnStarting(callback)</code>: register the callback <em>before</em> calling <code>next()</code> and ASP.NET Core invokes it just before the first byte is written, giving you a window to add or modify headers. For the body itself, you must swap <code>Response.Body</code> with a <code>MemoryStream</code> before calling <code>next()</code>.' },
    { q: 'What is the difference between IMiddleware and the conventional middleware pattern?', a: '<code>IMiddleware</code> is registered in DI and resolved per request — its constructor can inject scoped services. The conventional pattern (constructor + <code>InvokeAsync(HttpContext, RequestDelegate)</code>) resolves the class once at startup; constructor receives only singleton/transient services, but scoped services can be injected as additional <code>InvokeAsync</code> parameters. <code>IMiddleware</code> is simpler when you have multiple scoped constructor dependencies; the conventional pattern is the default recommendation in Microsoft docs.' },
    { q: 'When should I use middleware vs an action filter?', a: 'Middleware runs for <em>every</em> request, before routing decides which controller or minimal-API endpoint handles it. Action filters run only for matched MVC controller actions. Use middleware for truly cross-cutting concerns: auth, CORS, logging, compression, security headers, rate limiting. Use filters for MVC-specific concerns: model state validation, result shaping, action-level timing, or per-controller caching — things that only make sense once a controller is chosen.' },
    { q: 'How do I test custom middleware in isolation?', a: 'For integration testing, use <code>WebApplicationFactory&lt;Program&gt;</code> and call <code>CreateClient()</code> to get an HttpClient that routes through the full real pipeline. For unit testing, build a minimal pipeline with a <code>TestServer</code> or directly: <code>var handler = new ApplicationBuilder(sp).Use(...).Build()</code>, then invoke the resulting <code>RequestDelegate</code> with a <code>DefaultHttpContext</code>. The second approach lets you test middleware without spinning up Kestrel.' },
    { q: 'What does UseRouting() actually do, and when is explicit placement needed?', a: '<code>UseRouting()</code> matches the incoming request path against all registered endpoint routes and stores the match result in <code>HttpContext.GetEndpointFeature()</code>. In .NET 6+ minimal APIs, calling <code>app.MapGet()</code> implicitly inserts routing, so explicit <code>UseRouting()</code> is only needed when you want middleware between route-matching and endpoint-execution — for example, placing <code>UseCors()</code> or <code>UseRateLimiter()</code> after routing so they can read endpoint metadata for per-endpoint policies.' },
    { q: 'What is the difference between app.Map() and app.UseWhen()?', a: '<code>app.Map(path, branch)</code> permanently forks the pipeline — requests entering the branch never return to the main pipeline. <code>app.UseWhen(predicate, branch)</code> conditionally inserts middleware that rejoins the main pipeline after the branch finishes (unless the branch short-circuits by writing a response). Use <code>Map</code> for genuinely separate sub-apps (admin area, legacy API); use <code>UseWhen</code> for conditional cross-cutting behavior (extra logging for debug requests, per-tenant config) where normal endpoint handling should still occur.' },
    { q: 'How should I structure middleware that needs to log both request and response bodies?', a: 'Swap <code>context.Response.Body</code> with a <code>MemoryStream</code> before <code>next()</code> to capture the response body. For the request body, enable <code>Request.EnableBuffering()</code> so you can seek back to the beginning after reading. Always be conscious of memory: buffer only when necessary (development, audit logging) and set size limits. In production, prefer structured logging of metadata (method, path, status code, timing) over full body logging — body logging can expose secrets and PII.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The ASP.NET Core middleware pipeline is a "Russian doll" stack — each component wraps all downstream components; order is critical (exception handler first, auth before authz, static files before auth), and forgetting await next(ctx) silently stops the pipeline.',
    mustKnow: [
      '<code>app.Use()</code> must call <code>await next(ctx)</code> to continue — omitting it silently short-circuits the entire pipeline',
      '<code>app.Run()</code> is terminal (never calls next); code registered after it is unreachable dead code',
      'Middleware ordering: ExceptionHandler → HTTPS → StaticFiles → Routing → CORS → Authentication → Authorization → Endpoints',
      'UseAuthentication sets <code>HttpContext.User</code>; UseAuthorization reads it — never reverse the order',
      'Add response headers in <code>OnStarting(callback)</code> before calling <code>next()</code> — never after, as headers may already be sent',
      'Conventional middleware constructor is singleton-scoped; inject scoped services as <code>InvokeAsync</code> parameters, not constructor parameters',
      '<code>Map()</code>/<code>MapWhen()</code> branch permanently; <code>UseWhen()</code> branches and rejoins the main pipeline',
    ],
    interviewFocus: [
      'What happens if you forget to call await next(context)? How would you debug it?',
      'Why must UseAuthentication come before UseAuthorization?',
      'What is the difference between app.Map() and app.UseWhen()?',
      'How do you inject a Scoped service into conventional class-based middleware?',
      'Why use OnStarting() instead of setting response headers after await next()?',
    ],
  };
}
