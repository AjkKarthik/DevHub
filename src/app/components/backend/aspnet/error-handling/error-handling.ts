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
  selector: 'app-aspnet-error-handling',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss',
})
export class AspnetErrorHandling {

  quickRef: QuickRefItem[] = [
    { name: 'UseExceptionHandler()',      type: 'method',    desc: 'Global exception handler middleware' },
    { name: 'IExceptionHandler',          type: 'interface', desc: '.NET 8+ typed exception handler — chain multiple handlers' },
    { name: 'ProblemDetails',             type: 'class',     desc: 'RFC 9457 error response model (type, title, status, detail, instance)' },
    { name: 'ValidationProblemDetails',   type: 'class',     desc: 'ProblemDetails with a keyed errors dictionary' },
    { name: 'AddProblemDetails()',         type: 'method',    desc: 'Registers ProblemDetails services; enables automatic error formatting' },
    { name: 'IProblemDetailsService',     type: 'interface', desc: 'Service to write ProblemDetails to the response' },
    { name: 'UseDeveloperExceptionPage()', type: 'method',   desc: 'Shows stack trace in development — never use in production' },
    { name: 'UseStatusCodePages()',        type: 'method',   desc: 'Adds plain-text body to bare 4xx/5xx status codes' },
    { name: 'Problem()',                   type: 'method',   desc: 'ControllerBase helper — returns ObjectResult with ProblemDetails' },
    { name: 'Results.Problem()',           type: 'method',   desc: 'Minimal API equivalent of Problem()' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Global Exception Handler Middleware',
      points: [
        '<code>app.UseExceptionHandler()</code> catches all unhandled exceptions anywhere in the pipeline. Register it as the <strong>very first middleware</strong> so it wraps everything else.',
        'Call <code>builder.Services.AddProblemDetails()</code> before building the app — this makes <code>UseExceptionHandler()</code> automatically format errors as RFC 9457 JSON. Without it, the default exception page returns an empty 500.',
        'In development, replace it with <code>app.UseDeveloperExceptionPage()</code> for a rich stack trace view. Guard it strictly: <code>if (app.Environment.IsDevelopment())</code>.',
        '<code>app.UseStatusCodePages()</code> adds a plain-text body to bare 4xx/5xx responses that have no body (e.g., static file 404). Use <code>UseStatusCodePagesWithReExecute("/error/{0}")</code> for friendly error pages that preserve the URL.',
      ],
    },
    {
      heading: 'ProblemDetails (RFC 9457)',
      points: [
        'The five standard fields: <strong>type</strong> (URI identifying the error class), <strong>title</strong> (short summary), <strong>status</strong> (HTTP code), <strong>detail</strong> (specific description), <strong>instance</strong> (URI of the failing request).',
        '<code>ValidationProblemDetails</code> extends ProblemDetails with an <strong>errors</strong> dictionary mapping field names to error arrays — the standard format for 400 validation failures.',
        'Return from controllers with <code>Problem(title, detail, statusCode)</code> or <code>ValidationProblem(ModelState)</code>. From minimal APIs use <code>Results.Problem()</code> or <code>Results.ValidationProblem()</code>.',
      ],
    },
    {
      heading: 'IExceptionHandler (.NET 8+)',
      points: [
        'Register multiple typed handlers tried in registration order. Each returns <code>true</code> if it handled the exception, <code>false</code> to pass to the next handler.',
        'Chain domain-specific handlers first (<code>NotFoundException</code> → 404, <code>ValidationException</code> → 422) with a catch-all fallback last.',
        'Use <code>IProblemDetailsService.WriteAsync()</code> inside the handler to write the ProblemDetails response. Always set <code>ctx.Response.StatusCode</code> before calling WriteAsync.',
      ],
    },
    {
      heading: 'Custom ProblemDetails Extensions',
      points: [
        'Enrich every error response globally via the <code>AddProblemDetails</code> callback: <code>ctx.ProblemDetails.Extensions["traceId"] = Activity.Current?.Id</code>.',
        'Add diagnostic fields like <code>"traceId"</code>, <code>"nodeId"</code>, or (in non-production) <code>"exception"</code> to the Extensions dictionary — they serialise as root-level JSON properties.',
        'Set <code>ctx.ProblemDetails.Instance</code> to the request method + path so clients can reference the exact failing call in bug reports.',
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
        ctx.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier);

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
{
    app.UseExceptionHandler();    // AddProblemDetails handles the format
    app.UseHsts();
}

app.UseStatusCodePages();
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
        if (status == 0) return false;    // not handled — try next handler

        ctx.Response.StatusCode = status;
        await _pds.WriteAsync(new ProblemDetailsContext {
            HttpContext    = ctx,
            Exception      = ex,
            ProblemDetails = new() { Title = title, Status = status }
        }, ct);
        return true;
    }
}

// Registration (order = try order)
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
        ctx.ProblemDetails.Instance = \$"{req.Method} {req.Path}";
        ctx.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier;

        // Only expose exception type outside production
        var env = ctx.HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>();
        if (!env.IsProduction())
            ctx.ProblemDetails.Extensions["exception"] =
                ctx.Exception?.GetType().Name;
    });

// All error responses now include:
// { "instance": "POST /api/orders",
//   "traceId":  "00-abc-00",
//   "exception": "InvalidOperationException" (non-prod) }`,
    },
    {
      label: 'ValidationProblemDetails',
      language: 'csharp',
      code: `[HttpPost]
public IActionResult Create(CreateOrderDto dto)
{
    if (dto.Items.Count == 0)
    {
        ModelState.AddModelError("Items", "Order must have at least one item");
        return ValidationProblem(ModelState);    // 400 ValidationProblemDetails
    }
    return Ok();
}

// ValidationProblemDetails body:
// {
//   "type":   "https://tools.ietf.org/html/rfc9110#section-15.5.1",
//   "title":  "One or more validation errors occurred.",
//   "status": 400,
//   "errors": { "Items": ["Order must have at least one item"] }
// }`,
    },
    {
      label: 'Status Code Pages',
      language: 'csharp',
      code: `// UseStatusCodePagesWithReExecute keeps the original URL + status code
app.UseStatusCodePagesWithReExecute("/error/{0}");

// Error endpoint — returns ProblemDetails for any status code
app.MapGet("/error/{code:int}", (int code) =>
    Results.Problem(statusCode: code,
        title: code switch {
            404 => "Not Found",
            400 => "Bad Request",
            _   => "Server Error"
        }))
.ExcludeFromDescription();   // hide from OpenAPI docs

// vs UseStatusCodePagesWithRedirects (changes URL — usually undesirable)
// app.UseStatusCodePagesWithRedirects("/error/{0}");`,
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
        await _pds.WriteAsync(new ProblemDetailsContext {
            HttpContext    = ctx,
            Exception      = ex,
            ProblemDetails = new() { Title = title, Status = status }
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
      explanation: 'UseExceptionHandler() must wrap the rest of the pipeline. Registered after other middleware means exceptions thrown by those earlier middleware layers will NOT be caught.',
    },
    {
      q: 'What does AddProblemDetails() enable?',
      options: [
        'Adds a /problem endpoint',
        'Makes all error responses use RFC 9457 ProblemDetails JSON automatically',
        'Validates models against ProblemDetails schema',
        'Enables XML ProblemDetails responses',
      ],
      answer: 1,
      explanation: 'AddProblemDetails() registers IProblemDetailsService and configures UseExceptionHandler() and UseStatusCodePages() to write ProblemDetails responses by default.',
    },
    {
      q: 'IExceptionHandler.TryHandleAsync should return true when?',
      options: [
        'An exception was caught but not handled',
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
      explanation: 'UseDeveloperExceptionPage() shows the full stack trace and request details. This is a serious information disclosure risk in production.',
    },
    {
      q: 'What is the difference between UseStatusCodePagesWithRedirects and UseStatusCodePagesWithReExecute?',
      options: [
        'Redirects changes the URL (302); ReExecute keeps the URL and re-runs the pipeline',
        'They are identical',
        'Redirects is for controllers; ReExecute is for minimal APIs',
        'ReExecute changes the status code to 200',
      ],
      answer: 0,
      explanation: 'UseStatusCodePagesWithRedirects sends a 302 — the URL changes and the original status code is lost. UseStatusCodePagesWithReExecute re-runs the pipeline internally, preserving both the URL and the original status code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use IExceptionHandler or an exception filter?',
      a: 'IExceptionHandler is broader — it catches exceptions from any middleware, not just MVC filters. Use IExceptionHandler for app-wide error mapping. Use exception filters only when different controllers need different exception-to-response mappings.',
    },
    {
      q: 'What are the five fields of a ProblemDetails response?',
      a: '"type" (URI identifying the error class), "title" (short human-readable summary), "status" (HTTP status code), "detail" (longer explanation for this occurrence), and "instance" (URI of the request). All are optional per RFC 9457 but status and title should always be set.',
    },
    {
      q: 'How do I add extra fields to ProblemDetails (e.g. traceId)?',
      a: 'Add them to ProblemDetails.Extensions dictionary — entries serialise as root-level JSON properties. Use the AddProblemDetails(opts => opts.CustomizeProblemDetails = ...) callback to add them globally to every error response.',
    },
    {
      q: 'What happens if no IExceptionHandler handles an exception?',
      a: 'The exception propagates to the UseExceptionHandler middleware. With AddProblemDetails(), a generic 500 ProblemDetails response is returned. Without it, Kestrel closes the connection.',
    },
    {
      q: 'How do I hide stack traces from API clients in production?',
      a: 'Do not call UseDeveloperExceptionPage() in production. With AddProblemDetails() and UseExceptionHandler(), the 500 response never includes the stack trace. In the CustomizeProblemDetails callback you can gate "exception" in Extensions on IsDevelopment().',
    },
    {
      q: 'Can IExceptionHandler catch exceptions from background services?',
      a: 'No. IExceptionHandler only applies to HTTP request processing. Background services run outside the request pipeline. Wrap their ExecuteAsync with try/catch and use ILogger to record failures.',
    },
  ];
}
