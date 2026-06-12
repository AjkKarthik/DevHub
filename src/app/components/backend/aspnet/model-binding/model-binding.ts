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
  selector: 'app-aspnet-model-binding',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './model-binding.html',
  styleUrl: './model-binding.scss',
})
export class AspnetModelBinding {

  quickRef: QuickRefItem[] = [
    { name: '[FromBody]',        type: 'decorator', desc: 'Binds from JSON/XML request body' },
    { name: '[FromQuery]',       type: 'decorator', desc: 'Binds from query string (?key=value)' },
    { name: '[FromRoute]',       type: 'decorator', desc: 'Binds from route template segment {id}' },
    { name: '[FromHeader]',      type: 'decorator', desc: 'Binds from an HTTP request header' },
    { name: '[FromForm]',        type: 'decorator', desc: 'Binds from multipart/form-data or URL-encoded form' },
    { name: '[FromServices]',    type: 'decorator', desc: 'Binds from the DI container (minimal APIs)' },
    { name: 'AsParameters',      type: 'decorator', desc: 'Treats a struct/record as a parameter bag (minimal APIs)' },
    { name: '[Required]',        type: 'decorator', desc: 'DataAnnotations — field must not be null/empty' },
    { name: '[Range(min, max)]', type: 'decorator', desc: 'DataAnnotations — numeric range constraint' },
    { name: 'ModelState',        type: 'accessor',  desc: 'Dictionary of validation errors in controllers' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Binding Sources',
      points: [
        'ASP.NET Core resolves parameters from five sources: <strong>route values</strong>, <strong>query string</strong>, <strong>request body</strong> (JSON/XML), <strong>form data</strong>, and <strong>HTTP headers</strong>.',
        'In controllers with <code>[ApiController]</code>, source is inferred: simple types from route/query, complex types from body. In minimal APIs, use explicit attributes (<code>[FromQuery]</code>, <code>[FromBody]</code>, etc.).',
        'Only one <code>[FromBody]</code> is allowed per action — the request body is a non-seekable stream and can only be read once.',
      ],
    },
    {
      heading: 'DataAnnotations Validation',
      points: [
        'Annotate model properties with <code>[Required]</code>, <code>[Range]</code>, <code>[StringLength]</code>, <code>[EmailAddress]</code>, <code>[RegularExpression]</code>, etc.',
        'With <code>[ApiController]</code>, <code>ModelState</code> is checked <em>before</em> the action runs — an invalid model automatically returns 400 <code>ValidationProblemDetails</code>.',
        'In minimal APIs, DataAnnotations are <strong>NOT</strong> validated automatically. Add an endpoint filter or use .NET 9\'s built-in <code>AddValidation()</code>.',
      ],
    },
    {
      heading: '[AsParameters] — Minimal API Parameter Bags',
      points: [
        '<code>[AsParameters]</code> on a record/struct makes the binder bind each property individually from its <code>[From*]</code> attribute, rather than binding the whole object from the body.',
        'Ideal for search/paging parameters: <code>public record PagedQuery([FromQuery] string? Search, [FromQuery] int Page = 1, [FromQuery] int Size = 20);</code>',
        'The record is not itself a body parameter — it is a grouping of separately-bound query/route/header parameters. No <code>[FromBody]</code> is implied.',
      ],
    },
    {
      heading: 'FluentValidation',
      points: [
        'FluentValidation provides a fluent, testable alternative to DataAnnotations. Validators inherit <code>AbstractValidator&lt;T&gt;</code> and use a chainable rules API.',
        'Supports async validators (<code>MustAsync</code>), cross-property rules (<code>When/Unless</code>), and validator composition — features DataAnnotations cannot express cleanly.',
        'Register with <code>builder.Services.AddFluentValidationAutoValidation()</code> + <code>AddValidatorsFromAssemblyContaining&lt;MyValidator&gt;()</code> and validators run as part of <code>ModelState</code> automatically.',
      ],
    },
    {
      heading: 'Custom Model Binders & IParsable',
      points: [
        'Implement <code>IParsable&lt;T&gt;</code> on a type and ASP.NET Core (7+) will use it automatically for query-string and route binding — no custom binder needed.',
        'For controllers, implement <code>IModelBinder</code> and register via <code>[ModelBinder(typeof(MyBinder))]</code> on the parameter, or globally via <code>MvcOptions.ModelBinderProviders</code>.',
        'Use custom binders for: comma-separated array parameters, encrypted IDs, custom date ranges, or any format the default binder cannot parse.',
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
    string  category,                                          // [FromRoute]
    string? q,                                                 // [FromQuery]
    [FromHeader(Name = "Accept-Language")] string? lang)      // explicit
=> Ok(new { category, q, lang });

// Minimal API — explicit (no inference for simple types)
app.MapGet("/products/{category}", (
    [FromRoute]  string category,
    [FromQuery]  string? q,
    [FromHeader(Name = "Accept-Language")] string? lang,
    [FromServices] IProductService svc)
=> svc.FilterAsync(category, q, lang));`,
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
}

// POST /api/users with invalid body:
// Response: 400 { "errors": { "Email": ["…"], "Age": ["…"] } }
// handled automatically by [ApiController]`,
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

app.MapGet("/items", async (
    [AsParameters] PagedQuery q,
    IItemService svc) =>
    TypedResults.Ok(await svc.SearchAsync(q.Search, q.Page, q.Size, q.Sort, q.Order)));

// GET /items?search=shoe&page=2&size=10  ✓
// GET /items                             ✓ (all defaults)`,
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
    }
}

public class OrderItemValidator : AbstractValidator<OrderItemDto>
{
    public OrderItemValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0);
        RuleFor(x => x.Quantity).InclusiveBetween(1, 100);
    }
}

builder.Services
    .AddFluentValidationAutoValidation()
    .AddValidatorsFromAssemblyContaining<CreateOrderValidator>();
// POST /api/orders — FluentValidation runs via ModelState → auto 400`,
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
    public static bool TryParse(string? s, IFormatProvider? p,
        out DateRange r)
    {
        try  { r = Parse(s ?? "", p); return true;  }
        catch { r = default;          return false; }
    }
}

// GET /reports?range=2024-01-01..2024-03-31
app.MapGet("/reports", ([FromQuery] DateRange range, IReportService svc) =>
    svc.GenerateAsync(range.From, range.To));`,
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
        'Add an IEndpointFilter that calls Validator.TryValidateObject()',
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
        'Read Request.QueryString manually',
        'Implement IParsable<DateRange> — .NET 7+ binds it automatically',
        'Use [FromQuery] string dateRange and parse it inside the action',
      ],
      answer: 2,
      explanation: 'ASP.NET Core 7+ uses IParsable<T>.TryParse for query-string and route parameters. Implementing it is the cleanest way without writing a model binder.',
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
      a: '[FromBody] reads JSON or XML from the raw body stream (Content-Type: application/json). [FromForm] reads application/x-www-form-urlencoded or multipart/form-data. They cannot be combined in one action.',
    },
    {
      q: 'How does FluentValidation integrate with ProblemDetails?',
      a: 'With AddFluentValidationAutoValidation(), FluentValidation results are added to ModelState. The [ApiController] auto-400 then returns them as ValidationProblemDetails — the same format as DataAnnotations errors.',
    },
    {
      q: 'Can I bind a list from a query string?',
      a: 'Yes. Use [FromQuery] IEnumerable<string> or int[] ids. The convention is ?ids=1&ids=2&ids=3 (repeated keys). For comma-separated format you need a custom model binder or IParsable implementation.',
    },
    {
      q: 'How do I validate a model manually inside an action?',
      a: 'Call TryValidateModel(dto) on ControllerBase. This runs DataAnnotations and populates ModelState. Then check if (!ModelState.IsValid) return ValidationProblem(). Use this when the [ApiController] automatic 400 runs too early.',
    },
  ];
}
