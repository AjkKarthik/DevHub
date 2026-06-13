import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-minimal-api-advanced',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './minimal-api-advanced.html',
  styleUrl: './minimal-api-advanced.scss',
})
export class AspnetMinimalApiAdvanced {

  prerequisites: Prerequisite[] = [
    { label: 'Minimal APIs', route: '/aspnet/minimal-apis' },
    { label: 'Filters & Endpoint Filters', route: '/aspnet/filters' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'app.MapGroup(prefix)',          type: 'method',   desc: 'Groups endpoints under a common route prefix with shared metadata.' },
    { name: 'RouteGroupBuilder',             type: 'class',    desc: 'Returned by MapGroup — use to apply filters, auth, tags to the group.' },
    { name: 'TypedResults.Ok(value)',        type: 'method',   desc: 'Returns IResult with typed Ok(200). Enables compile-time response docs.' },
    { name: 'TypedResults.NotFound()',       type: 'method',   desc: 'Returns typed 404 IResult — preferred over Results.NotFound().' },
    { name: 'IEndpointFilter',               type: 'interface','desc': 'Implement to create reusable endpoint filters (validation, logging, etc.).' },
    { name: 'AddEndpointFilter<T>()',        type: 'method',   desc: 'Attaches a filter to an endpoint or group.' },
    { name: '[AsParameters]',                type: 'keyword',  desc: 'Binds multiple route/query/header params from a single class.' },
    { name: 'WithName(name)',                type: 'method',   desc: 'Assigns a name for link generation and OpenAPI operationId.' },
    { name: 'WithSummary / WithDescription', type: 'method',   desc: 'Adds OpenAPI summary and description to the endpoint.' },
    { name: 'ProducesProblem(statusCode)',   type: 'method',   desc: 'Documents error responses in OpenAPI output.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Route Groups',
      points: ['MapGroup(prefix) creates a RouteGroupBuilder that shares a URL prefix, middleware, auth requirements, and metadata. Nest groups for hierarchical APIs (e.g., /api/v1 → /users → /{id}/orders). Filters added to a group apply to every endpoint in it.'],
    },
    {
      heading: 'TypedResults vs Results',
      points: ['TypedResults returns strongly typed IResult implementations (Ok<T>, NotFound, etc.) instead of the non-generic Results static helper. This lets OpenAPI source generators and Swagger UI automatically infer return types without needing .Produces<T>() annotations.'],
    },
    {
      heading: 'Endpoint Filters',
      points: ['Implement IEndpointFilter and override InvokeAsync(context, next). Filters execute in pipeline order: call await next(context) to proceed, short-circuit by returning a result directly. Attach with AddEndpointFilter<T>() on a single endpoint or a RouteGroupBuilder for all endpoints.'],
    },
    {
      heading: 'Parameter Binding with [AsParameters]',
      points: ['By default, minimal API handler parameters are bound individually from route, query, body, header, or services. [AsParameters] lets you wrap multiple parameters into one record or class, reducing the parameter list and improving testability. Each property is bound the same way individual parameters would be.'],
    },
    {
      heading: 'OpenAPI and Versioning',
      points: ['Call .WithOpenApi() on an endpoint or group to opt in to OpenAPI generation. Add .WithName(), .WithSummary(), .WithDescription(), .WithTags(), and .Produces<T>() / ProducesProblem() to enrich the spec. For versioning, create separate MapGroup routes prefixed with /v1 or /v2 and tag them with Asp.Versioning.Http.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Route Groups',
      language: 'csharp',
      code: `var api = app.MapGroup("/api").RequireAuthorization();

var users = api.MapGroup("/users").WithTags("Users");

users.MapGet("/",    () => Results.Ok(new[] { "Alice", "Bob" }));
users.MapGet("/{id:int}", (int id) =>
    id > 0 ? TypedResults.Ok(new UserDto(id, "Alice")) : TypedResults.NotFound());

users.MapPost("/", async (CreateUserRequest req, IUserService svc) =>
{
    var user = await svc.CreateAsync(req);
    return TypedResults.Created(\`/api/users/\${user.Id}\`, user);
});

// Nested group
var orders = users.MapGroup("/{userId:int}/orders");
orders.MapGet("/", (int userId) => Results.Ok(Array.Empty<object>()));`,
    },
    {
      label: 'TypedResults',
      language: 'csharp',
      code: `// Handler return type documents itself in OpenAPI
app.MapGet("/products/{id:int}", async (int id, IProductRepo repo) =>
{
    var product = await repo.FindAsync(id);
    return product is null
        ? TypedResults.NotFound()
        : TypedResults.Ok(product);
})
.WithName("GetProduct")
.WithSummary("Get a product by ID")
.Produces<ProductDto>(200)
.ProducesProblem(404)
.WithOpenApi();

// Multiple typed returns via union-like approach
Results<Ok<ProductDto>, NotFound> GetProduct(int id, IProductRepo repo)
{
    var p = repo.Find(id);
    return p is null ? TypedResults.NotFound() : TypedResults.Ok(p);
}`,
    },
    {
      label: 'Endpoint Filter',
      language: 'csharp',
      code: `public class ValidationFilter<T> : IEndpointFilter
    where T : class
{
    private readonly IValidator<T> _validator;

    public ValidationFilter(IValidator<T> validator)
        => _validator = validator;

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var model = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (model is not null)
        {
            var result = await _validator.ValidateAsync(model);
            if (!result.IsValid)
                return Results.ValidationProblem(result.ToDictionary());
        }
        return await next(ctx);
    }
}

// Attach to group
users.MapPost("/", Handler)
     .AddEndpointFilter<ValidationFilter<CreateUserRequest>>();`,
    },
    {
      label: '[AsParameters]',
      language: 'csharp',
      code: `// Without [AsParameters] — messy parameter list
app.MapGet("/products", (
    string? search,
    int page,
    int pageSize,
    string? sortBy,
    bool descending,
    IProductService svc) => svc.SearchAsync(search, page, pageSize, sortBy, descending));

// With [AsParameters] — clean
public record ProductQuery(
    string? Search,
    int Page = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool Descending = false);

app.MapGet("/products", ([AsParameters] ProductQuery q, IProductService svc)
    => svc.SearchAsync(q));`,
    },
    {
      label: 'Group Auth + Metadata',
      language: 'csharp',
      code: `var v1 = app.MapGroup("/api/v1")
               .WithTags("v1")
               .RequireAuthorization("Admin")
               .AddEndpointFilter<RequestLoggingFilter>();

// All endpoints inherit auth, tags, and logging
v1.MapGet("/stats", () => Results.Ok(new { users = 100 }));
v1.MapDelete("/cache", (IOutputCacheStore store, CancellationToken ct)
    => store.EvictByTagAsync("products", ct));

// Public group — no auth
var pub = app.MapGroup("/api/public")
             .WithTags("Public")
             .AllowAnonymous();

pub.MapGet("/health", () => Results.Ok(new { status = "healthy" }));`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Results instead of TypedResults',
      wrong: `app.MapGet("/user/{id}", (int id) => Results.Ok(new UserDto(id)));`,
      right: `app.MapGet("/user/{id}", (int id) => TypedResults.Ok(new UserDto(id)));`,
      explanation: 'Results.Ok() returns a non-generic IResult that Swagger cannot infer. TypedResults.Ok<T>() enables automatic OpenAPI return-type documentation.',
    },
    {
      title: 'Adding individual endpoints to a group after branching',
      wrong: `var g = app.MapGroup("/api");
app.MapGet("/api/extra", Handler); // not in the group`,
      right: `var g = app.MapGroup("/api");
g.MapGet("/extra", Handler); // correctly inherits group config`,
      explanation: 'Endpoints mapped on app instead of the group variable do not inherit auth, filters, or metadata from the group.',
    },
    {
      title: 'Forgetting to register endpoint filters as services',
      wrong: `users.MapPost("/", Handler).AddEndpointFilter<ValidationFilter<Req>>();
// ValidationFilter not registered in DI`,
      right: `builder.Services.AddScoped(typeof(ValidationFilter<>));
users.MapPost("/", Handler).AddEndpointFilter<ValidationFilter<Req>>();`,
      explanation: 'Filters resolved from DI must be registered. Non-DI filters can be added via the lambda overload: .AddEndpointFilter((ctx, next) => ...).',
    },
    {
      title: 'Binding a body parameter inside a GET endpoint',
      wrong: `app.MapGet("/search", ([FromBody] SearchQuery q) => Search(q));`,
      right: `app.MapGet("/search", ([AsParameters] SearchQuery q) => Search(q));`,
      explanation: 'GET requests have no body. Use [AsParameters] to bind from query string, or switch to MapPost if a body is genuinely needed.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Grouped Product API',
    language: 'csharp',
    description: `Create a minimal API with the following:
- A route group at /api/products.
- GET / — returns a list of ProductDto.
- GET /{id:int} — returns TypedResults.Ok or TypedResults.NotFound.
- POST / — accepts CreateProductRequest and returns TypedResults.Created.
- Add an endpoint filter that logs the method and path of each request to the console.`,
    hints: [
      'Use app.MapGroup("/api/products") to create the group',
      'Attach the logging filter with .AddEndpointFilter() on the group',
      'TypedResults.Created(uri, value) sets the Location header',
    ],
    starterCode: `var products = app.MapGroup("/api/products");
// TODO: implement endpoints and logging filter`,
    solution: `public class LoggingFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var method = ctx.HttpContext.Request.Method;
        var path   = ctx.HttpContext.Request.Path;
        Console.WriteLine(\`[\${method}] \${path}\`);
        return await next(ctx);
    }
}

var products = app.MapGroup("/api/products")
                  .AddEndpointFilter<LoggingFilter>();

products.MapGet("/", () => TypedResults.Ok(new[] { new ProductDto(1, "Widget") }));

products.MapGet("/{id:int}", (int id) =>
    id == 1
        ? TypedResults.Ok(new ProductDto(1, "Widget"))
        : TypedResults.NotFound());

products.MapPost("/", (CreateProductRequest req) =>
    TypedResults.Created(\`/api/products/1\`, new ProductDto(1, req.Name)));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key advantage of TypedResults.Ok<T>() over Results.Ok()?',
      options: [
        'It is faster at runtime',
        'It enables automatic OpenAPI return-type inference',
        'It works with GET endpoints only',
        'It supports async results',
      ],
      answer: 1,
      explanation: 'TypedResults returns strongly typed IResult implementations, enabling OpenAPI source generators to infer response schemas without .Produces<T>() annotations.',
    },
    {
      q: 'How do you apply a filter to every endpoint in a group?',
      options: [
        'Attach the filter on app instead of the group',
        'Call .AddEndpointFilter() on the RouteGroupBuilder',
        'Register the filter as middleware',
        'Add [EndpointFilter] attribute to the handler method',
      ],
      answer: 1,
      explanation: 'Calling .AddEndpointFilter() on the RouteGroupBuilder propagates the filter to all endpoints mapped through that group.',
    },
    {
      q: 'What does [AsParameters] do?',
      options: [
        'Marks a parameter to be read from the route only',
        'Binds multiple parameters from a wrapper class/record',
        'Skips model binding for the parameter',
        'Applies FluentValidation automatically',
      ],
      answer: 1,
      explanation: '[AsParameters] lets you bundle route, query, header, and service parameters into one class, reducing handler parameter lists.',
    },
    {
      q: 'When an endpoint filter short-circuits, what should it return?',
      options: [
        'null',
        'Task.CompletedTask',
        'An IResult (e.g., Results.ValidationProblem(...))',
        'throw an exception',
      ],
      answer: 2,
      explanation: 'To short-circuit, return an IResult value without calling await next(context). Returning null causes a 204 No Content response.',
    },
    {
      q: 'Which call assigns a name to a minimal API endpoint for link generation?',
      options: ['.WithTags()', '.WithName()', '.WithSummary()', '.WithOpenApi()'],
      answer: 1,
      explanation: '.WithName(name) sets the operationId in OpenAPI and makes the endpoint resolvable by LinkGenerator.GetUriByName().',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use controller-style attributes like [HttpGet] on minimal API handlers?',
      a: 'No. Minimal APIs use the MapGet/MapPost/etc. method calls, not attribute routing. However, you can achieve the same metadata using .WithTags(), .WithName(), .Produces<T>(), and WithOpenApi() on the endpoint or group.',
    },
    {
      q: 'How do I apply authorization to some endpoints but not others in a group?',
      a: 'Call RequireAuthorization() on the group to protect all endpoints, then call .AllowAnonymous() on individual endpoints that should be public. Or create two groups — one protected, one public.',
    },
    {
      q: 'How do I access HttpContext inside a minimal API handler?',
      a: 'Add HttpContext as a parameter to the handler delegate — ASP.NET Core automatically injects it. You can also inject IHttpContextAccessor if you need context inside a service layer.',
    },
    {
      q: 'What is the difference between endpoint filters and middleware?',
      a: 'Middleware runs for every request before routing resolves the endpoint. Endpoint filters run after routing, targeting specific endpoints or groups. Filters have access to the endpoint metadata and handler arguments, making them better for per-endpoint cross-cutting concerns like validation.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Advanced Minimal APIs use route groups, TypedResults, endpoint filters, and [AsParameters] to build clean, testable, well-documented APIs.',
    mustKnow: [
      'MapGroup(prefix) shares auth, filters, and metadata across endpoints',
      'TypedResults.Ok<T>() enables automatic OpenAPI response type inference',
      'IEndpointFilter.InvokeAsync: call next to continue, return IResult to short-circuit',
      '[AsParameters] binds multiple parameters from a single class/record',
      'Filters on a group apply to every endpoint registered on that group',
      '.WithName(), .WithSummary(), .Produces<T>() enrich OpenAPI output',
    ],
    interviewFocus: [
      'What does MapGroup provide that individual MapGet calls do not?',
      'TypedResults vs Results — why does the type matter for OpenAPI?',
      'Endpoint filters vs middleware — when to use each',
      'How to perform request validation in a minimal API without controllers',
    ],
  };
}
