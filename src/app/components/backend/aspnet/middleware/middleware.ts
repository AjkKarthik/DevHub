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
  selector: 'app-aspnet-middleware',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './middleware.html',
  styleUrl: './middleware.scss',
})
export class AspnetMiddleware {

  quickRef: QuickRefItem[] = [
    { name: 'app.Use()',        type: 'method',  desc: 'Adds inline middleware; must call next(ctx) to continue the pipeline', since: 'Core 1+' },
    { name: 'app.Run()',        type: 'method',  desc: 'Adds a terminal delegate — never calls next; pipeline stops here', since: 'Core 1+' },
    { name: 'app.Map()',        type: 'method',  desc: 'Branches the pipeline when the request path starts with the given prefix', since: 'Core 1+' },
    { name: 'app.MapWhen()',    type: 'method',  desc: 'Branches based on an arbitrary predicate over HttpContext', since: 'Core 1+' },
    { name: 'app.UseWhen()',    type: 'method',  desc: 'Conditionally adds middleware that rejoins the main pipeline afterward', since: 'Core 1+' },
    { name: 'RequestDelegate',  type: 'type',    desc: 'Signature: Func<HttpContext, Task> — what every middleware eventually calls', since: 'Core 1+' },
    { name: 'IMiddleware',      type: 'interface', desc: 'Interface-based middleware with DI-resolved constructor; registered via UseMiddleware<T>()', since: 'Core 1+' },
    { name: 'UseRouting()',     type: 'method',  desc: 'Must appear before UseAuthorization() and UseEndpoints() for attribute routing', since: 'Core 3+' },
    { name: 'UseExceptionHandler()', type: 'method', desc: 'Catches unhandled exceptions and writes a structured error response', since: 'Core 1+' },
    { name: 'Short-circuit',    type: 'syntax',  desc: 'Return without calling next to stop the pipeline (auth failures, cache hits)', since: 'Core 1+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The pipeline — request in, response out',
      points: [
        'Every HTTP request passes through a sequential chain of <strong>middleware</strong> components. Each component can inspect or modify the request, invoke the next component, then inspect or modify the response on the way back.',
        'Think of it as a stack: request flows in order (1 → 2 → 3 → endpoint), then response flows back in reverse (endpoint → 3 → 2 → 1). This "Russian doll" structure lets each middleware do pre- and post-processing.',
        'A middleware that calls <code>await next(context)</code> continues the chain. One that does <em>not</em> call <code>next</code> <strong>short-circuits</strong> — no further middleware runs, and the response goes back immediately. Exception handlers and auth rejections use this pattern.',
        'The pipeline is built once at startup and reused for every request — middleware instances are long-lived (unless scoped services are resolved inside). Keep middleware constructors lean and do real work in the delegate.',
      ],
    },
    {
      heading: 'app.Use, app.Run, and app.Map',
      points: [
        '<code>app.Use(async (ctx, next) => { ... })</code> adds a middleware that participates in the chain. You must <code>await next(ctx)</code> to pass control forward; skipping it short-circuits.',
        '<code>app.Run(async ctx => { ... })</code> is syntactic sugar for a terminal middleware — it never receives a <code>next</code> delegate and the pipeline ends here. Anything registered <em>after</em> <code>Run</code> is dead code.',
        '<code>app.Map("/admin", adminApp => { ... })</code> branches the pipeline: requests whose path starts with <code>/admin</code> enter the branch; all others continue the main pipeline. The branch and main line are independent.',
        '<code>app.MapWhen(ctx => ctx.Request.Headers.ContainsKey("X-Debug"), debugApp => { ... })</code> branches on any predicate. <code>UseWhen</code> is similar but the request rejoins the main pipeline after the branch.',
      ],
    },
    {
      heading: 'Ordering rules — why order matters',
      points: [
        'Middleware order is critical. The recommended built-in order: <strong>ExceptionHandler → HSTS → HttpsRedirection → StaticFiles → Routing → CORS → Authentication → Authorization → custom → Endpoints</strong>.',
        'Exception handling must be <em>first</em> so it can catch errors from everything downstream. If you put it after authentication, auth exceptions escape the handler.',
        'Authentication must run <em>before</em> Authorization: auth establishes <em>who</em> the user is; authorization decides <em>what</em> they can do. Swapping them means the authorization checks run without a populated <code>ClaimsPrincipal</code>.',
        'Static files should be early in the pipeline to avoid running auth checks on public assets. If your static files are protected, move <code>UseStaticFiles</code> after <code>UseAuthentication</code>.',
      ],
    },
    {
      heading: 'Custom middleware — delegate vs class',
      points: [
        'For simple one-liners use the <strong>inline delegate</strong> form: <code>app.Use(async (ctx, next) => { ... })</code>. Good for request timing, adding headers, or logging.',
        'For anything with dependencies, use the <strong>class form</strong>: implement <code>IMiddleware</code> (or the conventional pattern with <code>InvokeAsync(HttpContext, RequestDelegate)</code>), register it with DI, and add it with <code>app.UseMiddleware&lt;MyMiddleware&gt;()</code>.',
        'The conventional pattern (<code>InvokeAsync(HttpContext ctx, RequestDelegate next)</code>) allows scoped services to be injected directly into <code>InvokeAsync</code> parameters — the constructor can only receive singleton/transient services.',
        'Middleware registered as <code>IMiddleware</code> is resolved from DI per request, so it supports scoped lifetimes in its constructor. The conventional pattern resolves the class once (singleton-like) unless you use method injection.',
      ],
    },
    {
      heading: 'Common built-in middleware and their purpose',
      points: [
        '<code>UseExceptionHandler</code> catches unhandled exceptions and converts them to a configured error page or JSON ProblemDetails response — essential in production.',
        '<code>UseHsts</code> adds the <code>Strict-Transport-Security</code> header, telling browsers to always use HTTPS. Combine with <code>UseHttpsRedirection</code> to redirect HTTP to HTTPS.',
        '<code>UseStaticFiles</code> serves files from <code>wwwroot/</code> without hitting your middleware chain. <code>UseResponseCompression</code> gzips responses. <code>UseResponseCaching</code> caches full HTTP responses.',
        '<code>UseRouting</code> + <code>UseEndpoints</code> (or just <code>MapControllers</code> / <code>MapGet</code> in .NET 6+) wires attribute/conventional routing. <code>UseCors</code> adds CORS headers and must come after routing but before authorization.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pipeline Order',
      language: 'csharp',
      code: `// ── Recommended built-in middleware order ────────────────────────────
var app = builder.Build();

// 1. Exception handling — must be first to catch everything downstream
if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
    app.UseExceptionHandler("/error");

// 2. Security headers
app.UseHsts();
app.UseHttpsRedirection();

// 3. Static files — before auth so public assets skip auth checks
app.UseStaticFiles();

// 4. Routing — must be before auth & CORS
app.UseRouting();

// 5. CORS — after routing, before auth
app.UseCors("AllowFrontend");

// 6. Auth — order: authn THEN authz
app.UseAuthentication();
app.UseAuthorization();

// 7. Your custom middleware here
app.UseMiddleware<RequestTimingMiddleware>();

// 8. Endpoints — maps controller/minimal-API routes
app.MapControllers();
app.MapGet("/ping", () => "pong");

app.Run();`,
    },
    {
      label: 'Inline Middleware',
      language: 'csharp',
      code: `// ── Inline middleware with app.Use ───────────────────────────────────
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();

    // Pre-processing: runs before the rest of the pipeline
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Elapsed-Ms"] = sw.ElapsedMilliseconds.ToString();
        return Task.CompletedTask;
    });

    await next(context);     // call next middleware

    // Post-processing: runs after the pipeline returns
    // (response may already be streaming, so headers are set via OnStarting above)
    app.Logger.LogInformation("{Method} {Path} → {Status} in {Ms}ms",
        context.Request.Method,
        context.Request.Path,
        context.Response.StatusCode,
        sw.ElapsedMilliseconds);
});

// ── Terminal middleware with app.Run ──────────────────────────────────
// Nothing registered after Run ever executes
app.Run(async context =>
{
    context.Response.StatusCode = 404;
    await context.Response.WriteAsync("Not found");
});

// ── Short-circuit example ─────────────────────────────────────────────
app.Use(async (ctx, next) =>
{
    if (!ctx.Request.Headers.TryGetValue("X-Api-Key", out var key) || key != "secret")
    {
        ctx.Response.StatusCode = 401;
        await ctx.Response.WriteAsync("Unauthorized");
        return;            // ← short-circuit: do NOT call next
    }
    await next(ctx);
});`,
    },
    {
      label: 'Class Middleware',
      language: 'csharp',
      code: `// ── Conventional class middleware ────────────────────────────────────
// Constructor receives singleton/transient services.
// InvokeAsync parameters can receive scoped services per-request.
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    // Singleton services go in the constructor
    public RequestTimingMiddleware(RequestDelegate next,
                                   ILogger<RequestTimingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    // Scoped services can be injected as InvokeAsync parameters
    public async Task InvokeAsync(HttpContext context, ICurrentUserService user)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        _logger.LogInformation("[{User}] {Method} {Path} {Status} {Ms}ms",
            user.Name,
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            sw.ElapsedMilliseconds);
    }
}

// ── IMiddleware (DI-activated, scoped-friendly) ───────────────────────
public class ApiKeyMiddleware : IMiddleware
{
    private readonly IApiKeyValidator _validator;   // can be Scoped!
    public ApiKeyMiddleware(IApiKeyValidator validator) => _validator = validator;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (!_validator.IsValid(context.Request.Headers["X-Api-Key"]))
        {
            context.Response.StatusCode = 401;
            return;
        }
        await next(context);
    }
}

// ── Registration ──────────────────────────────────────────────────────
builder.Services.AddScoped<ApiKeyMiddleware>();          // must register for IMiddleware
app.UseMiddleware<RequestTimingMiddleware>();
app.UseMiddleware<ApiKeyMiddleware>();`,
    },
    {
      label: 'Branching',
      language: 'csharp',
      code: `// ── Map: branch on path prefix ───────────────────────────────────────
app.Map("/admin", adminApp =>
{
    // This pipeline only runs for /admin/* requests
    adminApp.UseAuthentication();
    adminApp.UseAuthorization();
    adminApp.Run(async ctx =>
        await ctx.Response.WriteAsync("Admin area"));
});

// ── MapWhen: branch on arbitrary predicate ────────────────────────────
app.MapWhen(
    ctx => ctx.Request.Headers.ContainsKey("X-Debug"),
    debugApp =>
    {
        debugApp.Run(async ctx =>
        {
            await ctx.Response.WriteAsJsonAsync(new
            {
                headers   = ctx.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
                query     = ctx.Request.QueryString.Value,
                timestamp = DateTime.UtcNow,
            });
        });
    });

// ── UseWhen: conditional middleware that rejoins main pipeline ─────────
// Requests with ?trace=1 get extra logging, but then continue normally
app.UseWhen(
    ctx => ctx.Request.Query.ContainsKey("trace"),
    traceApp =>
    {
        traceApp.Use(async (ctx, next) =>
        {
            Console.WriteLine($"TRACE: {ctx.Request.Path}");
            await next(ctx);   // continues main pipeline after this branch
        });
    });

app.MapGet("/hello", () => "Hello!");   // reached by everyone, incl. trace requests
app.Run();`,
    },
  ];

  challenge: Challenge = {
    title: 'Correlation ID middleware',
    language: 'csharp',
    description: `Build a <code>CorrelationIdMiddleware</code> that:
1. Reads the <code>X-Correlation-Id</code> request header, or generates a new <code>Guid</code> if absent.
2. Stores the ID in <code>HttpContext.Items["CorrelationId"]</code>.
3. Adds <code>X-Correlation-Id</code> to the response headers.
4. Logs "Request {CorrelationId} starting" before calling next and "Request {CorrelationId} finished in {ms}ms" after.
Register it before routing in the pipeline and verify it appears on responses.`,
    hints: [
      'Use context.Request.Headers.TryGetValue("X-Correlation-Id", out var id) to read the header',
      'context.Response.OnStarting() is the safe place to add response headers after await next()',
      'Store the timing start before await next() and compute elapsed after it returns',
      'Register via app.UseMiddleware<CorrelationIdMiddleware>() before app.UseRouting()',
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
    solution: `public class CorrelationIdMiddleware
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
        var id = context.Request.Headers.TryGetValue("X-Correlation-Id", out var existing)
            ? existing.ToString()
            : Guid.NewGuid().ToString("N");

        context.Items["CorrelationId"] = id;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Correlation-Id"] = id;
            return Task.CompletedTask;
        });

        var sw = Stopwatch.StartNew();
        _logger.LogInformation("Request {CorrelationId} starting", id);

        await _next(context);

        _logger.LogInformation("Request {CorrelationId} finished in {Ms}ms", id, sw.ElapsedMilliseconds);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between app.Use() and app.Run()?',
      options: [
        'app.Use() is for GET requests; app.Run() is for POST requests',
        'app.Use() passes control to the next middleware via next(); app.Run() is terminal and never calls next',
        'app.Use() runs synchronously; app.Run() runs asynchronously',
        'app.Use() is for production; app.Run() is for development only',
      ],
      answer: 1,
      explanation: '<code>app.Use()</code> receives a <code>next</code> delegate and must call it to continue the pipeline. <code>app.Run()</code> is a convenience for a terminal middleware — it never gets a <code>next</code> delegate and the pipeline ends after it. Code registered after <code>Run()</code> is unreachable.',
    },
    {
      q: 'Why must UseAuthentication() come before UseAuthorization()?',
      options: [
        'UseAuthorization() throws if called first — it is a compile error',
        'UseAuthentication establishes who the user is; UseAuthorization uses that identity to decide access. Reversing them means authorization runs with no user info.',
        'It is just a convention — the order has no functional impact',
        'UseAuthentication() registers the auth middleware factory; UseAuthorization() activates it',
      ],
      answer: 1,
      explanation: 'Authentication populates <code>HttpContext.User</code> with claims from a token or cookie. Authorization then reads those claims to enforce policies. If you reverse the order, authorization checks run before any identity is established and every request will be treated as anonymous.',
    },
    {
      q: 'Which method branches the pipeline and does NOT rejoin the main pipeline afterward?',
      options: [
        'app.UseWhen()',
        'app.MapWhen()',
        'app.Use()',
        'app.Map()',
      ],
      answer: 1,
      explanation: 'Both <code>Map()</code> and <code>MapWhen()</code> create a true branch — requests that enter the branch never return to the main pipeline. <code>UseWhen()</code> also creates a branch but the request rejoins the main pipeline after the branch finishes (unless the branch short-circuits with a response).',
    },
    {
      q: 'Why should exception-handling middleware be registered first?',
      options: [
        'It must run before routing resolves the endpoint',
        'It wraps the entire pipeline; if added later it cannot catch exceptions thrown by earlier middleware',
        'ASP.NET Core enforces this with a build-time error if the order is wrong',
        'Exception handling only works on the first middleware in the chain',
      ],
      answer: 1,
      explanation: 'Middleware wraps downstream components. Exception handling works by wrapping <code>await next()</code> in a try/catch. If you register it after other middleware, exceptions thrown by those earlier components escape the handler. First in the registration order = outermost wrapper = broadest coverage.',
    },
    {
      q: 'How do you inject a scoped service into class-based middleware without making the middleware itself scoped?',
      options: [
        'Register the service as Singleton so it matches the middleware lifetime',
        'Add the scoped service as a parameter to InvokeAsync() — ASP.NET Core resolves it from the request scope',
        'Use IServiceProvider in the constructor and call GetService<T>() inside InvokeAsync',
        'Scoped services cannot be used in middleware at all',
      ],
      answer: 1,
      explanation: 'Conventional middleware (with <code>InvokeAsync</code>) supports per-request DI via method injection: any parameter after <code>HttpContext</code> is resolved from the request\'s service scope. The middleware class itself is resolved once (singleton-like), but its <code>InvokeAsync</code> parameters are fresh per request.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What happens if I forget to call await next(context) in my middleware?',
      a: 'The pipeline short-circuits at your middleware. No subsequent middleware, routing, or endpoint handler runs. The response is whatever your middleware writes (or an empty 200 if you write nothing). This is intentional for rejecting requests early (auth checks, rate limiting), but accidental omission will make your app appear broken — all downstream features silently stop working.',
    },
    {
      q: 'Can middleware modify the response after next() returns?',
      a: 'Not the status code or headers once writing has started — once <code>Response.Body</code> is written to, the headers are already sent to the client. The safe pattern is <code>context.Response.OnStarting(callback)</code>: register a callback before calling <code>next()</code> and ASP.NET Core invokes it just before the first byte is written, giving you a window to add/modify headers.',
    },
    {
      q: 'What is the difference between IMiddleware and the conventional middleware pattern?',
      a: '<code>IMiddleware</code> requires the class to be registered in DI and resolves it per request, making scoped constructor injection work naturally. The conventional pattern (constructor + <code>InvokeAsync(HttpContext, RequestDelegate)</code>) is resolved once at startup — its constructor gets only singleton/transient services. For scoped deps, conventional middleware uses method injection (extra params on <code>InvokeAsync</code>). <code>IMiddleware</code> is simpler when you have scoped constructor dependencies.',
    },
    {
      q: 'When should I use middleware vs an action filter?',
      a: 'Middleware runs for <em>every</em> request, regardless of whether a route is matched. Action filters run only when an MVC controller action is involved. Use middleware for truly cross-cutting concerns (auth, CORS, logging, compression, security headers). Use filters for MVC-specific concerns (model state validation, result shaping, action-level logging) that only make sense once a controller is chosen.',
    },
    {
      q: 'How do I test custom middleware in isolation?',
      a: 'Create a <code>TestServer</code> via <code>new WebApplicationFactory&lt;Program&gt;()</code> and call <code>CreateClient()</code> to get an <code>HttpClient</code> that routes through the full pipeline. For unit testing, build a minimal pipeline with <code>new ApplicationBuilder(serviceProvider).Use(...).Build()</code> and invoke the resulting <code>RequestDelegate</code> with a fake <code>DefaultHttpContext</code>.',
    },
    {
      q: 'What does UseRouting() actually do, and when is it needed explicitly?',
      a: 'In .NET 6+ minimal APIs, calling <code>app.MapGet()</code> etc. implicitly adds routing middleware, so explicit <code>UseRouting()</code> is only needed when you want middleware to run between route matching and endpoint execution — e.g., <code>UseRouting → UseCors → UseAuthentication → UseAuthorization → MapControllers</code>. The documented recommended pattern still places it explicitly for clarity, and it is required when using <code>app.UseEndpoints()</code> (pre-.NET 6 style).',
    },
  ];
}
