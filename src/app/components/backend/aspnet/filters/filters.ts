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
  selector: 'app-aspnet-filters',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
})
export class AspnetFilters {

  quickRef: QuickRefItem[] = [
    { name: 'IActionFilter',          type: 'interface', desc: 'Before/after action execution; access action arguments' },
    { name: 'IAsyncActionFilter',     type: 'interface', desc: 'Async version; call await next() to invoke the action' },
    { name: 'IExceptionFilter',       type: 'interface', desc: 'Handles unhandled exceptions from actions and result filters' },
    { name: 'IResultFilter',          type: 'interface', desc: 'Before/after IActionResult.ExecuteResultAsync' },
    { name: 'IAuthorizationFilter',   type: 'interface', desc: 'Runs first in the MVC filter pipeline; short-circuits on 401/403' },
    { name: 'IResourceFilter',        type: 'interface', desc: 'Wraps everything after auth — useful for caching' },
    { name: 'ServiceFilterAttribute', type: 'class',     desc: 'Resolves a filter from DI — supports scoped/transient filters' },
    { name: 'TypeFilterAttribute',    type: 'class',     desc: 'Creates a filter via DI with optional constructor arguments' },
    { name: 'IEndpointFilter',        type: 'interface', desc: 'Minimal-API filter — wraps the handler (no MVC pipeline)' },
    { name: 'IFilterFactory',         type: 'interface', desc: 'Creates a filter instance per-request' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Filter Types & Execution Order',
      points: [
        'MVC filters run in a fixed pipeline. Outermost to innermost: <strong>Authorization</strong> → <strong>Resource</strong> → (model binding) → <strong>Action</strong> → <strong>Exception</strong> → <strong>Result</strong>.',
        '<em>Authorization filters</em> run before model binding and can short-circuit with 401/403. <em>Action filters</em> run around the action itself — the most commonly used type.',
        '<em>Exception filters</em> catch exceptions from actions and other MVC filters (but not from middleware). <em>Result filters</em> run around <code>IActionResult.ExecuteResultAsync</code>, after the action has returned.',
        'Multiple filters of the same type run in <code>Order</code> property order — lower values = outermost. Globally registered filters are outermost by default.',
      ],
    },
    {
      heading: 'Action Filters',
      points: [
        'Implement <code>IAsyncActionFilter</code> for async filters. Call <code>await next()</code> to invoke the action. Assign <code>context.Result</code> <em>before</em> calling <code>next()</code> to short-circuit the action entirely.',
        '<code>ActionExecutingContext.ActionArguments</code> gives access to all bound action parameters before the action runs.',
        '<code>ActionExecutedContext.Exception</code> contains any exception thrown by the action — set <code>context.ExceptionHandled = true</code> to suppress it.',
        'Use <code>ActionFilterAttribute</code> (a convenience base class) for synchronous filters that need both OnActionExecuting and OnActionExecuted.',
      ],
    },
    {
      heading: 'Exception Filters',
      points: [
        'Exception filters catch unhandled exceptions from actions, action filters, and result filters. They do <strong>NOT</strong> catch exceptions from middleware or authorization filters.',
        'Set <code>context.Result</code> (not <code>context.Exception</code>) to produce a response. Set <code>context.ExceptionHandled = true</code> to stop propagation.',
        'Prefer <code>IExceptionHandler</code> middleware (.NET 8+) for app-wide coverage. Use exception filters when different controllers need different exception mappings.',
      ],
    },
    {
      heading: 'Registering Filters',
      points: [
        '<strong>Global:</strong> <code>builder.Services.AddControllers(o => o.Filters.Add&lt;T&gt;())</code> — applies to all controller actions.',
        '<strong>Controller-level:</strong> <code>[ServiceFilter(typeof(T))]</code> on the class. Use <code>[ServiceFilter]</code> when the filter has DI dependencies.',
        '<strong>Action-level:</strong> <code>[ServiceFilter(typeof(T))]</code> on the method. Use <code>[TypeFilter(typeof(T), Arguments = [...]]</code> to pass constructor arguments.',
        'Filters used with <code>[ServiceFilter]</code> must be registered in the DI container. Scoped filters are safe — they are resolved per-request.',
      ],
    },
    {
      heading: 'Endpoint Filters (Minimal APIs)',
      points: [
        '<code>IEndpointFilter</code> works at the endpoint-routing layer — applies to minimal API handlers and (via endpoint metadata) controllers too.',
        'Chain multiple filters with multiple <code>.AddEndpointFilter()</code> calls: first added = outermost. Execution is FIFO in, LIFO out (like middleware).',
        'Use <code>ctx.GetArgument&lt;T&gt;(index)</code> to access handler parameters inside the filter — useful for validation before the handler runs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Action Filter',
      language: 'csharp',
      code: `public class RequireApiKeyFilter : IActionFilter
{
    private readonly string _expectedKey;
    public RequireApiKeyFilter(IConfiguration cfg)
        => _expectedKey = cfg["ApiKey"] ?? "";

    public void OnActionExecuting(ActionExecutingContext ctx)
    {
        if (!ctx.HttpContext.Request.Headers.TryGetValue(
                "X-Api-Key", out var key) || key != _expectedKey)
        {
            // Short-circuit — action never runs
            ctx.Result = new UnauthorizedObjectResult(
                new ProblemDetails { Title = "Invalid API key", Status = 401 });
        }
    }

    public void OnActionExecuted(ActionExecutedContext ctx)
    {
        ctx.HttpContext.Response.Headers["X-Processed-By"] = "DevHub";
    }
}

builder.Services.AddScoped<RequireApiKeyFilter>();

// Apply per-action
[ServiceFilter(typeof(RequireApiKeyFilter))]
[HttpPost]
public IActionResult Create(CreateDto dto) => Ok();`,
    },
    {
      label: 'Exception Filter',
      language: 'csharp',
      code: `public class GlobalExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext ctx)
    {
        var (status, title) = ctx.Exception switch
        {
            NotFoundException  e => (404, e.Message),
            ConflictException  e => (409, e.Message),
            ValidationException e => (422, e.Message),
            _ => (0, "")
        };
        if (status == 0) return;    // unrecognised — fall through

        ctx.Result = new ObjectResult(new ProblemDetails
        {
            Title    = title,
            Status   = status,
            Instance = ctx.HttpContext.Request.Path
        }) { StatusCode = status };
        ctx.ExceptionHandled = true;
    }
}

// Global registration
builder.Services.AddControllers(o =>
    o.Filters.Add<GlobalExceptionFilter>());
builder.Services.AddScoped<GlobalExceptionFilter>();`,
    },
    {
      label: 'Global Registration',
      language: 'csharp',
      code: `builder.Services.AddControllers(options =>
{
    options.Filters.Add<RequestTimingFilter>();
    options.Filters.Add<GlobalExceptionFilter>();
    options.Filters.Add(new ResponseCacheAttribute { Duration = 60 });
});
builder.Services.AddScoped<RequestTimingFilter>();
builder.Services.AddScoped<GlobalExceptionFilter>();

// RequestTimingFilter
public class RequestTimingFilter : IAsyncActionFilter
{
    private readonly ILogger<RequestTimingFilter> _logger;
    public RequestTimingFilter(ILogger<RequestTimingFilter> l) => _logger = l;

    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var sw = Stopwatch.StartNew();
        await next();
        _logger.LogInformation("{Action} took {Ms}ms",
            ctx.ActionDescriptor.DisplayName, sw.ElapsedMilliseconds);
    }
}`,
    },
    {
      label: 'Endpoint Filters',
      language: 'csharp',
      code: `public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var model = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (model is null) return Results.BadRequest("Missing request body");

        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(
                model, new ValidationContext(model), results, true))
        {
            var errors = results
                .GroupBy(r => r.MemberNames.FirstOrDefault() ?? "_")
                .ToDictionary(g => g.Key,
                    g => g.Select(r => r.ErrorMessage ?? "Invalid").ToArray());
            return Results.ValidationProblem(errors);
        }
        return await next(ctx);
    }
}

// Apply to group
var orders = app.MapGroup("/orders");
orders.MapPost("/", CreateOrder)
      .AddEndpointFilter<ValidationFilter<CreateOrderDto>>();`,
    },
  ];

  challenge: Challenge = {
    title: 'Audit Action Filter',
    language: 'csharp',
    description: 'Write an async action filter AuditFilter that: logs the action name and arguments before execution, logs the result type after execution, and adds an "X-Audit-Id" response header with a new GUID. Register it globally on all controllers.',
    hints: [
      'Implement IAsyncActionFilter with OnActionExecutionAsync',
      'context.ActionDescriptor.DisplayName gives the action name',
      'context.ActionArguments is a dictionary of argument names to values',
      'executed.Result?.GetType().Name gives the result type name',
      'Add to options.Filters.Add<AuditFilter>() in AddControllers()',
    ],
    starterCode: `public class AuditFilter : IAsyncActionFilter
{
    private readonly ILogger<AuditFilter> _logger;
    public AuditFilter(ILogger<AuditFilter> logger) => _logger = logger;

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // TODO: log action name + arguments
        // TODO: call next()
        // TODO: log result type
        // TODO: add X-Audit-Id header
    }
}

// Program.cs
builder.Services.AddControllers(/* TODO: register globally */);
builder.Services.AddScoped<AuditFilter>();`,
    solution: `public class AuditFilter : IAsyncActionFilter
{
    private readonly ILogger<AuditFilter> _logger;
    public AuditFilter(ILogger<AuditFilter> logger) => _logger = logger;

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        var action  = context.ActionDescriptor.DisplayName;
        var auditId = Guid.NewGuid().ToString();

        _logger.LogInformation(
            "[Audit {Id}] → {Action} | Args: {@Args}",
            auditId, action, context.ActionArguments);

        var executed = await next();

        _logger.LogInformation(
            "[Audit {Id}] ← {Action} | Result: {Result}",
            auditId, action, executed.Result?.GetType().Name ?? "null");

        context.HttpContext.Response.Headers["X-Audit-Id"] = auditId;
    }
}

// Program.cs
builder.Services.AddControllers(options =>
    options.Filters.Add<AuditFilter>());
builder.Services.AddScoped<AuditFilter>();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In which order do MVC filter types execute? (first to last)',
      options: [
        'Action → Authorization → Exception → Result → Resource',
        'Authorization → Resource → Action → Exception → Result',
        'Resource → Authorization → Action → Result → Exception',
        'Authorization → Action → Resource → Result → Exception',
      ],
      answer: 1,
      explanation: 'Authorization → Resource → (model binding) → Action → Exception → Result. Authorization runs first and can short-circuit everything.',
    },
    {
      q: 'How do you short-circuit an action from inside OnActionExecuting?',
      options: [
        'throw new HttpException(400)',
        'return false from OnActionExecuting',
        'Set context.Result without calling next()',
        'Call context.Cancel()',
      ],
      answer: 2,
      explanation: 'Setting context.Result before calling next() short-circuits the pipeline. The action never executes; the assigned result is used instead.',
    },
    {
      q: 'Which attribute resolves a filter from the DI container, supporting scoped/transient lifetimes?',
      options: ['[Filter(typeof(T))]', '[InjectFilter(typeof(T))]', '[ServiceFilter(typeof(T))]', '[DIFilter(typeof(T))]'],
      answer: 2,
      explanation: '[ServiceFilter(typeof(T))] resolves the filter from the DI container on each request. The filter type must be registered in services.',
    },
    {
      q: 'An exception filter will NOT catch exceptions thrown by which component?',
      options: ['Actions', 'Action filters', 'Authorization middleware', 'Result filters'],
      answer: 2,
      explanation: 'Exception filters only catch exceptions from actions, action filters, and result filters — within the MVC pipeline. Middleware exceptions are NOT caught.',
    },
    {
      q: 'What is the key difference between IActionFilter and IEndpointFilter?',
      options: [
        'IActionFilter is faster',
        'IEndpointFilter cannot access the request body',
        'IActionFilter is MVC-specific; IEndpointFilter works at the endpoint-routing layer',
        'IEndpointFilter only supports synchronous filters',
      ],
      answer: 2,
      explanation: 'IActionFilter is part of the MVC pipeline and requires controller infrastructure. IEndpointFilter works at endpoint routing and applies to both minimal APIs and controllers.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a filter vs middleware?',
      a: 'Use middleware for cross-cutting concerns that apply to ALL requests (CORS, auth, compression). Use filters for concerns specific to MVC/API actions (audit logging action arguments, domain exception mapping). If you need access to ActionContext or ActionArguments, use a filter.',
    },
    {
      q: 'Can I use both IActionFilter and IEndpointFilter on the same controller?',
      a: 'Yes. IActionFilter runs inside the MVC pipeline, IEndpointFilter runs at the endpoint level (outside MVC). The IEndpointFilter runs first. Both are valid on controllers, but prefer IActionFilter for controller-specific concerns.',
    },
    {
      q: 'What is the difference between [ServiceFilter] and [TypeFilter]?',
      a: '[ServiceFilter(typeof(T))] resolves T from the DI container — the filter must be registered as a service. [TypeFilter(typeof(T))] uses ActivatorUtilities to create the filter, allowing you to pass additional constructor arguments via the Arguments property.',
    },
    {
      q: 'How do result filters differ from action filters?',
      a: 'Action filters run around action execution (before/after the method call). Result filters run around IActionResult.ExecuteResultAsync — after the action has returned a result but before that result is written to the HTTP response. Use result filters to modify the response before serialization.',
    },
    {
      q: 'Can exception filters catch all exceptions in ASP.NET Core?',
      a: 'No. Exception filters only catch unhandled exceptions from actions and MVC filters. Exceptions from middleware, background services, or startup are not caught. For broad coverage, use app.UseExceptionHandler() or IExceptionHandler.',
    },
    {
      q: 'How do I control the order of multiple filters of the same type?',
      a: 'Implement IOrderedFilter and set the Order property — lower values run as the outer (first) filter. For attribute-based filters, derive from Attribute and implement IOrderedFilter. Globally registered filters are outermost by default.',
    },
  ];
}
