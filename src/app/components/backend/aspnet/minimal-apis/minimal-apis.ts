import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-minimal-apis',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './minimal-apis.html',
  styleUrl: './minimal-apis.scss',
})
export class AspnetMinimalApis {

  prerequisites: Prerequisite[] = [
    { label: 'Routing', route: '/aspnet/routing' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'app.MapGet()',      type: 'method',    desc: 'Register a GET endpoint with a route template and handler' },
    { name: 'app.MapPost()',     type: 'method',    desc: 'Register a POST endpoint' },
    { name: 'app.MapGroup()',    type: 'method',    desc: 'Group endpoints under a shared prefix and metadata' },
    { name: 'TypedResults',      type: 'class',     desc: 'Static factory for compile-time typed result objects' },
    { name: 'IResult',           type: 'interface', desc: 'Base interface for all results (Ok, NotFound, Created, …)' },
    { name: 'Results<T1,T2>',    type: 'type',      desc: 'Union return type for multi-result endpoints' },
    { name: 'IEndpointFilter',   type: 'interface', desc: 'Endpoint filter — runs before/after the handler' },
    { name: '.WithName()',       type: 'method',    desc: 'Names an endpoint for URL generation' },
    { name: '.WithTags()',       type: 'method',    desc: 'Groups endpoints in Swagger/OpenAPI UI' },
    { name: '.WithSummary()',    type: 'method',    desc: 'Adds OpenAPI summary text to an endpoint' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Minimal APIs vs Controllers — when to choose each',
      points: [
        'Minimal APIs register endpoints directly on <code>WebApplication</code> — no controller class, no attribute ceremony, no MVC pipeline. Both use the same endpoint routing engine and can coexist in one app; you can use controllers for complex domain areas and minimal APIs for simple utilities in the same project.',
        'Choose <strong>minimal APIs</strong> for microservices, serverless functions, small focused APIs, or when startup time and binary size matter (AOT publishing). They have significantly less overhead per endpoint than the MVC pipeline.',
        'Choose <strong>controllers</strong> for large teams that value convention over configuration, complex shared action filters (logging, audit, idempotency applied across many actions), nested route hierarchies, and API surface areas with many endpoints sharing significant cross-cutting behaviour.',
        'DI injection is first-class in handlers: declare a service-type parameter and ASP.NET Core resolves it from the container automatically — no <code>[FromServices]</code> attribute needed in .NET 7+. Simple types bind from route/query; complex types from the JSON body.',
        'Minimal APIs support the full ASP.NET Core security stack: <code>.RequireAuthorization()</code>, <code>.RequireCors()</code>, <code>.RequireRateLimiting()</code>, and <code>.AllowAnonymous()</code> work identically to their controller equivalents, applied per-endpoint or per-group.',
      ],
    },
    {
      heading: 'TypedResults and Results<T1,T2>',
      points: [
        '<code>TypedResults</code> returns <em>concrete generic types</em> (<code>Ok&lt;T&gt;</code>, <code>NotFound</code>, <code>Created&lt;T&gt;</code>) instead of the base <code>IResult</code> interface. OpenAPI source generators discover the response schema at compile time — no <code>[ProducesResponseType]</code> annotations needed.',
        'Use <code>Results&lt;T1, T2, …&gt;</code> as the handler return type to declare the full set of possible outcomes: <code>Results&lt;Ok&lt;Product&gt;, NotFound&gt;</code>. The compiler enforces that every code path returns one of the declared types — making response gaps a compile error rather than a documentation mistake.',
        'Prefer <code>TypedResults</code> over the static <code>Results</code> class for any production code. The difference is purely type-safety and OpenAPI generation — there is zero runtime overhead. <code>Results.Ok()</code> and <code>TypedResults.Ok()</code> execute the same pipeline code.',
        'For stream responses, file downloads, and server-sent events: <code>TypedResults.Stream()</code>, <code>TypedResults.File()</code>, and <code>TypedResults.ServerSentEvents()</code> (.NET 9+) provide typed variants of these less common result types.',
        'The return type <code>IResult</code> still works and is appropriate for simple handlers where the response shape is obvious. Prefer <code>TypedResults</code> for any endpoint where a client generator or OpenAPI documentation matters.',
      ],
    },
    {
      heading: 'Route Groups — shared prefix and metadata',
      points: [
        '<code>app.MapGroup("/prefix")</code> returns a <code>RouteGroupBuilder</code>. All endpoints mapped on it inherit the path prefix — no need to repeat it on every route. Call <code>.WithTags("Products")</code>, <code>.RequireAuthorization()</code>, or <code>.WithOpenApi()</code> once and every child endpoint shares it.',
        'Groups are composable and nestable: <code>var v2 = api.MapGroup("/v2"); var orders = v2.MapGroup("/orders")</code> gives <code>/api/v2/orders/…</code>. Outer-group metadata accumulates — each nesting level adds to the inherited set.',
        'Groups apply <em>endpoint metadata</em>, not middleware. Authorization checks, rate-limiting policies, and CORS policies are attached as metadata via the endpoint routing system — they run in the middleware pipeline only when the endpoint is matched.',
        'Individual endpoints inside a group can <em>override</em> group-level metadata: a group may <code>.RequireAuthorization()</code> while a specific child calls <code>.AllowAnonymous()</code> to make only that endpoint public.',
        'Extract group setup into extension methods (<code>static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder r)</code>) called from <code>Program.cs</code>. This scales to large projects with hundreds of endpoints without turning <code>Program.cs</code> into a 2000-line file.',
      ],
    },
    {
      heading: 'Endpoint Filters',
      points: [
        '<code>IEndpointFilter</code> wraps a handler (or a chain of handlers) in a before/after hook. Code before <code>await next(ctx)</code> runs before the handler; code after the <code>await</code> runs after the handler returns. Return early from the filter to short-circuit the handler entirely.',
        'Chain multiple filters with multiple <code>.AddEndpointFilter()</code> calls — the first registered is the outermost. Execution order: filter 1 before → filter 2 before → handler → filter 2 after → filter 1 after.',
        'Access the handler\'s bound parameters inside a filter with <code>ctx.GetArgument&lt;T&gt;(index)</code> where index is the parameter position in the handler signature. This enables pre-validation of specific bound objects without re-binding the request.',
        'Prefer endpoint filters over middleware for cross-cutting concerns that are <em>endpoint-specific</em> (per-route validation, idempotency keys, per-group audit logging). Use middleware for app-wide concerns (request logging, exception handling, authentication).',
        'Use <code>.AddEndpointFilterFactory()</code> for filters that need DI constructor injection: the factory receives an <code>EndpointFilterFactoryContext</code> with access to <code>IServiceProvider</code> to resolve dependencies.',
      ],
    },
    {
      heading: 'OpenAPI metadata and handler organisation',
      points: [
        'Enrich the OpenAPI document with fluent metadata: <code>.WithSummary("Short description")</code>, <code>.WithDescription("Long description")</code>, <code>.Produces&lt;Product&gt;(200)</code>, <code>.ProducesProblem(404)</code>, <code>.WithOpenApi(op => { op.Deprecated = true; return op; })</code>.',
        'Name endpoints with <code>.WithName("GetProduct")</code> to enable URL generation via <code>LinkGenerator.GetPathByName("GetProduct", new { id })</code> — equivalent to <code>CreatedAtAction()</code> in controllers and required for the <code>Location</code> header in 201 Created responses.',
        'For large projects, move handlers into static extension methods on <code>IEndpointRouteBuilder</code>: <code>app.MapProductEndpoints()</code>. Each feature area gets its own file. <code>Program.cs</code> remains a clean list of feature registrations.',
        'Keep handlers as <code>static</code> methods to avoid accidental state capture and enable the source generator to verify parameter binding at build time. Instance methods work but cannot benefit from compile-time parameter binding analysis.',
        'Register OpenAPI in .NET 9+ with <code>builder.Services.AddOpenApi()</code> and serve via <code>app.MapOpenApi()</code>. For older versions, use Swashbuckle (<code>AddSwaggerGen</code> + <code>UseSwagger</code>) or Scalar with the <code>Scalar.AspNetCore</code> package.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Map*',
      language: 'csharp',
      code: `var app = builder.Build();

app.MapGet("/hello", () => "Hello, World!");

app.MapGet("/items/{id:int}", (int id) =>
    id > 0 ? Results.Ok(new { id }) : Results.BadRequest());

app.MapPost("/items", (CreateItemDto dto) =>
{
    var item = new Item(Guid.NewGuid(), dto.Name);
    return TypedResults.Created(\$"/items/{item.Id}", item);
});

app.MapDelete("/items/{id:guid}", (Guid id) =>
    TypedResults.NoContent());

app.Run();

record Item(Guid Id, string Name);
record CreateItemDto(string Name);`,
    },
    {
      label: 'TypedResults',
      language: 'csharp',
      code: `// Compile-time checked — OpenAPI sees all response shapes
app.MapGet("/users/{id:int}",
    async Task<Results<Ok<User>, NotFound>> (int id, IUserRepo repo) =>
    {
        var user = await repo.FindAsync(id);
        return user is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(user);
    });

// vs IResult (less type-safe — OpenAPI cannot infer T)
app.MapGet("/users/{id:int}", async (int id, IUserRepo repo) =>
{
    var user = await repo.FindAsync(id);
    return user is null ? Results.NotFound() : Results.Ok(user);
});`,
    },
    {
      label: 'Route Groups',
      language: 'csharp',
      code: `var api = app.MapGroup("/api/v1").WithOpenApi();

var products = api.MapGroup("/products")
    .WithTags("Products")
    .RequireAuthorization();

products.MapGet("/",            GetAllProducts);
products.MapGet("/{id:int}",    GetProduct);
products.MapPost("/",           CreateProduct);
products.MapPut("/{id:int}",    UpdateProduct);
products.MapDelete("/{id:int}", DeleteProduct);`,
    },
    {
      label: 'Endpoint Filters',
      language: 'csharp',
      code: `// Inline filter — validate before handler
app.MapPost("/orders", CreateOrder)
   .AddEndpointFilter(async (ctx, next) =>
   {
       var dto = ctx.GetArgument<CreateOrderDto>(0);
       if (dto.Quantity <= 0)
           return Results.BadRequest("Quantity must be positive");
       return await next(ctx);
   });

// Typed reusable filter
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var arg = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (arg is null) return Results.BadRequest("Missing body");
        var errors = new List<ValidationResult>();
        if (!Validator.TryValidateObject(arg, new ValidationContext(arg), errors, true))
            return Results.ValidationProblem(
                errors.GroupBy(e => e.MemberNames.FirstOrDefault() ?? "")
                      .ToDictionary(g => g.Key,
                          g => g.Select(e => e.ErrorMessage!).ToArray()));
        return await next(ctx);
    }
}`,
    },
    {
      label: 'Organised Handlers',
      language: 'csharp',
      code: `// Program.cs
var app = builder.Build();
app.MapProductEndpoints().MapOrderEndpoints();
app.Run();

// Extensions/ProductEndpoints.cs
public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(
        this IEndpointRouteBuilder routes)
    {
        var g = routes.MapGroup("/products").WithTags("Products");
        g.MapGet("/",        GetAll).WithSummary("List products");
        g.MapGet("/{id}",    GetById);
        g.MapPost("/",       Create).RequireAuthorization();
        g.MapDelete("/{id}", Delete).RequireAuthorization();
        return routes;
    }

    static async Task<Ok<IEnumerable<Product>>> GetAll(IProductService s)
        => TypedResults.Ok(await s.GetAllAsync());

    static async Task<Results<Ok<Product>, NotFound>> GetById(
        int id, IProductService s)
    {
        var p = await s.FindAsync(id);
        return p is null ? TypedResults.NotFound() : TypedResults.Ok(p);
    }

    static async Task<Created<Product>> Create(
        CreateProductDto dto, IProductService s)
    {
        var p = await s.CreateAsync(dto);
        return TypedResults.Created(\$"/products/{p.Id}", p);
    }
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Notes Minimal API',
    language: 'csharp',
    description: 'Build a minimal API for a notes app using MapGroup("/notes"): GET / returns all notes, GET /{id:guid} returns one note or 404, POST / creates a note and returns 201 Created, DELETE /{id:guid} deletes a note and returns 204 or 404. Use TypedResults and Results<T1,T2> return types. Store notes in a static in-memory list.',
    hints: [
      'app.MapGroup("/notes") returns a RouteGroupBuilder',
      'TypedResults.Created($"/notes/{note.Id}", note) returns 201 with Location header',
      'Results<Ok<Note>, NotFound> declares both outcomes for a GET-by-id endpoint',
      'Use Guid.NewGuid() for generated IDs',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var notes = app.MapGroup("/notes").WithTags("Notes");

// TODO: GET /notes
// TODO: GET /notes/{id:guid}
// TODO: POST /notes
// TODO: DELETE /notes/{id:guid}

app.Run();

record Note(Guid Id, string Title, string Body);
record CreateNoteDto(string Title, string Body);`,
    solution: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var store = new List<Note>();
var notes = app.MapGroup("/notes").WithTags("Notes");

notes.MapGet("/", () => TypedResults.Ok(store));

notes.MapGet("/{id:guid}", (Guid id) =>
{
    var note = store.FirstOrDefault(n => n.Id == id);
    return note is null
        ? (Results<Ok<Note>, NotFound>)TypedResults.NotFound()
        : TypedResults.Ok(note);
});

notes.MapPost("/", (CreateNoteDto dto) =>
{
    var note = new Note(Guid.NewGuid(), dto.Title, dto.Body);
    store.Add(note);
    return TypedResults.Created(\$"/notes/{note.Id}", note);
});

notes.MapDelete("/{id:guid}", (Guid id) =>
{
    var note = store.FirstOrDefault(n => n.Id == id);
    if (note is null) return (Results<NoContent, NotFound>)TypedResults.NotFound();
    store.Remove(note);
    return TypedResults.NoContent();
});

app.Run();

record Note(Guid Id, string Title, string Body);
record CreateNoteDto(string Title, string Body);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which method shares a URL prefix and metadata across multiple minimal API endpoints?',
      options: ['app.UseRouting()', 'app.MapGroup()', 'app.UseEndpoints()', 'RouteBuilder.Map()'],
      answer: 1,
      explanation: 'app.MapGroup() returns a RouteGroupBuilder. All Map* calls on that builder inherit the prefix, tags, auth requirements, and filters you attach to the group.',
    },
    {
      q: 'What advantage does TypedResults.Ok<T>() have over Results.Ok()?',
      options: [
        'TypedResults is faster at runtime',
        'TypedResults allows returning XML',
        'TypedResults encodes the response type so OpenAPI generators can discover it at compile time',
        'TypedResults supports async operations',
      ],
      answer: 2,
      explanation: 'TypedResults returns concrete generic types (Ok<T>) rather than IResult. OpenAPI source generators can inspect these and generate accurate schema without [ProducesResponseType] attributes.',
    },
    {
      q: 'When does code in an IEndpointFilter after "await next(ctx)" run?',
      options: ['Never', 'Before the handler', 'After the handler returns a result', 'Only when an exception is thrown'],
      answer: 2,
      explanation: 'Filters wrap the handler like middleware. "await next(ctx)" calls the next filter or the handler. Code after that line runs after the handler has returned.',
    },
    {
      q: 'Which method chains on MapGroup() to add OpenAPI tags?',
      options: ['.AddTags()', '.Tag()', '.WithTags()', '.SetTags()'],
      answer: 2,
      explanation: '.WithTags() is the extension method on RouteGroupBuilder and RouteHandlerBuilder that sets the OpenAPI tag(s) for endpoints.',
    },
    {
      q: 'Minimal APIs and controllers can coexist in the same ASP.NET Core application.',
      options: ['True — both use the same endpoint routing engine', 'False — you must choose one', 'True, but only in .NET 8+', 'False — middleware conflicts prevent coexistence'],
      answer: 0,
      explanation: 'Both are built on top of endpoint routing. You can call builder.Services.AddControllers() and app.MapControllers() alongside app.MapGet() etc. in the same app.',
    },
    {
      q: 'A handler has signature (int id, IProductService svc). Where does "svc" bind from?',
      options: [
        'From the request query string (?svc=...)',
        'From the request body (JSON)',
        'From the DI container — service types are resolved automatically without [FromServices]',
        'It causes an AmbiguousMatchException because the binding source is unclear',
      ],
      answer: 2,
      explanation: 'In .NET 7+, minimal API parameter binding infers the source for known DI service types: if a parameter type is registered in the DI container it is resolved from the container automatically — no <code>[FromServices]</code> attribute required. Route, query, and body binding only apply to types that are not registered services.',
    },
    {
      q: 'What does calling .AllowAnonymous() on one endpoint inside a group that has .RequireAuthorization() do?',
      options: [
        'It disables authorization for the entire group',
        'It causes a startup exception — you cannot mix auth and anonymous in one group',
        'It exempts only that specific endpoint from the group-level authorization requirement',
        'It has no effect — group-level auth always takes precedence',
      ],
      answer: 2,
      explanation: '<code>AllowAnonymous()</code> adds an endpoint-level metadata marker that overrides the group-level <code>RequireAuthorization()</code> for that endpoint only. The authorization middleware reads the endpoint metadata and skips the auth check when it finds <code>AllowAnonymous</code>. All other endpoints in the group remain protected.',
    },
    {
      q: 'In an endpoint filter, what happens when you return a result WITHOUT calling "await next(ctx)"?',
      options: [
        'The handler executes and then the filter result is discarded',
        'The request short-circuits — the handler never executes and the filter result becomes the response',
        'An InvalidOperationException is thrown because next() must always be called',
        'The result is queued and executed after the handler finishes',
      ],
      answer: 1,
      explanation: 'Returning early from an endpoint filter (without calling <code>next</code>) short-circuits the pipeline — the handler never runs and the filter\'s return value becomes the HTTP response. This is the mechanism for request validation filters: inspect the request, and if invalid, return <code>Results.BadRequest()</code> immediately without ever invoking the handler.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do minimal APIs support model validation automatically?',
      a: 'Not out of the box. Unlike [ApiController] controllers, minimal APIs do not automatically validate DataAnnotations. Add an endpoint filter that calls Validator.TryValidateObject(), use FluentValidation with its minimal-API integration, or use .NET 9\'s built-in AddValidation().',
    },
    {
      q: 'How do I bind a request body in a minimal API handler?',
      a: 'Declare a parameter of the expected type — ASP.NET Core infers [FromBody] for complex types. Primitive types are bound from route or query string. Use [FromQuery], [FromRoute], [FromHeader], [FromServices], or [FromBody] explicitly when the inference is ambiguous.',
    },
    {
      q: 'Can I use MVC action filters (IActionFilter) in minimal APIs?',
      a: 'No. IActionFilter is an MVC concept. Use IEndpointFilter instead — it has a similar before/after hook model and works at the endpoint routing layer.',
    },
    {
      q: 'How do I handle exceptions in minimal APIs?',
      a: 'Use app.UseExceptionHandler() or register an IExceptionHandler (.NET 8+). These are the same mechanisms as controllers. You can also add an endpoint filter that catches exceptions per-group.',
    },
    {
      q: 'Does MapGroup() support middleware?',
      a: 'No. MapGroup() supports endpoint filters, metadata (auth, rate-limiting, CORS, OpenAPI). Middleware applies to the entire request pipeline regardless of which endpoint matches.',
    },
    {
      q: 'How do I generate a URL to a named minimal API endpoint?',
      a: 'Name the endpoint with .WithName("EndpointName"), then inject LinkGenerator and call linkGenerator.GetPathByName("EndpointName", new { id = 1 }). Equivalent to CreatedAtAction in controllers.',
    },
    {
      q: 'How does automatic model validation work in minimal APIs compared to [ApiController] controllers?',
      a: 'Unlike <code>[ApiController]</code>, minimal APIs do NOT automatically validate DataAnnotations or return 400 on invalid input — there is no built-in equivalent of the automatic ModelState check. You must add validation yourself: either write an endpoint filter using <code>Validator.TryValidateObject()</code>, use FluentValidation\'s minimal-API integration, or in .NET 9+ add the built-in <code>builder.Services.AddValidation()</code> with the corresponding endpoint filter. Always validate at the boundary.',
    },
    {
      q: 'What is the difference between endpoint filters (.AddEndpointFilter) and middleware (app.Use)?',
      a: '<strong>Middleware</strong> runs for every request in the pipeline, before the endpoint is matched — it cannot inspect which endpoint was selected or access bound parameters. <strong>Endpoint filters</strong> run <em>after</em> routing and model binding, with access to the matched endpoint\'s bound parameters via <code>ctx.GetArgument&lt;T&gt;()</code>. Use middleware for app-wide concerns (HTTPS redirect, CORS preflight, authentication); use endpoint filters for per-endpoint or per-group concerns (per-route validation, idempotency, group-specific rate limiting).',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Results.Ok() instead of TypedResults.Ok() — losing OpenAPI type information',
      wrong: `// BAD: IResult return type — OpenAPI generator cannot infer the response schema
app.MapGet("/products/{id:int}", async (int id, IProductRepo repo) =>
{
    var p = await repo.FindAsync(id);
    return p is null ? Results.NotFound() : Results.Ok(p);   // IResult — schema lost
});`,
      right: `// GOOD: TypedResults with Results<T1,T2> — compiler and OpenAPI both know all outcomes
app.MapGet("/products/{id:int}",
    async Task<Results<Ok<Product>, NotFound>> (int id, IProductRepo repo) =>
    {
        var p = await repo.FindAsync(id);
        return p is null ? TypedResults.NotFound() : TypedResults.Ok(p);
    });`,
      explanation: 'Results.Ok() returns IResult — the OpenAPI source generator sees no schema information. TypedResults.Ok<Product>() returns a concrete Ok<Product> that generators can inspect at compile time, producing accurate response schemas without needing [ProducesResponseType] attributes. Zero runtime difference; significant documentation difference.',
    },
    {
      title: 'Bloating Program.cs with all handlers inline',
      wrong: `// BAD: hundreds of handler lambdas inline in Program.cs
app.MapGet("/products", async (IProductRepo repo) => await repo.GetAllAsync());
app.MapGet("/products/{id}", async (int id, IProductRepo repo) => ...);
app.MapPost("/products", async (CreateProductDto dto, IProductRepo repo) => ...);
// ... 50 more lines of endpoint registrations in one file`,
      right: `// GOOD: extract to extension methods per feature
app.MapProductEndpoints();
app.MapOrderEndpoints();
app.MapUserEndpoints();

// ProductEndpoints.cs
public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder r)
    {
        var g = r.MapGroup("/products").WithTags("Products");
        g.MapGet("/",         GetAll);
        g.MapGet("/{id:int}", GetById);
        g.MapPost("/",        Create).RequireAuthorization();
        return r;
    }
    static async Task<Ok<IEnumerable<Product>>> GetAll(IProductRepo repo) => ...;
}`,
      explanation: 'Inline lambdas in Program.cs are fine for a handful of endpoints but become unnavigable for real APIs. Move handlers into static extension methods on IEndpointRouteBuilder, one file per feature area. Program.cs becomes a clean list of MapXxxEndpoints() calls, and each feature is independently readable and testable.',
    },
    {
      title: 'Missing validation — minimal APIs have no automatic [ApiController] equivalent',
      wrong: `// BAD: no validation — invalid CreateProductDto reaches the handler silently
app.MapPost("/products", (CreateProductDto dto, IProductRepo repo) =>
    repo.CreateAsync(dto));  // dto.Name could be null, Price could be -1`,
      right: `// GOOD: add an endpoint filter for DataAnnotations validation
app.MapPost("/products", (CreateProductDto dto, IProductRepo repo) =>
    repo.CreateAsync(dto))
   .AddEndpointFilter<ValidationFilter<CreateProductDto>>();

// Or .NET 9+: builder.Services.AddValidation() + .WithParameterValidation() on the endpoint`,
      explanation: 'Unlike controllers with [ApiController], minimal API endpoints do not validate DataAnnotations automatically. An invalid request body reaches the handler without any check. Always add a validation filter, use FluentValidation integration, or the .NET 9 built-in validation API — never assume the incoming DTO is valid.',
    },
    {
      title: 'Forgetting .WithName() when returning 201 Created with a Location header',
      wrong: `app.MapPost("/products", (CreateProductDto dto) =>
{
    var product = Create(dto);
    // BAD: hard-coded URL — breaks if the GET route changes
    return TypedResults.Created(\$"/products/{product.Id}", product);
});`,
      right: `app.MapGet("/products/{id:int}", (int id) => Get(id))
   .WithName("GetProduct");

app.MapPost("/products", (CreateProductDto dto, LinkGenerator links, HttpContext ctx) =>
{
    var product = Create(dto);
    // GOOD: URL generated from the named endpoint
    var url = links.GetPathByName("GetProduct", new { id = product.Id });
    return TypedResults.Created(url, product);
});`,
      explanation: 'Hard-coding the URI in TypedResults.Created() works until the GET route is renamed or versioned — the Location header then points to a 404 with no compile-time warning. WithName() + LinkGenerator generates the URL from the live route table, remaining correct through refactoring.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Minimal APIs register endpoints directly on WebApplication with map.MapGet/Post/Put/Delete — use TypedResults and Results<T1,T2> for compile-time OpenAPI correctness, MapGroup for shared prefix and metadata, and endpoint filters for per-route cross-cutting concerns.',
    mustKnow: [
      '<code>app.MapGet/Post/Put/Delete(route, handler)</code> — handler parameters auto-bind from route, query, body, or DI',
      '<code>TypedResults.Ok&lt;T&gt;()</code> over <code>Results.Ok()</code> — exposes response schema to OpenAPI generators at compile time',
      '<code>Results&lt;Ok&lt;T&gt;, NotFound&gt;</code> return type — compiler enforces all declared outcomes are returned',
      '<code>app.MapGroup("/prefix")</code> — inherits prefix, tags, auth, rate-limiting, filters; individual endpoints can override with <code>.AllowAnonymous()</code>',
      'Endpoint filters: before-handler (validate) → <code>await next(ctx)</code> → after-handler; short-circuit by returning without calling next',
      'No automatic model validation unlike <code>[ApiController]</code> — must add a filter, FluentValidation, or .NET 9 <code>AddValidation()</code>',
      '<code>.WithName("X")</code> + <code>LinkGenerator.GetPathByName("X", values)</code> — route-rename-safe URL generation for Location headers',
    ],
    interviewFocus: [
      'When would you choose minimal APIs over controllers?',
      'What is the difference between TypedResults and Results? Why does it matter?',
      'How do endpoint filters differ from middleware?',
      'How does MapGroup() help with auth and OpenAPI — and how do you exempt one endpoint from group auth?',
      'How do you add model validation to minimal API endpoints?',
    ],
  };
}
