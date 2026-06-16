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
  selector: 'app-aspnet-model-binding',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './model-binding.html',
  styleUrl: './model-binding.scss',
})
export class AspnetModelBinding {

  prerequisites: Prerequisite[] = [
    { label: 'Controllers & Actions', route: '/aspnet/controllers' },
    { label: 'Minimal APIs', route: '/aspnet/minimal-apis' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '[FromBody]',        type: 'decorator', desc: 'Binds from JSON/XML request body' },
    { name: '[FromQuery]',       type: 'decorator', desc: 'Binds from query string (?key=value)' },
    { name: '[FromRoute]',       type: 'decorator', desc: 'Binds from route template segment {id}' },
    { name: '[FromHeader]',      type: 'decorator', desc: 'Binds from an HTTP request header' },
    { name: '[FromForm]',        type: 'decorator', desc: 'Binds from multipart/form-data or URL-encoded form' },
    { name: '[FromServices]',    type: 'decorator', desc: 'Binds from the DI container (minimal APIs)' },
    { name: '[AsParameters]',    type: 'decorator', desc: 'Treats a struct/record as a parameter bag (minimal APIs)' },
    { name: '[Required]',        type: 'decorator', desc: 'DataAnnotations — field must not be null/empty' },
    { name: '[Range(min, max)]', type: 'decorator', desc: 'DataAnnotations — numeric range constraint' },
    { name: 'ModelState',        type: 'accessor',  desc: 'Dictionary of validation errors in controllers' },
    { name: 'IParsable<T>',      type: 'interface', desc: 'Implement to get automatic query/route binding (.NET 7+)' },
    { name: 'IModelBinder',      type: 'interface', desc: 'Implement for custom binding logic in controllers' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Binding Sources and Inference Rules',
      points: [
        'ASP.NET Core resolves parameters from five sources: <strong>route values</strong>, <strong>query string</strong>, <strong>request body</strong> (JSON/XML), <strong>form data</strong>, and <strong>HTTP headers</strong>.',
        'In controllers with <code>[ApiController]</code>, source is inferred automatically: simple types (<code>string</code>, <code>int</code>, <code>Guid</code>) come from route or query; complex types come from body.',
        'In minimal APIs there is no inference — always use explicit attributes (<code>[FromQuery]</code>, <code>[FromBody]</code>, etc.) except for services injected via DI, which are resolved from the container automatically.',
        'Only one <code>[FromBody]</code> is allowed per action — the request body is a non-seekable stream and can only be read once; a second attempt throws.',
        'Special types that bypass attribute binding: <code>HttpContext</code>, <code>HttpRequest</code>, <code>HttpResponse</code>, <code>CancellationToken</code>, <code>ClaimsPrincipal</code> are injected directly by the framework.',
        'For file uploads, use <code>IFormFile</code> (single) or <code>IFormFileCollection</code> (multiple) with <code>[FromForm]</code> — do NOT use <code>[FromBody]</code>.',
      ],
    },
    {
      heading: 'DataAnnotations Validation',
      points: [
        'Annotate model properties with <code>[Required]</code>, <code>[Range]</code>, <code>[StringLength]</code>, <code>[EmailAddress]</code>, <code>[RegularExpression]</code>, <code>[Url]</code>, etc.',
        'With <code>[ApiController]</code>, a built-in filter (<code>ModelStateInvalidFilter</code>) runs <em>before</em> the action — an invalid model automatically returns 400 <code>ValidationProblemDetails</code> without touching your action code.',
        'In minimal APIs, DataAnnotations are <strong>NOT</strong> validated automatically; add an endpoint filter, FluentValidation, or .NET 9\'s built-in <code>AddValidation()</code> (<code>builder.Services.AddValidation()</code> + filter).',
        'Customise the automatic 400 response via <code>ApiBehaviorOptions.InvalidModelStateResponseFactory</code> — set it in <code>builder.Services.Configure&lt;ApiBehaviorOptions&gt;()</code>.',
        'Use <code>[ValidateNever]</code> on a property to skip validation for that property (e.g. a computed field populated after binding).',
        'For nested objects, validation is recursive — add <code>[ValidateNever]</code> on navigation properties you do not want checked.',
      ],
    },
    {
      heading: '[AsParameters] — Minimal API Parameter Bags',
      points: [
        '<code>[AsParameters]</code> on a record/struct makes the binder bind each property individually from its <code>[From*]</code> attribute, rather than binding the whole object from the body.',
        'Ideal for search/paging parameters: <code>public record PagedQuery([FromQuery] string? Search, [FromQuery] int Page = 1, [FromQuery] int Size = 20);</code>',
        'The record is not itself a body parameter — it is a grouping of separately-bound query/route/header parameters. No <code>[FromBody]</code> is implied.',
        'Works with both records and structs; properties must have public setters or be positional record properties.',
        'Combine <code>[FromRoute]</code> and <code>[FromQuery]</code> properties in the same record — useful for REST endpoints like <code>/items/{id}/comments?page=2</code>.',
        'DataAnnotations on the record\'s properties are respected by controller ModelState; in minimal APIs you still need an endpoint filter.',
      ],
    },
    {
      heading: 'FluentValidation',
      points: [
        'FluentValidation provides a fluent, testable alternative to DataAnnotations. Validators inherit <code>AbstractValidator&lt;T&gt;</code> and use a chainable rules API.',
        'Supports async validators (<code>MustAsync</code>), cross-property rules (<code>When/Unless</code>), conditional rules (<code>When(x => x.IsCompany, () => RuleFor(x => x.CompanyName).NotEmpty())</code>), and validator composition.',
        'Register with <code>builder.Services.AddFluentValidationAutoValidation()</code> + <code>AddValidatorsFromAssemblyContaining&lt;MyValidator&gt;()</code>; validators run via ModelState automatically in controllers.',
        'For minimal APIs, inject <code>IValidator&lt;T&gt;</code> directly into the handler and call <code>await validator.ValidateAsync(dto)</code>; return <code>Results.ValidationProblem(result.ToDictionary())</code> on failure.',
        'Use <code>RuleForEach</code> to validate collection elements and <code>SetValidator</code> to delegate to child validators — keeps each class\'s validation rules co-located.',
        'FluentValidation can replace DataAnnotations entirely — remove <code>AddDataAnnotationsValidation</code> and rely only on FV validators for a single source of truth.',
      ],
    },
    {
      heading: 'Custom Model Binders & IParsable',
      points: [
        'Implement <code>IParsable&lt;T&gt;</code> on a type and ASP.NET Core (.NET 7+) will use it automatically for query-string and route binding — no custom binder class needed.',
        'For controllers, implement <code>IModelBinder</code> returning a <code>Task</code> that sets <code>context.Result = ModelBindingResult.Success(value)</code>, then register via <code>[ModelBinder(typeof(MyBinder))]</code> on the parameter or globally via <code>MvcOptions.ModelBinderProviders.Insert(0, ...)</code>.',
        'Use custom binders for: comma-separated array parameters, encrypted IDs, custom date ranges, or any format the default binder cannot parse without custom parsing.',
        '<code>IModelBinderProvider</code> is the factory pattern — implement it when you need to decide at configuration time which binder to use based on the type or its attributes.',
        'For strongly-typed IDs (<code>OrderId</code>, <code>CustomerId</code>), implementing <code>IParsable&lt;T&gt;</code> is the recommended approach in .NET 7+; avoids polluting action signatures with raw primitives.',
        'Never throw in a model binder — call <code>context.ModelState.TryAddModelError</code> and set <code>context.Result = ModelBindingResult.Failed()</code> so the framework returns a proper 400.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Binding Sources',
      language: 'csharp',
      code: `// Controller — [ApiController] infers sources
[HttpGet("{category}")]
public IActionResult Get(
    string  category,                                          // [FromRoute] inferred
    string? q,                                                 // [FromQuery] inferred
    [FromHeader(Name = "Accept-Language")] string? lang)      // explicit header
=> Ok(new { category, q, lang });

// Minimal API — always explicit (no inference)
app.MapGet("/products/{category}", (
    [FromRoute]  string category,
    [FromQuery]  string? q,
    [FromHeader(Name = "Accept-Language")] string? lang,
    [FromServices] IProductService svc)                       // DI — no attribute needed
=> svc.FilterAsync(category, q, lang));

// Special types injected automatically — no attribute required
app.MapGet("/info", (HttpContext ctx, CancellationToken ct, ClaimsPrincipal user) =>
    TypedResults.Ok(new { user.Identity!.Name, ctx.Connection.RemoteIpAddress?.ToString() }));`,
    },
    {
      label: 'DataAnnotations',
      language: 'csharp',
      code: `public class RegisterUserDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required, StringLength(50, MinimumLength = 8)]
    public string Password { get; set; } = "";

    [Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = "";

    [Range(18, 120)]
    public int Age { get; set; }

    [ValidateNever]           // skip — computed at service layer
    public string Role { get; set; } = "user";
}

// POST /api/users with invalid body → 400 automatically via [ApiController]:
// { "errors": { "Email": ["…"], "Age": ["…"] } }

// Customise the 400 response factory:
builder.Services.Configure<ApiBehaviorOptions>(o =>
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState
            .Where(e => e.Value?.Errors.Any() == true)
            .ToDictionary(k => k.Key, v => v.Value!.Errors.Select(e => e.ErrorMessage).ToArray());
        return new BadRequestObjectResult(new { Code = "VALIDATION_FAILED", Errors = errors });
    });`,
    },
    {
      label: 'AsParameters',
      language: 'csharp',
      code: `public record PagedQuery(
    [FromQuery] string? Search = null,
    [FromQuery] int     Page   = 1,
    [FromQuery] int     Size   = 20,
    [FromQuery] string  Sort   = "id",
    [FromQuery] string  Order  = "asc");

// Combine route + query in same record:
public record ItemCommentQuery(
    [FromRoute] int    ItemId,
    [FromQuery] int    Page = 1,
    [FromQuery] int    Size = 20);

app.MapGet("/items/{itemId}/comments", async (
    [AsParameters] ItemCommentQuery q,
    ICommentService svc) =>
    TypedResults.Ok(await svc.GetCommentsAsync(q.ItemId, q.Page, q.Size)));

// GET /items/42/comments?page=2&size=10  ✓
// GET /items/42/comments                 ✓ (defaults: page=1, size=20)`,
    },
    {
      label: 'FluentValidation',
      language: 'csharp',
      code: `public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty()
            .WithMessage("Order must have at least one item");
        RuleForEach(x => x.Items).SetValidator(new OrderItemValidator());
        When(x => x.IsExpedited, () =>
            RuleFor(x => x.DeliveryDate).NotNull().GreaterThan(DateTime.UtcNow));
    }
}

// Controller — automatic via AddFluentValidationAutoValidation()
builder.Services
    .AddFluentValidationAutoValidation()
    .AddValidatorsFromAssemblyContaining<CreateOrderValidator>();

// Minimal API — inject and call manually
app.MapPost("/orders", async (
    CreateOrderDto dto,
    IValidator<CreateOrderDto> validator,
    IOrderService svc) =>
{
    var result = await validator.ValidateAsync(dto);
    if (!result.IsValid)
        return Results.ValidationProblem(result.ToDictionary());
    var order = await svc.CreateAsync(dto);
    return TypedResults.Created(\`/orders/\${order.Id}\`, order);
});`,
    },
    {
      label: 'IParsable Binder',
      language: 'csharp',
      code: `// IParsable<T> — .NET 7+ binds automatically from query/route
public readonly record struct DateRange(DateOnly From, DateOnly To)
    : IParsable<DateRange>
{
    public static DateRange Parse(string s, IFormatProvider? _)
    {
        var p = s.Split("..");
        return new DateRange(DateOnly.Parse(p[0]), DateOnly.Parse(p[1]));
    }
    public static bool TryParse(string? s, IFormatProvider? p, out DateRange r)
    {
        try  { r = Parse(s ?? "", p); return true;  }
        catch { r = default;          return false; }
    }
}

// GET /reports?range=2024-01-01..2024-03-31
app.MapGet("/reports", ([FromQuery] DateRange range, IReportService svc) =>
    svc.GenerateAsync(range.From, range.To));

// Strongly-typed ID with IParsable:
public readonly record struct OrderId(int Value) : IParsable<OrderId>
{
    public static OrderId Parse(string s, IFormatProvider? _) => new(int.Parse(s));
    public static bool TryParse(string? s, IFormatProvider? p, out OrderId r)
    {
        r = default;
        return int.TryParse(s, out var v) && (r = new(v)) != default;
    }
}
// GET /orders/{orderId} — binds OrderId directly from route`,
    },
  ];

  challenge: Challenge = {
    title: 'Validated Search Endpoint',
    language: 'csharp',
    description: 'Create a minimal API endpoint GET /search that accepts [AsParameters] SearchQuery where: q (required, min 2 chars) comes from query, page (default 1, min 1) from query, size (default 20, 5–100) from query. Add an endpoint filter that validates the parameters and returns 400 if invalid. Return Ok with the parameters echoed back.',
    hints: [
      'Use [AsParameters] SearchQuery with [FromQuery] on each property',
      'Add a filter via .AddEndpointFilter(async (ctx, next) => ...)',
      'ctx.GetArgument<SearchQuery>(0) gets the bound parameter inside the filter',
      'Return Results.ValidationProblem(errors) for invalid input',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// TODO: define SearchQuery record
// TODO: MapGet /search with [AsParameters] SearchQuery
// TODO: add endpoint filter for validation

app.Run();`,
    solution: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/search", ([AsParameters] SearchQuery q) =>
    TypedResults.Ok(new { q.Q, q.Page, q.Size }))
.AddEndpointFilter(async (ctx, next) =>
{
    var query = ctx.GetArgument<SearchQuery>(0);
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrEmpty(query.Q) || query.Q.Length < 2)
        errors["q"] = ["Search term must be at least 2 characters"];
    if (query.Page < 1)
        errors["page"] = ["Page must be >= 1"];
    if (query.Size < 5 || query.Size > 100)
        errors["size"] = ["Size must be between 5 and 100"];

    return errors.Count > 0 ? Results.ValidationProblem(errors) : await next(ctx);
});

app.Run();

public record SearchQuery(
    [FromQuery] string? Q,
    [FromQuery] int     Page = 1,
    [FromQuery] int     Size = 20);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In a controller with [ApiController], how is a complex type parameter bound by default?',
      options: ['[FromQuery]', '[FromRoute]', '[FromBody]', '[FromForm]'],
      answer: 2,
      explanation: '[ApiController] infers [FromBody] for complex type parameters. Simple types (int, string) are inferred from [FromRoute] (if the route contains that name) or [FromQuery].',
    },
    {
      q: 'How many [FromBody] parameters can a single action have?',
      options: ['Unlimited', '2', '1', '0 — use [FromForm] instead'],
      answer: 2,
      explanation: 'The request body is a non-seekable stream. It can only be read once, so only one [FromBody] parameter per action is supported.',
    },
    {
      q: 'Which attribute lets you treat a record as a parameter bag in minimal APIs?',
      options: ['[FromParameters]', '[AsParameters]', '[ParameterBag]', '[BindFrom]'],
      answer: 1,
      explanation: '[AsParameters] tells the minimal API binder to bind each property of the type individually from its [From*] attribute.',
    },
    {
      q: 'DataAnnotations validation in minimal APIs is NOT automatic. What is the recommended fix?',
      options: [
        'ModelState is available in minimal APIs too',
        'Add an IEndpointFilter that validates the model manually',
        'Annotate the handler with [ValidateModel]',
        'Call app.UseModelValidation()',
      ],
      answer: 1,
      explanation: 'Minimal APIs do not have the [ApiController] pipeline. Add validation explicitly via an IEndpointFilter, FluentValidation, or .NET 9+ AddValidation().',
    },
    {
      q: 'The cleanest way to bind a custom type DateRange from a query string in .NET 7+ is?',
      options: [
        'Write a custom IModelBinder and register it globally',
        'Read Request.QueryString manually in the handler',
        'Implement IParsable<DateRange> — .NET 7+ binds it automatically',
        'Use [FromQuery] string dateRange and parse it inside the action',
      ],
      answer: 2,
      explanation: 'ASP.NET Core 7+ uses IParsable<T>.TryParse for query-string and route parameters. Implementing it is the cleanest way without writing a model binder.',
    },
    {
      q: 'What does [ValidateNever] do on a DTO property?',
      options: [
        'Excludes the property from JSON binding',
        'Skips DataAnnotations validation for that property only',
        'Marks the property as optional in the route template',
        'Prevents FluentValidation from seeing the property',
      ],
      answer: 1,
      explanation: '[ValidateNever] tells ModelState to skip validation for that specific property. Useful for computed fields that are set at the service layer, not by the caller.',
    },
    {
      q: 'How do you accept file uploads in a controller action?',
      options: [
        '[FromBody] IFormFile file',
        '[FromForm] IFormFile file',
        '[FromQuery] IFormFile file',
        'IFormFile is injected by the DI container automatically',
      ],
      answer: 1,
      explanation: 'File uploads arrive as multipart/form-data. Use [FromForm] IFormFile (single) or IFormFileCollection (multiple). [FromBody] is for JSON/XML payloads.',
    },
    {
      q: 'You need to customise the 400 response that [ApiController] returns for invalid models. Where do you configure this?',
      options: [
        'Override OnActionExecuting in a custom ActionFilter',
        'Set ApiBehaviorOptions.InvalidModelStateResponseFactory in ConfigureServices',
        'Implement IModelValidator and register it as a singleton',
        'Add a middleware that intercepts all 400 responses',
      ],
      answer: 1,
      explanation: 'ApiBehaviorOptions.InvalidModelStateResponseFactory is a delegate you set once in ConfigureServices. It receives the ActionContext and returns any IActionResult, giving full control over the 400 shape.',
    },
    {
      q: 'Which types are injected by the framework automatically in minimal API handlers without any [From*] attribute?',
      options: [
        'Any registered DI service',
        'HttpContext, HttpRequest, CancellationToken, ClaimsPrincipal',
        'Only ILogger<T> and IConfiguration',
        'Any class that implements IBindable',
      ],
      answer: 1,
      explanation: 'HttpContext, HttpRequest, HttpResponse, CancellationToken, and ClaimsPrincipal are special types the framework injects directly. Arbitrary DI services require [FromServices] in minimal APIs (or are auto-resolved if the type is registered and unambiguous in .NET 7+).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What happens when [ApiController] detects an invalid ModelState?',
      a: 'A built-in action filter (ModelStateInvalidFilter) runs before the action, calls ValidationProblemDetails with all validation errors, and returns 400. The action itself never executes. Override via ApiBehaviorOptions.InvalidModelStateResponseFactory.',
    },
    {
      q: 'Can I have optional [FromBody] parameters?',
      a: 'Yes — make the parameter type nullable (CreateOrderDto?) or give it a default value. If the body is empty or missing, the value will be null. For required bodies, leave it non-nullable; [ApiController] returns 400 if the body cannot be bound.',
    },
    {
      q: 'What is the difference between [FromForm] and [FromBody]?',
      a: '[FromBody] reads JSON or XML from the raw body stream (Content-Type: application/json). [FromForm] reads application/x-www-form-urlencoded or multipart/form-data. They cannot be combined in one action because the body stream can only be read once.',
    },
    {
      q: 'How does FluentValidation integrate with ProblemDetails?',
      a: 'With AddFluentValidationAutoValidation(), FluentValidation results are added to ModelState. The [ApiController] auto-400 then returns them as ValidationProblemDetails — the same format as DataAnnotations errors. In minimal APIs, call result.ToDictionary() and pass to Results.ValidationProblem().',
    },
    {
      q: 'Can I bind a list from a query string?',
      a: 'Yes. Use [FromQuery] IEnumerable<string> or int[] ids. The convention is ?ids=1&ids=2&ids=3 (repeated keys). For comma-separated format you need a custom model binder or IParsable implementation that splits on commas.',
    },
    {
      q: 'How do I validate a model manually inside an action?',
      a: 'Call TryValidateModel(dto) on ControllerBase. This runs DataAnnotations and populates ModelState. Then check if (!ModelState.IsValid) return ValidationProblem(). Use this when the [ApiController] automatic 400 runs too early (e.g. after an async enrichment step).',
    },
    {
      q: 'What is the difference between IModelBinder and IModelBinderProvider?',
      a: 'IModelBinder performs the actual binding logic for a parameter. IModelBinderProvider is the factory that decides which IModelBinder to use based on the parameter type and attributes. Register a provider globally via MvcOptions.ModelBinderProviders.Insert(0, provider) so it applies to all matching parameters.',
    },
    {
      q: 'When should I prefer FluentValidation over DataAnnotations?',
      a: 'Choose FluentValidation when you need: async validation (database uniqueness checks), cross-property rules (password == confirmPassword), conditional rules (field required only when another field has a certain value), or reusable child validators. DataAnnotations are fine for simple, stateless constraints on individual properties.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using [FromBody] twice in the same action',
      wrong: `[HttpPost]
public IActionResult Create(
    [FromBody] CreateUserDto user,
    [FromBody] CreateAddressDto address) // ❌ second body read — throws`,
      right: `public class CreateUserWithAddressDto
{
    public CreateUserDto User { get; set; } = null!;
    public CreateAddressDto Address { get; set; } = null!;
}

[HttpPost]
public IActionResult Create([FromBody] CreateUserWithAddressDto dto) // ✓`,
      explanation: 'The request body is a non-seekable stream — once read, it cannot be rewound. Combine multiple body objects into a single wrapper DTO.',
    },
    {
      title: 'Expecting automatic validation in minimal APIs',
      wrong: `app.MapPost("/users", (CreateUserDto dto) =>
{
    // ❌ DataAnnotations are NOT validated automatically here
    // dto.Email could be null even if [Required] is on it
    return Results.Ok(userService.Create(dto));
});`,
      right: `app.MapPost("/users", async (CreateUserDto dto, IValidator<CreateUserDto> v) =>
{
    var result = await v.ValidateAsync(dto);
    if (!result.IsValid) return Results.ValidationProblem(result.ToDictionary());
    return Results.Ok(userService.Create(dto));
}); // ✓ — explicit validation`,
      explanation: '[ApiController] automatically validates ModelState; minimal APIs do not. Always validate explicitly in minimal API handlers via FluentValidation or an endpoint filter.',
    },
    {
      title: 'Using [FromBody] for file uploads',
      wrong: `[HttpPost("upload")]
public async Task<IActionResult> Upload([FromBody] IFormFile file) // ❌`,
      right: `[HttpPost("upload")]
public async Task<IActionResult> Upload([FromForm] IFormFile file) // ✓
{
    using var stream = file.OpenReadStream();
    await storageService.UploadAsync(stream, file.FileName);
    return Ok();
}`,
      explanation: 'File uploads use multipart/form-data, not JSON. Use [FromForm] with IFormFile. [FromBody] is for JSON/XML payloads only.',
    },
    {
      title: 'Throwing exceptions in a custom IModelBinder',
      wrong: `public Task BindModelAsync(ModelBindingContext context)
{
    var raw = context.ValueProvider.GetValue(context.ModelName).FirstValue;
    var value = int.Parse(raw!); // ❌ throws on bad input → 500
    context.Result = ModelBindingResult.Success(new OrderId(value));
    return Task.CompletedTask;
}`,
      right: `public Task BindModelAsync(ModelBindingContext context)
{
    var raw = context.ValueProvider.GetValue(context.ModelName).FirstValue;
    if (!int.TryParse(raw, out var v))
    {
        context.ModelState.TryAddModelError(context.ModelName, "Invalid ID format");
        context.Result = ModelBindingResult.Failed(); // ✓ → 400
        return Task.CompletedTask;
    }
    context.Result = ModelBindingResult.Success(new OrderId(v));
    return Task.CompletedTask;
}`,
      explanation: 'Never throw in a model binder — unhandled exceptions become 500. Use ModelState.TryAddModelError + ModelBindingResult.Failed() to produce a 400 with a readable error message.',
    },
    {
      title: 'Ignoring the IParsable<T> option and writing a full binder',
      wrong: `// Writing IModelBinder + IModelBinderProvider for a custom value type:
public class DateRangeBinder : IModelBinder { /* 30+ lines */ }
public class DateRangeBinderProvider : IModelBinderProvider { /* 20+ lines */ }
// ... register in MvcOptions ...`,
      right: `public readonly record struct DateRange(DateOnly From, DateOnly To)
    : IParsable<DateRange>
{
    public static DateRange Parse(string s, IFormatProvider? _)
        => new(DateOnly.Parse(s.Split("..")[0]), DateOnly.Parse(s.Split("..")[1]));
    public static bool TryParse(string? s, IFormatProvider? p, out DateRange r)
    {
        try { r = Parse(s ?? "", p); return true; }
        catch { r = default; return false; }
    }
}
// [FromQuery] DateRange range — bound automatically, zero boilerplate ✓`,
      explanation: '.NET 7+ uses IParsable<T>.TryParse for query/route parameters. For value types and strongly-typed IDs, IParsable<T> eliminates the need for a custom binder entirely.',
    },
    {
      title: 'Reading Request.Body manually instead of using binding',
      wrong: `app.MapPost("/data", async (HttpRequest req) =>
{
    using var reader = new StreamReader(req.Body);
    var json = await reader.ReadToEndAsync(); // ❌ raw stream, bypasses validation
    var dto = JsonSerializer.Deserialize<MyDto>(json);
    // ...
});`,
      right: `app.MapPost("/data", async (MyDto dto) =>
{
    // ✓ ASP.NET Core deserialises and validates automatically
    // dto is ready to use — no manual stream reading needed
});`,
      explanation: 'Reading the raw body stream bypasses model binding, validation, content-type negotiation, and error handling. Let the framework bind the parameter; only access the raw stream when you genuinely need it (e.g. streaming large uploads).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Model binding maps HTTP request data (route, query, body, headers, form) into action parameters; DataAnnotations and FluentValidation enforce constraints before the handler runs.',
    mustKnow: [
      '[ApiController] infers binding sources: complex types → body, simple types → route/query; minimal APIs require explicit [From*] attributes',
      'Only one [FromBody] per action — body is a non-seekable stream read exactly once',
      '[AsParameters] binds record/struct properties individually from their [From*] attributes — the record itself is NOT a body parameter',
      '[ApiController] auto-validates ModelState and returns 400 before the action; minimal APIs require an explicit filter or FluentValidation',
      'IParsable<T> gives automatic query/route binding for custom value types in .NET 7+ with zero boilerplate',
      'Never throw in custom binders — use ModelState.TryAddModelError + ModelBindingResult.Failed() to return 400',
      'Customise the automatic 400 via ApiBehaviorOptions.InvalidModelStateResponseFactory',
    ],
    interviewFocus: [
      'What is the difference between [FromBody] and [FromForm], and why can\'t you use both?',
      'How does validation work in minimal APIs vs controller actions with [ApiController]?',
      'When would you choose FluentValidation over DataAnnotations?',
      'What is [AsParameters] and when is it useful?',
      'How does IParsable<T> simplify custom binding compared to IModelBinder?',
    ],
  };
}
