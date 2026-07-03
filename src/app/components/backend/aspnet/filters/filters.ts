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
  selector: 'app-aspnet-filters',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
})
export class AspnetFilters {

  prerequisites: Prerequisite[] = [
    { label: 'Controllers & Actions', route: '/aspnet/controllers' },
    { label: 'Minimal APIs', route: '/aspnet/minimal-apis' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

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
    { name: 'IFilterFactory',         type: 'interface', desc: 'Creates a filter instance per-request from DI' },
    { name: 'IOrderedFilter',         type: 'interface', desc: 'Set Order property to control filter execution sequence' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Filter Types & Execution Order',
      points: [
        'MVC filters run in a fixed pipeline. Outermost to innermost: <strong>Authorization</strong> → <strong>Resource</strong> → (model binding) → <strong>Action</strong> → <strong>Exception</strong> → <strong>Result</strong>.',
        '<em>Authorization filters</em> run before model binding and can short-circuit with 401/403 without ever touching the action. <em>Resource filters</em> wrap everything after auth — ideal for output caching.',
        '<em>Action filters</em> run around the action method — the most commonly used type. <em>Exception filters</em> catch unhandled exceptions within the MVC pipeline. <em>Result filters</em> run around result execution, after the action has returned.',
        'Each filter type has both sync (<code>IActionFilter</code>) and async (<code>IAsyncActionFilter</code>) variants — always prefer the async variant to avoid deadlock risks with async action methods.',
        'Multiple filters of the same type execute in <code>Order</code> property order — lower values = outermost. Globally registered filters have <code>Order = 0</code> by default and are outermost unless overridden.',
        'Implement <code>IOrderedFilter</code> to set the <code>Order</code> property on a custom filter and control its position relative to other filters at the same scope.',
      ],
    },
    {
      heading: 'Action Filters',
      points: [
        'Implement <code>IAsyncActionFilter.OnActionExecutionAsync</code>: call <code>await next()</code> to proceed to the action. Assign <code>context.Result</code> <em>before</em> calling <code>next()</code> to short-circuit and skip the action entirely.',
        '<code>ActionExecutingContext.ActionArguments</code> gives access to all bound action parameters before the action runs — useful for audit logging, parameter transformation, or pre-validation.',
        '<code>ActionExecutedContext.Exception</code> contains any exception thrown by the action; set <code>context.ExceptionHandled = true</code> to suppress it and prevent further propagation.',
        '<code>ActionExecutedContext.Result</code> holds the <code>IActionResult</code> returned by the action — you can replace it to wrap responses (e.g. envelope pattern).',
        'Use <code>ActionFilterAttribute</code> (a convenience base class) when you need both <code>OnActionExecuting</code> and <code>OnActionExecuted</code> in a single attribute class.',
        'Avoid reading the request body in an action filter — by the time the filter runs, the body has already been read and bound into <code>ActionArguments</code>. Inspect those instead.',
      ],
    },
    {
      heading: 'Exception Filters',
      points: [
        'Exception filters catch unhandled exceptions from actions, action filters, and result filters. They do <strong>NOT</strong> catch exceptions from middleware, authorization filters, or resource filters.',
        'Set <code>context.Result</code> (an <code>IActionResult</code>) to produce a response. Set <code>context.ExceptionHandled = true</code> to stop the exception propagating up the pipeline.',
        'If you leave <code>context.Result</code> unset, the exception propagates to middleware — useful when you only want to handle specific domain exceptions and let others fall through.',
        'Prefer <code>IExceptionHandler</code> middleware (.NET 8+) or <code>UseExceptionHandler</code> for app-wide coverage. Use exception filters when different controllers need different exception-to-status-code mappings.',
        'Exception filters are not the right place for logging — the exception has been "handled" by the time the filter runs; logging middleware or <code>IExceptionHandler</code> gives more context.',
        'Can be applied at action, controller, or global scope. Global exception filters serve as a safety net; controller-scoped ones handle domain-specific exceptions.',
      ],
    },
    {
      heading: 'Registering Filters',
      points: [
        '<strong>Global:</strong> <code>builder.Services.AddControllers(o => o.Filters.Add&lt;T&gt;())</code> — applies to all controller actions. The filter type must also be registered in DI if it has dependencies.',
        '<strong>Controller-level:</strong> <code>[ServiceFilter(typeof(T))]</code> on the class. Use <code>[ServiceFilter]</code> when the filter has DI dependencies — it is resolved from the container.',
        '<strong>Action-level:</strong> <code>[TypeFilter(typeof(T), Arguments = new object[] { ... })]</code> to pass constructor arguments that are not in DI.',
        '<code>[ServiceFilter]</code> requires the type to be registered; <code>[TypeFilter]</code> uses <code>ActivatorUtilities</code> and does not require registration but constructor args must be provided explicitly.',
        '<code>IFilterFactory</code> lets you build the filter instance per-request from DI — useful when filter behaviour depends on per-request data (e.g. tenant ID from a claim).',
        'Scoped filters are safe with <code>[ServiceFilter]</code> — the DI container resolves a new instance per request. Never register a filter with a captive dependency (Scoped filter depending on Transient held as a field).',
      ],
    },
    {
      heading: 'Endpoint Filters (Minimal APIs)',
      points: [
        '<code>IEndpointFilter</code> works at the endpoint-routing layer — applies to minimal API handlers and (via endpoint metadata) controllers too. No MVC pipeline dependency.',
        'Chain multiple filters with multiple <code>.AddEndpointFilter()</code> calls: first added = outermost. Execution is FIFO in, LIFO out — same mental model as middleware.',
        'Use <code>ctx.GetArgument&lt;T&gt;(index)</code> to access handler parameters inside the filter by position — useful for validation before the handler runs.',
        'Return <code>await next(ctx)</code> to continue, or return a result directly (e.g. <code>Results.ValidationProblem(errors)</code>) to short-circuit.',
        'Generic endpoint filters (<code>IEndpointFilter</code> implemented as a generic class) can target a specific DTO type, allowing reuse across multiple endpoints: <code>.AddEndpointFilter&lt;ValidationFilter&lt;CreateOrderDto&gt;&gt;()</code>.',
        'Unlike <code>IActionFilter</code>, endpoint filters do not have separate before/after methods — everything is in one <code>InvokeAsync</code> method, making them simpler to reason about.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Action Filter',
      language: 'csharp',
      code: `public class RequireApiKeyFilter : IAsyncActionFilter
{
    private readonly string _expectedKey;
    public RequireApiKeyFilter(IConfiguration cfg)
        => _expectedKey = cfg["ApiKey"] ?? "";

    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        if (!ctx.HttpContext.Request.Headers.TryGetValue(
                "X-Api-Key", out var key) || key != _expectedKey)
        {
            // Short-circuit — action never runs
            ctx.Result = new UnauthorizedObjectResult(
                new ProblemDetails { Title = "Invalid API key", Status = 401 });
            return;                    // ← do NOT call next() after setting Result
        }

        var executed = await next();   // run the action

        // Post-action: add a response header
        executed.HttpContext.Response.Headers["X-Processed-By"] = "DevHub";
    }
}

builder.Services.AddScoped<RequireApiKeyFilter>();

[ServiceFilter(typeof(RequireApiKeyFilter))]
[HttpPost]
public IActionResult Create(CreateDto dto) => Ok();`,
    },
    {
      label: 'Exception Filter',
      language: 'csharp',
      code: `public class DomainExceptionFilter : IExceptionFilter
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
        if (status == 0) return;   // unrecognised — let it propagate

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
    o.Filters.Add<DomainExceptionFilter>());
builder.Services.AddScoped<DomainExceptionFilter>();`,
    },
    {
      label: 'Global Registration',
      language: 'csharp',
      code: `builder.Services.AddControllers(options =>
{
    options.Filters.Add<RequestTimingFilter>();   // outermost
    options.Filters.Add<DomainExceptionFilter>(); // second
});
builder.Services.AddScoped<RequestTimingFilter>();
builder.Services.AddScoped<DomainExceptionFilter>();

public class RequestTimingFilter : IAsyncActionFilter
{
    private readonly ILogger<RequestTimingFilter> _logger;
    public RequestTimingFilter(ILogger<RequestTimingFilter> l) => _logger = l;

    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var sw = Stopwatch.StartNew();
        var executed = await next();
        _logger.LogInformation("{Action} took {Ms}ms | Status: {Result}",
            ctx.ActionDescriptor.DisplayName,
            sw.ElapsedMilliseconds,
            (executed.Result as ObjectResult)?.StatusCode);
    }
}`,
    },
    {
      label: 'Endpoint Filters',
      language: 'csharp',
      code: `// Generic validation filter for minimal APIs
public class ValidationFilter<T> : IEndpointFilter where T : class
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
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(r => r.ErrorMessage ?? "Invalid").ToArray());
            return Results.ValidationProblem(errors);
        }
        return await next(ctx);
    }
}

// Apply to route group
var orders = app.MapGroup("/orders");
orders.MapPost("/", CreateOrder)
      .AddEndpointFilter<ValidationFilter<CreateOrderDto>>();
orders.MapPut("/{id}", UpdateOrder)
      .AddEndpointFilter<ValidationFilter<UpdateOrderDto>>();`,
    },
    {
      label: 'IFilterFactory',
      language: 'csharp',
      code: `// Filter that needs per-request DI resolution
public class TenantAuditFilterFactory : IFilterFactory
{
    public bool IsReusable => false; // new instance per request

    public IFilterMetadata CreateInstance(IServiceProvider sp)
    {
        // Pull scoped service not available at startup
        var audit = sp.GetRequiredService<IAuditService>();
        var logger = sp.GetRequiredService<ILogger<TenantAuditFilter>>();
        return new TenantAuditFilter(audit, logger);
    }
}

public class TenantAuditFilter : IAsyncActionFilter
{
    private readonly IAuditService _audit;
    private readonly ILogger _logger;
    public TenantAuditFilter(IAuditService audit, ILogger logger)
        => (_audit, _logger) = (audit, logger);

    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var tenant = ctx.HttpContext.User.FindFirst("tenant_id")?.Value;
        _logger.LogInformation("Tenant {T} → {Action}", tenant, ctx.ActionDescriptor.DisplayName);
        await next();
        await _audit.LogAsync(tenant, ctx.ActionDescriptor.DisplayName);
    }
}

// Use as attribute — no DI registration needed for the factory itself
[TenantAuditFilterFactory]
[HttpDelete("{id}")]
public IActionResult Delete(int id) => NoContent();`,
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
      explanation: 'Authorization → Resource → (model binding) → Action → Exception → Result. Authorization runs first and can short-circuit everything else.',
    },
    {
      q: 'How do you short-circuit an action from inside OnActionExecutionAsync?',
      options: [
        'throw new HttpException(400)',
        'return false from the method',
        'Set context.Result and return without calling next()',
        'Call context.Cancel()',
      ],
      answer: 2,
      explanation: 'Setting context.Result before returning (without calling next()) short-circuits the pipeline. The action never executes; the assigned result is used instead.',
    },
    {
      q: 'Which attribute resolves a filter from the DI container, supporting scoped/transient lifetimes?',
      options: ['[Filter(typeof(T))]', '[InjectFilter(typeof(T))]', '[ServiceFilter(typeof(T))]', '[DIFilter(typeof(T))]'],
      answer: 2,
      explanation: '[ServiceFilter(typeof(T))] resolves the filter from the DI container each request. The filter type must be registered as a service.',
    },
    {
      q: 'An exception filter will NOT catch exceptions thrown by which component?',
      options: ['Actions', 'Action filters', 'Middleware', 'Result filters'],
      answer: 2,
      explanation: 'Exception filters only catch exceptions from actions, action filters, and result filters — within the MVC pipeline. Middleware exceptions are NOT caught by MVC exception filters.',
    },
    {
      q: 'What is the key difference between IActionFilter and IEndpointFilter?',
      options: [
        'IActionFilter is faster at runtime',
        'IEndpointFilter cannot access the request body',
        'IActionFilter is MVC-specific; IEndpointFilter works at the endpoint-routing layer',
        'IEndpointFilter only supports synchronous execution',
      ],
      answer: 2,
      explanation: 'IActionFilter is part of the MVC pipeline and requires controller infrastructure. IEndpointFilter works at endpoint routing and applies to both minimal APIs and controllers.',
    },
    {
      q: 'What does IFilterFactory.IsReusable = false mean?',
      options: [
        'The filter cannot be reused across requests — a new instance is created each time',
        'The filter factory itself cannot be registered as a singleton',
        'The filter does not support async operations',
        'The filter is disposed after each action call',
      ],
      answer: 0,
      explanation: 'IsReusable = false tells ASP.NET Core to create a new filter instance per request via CreateInstance(). IsReusable = true caches the filter instance for reuse — only safe for singleton-friendly filters.',
    },
    {
      q: 'What is the difference between [ServiceFilter] and [TypeFilter]?',
      options: [
        '[TypeFilter] resolves from DI; [ServiceFilter] uses ActivatorUtilities',
        '[ServiceFilter] resolves from DI; [TypeFilter] uses ActivatorUtilities with optional constructor args',
        'They are identical — different names for the same behaviour',
        '[ServiceFilter] requires a singleton lifetime; [TypeFilter] requires transient',
      ],
      answer: 1,
      explanation: '[ServiceFilter] requires the filter type to be registered in DI and resolves it from the container. [TypeFilter] uses ActivatorUtilities and can receive additional constructor arguments via the Arguments property — no DI registration required.',
    },
    {
      q: 'Where does a result filter run relative to the action?',
      options: [
        'Before model binding, before the action runs',
        'After the action runs but before the result is written to the HTTP response',
        'After the response has been sent to the client',
        'At the same time as the action, on a different thread',
      ],
      answer: 1,
      explanation: 'Result filters run after the action has returned an IActionResult but before IActionResult.ExecuteResultAsync serializes the response. This is the place to modify the response shape before serialization.',
    },
    {
      q: 'In an endpoint filter chain, in what order do filters execute?',
      options: [
        'Last added executes first (LIFO for entry, FIFO for exit)',
        'First added executes first entering; last added executes first exiting (FIFO in, LIFO out)',
        'All filters execute in parallel',
        'Order is determined by the filter\'s priority property',
      ],
      answer: 1,
      explanation: 'Endpoint filters behave like middleware — first added is outermost (executes first entering, last exiting). This matches the mental model of middleware stack nesting.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a filter vs middleware?',
      a: 'Use middleware for cross-cutting concerns that apply to ALL requests (CORS, auth, compression, rate limiting). Use filters for concerns specific to MVC/API actions (audit logging action arguments, domain exception mapping). If you need access to ActionContext, ActionArguments, or action metadata, use a filter.',
    },
    {
      q: 'Can I use both IActionFilter and IEndpointFilter on the same controller?',
      a: 'Yes. IActionFilter runs inside the MVC pipeline, IEndpointFilter runs at the endpoint level (outside MVC). The IEndpointFilter executes first. Both are valid on controllers, but prefer IActionFilter for controller-specific concerns that need ActionContext.',
    },
    {
      q: 'If a filter has constructor dependencies but was never registered in the DI container, which attribute must you use?',
      a: '[TypeFilter(typeof(T))] — it uses ActivatorUtilities to construct the filter directly, resolving what dependencies it can from DI while allowing extra constructor arguments to be passed explicitly via the Arguments property. [ServiceFilter(typeof(T))] would throw at runtime, since it strictly requires T to already be registered as a service in the container — it has no fallback construction mechanism.',
    },
    {
      q: 'How do result filters differ from action filters?',
      a: 'Action filters run around action execution (before/after the method call). Result filters run around IActionResult.ExecuteResultAsync — after the action has returned a result but before that result is serialized and written to the HTTP response. Use result filters to modify the response structure before serialization.',
    },
    {
      q: 'Can exception filters catch all exceptions in ASP.NET Core?',
      a: 'No. Exception filters only catch unhandled exceptions from actions and MVC filters. Exceptions from middleware, background services, or startup are not caught. For broad coverage, use app.UseExceptionHandler() or implement IExceptionHandler (.NET 8+).',
    },
    {
      q: 'How do I control the order of multiple filters of the same type?',
      a: 'Implement IOrderedFilter and set the Order property — lower values run as the outer (first-entry, last-exit) filter. For attribute-based filters, derive from Attribute and implement IOrderedFilter. Globally registered filters default to Order=0 and run outermost unless overridden.',
    },
    {
      q: 'What is IResourceFilter and when is it useful?',
      a: 'IResourceFilter wraps everything after auth — model binding, action execution, result execution. Its OnResourceExecuting/Executed run before and after all of that. The primary use case is output caching: check the cache in OnResourceExecuting and short-circuit; populate the cache in OnResourceExecuted before the response is written.',
    },
    {
      q: 'How do I pass per-request data from a filter to an action?',
      a: 'Use HttpContext.Items — it is a dictionary scoped to the current request. Set context.HttpContext.Items["myKey"] = value in the filter, then access it in the action via HttpContext.Items["myKey"]. This is the standard request-scoped data propagation mechanism in ASP.NET Core.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling next() after setting context.Result in a short-circuit',
      wrong: `public async Task OnActionExecutionAsync(
    ActionExecutingContext ctx, ActionExecutionDelegate next)
{
    ctx.Result = new UnauthorizedResult(); // ❌ — then still calls next
    await next();
}`,
      right: `public async Task OnActionExecutionAsync(
    ActionExecutingContext ctx, ActionExecutionDelegate next)
{
    if (!IsAuthorised(ctx))
    {
        ctx.Result = new UnauthorizedResult();
        return;              // ✓ — return immediately, do NOT call next()
    }
    await next();
}`,
      explanation: 'If you set context.Result AND call next(), the action executes anyway and its result overwrites yours. Set the result and return without calling next() to truly short-circuit.',
    },
    {
      title: 'Registering a filter that has DI dependencies without [ServiceFilter]',
      wrong: `[RequireApiKeyFilter]          // ❌ — attribute instantiated by the compiler
[HttpPost]                       // IConfiguration not injected — NullReferenceException
public IActionResult Create(CreateDto dto) => Ok();`,
      right: `[ServiceFilter(typeof(RequireApiKeyFilter))]  // ✓ — resolved from DI
[HttpPost]
public IActionResult Create(CreateDto dto) => Ok();

// Also register in DI:
builder.Services.AddScoped<RequireApiKeyFilter>();`,
      explanation: 'Attribute classes are instantiated by the CLR with no DI. For filters that need injected services, use [ServiceFilter] or [TypeFilter] so the framework resolves them from the container.',
    },
    {
      title: 'Using exception filters expecting to catch middleware exceptions',
      wrong: `// Developer assumes this catches ALL app exceptions
builder.Services.AddControllers(o =>
    o.Filters.Add<GlobalExceptionFilter>()); // ❌ — only catches MVC pipeline exceptions`,
      right: `// Middleware-level handler for broad coverage
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var feature = ctx.Features.Get<IExceptionHandlerFeature>();
    // handle feature.Error ...
}));

// Exception filter for MVC-specific domain mapping only
builder.Services.AddControllers(o =>
    o.Filters.Add<DomainExceptionFilter>()); // ✓ — layered approach`,
      explanation: 'Exception filters only cover the MVC pipeline. Middleware exceptions, startup errors, and background task exceptions bypass them entirely. Use UseExceptionHandler/IExceptionHandler for global coverage and exception filters for domain-specific mappings.',
    },
    {
      title: 'Implementing IActionFilter (sync) on async action methods',
      wrong: `public class SlowFilter : IActionFilter   // ❌ sync interface on async action
{
    public void OnActionExecuting(ActionExecutingContext ctx) { /* ... */ }
    public void OnActionExecuted(ActionExecutedContext ctx)  { /* ... */ }
}`,
      right: `public class FastFilter : IAsyncActionFilter  // ✓ async interface
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        // before
        var executed = await next();
        // after
    }
}`,
      explanation: 'The sync IActionFilter.OnActionExecuting blocks the thread while the async action runs. Use IAsyncActionFilter to avoid thread starvation under load — the framework naturally awaits the next delegate.',
    },
    {
      title: 'Forgetting to register the filter type in DI when using [ServiceFilter]',
      wrong: `[ServiceFilter(typeof(AuditFilter))]   // ❌
[HttpGet]
public IActionResult Get() => Ok();
// AuditFilter not registered → InvalidOperationException at runtime`,
      right: `// Program.cs
builder.Services.AddScoped<AuditFilter>();  // ✓ register first

[ServiceFilter(typeof(AuditFilter))]
[HttpGet]
public IActionResult Get() => Ok();`,
      explanation: '[ServiceFilter] resolves the filter from the DI container. If the type is not registered, you get an InvalidOperationException at runtime (first request). Always register filter types alongside AddControllers().',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Filters are MVC pipeline hooks (Authorization → Resource → Action → Exception → Result) that intercept requests before/after controller actions; endpoint filters serve the same role for minimal APIs at the routing layer.',
    mustKnow: [
      'MVC filter pipeline order: Authorization → Resource → (model binding) → Action → Exception → Result',
      'Short-circuit by setting context.Result and returning WITHOUT calling next()',
      'IAsyncActionFilter is preferred over IActionFilter to avoid thread starvation on async actions',
      '[ServiceFilter] resolves filter from DI (must be registered); [TypeFilter] uses ActivatorUtilities with optional constructor args',
      'Exception filters only cover the MVC pipeline — middleware exceptions need UseExceptionHandler/IExceptionHandler',
      'IEndpointFilter is the minimal-API equivalent: first-added = outermost, FIFO-in LIFO-out like middleware',
      'IOrderedFilter.Order controls execution sequence; lower values = outermost',
    ],
    interviewFocus: [
      'What is the MVC filter pipeline order and what can each filter type do?',
      'How does short-circuiting work in IAsyncActionFilter?',
      'When would you use a filter instead of middleware?',
      'What is the difference between [ServiceFilter] and [TypeFilter]?',
      'How do IActionFilter and IEndpointFilter differ, and which runs first?',
    ],
  };
}
