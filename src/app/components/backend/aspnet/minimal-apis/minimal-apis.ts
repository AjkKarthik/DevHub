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
  selector: 'app-aspnet-minimal-apis',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './minimal-apis.html',
  styleUrl: './minimal-apis.scss',
})
export class AspnetMinimalApis {

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
      heading: 'Minimal APIs vs Controllers',
      points: [
        'Minimal APIs register endpoints directly on <code>WebApplication</code> — no controller class, no attributes, less ceremony. Both use the same endpoint routing engine and can coexist in one app.',
        'Choose <strong>minimal APIs</strong> for microservices, small APIs, cloud functions, or when you want full control. Choose <strong>controllers</strong> for large teams, complex routing hierarchies, and shared action filters.',
        'DI injection works the same: declare a parameter of the service type and ASP.NET Core resolves it from the container. Simple types are bound from route/query; complex types from body.',
      ],
    },
    {
      heading: 'TypedResults',
      points: [
        '<code>TypedResults</code> returns concrete generic types (<code>Ok&lt;T&gt;</code>, <code>NotFound</code>, <code>Created&lt;T&gt;</code>) instead of the base <code>IResult</code>. OpenAPI generators can discover response shapes at compile time without <code>[ProducesResponseType]</code>.',
        'Use <code>Results&lt;T1, T2, …&gt;</code> as the handler return type to declare all possible outcomes. The compiler enforces that every code path returns one of the declared types.',
        'Prefer <code>TypedResults</code> over <code>Results</code> for new code — the difference is purely compile-time typing and OpenAPI generation, with no runtime overhead.',
      ],
    },
    {
      heading: 'Route Groups',
      points: [
        '<code>app.MapGroup("/prefix")</code> shares a URL prefix, tags, auth requirements, and filters across all endpoints added to it. Avoids repeating <code>.WithTags("Products").RequireAuthorization()</code> on every endpoint.',
        'Nest groups inside each other for hierarchical prefixes. Filters added to an outer group run before filters of inner groups.',
        'Groups apply endpoint metadata — not middleware. Authorization, rate limiting, CORS, and OpenAPI tags are all set via metadata, not middleware calls.',
      ],
    },
    {
      heading: 'Endpoint Filters',
      points: [
        '<code>IEndpointFilter</code> wraps the handler in a before/after hook. Code before <code>await next(ctx)</code> runs before the handler; code after runs after.',
        'Chain multiple filters with multiple <code>.AddEndpointFilter()</code> calls — first added = outermost. Use <code>ctx.GetArgument&lt;T&gt;(index)</code> to access bound parameters inside the filter.',
        'Prefer endpoint filters over middleware for concerns specific to a group (validation, idempotency, per-endpoint logging). Use middleware for app-wide concerns.',
      ],
    },
    {
      heading: 'OpenAPI Metadata & Handler Organisation',
      points: [
        'Decorate endpoints with <code>.WithSummary()</code>, <code>.WithDescription()</code>, <code>.Produces&lt;T&gt;()</code>, and <code>.ProducesProblem()</code> to enrich the generated OpenAPI document.',
        'For large projects, move handlers into static extension methods on <code>IEndpointRouteBuilder</code>: <code>app.MapProductEndpoints()</code>. This keeps <code>Program.cs</code> readable without the overhead of controllers.',
        'Name endpoints with <code>.WithName("EndpointName")</code> then use <code>LinkGenerator.GetPathByName()</code> to generate URLs — equivalent to <code>CreatedAtAction()</code> in controllers.',
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
  ];
}
