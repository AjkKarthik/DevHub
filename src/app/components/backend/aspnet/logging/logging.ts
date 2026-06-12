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
  selector: 'app-aspnet-logging',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './logging.html',
  styleUrl: './logging.scss',
})
export class AspnetLogging {

  quickRef: QuickRefItem[] = [
    { name: 'ILogger<T>',                   type: 'interface', desc: 'Inject into any service; T becomes the category name for log filtering', since: 'Core 1+' },
    { name: 'logger.LogInformation("…")',   type: 'method',   desc: 'Logs at Information level; also Log{Warning,Error,Critical,Debug,Trace}()', since: 'Core 1+' },
    { name: 'Structured template: "User {UserId} logged in"', type: 'syntax', desc: 'Named holes {…} capture structured properties — NOT string interpolation', since: 'Core 1+' },
    { name: 'logger.BeginScope(…)',         type: 'method',   desc: 'Attaches ambient context to all log entries within the using block', since: 'Core 1+' },
    { name: 'LogLevel',                     type: 'type',     desc: 'Trace < Debug < Information < Warning < Error < Critical < None', since: 'Core 1+' },
    { name: '[LoggerMessage] source gen',   type: 'decorator', desc: 'Compile-time generated log methods — zero allocation, no boxing, fastest path', since: '.NET 6+' },
    { name: 'Logging:LogLevel:Default',     type: 'keyword',  desc: 'appsettings.json key controlling the minimum log level (per category)', since: 'Core 1+' },
    { name: 'builder.Logging.ClearProviders()', type: 'method', desc: 'Removes all built-in providers before adding your own (Serilog, NLog, etc.)', since: 'Core 1+' },
    { name: 'ILogger.IsEnabled(level)',     type: 'method',   desc: 'Check before building expensive log arguments to avoid allocations when filtered out', since: 'Core 1+' },
    { name: 'Activity / OpenTelemetry',     type: 'keyword',  desc: '.NET distributed tracing — logs emit TraceId/SpanId automatically with OTel providers', since: '.NET 5+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ILogger<T> and log levels',
      points: [
        'Inject <code>ILogger&lt;MyService&gt;</code> into any class. The generic type parameter becomes the <strong>category name</strong> — usually the fully-qualified class name — which is used in appsettings.json to filter log output per class or namespace.',
        'Six log levels in ascending severity: <code>Trace</code> (most verbose), <code>Debug</code>, <code>Information</code>, <code>Warning</code>, <code>Error</code>, <code>Critical</code>. Each has a matching method: <code>LogTrace</code> … <code>LogCritical</code>, plus the generic <code>Log(level, …)</code>.',
        'Set minimum levels in <code>appsettings.json</code> under <code>"Logging": { "LogLevel": { "Default": "Information", "Microsoft": "Warning" } }</code>. Messages below the minimum are discarded before reaching any provider — no allocation, no overhead.',
        'Prefer <code>LogError(ex, "…")</code> with an <code>Exception</code> first argument to capture stack traces. The exception is attached to the log entry as structured data, not just concatenated as a string.',
      ],
    },
    {
      heading: 'Structured logging — templates, not interpolation',
      points: [
        'Use <strong>message templates</strong> with named holes: <code>logger.LogInformation("Order {OrderId} placed by {UserId}", orderId, userId)</code>. The holes become named structured properties that log sinks (Seq, Elasticsearch, Application Insights) can index and query.',
        'Never use string interpolation (<code>$"Order {orderId}"</code>) in log calls. Interpolation builds the string even when the log level is filtered out — wasting allocations. It also discards the structured data, turning it into an opaque string.',
        'Semantic logging lets you write queries like <code>WHERE OrderId = 42</code> in your log tool instead of <code>WHERE message LIKE \'%42%\'</code>. The difference between "a log message" and "observable, queryable telemetry data" is structured logging.',
        'Property names are by convention PascalCase. Complex objects are serialized by the provider (Serilog destructs them with <code>{@obj}</code>). Keep holes to the minimum needed to identify the event.',
      ],
    },
    {
      heading: 'Log scopes — attaching ambient context',
      points: [
        '<code>logger.BeginScope(…)</code> attaches key-value pairs to every log entry made within the <code>using</code> block — including calls inside injected services that share the same logger category.',
        'Common uses: attach a request correlation ID, tenant ID, or user ID to all logs within a request or a batch job, without threading it through every method signature.',
        'The scope is pushed to a thread-local (or async-local) stack. Providers that support structured logging (Serilog, Application Insights) capture scope properties alongside the message. The built-in console provider can be configured to include scopes.',
        'Middleware is the natural place to open a request-wide scope: <code>using (_logger.BeginScope(new { CorrelationId = ctx.TraceIdentifier })) { await next(ctx); }</code>.',
      ],
    },
    {
      heading: 'Source-generated LoggerMessage — zero-allocation logging',
      points: [
        'Every call to <code>logger.LogInformation("…", args)</code> boxes value-type arguments and allocates a delegate unless the message is filtered. <strong>Source-generated LoggerMessage</strong> avoids this entirely.',
        'Decorate a <code>static partial</code> method with <code>[LoggerMessage(EventId, Level, "template")]</code>. The compiler generates a cached delegate that checks the enabled level first and skips all allocations if filtered.',
        'The generated method is strongly typed — the compiler will catch mismatched argument counts and wrong types at build time, unlike the runtime-only checks in normal log calls.',
        'Use source gen for hot-path log statements (per-request, per-loop). Less critical log calls (startup, shutdown, rare errors) do not justify the boilerplate.',
      ],
    },
    {
      heading: 'Providers and third-party logging frameworks',
      points: [
        'Built-in providers: <code>Console</code>, <code>Debug</code>, <code>EventSource</code>, <code>EventLog</code> (Windows), <code>ApplicationInsights</code> (via NuGet). They are all sink-agnostic: <code>ILogger</code> in your code never changes when you swap providers.',
        'Popular third-party providers: <strong>Serilog</strong> (rich sink ecosystem — files, Seq, Elasticsearch, Splunk), <strong>NLog</strong> (high-performance, flexible targets), <strong>OpenTelemetry</strong> (CNCF standard, exports to Jaeger, Tempo, Prometheus).',
        'To use Serilog: <code>builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration))</code>. Call <code>builder.Logging.ClearProviders()</code> first to avoid duplicate console output.',
        'Log correlation with distributed tracing: when OpenTelemetry is configured, <code>ILogger</code> automatically stamps every entry with the current <code>TraceId</code> and <code>SpanId</code>, linking logs to traces in your observability platform.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic ILogger Usage',
      language: 'csharp',
      code: `// ── Injecting and using ILogger<T> ───────────────────────────────────
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger) => _logger = logger;

    public async Task<Order> CreateAsync(CreateOrderRequest req)
    {
        // Information — normal business event
        _logger.LogInformation("Creating order for customer {CustomerId}", req.CustomerId);

        Order order;
        try
        {
            order = await ProcessOrderAsync(req);
            _logger.LogInformation("Order {OrderId} created successfully", order.Id);
        }
        catch (PaymentException ex)
        {
            // Error — exception as first argument captures the stack trace
            _logger.LogError(ex, "Payment failed for customer {CustomerId}", req.CustomerId);
            throw;
        }

        // Conditional check before building expensive state
        if (_logger.IsEnabled(LogLevel.Debug))
        {
            var details = await LoadOrderDetailsAsync(order.Id);  // expensive
            _logger.LogDebug("Order details: {Details}", details);
        }

        return order;
    }
}

// ── appsettings.json log level config ─────────────────────────────────
// {
//   "Logging": {
//     "LogLevel": {
//       "Default":              "Information",
//       "Microsoft":            "Warning",
//       "Microsoft.Hosting.Lifetime": "Information",
//       "MyApp.Services":       "Debug"     ← per-namespace override
//     }
//   }
// }`,
    },
    {
      label: 'Structured vs Interpolated',
      language: 'csharp',
      code: `// ── DO: structured templates (named holes become queryable properties) ──
_logger.LogInformation("Order {OrderId} placed by {UserId} for {Amount:C}",
    order.Id, order.UserId, order.TotalAmount);

// ── DON'T: string interpolation (builds string even when filtered) ────
_logger.LogInformation(\$"Order {order.Id} placed by {order.UserId}");
// ^ allocates the interpolated string before checking log level!

// ── DO: use exception as first argument for Error/Critical ────────────
_logger.LogError(ex, "Failed to process payment for order {OrderId}", orderId);

// ── DON'T: embed exception in message ────────────────────────────────
_logger.LogError(\$"Failed: {ex.Message}");   // loses structured data & stack

// ── Logging complex objects — with Serilog destructuring ─────────────
// Serilog: prefix property with @ to serialize the object graph
// Standard ILogger: complex objects are ToString()'d unless provider destructs them
_logger.LogInformation("Processing request {@Request}", request);

// ── Log levels by example ─────────────────────────────────────────────
_logger.LogTrace("Entering ParseRequest with {ByteCount} bytes", buf.Length);
_logger.LogDebug("Cache miss for key {CacheKey}", key);
_logger.LogInformation("User {UserId} logged in from {IpAddress}", userId, ip);
_logger.LogWarning("Rate limit approaching: {UsagePercent}% of quota used", pct);
_logger.LogError(ex, "Database query failed for {Query}", sql);
_logger.LogCritical("Payment provider is unreachable — orders cannot be processed");`,
    },
    {
      label: 'Log Scopes',
      language: 'csharp',
      code: `// ── Request-wide scope via middleware ─────────────────────────────────
app.Use(async (context, next) =>
{
    // Every log entry inside this request gets CorrelationId attached
    using var scope = _logger.BeginScope(new Dictionary<string, object>
    {
        ["CorrelationId"] = context.TraceIdentifier,
        ["RequestPath"]   = context.Request.Path.Value ?? "",
    });

    await next(context);
});

// ── Per-operation scope in a service ─────────────────────────────────
public async Task ProcessJobAsync(int jobId)
{
    using var scope = _logger.BeginScope("Job {JobId}", jobId);
    // All logs below automatically include the JobId scope property

    _logger.LogInformation("Starting job processing");

    await FetchDataAsync();       // ILogger<DataFetcher> logs here too get the scope
    await TransformDataAsync();

    _logger.LogInformation("Job processing complete");
}   // scope disposed — no more JobId on subsequent log entries

// ── Console provider: enable scopes ──────────────────────────────────
// appsettings.json:
// "Logging": {
//   "Console": {
//     "IncludeScopes": true,
//     "FormatterName": "json"
//   }
// }`,
    },
    {
      label: 'Source-Generated LoggerMessage',
      language: 'csharp',
      code: `// ── Source-generated logging — compile-time, zero-allocation ─────────
public partial class OrderService
{
    private readonly ILogger<OrderService> _logger;

    // Attribute-based: compiler generates a static partial method
    [LoggerMessage(
        EventId   = 1001,
        Level     = LogLevel.Information,
        Message   = "Order {OrderId} created for customer {CustomerId}")]
    private static partial void LogOrderCreated(
        ILogger logger, int orderId, string customerId);

    [LoggerMessage(
        EventId   = 1002,
        Level     = LogLevel.Error,
        Message   = "Payment failed for order {OrderId}")]
    private static partial void LogPaymentFailed(
        ILogger logger, Exception ex, int orderId);

    [LoggerMessage(
        EventId   = 1003,
        Level     = LogLevel.Warning,
        Message   = "Retry {Attempt}/{MaxAttempts} for order {OrderId}")]
    private static partial void LogRetryAttempt(
        ILogger logger, int attempt, int maxAttempts, int orderId);

    public async Task<Order> CreateAsync(CreateOrderRequest req)
    {
        var order = await ProcessAsync(req);
        LogOrderCreated(_logger, order.Id, req.CustomerId);  // zero alloc
        return order;
    }

    public async Task ChargeAsync(int orderId)
    {
        for (int i = 1; i <= 3; i++)
        {
            try { await _paymentGateway.ChargeAsync(orderId); return; }
            catch (Exception ex) when (i < 3)
            {
                LogRetryAttempt(_logger, i, 3, orderId);
            }
            catch (Exception ex)
            {
                LogPaymentFailed(_logger, ex, orderId);
                throw;
            }
        }
    }
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Request audit logger middleware with structured scopes',
    language: 'csharp',
    description: `Build an <code>AuditMiddleware</code> that:
1. Reads (or generates) a <code>X-Request-Id</code> header.
2. Opens a log scope attaching <code>RequestId</code>, <code>Method</code>, and <code>Path</code> to all entries within the request.
3. Logs <code>Information</code>: "Request started" before calling next.
4. Logs <code>Information</code>: "Request completed {StatusCode} in {ElapsedMs}ms" after the pipeline returns.
5. Logs <code>Warning</code> (not Error) if the response status is 4xx, and <code>Error</code> if 5xx.
Register it in Program.cs and verify the logs appear with structured properties.`,
    hints: [
      'Use logger.BeginScope(new { RequestId, Method, Path }) and wrap the await next(ctx) inside the using block',
      'Capture Stopwatch.StartNew() before await next(ctx); read ElapsedMilliseconds after',
      'Check context.Response.StatusCode >= 500 for error level, >= 400 for warning',
      'Register via builder.Services.AddTransient<AuditMiddleware>() and app.UseMiddleware<AuditMiddleware>() early in pipeline',
    ],
    starterCode: `public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // TODO: read or generate request ID
        // TODO: open log scope with RequestId, Method, Path
        // TODO: log "Request started"
        // TODO: time the request
        // TODO: call next
        // TODO: log completion with level based on status code
    }
}`,
    solution: `public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.Request.Headers.TryGetValue("X-Request-Id", out var h)
            ? h.ToString() : Guid.NewGuid().ToString("N")[..8];

        context.Response.Headers["X-Request-Id"] = requestId;

        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["RequestId"] = requestId,
            ["Method"]    = context.Request.Method,
            ["Path"]      = context.Request.Path.Value ?? "",
        });

        _logger.LogInformation("Request started");
        var sw = Stopwatch.StartNew();

        await _next(context);

        var status = context.Response.StatusCode;
        var ms     = sw.ElapsedMilliseconds;

        if (status >= 500)
            _logger.LogError("Request completed {StatusCode} in {ElapsedMs}ms", status, ms);
        else if (status >= 400)
            _logger.LogWarning("Request completed {StatusCode} in {ElapsedMs}ms", status, ms);
        else
            _logger.LogInformation("Request completed {StatusCode} in {ElapsedMs}ms", status, ms);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you use message templates ("Order {Id} created") instead of string interpolation ($"Order {id} created") in log calls?',
      options: [
        'String interpolation does not compile inside log methods',
        'Templates keep named properties as structured data for querying; interpolation allocates a string even when the level is filtered out',
        'ILogger only accepts string literals, not interpolated strings',
        'Templates are faster because they use StringBuilder internally',
      ],
      answer: 1,
      explanation: 'Message templates preserve named properties as structured fields in the log sink (Seq, App Insights, Elasticsearch can query <code>WHERE OrderId = 42</code>). String interpolation discards this structure. More importantly, interpolation always allocates the result string, while templates with level filtering skip all allocations when the level is below the configured minimum.',
    },
    {
      q: 'What does logger.BeginScope(...) do?',
      options: [
        'It creates a new ILogger instance scoped to the current class',
        'It starts a database transaction linked to the current log session',
        'It attaches ambient key-value properties to every log entry written within the using block',
        'It limits log output to the specified severity level for the duration of the block',
      ],
      answer: 2,
      explanation: '<code>BeginScope()</code> pushes properties onto an async-local scope stack. All log entries within the <code>using</code> block (including those from injected services) carry those properties. Providers like Serilog and Application Insights serialize the scope alongside each entry — ideal for attaching a correlation ID or tenant ID to an entire request.',
    },
    {
      q: 'What is the primary advantage of [LoggerMessage] source generation over direct logger.LogXxx() calls?',
      options: [
        'It supports more log levels than the standard ILogger interface',
        'It generates compile-time-checked, cached log delegates that avoid boxing and allocation on filtered paths',
        'It automatically routes logs to multiple providers simultaneously',
        'It enables logs to be written to a database without configuration',
      ],
      answer: 1,
      explanation: 'Standard <code>LogXxx()</code> calls box value-type arguments and allocate a delegate every call, even if the log level is filtered. <code>[LoggerMessage]</code> generates a <code>static partial</code> method that checks the level first and, if disabled, returns immediately with zero heap allocation. Arguments are also strongly typed, catching mismatches at compile time.',
    },
    {
      q: 'In appsettings.json, how do you set the minimum log level to Warning for everything except your own app\'s namespace?',
      options: [
        '"LogLevel": { "Default": "Warning", "MyApp": "Information" }',
        '"LogLevel": { "All": "Warning", "Except:MyApp": "Information" }',
        '"LogLevel": { "Warning": true, "MyApp": false }',
        '"MinimumLevel": "Warning", "Override": { "MyApp": "Information" }',
      ],
      answer: 0,
      explanation: 'The <code>"Logging": { "LogLevel": { ... } }</code> block accepts category prefixes as keys. <code>"Default": "Warning"</code> applies to everything not otherwise matched; <code>"MyApp": "Information"</code> overrides the default for all categories whose name starts with <code>MyApp</code>. More specific prefixes always win.',
    },
    {
      q: 'When should you call logger.IsEnabled(LogLevel.Debug) before a log call?',
      options: [
        'Always — it is best practice to guard every log call',
        'Never — ASP.NET Core already checks the level before writing',
        'When computing the log arguments is expensive and you want to skip that work when the level is filtered out',
        'Only for LogLevel.Trace — all other levels are cheap enough to skip the check',
      ],
      answer: 2,
      explanation: 'ASP.NET Core checks the level before writing the entry, so filtered log calls do not write output. But if you must build expensive arguments first (loading from a database, serialising a large object), those allocations happen before the level check. Wrapping the work in <code>if (logger.IsEnabled(LogLevel.Debug))</code> skips the expensive preparation entirely when the level is off.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between LogError(ex, "…") and LogError("…" + ex.Message)?',
      a: '<code>LogError(ex, "message {Id}", id)</code> attaches the exception as a first-class structured property — the provider serialises the full stack trace, inner exception chain, and exception type alongside the log entry. Concatenating the message with <code>ex.Message</code> loses the stack trace, structured data, and makes the log unsearchable by exception type.',
    },
    {
      q: 'How do I use Serilog with ASP.NET Core?',
      a: 'Install <code>Serilog.AspNetCore</code> and configure it in Program.cs: <code>builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration).WriteTo.Console().WriteTo.File("logs/log.txt", rollingInterval: RollingInterval.Day))</code>. Call <code>builder.Logging.ClearProviders()</code> before this line to remove the default providers and avoid duplicate console output. Your existing <code>ILogger&lt;T&gt;</code> injections require no changes.',
    },
    {
      q: 'Can I log from a constructor or a field initialiser?',
      a: 'No — the <code>ILogger</code> is not available until the constructor body runs, and in a field initialiser it has not been injected yet. For "service created" diagnostics, log in the constructor body after assigning <code>_logger</code>. For early startup events (before DI is available), use a temporary <code>ILoggerFactory</code> created from <code>LoggerFactory.Create()</code> or defer the log until the first method call.',
    },
    {
      q: 'What is the EventId parameter in [LoggerMessage] and why does it matter?',
      a: 'EventId is an integer identifier for the log event type. It allows log analysis tools, alerting rules, and monitoring dashboards to query by event type rather than parsing message strings. Assign stable, unique IDs across your application — e.g., group them by service (1000–1099 for OrderService, 2000–2099 for PaymentService). Once an EventId is in production logs, avoid changing it — queries and alerts depend on it.',
    },
    {
      q: 'How does OpenTelemetry relate to ILogger?',
      a: 'OpenTelemetry for .NET bridges the three pillars of observability — logs, metrics, and traces — into a vendor-neutral SDK. When you add <code>builder.Logging.AddOpenTelemetry()</code>, your existing <code>ILogger</code> calls are automatically forwarded to the OTel pipeline (and from there to Jaeger, Grafana Tempo, Dynatrace, etc.). Every log entry is automatically stamped with the active <code>TraceId</code> and <code>SpanId</code>, correlating log lines to the distributed trace that produced them.',
    },
    {
      q: 'Why do I see duplicate log entries after adding Serilog?',
      a: 'You forgot to call <code>builder.Logging.ClearProviders()</code> before <code>builder.Host.UseSerilog(…)</code>. Without clearing, both the default Console/Debug providers and Serilog\'s providers are active, so every log entry goes through both pipelines. Call <code>ClearProviders()</code> first, then configure Serilog as the sole provider.',
    },
  ];
}
