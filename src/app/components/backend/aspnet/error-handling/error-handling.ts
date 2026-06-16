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
  selector: 'app-aspnet-error-handling',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss',
})
export class AspnetErrorHandling {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware', route: '/aspnet/middleware' },
    { label: 'Controllers & Actions', route: '/aspnet/controllers' },
    { label: 'Filters & Endpoint Filters', route: '/aspnet/filters' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'UseExceptionHandler()',       type: 'method',    desc: 'Global exception handler middleware — register first' },
    { name: 'IExceptionHandler',           type: 'interface', desc: '.NET 8+ typed handler — chain multiple, return true when handled' },
    { name: 'ProblemDetails',              type: 'class',     desc: 'RFC 9457 error response (type, title, status, detail, instance)' },
    { name: 'ValidationProblemDetails',    type: 'class',     desc: 'ProblemDetails + errors dictionary for validation failures' },
    { name: 'AddProblemDetails()',          type: 'method',    desc: 'Registers ProblemDetails services; enables automatic JSON formatting' },
    { name: 'IProblemDetailsService',      type: 'interface', desc: 'Write ProblemDetails to the response inside an IExceptionHandler' },
    { name: 'UseDeveloperExceptionPage()', type: 'method',    desc: 'Stack trace page — development only, never production' },
    { name: 'UseStatusCodePages()',         type: 'method',    desc: 'Adds body to bare 4xx/5xx responses with no body' },
    { name: 'Problem()',                   type: 'method',    desc: 'ControllerBase helper — returns 500 ProblemDetails ObjectResult' },
    { name: 'Results.Problem()',           type: 'method',    desc: 'Minimal API equivalent of Problem()' },
    { name: 'CustomizeProblemDetails',     type: 'accessor',  desc: 'AddProblemDetails callback to enrich every error response globally' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Global Exception Handler Middleware',
      points: [
        '<code>app.UseExceptionHandler()</code> catches all unhandled exceptions anywhere in the pipeline. Register it as the <strong>very first middleware</strong> so it wraps everything else.',
        'Call <code>builder.Services.AddProblemDetails()</code> before building the app — this makes <code>UseExceptionHandler()</code> automatically format errors as RFC 9457 JSON ProblemDetails. Without it, the default handler returns an empty 500 body.',
        'In development, replace it with <code>app.UseDeveloperExceptionPage()</code> for a rich stack trace view. Guard it strictly: <code>if (app.Environment.IsDevelopment())</code> — exposing stack traces in production is a security vulnerability.',
        '<code>app.UseStatusCodePages()</code> adds a plain-text body to bare 4xx/5xx responses that have no body (e.g., a static file 404 returns no body by default).',
        '<code>UseStatusCodePagesWithReExecute("/error/{0}")</code> re-runs the pipeline through an error endpoint, preserving the original URL and status code — the recommended approach over <code>UseStatusCodePagesWithRedirects</code> which changes the URL.',
        'UseExceptionHandler logs exceptions automatically when a logger is configured — you do not need to log inside exception handlers unless you need custom fields.',
      ],
    },
    {
      heading: 'ProblemDetails (RFC 9457)',
      points: [
        'The five standard fields: <strong>type</strong> (URI identifying the error class, e.g. RFC link), <strong>title</strong> (short summary), <strong>status</strong> (HTTP status code), <strong>detail</strong> (specific description of this occurrence), <strong>instance</strong> (URI of the failing request).',
        '<code>ValidationProblemDetails</code> extends ProblemDetails with an <strong>errors</strong> dictionary mapping field names to string arrays — the standard format for 400 validation failures from <code>[ApiController]</code>.',
        'Return from controllers with <code>Problem(title, detail, statusCode)</code> or <code>ValidationProblem(ModelState)</code>. From minimal APIs: <code>Results.Problem()</code> or <code>Results.ValidationProblem(errors)</code>.',
        'ProblemDetails.Extensions is a dictionary whose entries serialise as root-level JSON properties — use it for custom fields like <code>traceId</code>, <code>correlationId</code>, <code>nodeId</code>.',
        'The <code>type</code> URI should be a stable, bookmarkable URL describing the error category (e.g., your own docs page or the relevant RFC section) — not a per-request URL.',
        'Clients should branch on <code>status</code> for machine handling and display <code>detail</code> to users. Do not put sensitive data (stack traces, connection strings) in any ProblemDetails field in production.',
      ],
    },
    {
      heading: 'IExceptionHandler (.NET 8+)',
      points: [
        'Register multiple typed handlers tried in registration order via <code>builder.Services.AddExceptionHandler&lt;T&gt;()</code>. Each returns <code>true</code> if it handled the exception, <code>false</code> to pass to the next handler.',
        'Chain domain-specific handlers first (<code>NotFoundException</code> → 404, <code>ValidationException</code> → 422) with a catch-all <code>FallbackExceptionHandler</code> last that always returns <code>true</code>.',
        'Use <code>IProblemDetailsService.WriteAsync(new ProblemDetailsContext { ... })</code> inside the handler to write the response. Always set <code>ctx.Response.StatusCode</code> before calling <code>WriteAsync</code>.',
        'Prefer <code>IExceptionHandler</code> over exception filters for app-wide exception mapping — it applies to any middleware, not just the MVC pipeline.',
        'Each handler receives the raw <code>Exception</code> — use <code>ex is NotFoundException nfe</code> pattern matching to inspect the type and extract properties in a type-safe way.',
        'A handler that returns <code>false</code> leaves the response untouched — the next handler starts with a clean state. Never write a partial response then return <code>false</code>.',
      ],
    },
    {
      heading: 'Custom ProblemDetails Extensions',
      points: [
        'Enrich every error response globally via the <code>AddProblemDetails</code> callback: <code>opts.CustomizeProblemDetails = ctx => { ... }</code>.',
        'Add diagnostic fields like <code>"traceId"</code> (<code>Activity.Current?.Id</code>), <code>"nodeId"</code> (machine name), or (in non-production) <code>"exception"</code> to <code>ctx.ProblemDetails.Extensions</code> — they serialise as root-level JSON properties.',
        'Set <code>ctx.ProblemDetails.Instance</code> to the request method + path so clients can reference the exact failing call in bug reports: <code>$"{req.Method} {req.Path}"</code>.',
        'Gate sensitive fields behind <code>IWebHostEnvironment.IsProduction()</code> — include exception type in staging but hide it in production.',
        'The callback runs synchronously during response writing — keep it lightweight. For async lookups (e.g., fetching a request ID from a distributed tracing service), do them in middleware before the error response is generated.',
        'Use <code>ctx.ProblemDetails.Type</code> to set a stable URI for each error category — link to your API docs page for that error type so clients know what it means and how to fix it.',
      ],
    },
    {
      heading: 'Exception Hierarchy and Domain Exceptions',
      points: [
        'Define a base <code>DomainException</code> class with a status code property. Derived classes (<code>NotFoundException</code>, <code>ConflictException</code>, <code>UnprocessableEntityException</code>) carry their own status codes.',
        'Map domain exceptions to HTTP status codes in a single <code>IExceptionHandler</code> — this is the only place that knows both the domain model and HTTP semantics.',
        'Never use HTTP status codes in your domain layer — throw <code>NotFoundException</code> (not <code>HttpException(404)</code>). The handler layer converts domain concepts to HTTP.',
        'Use sealed exception classes to prevent accidental derivation that would break the <code>switch</code> expression in the handler.',
        '<code>AggregateException</code> from parallel tasks — unwrap with <code>.InnerExceptions</code> or use <code>.Flatten()</code> and re-map each inner exception individually.',
        'Exceptions that cross API boundaries should serialise only safe information in their <code>Message</code> — avoid including internal IDs, SQL, or file paths that could leak sensitive data.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'UseExceptionHandler',
      language: 'csharp',
      code: `// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails(opts =>
    opts.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Instance =
            \$"{ctx.HttpContext.Request.Method} {ctx.HttpContext.Request.Path}";
        ctx.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier;
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
{
    app.UseExceptionHandler();   // AddProblemDetails drives the format
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/error/{0}");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();`,
    },
    {
      label: 'IExceptionHandler',
      language: 'csharp',
      code: `public class DomainExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _pds;
    public DomainExceptionHandler(IProblemDetailsService p) => _pds = p;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException   e => (404, e.Message),
            ConflictException   e => (409, e.Message),
            ForbiddenException  _ => (403, "Access denied"),
            _                     => (0,   "")
        };
        if (status == 0) return false;   // not handled → next handler

        ctx.Response.StatusCode = status;
        await _pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext    = ctx,
            Exception      = ex,
            ProblemDetails = new ProblemDetails { Title = title, Status = status }
        }, ct);
        return true;
    }
}

// Registration — tried in order
builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddExceptionHandler<FallbackExceptionHandler>();
builder.Services.AddProblemDetails();`,
    },
    {
      label: 'Custom ProblemDetails',
      language: 'csharp',
      code: `builder.Services.AddProblemDetails(opts =>
    opts.CustomizeProblemDetails = ctx =>
    {
        var req = ctx.HttpContext.Request;
        var env = ctx.HttpContext.RequestServices
                      .GetRequiredService<IWebHostEnvironment>();

        ctx.ProblemDetails.Instance =
            \$"{req.Method} {req.Path}{req.QueryString}";
        ctx.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier;

        if (!env.IsProduction())
            ctx.ProblemDetails.Extensions["exception"] =
                ctx.Exception?.GetType().Name;
    });

// All error responses now include:
// {
//   "status":    500,
//   "title":     "An error occurred while processing your request.",
//   "instance":  "POST /api/orders",
//   "traceId":   "00-abc123-00",
//   "exception": "InvalidOperationException"   ← non-prod only
// }`,
    },
    {
      label: 'ValidationProblemDetails',
      language: 'csharp',
      code: `// Controller — manual validation problem
[HttpPost]
public IActionResult Create(CreateOrderDto dto)
{
    if (dto.Items.Count == 0)
        ModelState.AddModelError("Items", "Order must have at least one item");
    if (dto.CustomerId <= 0)
        ModelState.AddModelError("CustomerId", "Invalid customer");

    if (!ModelState.IsValid)
        return ValidationProblem(ModelState);   // 400 ValidationProblemDetails

    return Ok(orderService.Create(dto));
}

// Minimal API — explicit errors dictionary
app.MapPost("/orders", (CreateOrderDto dto) =>
{
    var errors = new Dictionary<string, string[]>();
    if (dto.Items.Count == 0)
        errors["Items"] = ["Order must have at least one item"];
    if (errors.Count > 0)
        return Results.ValidationProblem(errors);
    return TypedResults.Ok(dto);
});

// Response body:
// { "type": "...", "title": "One or more validation errors occurred.",
//   "status": 400, "errors": { "Items": ["Order must have at least one item"] } }`,
    },
    {
      label: 'Status Code Pages',
      language: 'csharp',
      code: `// ReExecute — keeps original URL + status code (recommended)
app.UseStatusCodePagesWithReExecute("/error/{0}");

// Error endpoint — returns ProblemDetails for any status code
app.MapGet("/error/{code:int}", (int code) =>
    Results.Problem(
        statusCode: code,
        title: code switch {
            404 => "The requested resource was not found.",
            403 => "You do not have permission to access this resource.",
            400 => "The request was invalid.",
            _   => "An unexpected error occurred."
        }))
.ExcludeFromDescription();    // hide from OpenAPI docs

// vs Redirects (changes URL — status code lost):
// app.UseStatusCodePagesWithRedirects("/error/{0}");  ← avoid`,
    },
  ];

  challenge: Challenge = {
    title: 'Typed Exception Handler',
    language: 'csharp',
    description: 'Implement an IExceptionHandler called AppExceptionHandler that: maps NotFoundException to 404 ProblemDetails, maps UnauthorizedException to 401, returns false for all other exception types. Register it in Program.cs with AddProblemDetails(). Write a minimal API endpoint GET /items/{id:int} that throws NotFoundException when id < 1.',
    hints: [
      'Implement IExceptionHandler.TryHandleAsync returning ValueTask<bool>',
      'Use IProblemDetailsService.WriteAsync to write the response',
      'Set ctx.Response.StatusCode BEFORE calling WriteAsync',
      'Return false if the exception type is not handled',
    ],
    starterCode: `public class AppExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _pds;
    public AppExceptionHandler(IProblemDetailsService pds) => _pds = pds;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        // TODO: map NotFoundException → 404, UnauthorizedException → 401
        // TODO: return false for other exceptions
        return false;
    }
}

public class NotFoundException(string msg)     : Exception(msg);
public class UnauthorizedException(string msg) : Exception(msg);

// Program.cs
var builder = WebApplication.CreateBuilder(args);
// TODO: register handler + AddProblemDetails
var app = builder.Build();
app.UseExceptionHandler();
// TODO: MapGet /items/{id:int}
app.Run();`,
    solution: `public class AppExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _pds;
    public AppExceptionHandler(IProblemDetailsService pds) => _pds = pds;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException   e => (404, e.Message),
            UnauthorizedException _ => (401, "Unauthorized"),
            _                     => (0,   "")
        };
        if (status == 0) return false;

        ctx.Response.StatusCode = status;
        await _pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext    = ctx,
            Exception      = ex,
            ProblemDetails = new ProblemDetails { Title = title, Status = status }
        }, ct);
        return true;
    }
}

public class NotFoundException(string msg)     : Exception(msg);
public class UnauthorizedException(string msg) : Exception(msg);

// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler();

app.MapGet("/items/{id:int}", (int id) =>
{
    if (id < 1) throw new NotFoundException(\$"Item {id} not found");
    return TypedResults.Ok(new { id, name = "Sample Item" });
});

app.Run();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which middleware must be registered FIRST so it can catch all unhandled exceptions?',
      options: ['UseAuthorization()', 'UseRouting()', 'UseExceptionHandler()', 'UseHttpsRedirection()'],
      answer: 2,
      explanation: 'UseExceptionHandler() must wrap the rest of the pipeline. Registered after other middleware, it cannot catch exceptions thrown by those earlier middleware layers.',
    },
    {
      q: 'What does AddProblemDetails() enable?',
      options: [
        'Adds a /problem endpoint automatically',
        'Makes all error responses use RFC 9457 ProblemDetails JSON format',
        'Validates models against ProblemDetails schema',
        'Enables XML ProblemDetails responses',
      ],
      answer: 1,
      explanation: 'AddProblemDetails() registers IProblemDetailsService and configures UseExceptionHandler() and UseStatusCodePages() to write RFC 9457 ProblemDetails JSON responses.',
    },
    {
      q: 'IExceptionHandler.TryHandleAsync should return true when?',
      options: [
        'An exception was caught but not yet handled',
        'The exception was handled and the response was written',
        'The next handler in the chain should run',
        'The exception should be rethrown',
      ],
      answer: 1,
      explanation: 'Return true to signal the exception has been fully handled (response written). Return false to pass the exception to the next registered IExceptionHandler.',
    },
    {
      q: 'UseDeveloperExceptionPage() should be used in which environment(s)?',
      options: ['Production only', 'All environments', 'Development only', 'Staging and Development'],
      answer: 2,
      explanation: 'UseDeveloperExceptionPage() shows the full stack trace and request details — a serious information disclosure risk. Only use it in Development.',
    },
    {
      q: 'What is the difference between UseStatusCodePagesWithRedirects and UseStatusCodePagesWithReExecute?',
      options: [
        'Redirects sends 302 and changes the URL; ReExecute keeps the URL and original status code',
        'They are identical — just different names',
        'Redirects is for controllers; ReExecute is for minimal APIs',
        'ReExecute changes the status code to 200',
      ],
      answer: 0,
      explanation: 'UseStatusCodePagesWithRedirects sends a 302 — the URL changes and the original status code is lost. UseStatusCodePagesWithReExecute re-runs the pipeline internally, preserving both the URL and the original status code.',
    },
    {
      q: 'Where should you set ctx.Response.StatusCode when writing a ProblemDetails response inside IExceptionHandler?',
      options: [
        'Inside ProblemDetails.Status — it sets both automatically',
        'After calling IProblemDetailsService.WriteAsync()',
        'Before calling IProblemDetailsService.WriteAsync()',
        'It is set automatically by AddProblemDetails()',
      ],
      answer: 2,
      explanation: 'Set ctx.Response.StatusCode before calling WriteAsync. WriteAsync uses the ProblemDetailsContext.ProblemDetails.Status field for the body but reads the HTTP status code from the response object.',
    },
    {
      q: 'ProblemDetails.Extensions entries serialise as what in the JSON response?',
      options: [
        'A nested "extensions" object',
        'Ignored — extensions are not serialised',
        'Root-level JSON properties alongside type/title/status',
        'Base64-encoded metadata',
      ],
      answer: 2,
      explanation: 'ProblemDetails.Extensions entries are merged into the root of the JSON response body — they appear as top-level properties alongside "type", "title", "status", etc.',
    },
    {
      q: 'What happens if no registered IExceptionHandler returns true?',
      options: [
        'A 200 OK is returned',
        'The exception is silently swallowed',
        'UseExceptionHandler middleware produces a generic 500 ProblemDetails (with AddProblemDetails) or closes the connection',
        'The exception is rethrown and crashes the process',
      ],
      answer: 2,
      explanation: 'If all handlers return false, UseExceptionHandler falls back to a generic 500. With AddProblemDetails(), this becomes a ProblemDetails JSON response. Without it, Kestrel closes the connection with no body.',
    },
    {
      q: 'Which component should you use for exception handling that needs to catch middleware exceptions?',
      options: [
        'IExceptionFilter on a base controller',
        'UseExceptionHandler / IExceptionHandler',
        'A try/catch in every action method',
        'IActionFilter with ExceptionHandled = true',
      ],
      answer: 1,
      explanation: 'Exception filters only cover the MVC pipeline (actions, action filters). UseExceptionHandler/IExceptionHandler catches exceptions from any middleware layer, making them the right choice for app-wide coverage.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use IExceptionHandler or an exception filter?',
      a: 'IExceptionHandler is broader — it catches exceptions from any middleware, not just MVC filters. Use IExceptionHandler for app-wide error mapping. Use exception filters only when different controllers need different exception-to-response mappings that depend on ActionContext.',
    },
    {
      q: 'What are the five fields of a ProblemDetails response?',
      a: '"type" (URI identifying the error class), "title" (short human-readable summary), "status" (HTTP status code), "detail" (longer explanation for this specific occurrence), and "instance" (URI of the failing request). All are optional per RFC 9457 but status and title should always be set.',
    },
    {
      q: 'How do I add extra fields to ProblemDetails (e.g. traceId)?',
      a: 'Add them to ProblemDetails.Extensions dictionary — entries serialise as root-level JSON properties. Use the AddProblemDetails(opts => opts.CustomizeProblemDetails = ...) callback to add them globally to every error response.',
    },
    {
      q: 'What happens if no IExceptionHandler handles an exception?',
      a: 'The exception propagates to the UseExceptionHandler middleware. With AddProblemDetails(), a generic 500 ProblemDetails response is returned. Without it, Kestrel closes the connection with an empty response body.',
    },
    {
      q: 'How do I hide stack traces from API clients in production?',
      a: 'Do not call UseDeveloperExceptionPage() in production. With AddProblemDetails() and UseExceptionHandler(), the 500 response never includes the stack trace. In the CustomizeProblemDetails callback you can gate "exception" in Extensions on IsDevelopment().',
    },
    {
      q: 'Can IExceptionHandler catch exceptions from background services?',
      a: 'No. IExceptionHandler only applies to HTTP request processing. Background services run outside the request pipeline. Wrap their ExecuteAsync with try/catch and use ILogger to record failures, or use unhandled exception events on the host.',
    },
    {
      q: 'When should I define custom domain exception classes?',
      a: 'Always — use domain exceptions (NotFoundException, ConflictException) in your service layer instead of HTTP-specific exceptions. Map them to status codes in a single IExceptionHandler. This keeps your domain layer free of HTTP dependencies and centralises error-to-HTTP mapping.',
    },
    {
      q: 'Is it safe to include exception details in ProblemDetails responses?',
      a: 'Never in production — exception messages can leak file paths, SQL, internal IDs, or stack frame details. Gate sensitive fields (exception type, inner messages) behind IsDevelopment() in CustomizeProblemDetails. The top-level "detail" field should only contain user-safe descriptions.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Registering UseExceptionHandler after other middleware',
      wrong: `app.UseHttpsRedirection();
app.UseRouting();
app.UseExceptionHandler();   // ❌ — too late to catch routing/auth exceptions`,
      right: `// UseExceptionHandler must be FIRST
app.UseExceptionHandler();   // ✓
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.MapControllers();`,
      explanation: 'Middleware is a pipeline — exceptions only travel upward to handlers registered above the throwing middleware. UseExceptionHandler must wrap everything it needs to catch.',
    },
    {
      title: 'Skipping AddProblemDetails() and getting empty 500 bodies',
      wrong: `// Program.cs — missing AddProblemDetails
var app = builder.Build();
app.UseExceptionHandler();   // ❌ — unhandled exceptions → empty 500 body`,
      right: `builder.Services.AddProblemDetails();   // ✓ — register first
var app = builder.Build();
app.UseExceptionHandler();               // now returns JSON ProblemDetails on error`,
      explanation: 'Without AddProblemDetails(), UseExceptionHandler has no formatter registered. The response body is empty, leaving clients with no information about what went wrong.',
    },
    {
      title: 'Using UseDeveloperExceptionPage() in production',
      wrong: `var app = builder.Build();
app.UseDeveloperExceptionPage();   // ❌ — exposes stack traces in production`,
      right: `if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
{
    app.UseExceptionHandler();   // ✓ — safe in production
    app.UseHsts();
}`,
      explanation: 'UseDeveloperExceptionPage() returns the full stack trace, file paths, and request details. Exposing this in production is a serious information disclosure vulnerability (OWASP A05).',
    },
    {
      title: 'Setting StatusCode after calling IProblemDetailsService.WriteAsync',
      wrong: `ctx.Response.StatusCode = status;              // ❌ — set after WriteAsync
await _pds.WriteAsync(new ProblemDetailsContext { ... }, ct);`,
      right: `ctx.Response.StatusCode = status;              // ✓ — BEFORE WriteAsync
await _pds.WriteAsync(new ProblemDetailsContext
{
    HttpContext    = ctx,
    Exception      = ex,
    ProblemDetails = new ProblemDetails { Title = title, Status = status }
}, ct);`,
      explanation: 'HTTP response headers (including status code) must be written before the body. WriteAsync starts streaming the body — setting StatusCode after it has no effect.',
    },
    {
      title: 'Writing exception details into ProblemDetails in production',
      wrong: `opts.CustomizeProblemDetails = ctx =>
    ctx.ProblemDetails.Extensions["exception"] =    // ❌ leaks in production
        ctx.Exception?.ToString();`,
      right: `opts.CustomizeProblemDetails = ctx =>
{
    var env = ctx.HttpContext.RequestServices
                  .GetRequiredService<IWebHostEnvironment>();
    if (!env.IsProduction())                        // ✓ gate on environment
        ctx.ProblemDetails.Extensions["exception"] =
            ctx.Exception?.GetType().Name;          // type only — not ToString()
};`,
      explanation: 'Exception.ToString() includes the full stack trace with file paths and line numbers. Gate any exception details behind !IsProduction() and prefer the type name over the full string.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Error handling in ASP.NET Core layers UseExceptionHandler (global middleware) over IExceptionHandler (typed handlers) over exception filters (MVC-only), all feeding RFC 9457 ProblemDetails responses.',
    mustKnow: [
      'UseExceptionHandler() must be registered first — it can only catch exceptions thrown by middleware below it',
      'AddProblemDetails() is required for automatic RFC 9457 JSON formatting on errors',
      'IExceptionHandler.TryHandleAsync returns true (handled) or false (try next handler)',
      'Set ctx.Response.StatusCode BEFORE calling IProblemDetailsService.WriteAsync()',
      'UseDeveloperExceptionPage() is for Development only — it leaks stack traces',
      'UseStatusCodePagesWithReExecute keeps the original URL + status code; UseStatusCodePagesWithRedirects changes the URL',
      'ProblemDetails.Extensions entries serialise as root-level JSON properties — use for traceId, correlationId',
    ],
    interviewFocus: [
      'Why must UseExceptionHandler be registered first and what happens if it isn\'t?',
      'What is the difference between IExceptionHandler and an exception filter?',
      'What does AddProblemDetails() do and why is it needed?',
      'How do you add custom fields like traceId to every error response?',
      'How do you prevent stack trace leakage in production ProblemDetails?',
    ],
  };
}
