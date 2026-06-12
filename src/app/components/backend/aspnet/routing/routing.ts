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
  selector: 'app-aspnet-routing',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './routing.html',
  styleUrl: './routing.scss',
})
export class AspnetRouting {

  quickRef: QuickRefItem[] = [
    { name: 'app.MapGet(pattern, handler)',   type: 'method',  desc: 'Registers a GET endpoint for the given route pattern', since: '.NET 6+' },
    { name: 'app.MapPost / Put / Delete',     type: 'method',  desc: 'Same as MapGet for other HTTP verbs; MapMethods() for multiple at once', since: '.NET 6+' },
    { name: '{id:int}',                       type: 'constraint', desc: 'Route constraint — only matches if segment is parseable as int', since: 'Core 1+' },
    { name: '{slug:regex(^[a-z-]+$)}',        type: 'constraint', desc: 'Regex constraint on a route segment', since: 'Core 1+' },
    { name: '{name?}',                        type: 'syntax',  desc: 'Optional route parameter — omitted segment sets parameter to null', since: 'Core 1+' },
    { name: '{**rest}',                       type: 'syntax',  desc: 'Catch-all parameter that matches the remainder of the path including slashes', since: 'Core 1+' },
    { name: 'app.MapGroup(prefix)',           type: 'method',  desc: 'Groups endpoints under a shared path prefix and shared filters/metadata', since: '.NET 7+' },
    { name: '[Route] / [HttpGet]',            type: 'decorator', desc: 'Attribute routing on controllers; [HttpGet("{id}")] overrides class-level [Route]', since: 'Core 1+' },
    { name: 'LinkGenerator',                  type: 'class',   desc: 'DI service that generates URLs for named endpoints without hard-coded strings', since: 'Core 2.2+' },
    { name: '.WithName("endpoint-name")',     type: 'method',  desc: 'Assigns a name to a minimal-API endpoint for link generation and OpenAPI', since: '.NET 6+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Endpoint routing — how it works',
      points: [
        'ASP.NET Core uses <strong>endpoint routing</strong> since .NET Core 3. Route matching happens in two stages: <code>UseRouting()</code> matches the URL to a registered endpoint and stores it on <code>HttpContext</code>; <code>UseEndpoints()</code> (or the implicit terminal middleware in .NET 6+) executes it.',
        'This two-stage model lets middleware inspect the matched endpoint — including its metadata (auth policies, CORS policies, rate-limit policies) — <em>before</em> execution. That is why auth middleware goes between routing and execution.',
        'In .NET 6+ minimal APIs, calling <code>app.MapGet()</code> automatically registers both stages, so you rarely need explicit <code>UseRouting()</code>/<code>UseEndpoints()</code> calls.',
        'An endpoint is anything with a route and a handler: minimal-API lambdas, controller actions, Razor Pages, SignalR hubs, and gRPC services all participate in the same endpoint routing table.',
      ],
    },
    {
      heading: 'Route templates and constraints',
      points: [
        'Route templates mix literals and parameters: <code>/products/{id}/reviews/{page}</code>. Parameters are surrounded by braces; the router extracts values from matching URLs and makes them available as route values.',
        '<strong>Constraints</strong> narrow matching: <code>{id:int}</code> only matches integer segments; <code>{code:length(3)}</code> matches exactly 3-char strings; <code>{price:decimal:min(0)}</code> chains constraints. Unmatched constraints move to the next route.',
        'Built-in constraints: <code>int</code>, <code>long</code>, <code>double</code>, <code>bool</code>, <code>guid</code>, <code>datetime</code>, <code>alpha</code>, <code>minlength(n)</code>, <code>maxlength(n)</code>, <code>length(n)</code>, <code>min(n)</code>, <code>max(n)</code>, <code>range(min,max)</code>, <code>regex(expr)</code>.',
        '<strong>Optional parameters</strong> end with <code>?</code>: <code>{name?}</code>. <strong>Default values</strong> use <code>=</code>: <code>{page=1}</code>. <strong>Catch-alls</strong> use <code>**</code>: <code>{**path}</code> matches the rest of the URL including slashes.',
      ],
    },
    {
      heading: 'MapGroup — shared prefix and shared behaviour',
      points: [
        '<code>app.MapGroup("/api/v1")</code> returns a <code>RouteGroupBuilder</code>. All endpoints mapped on it inherit the prefix — no need to repeat it on every route.',
        'Groups also inherit metadata: call <code>.RequireAuthorization()</code>, <code>.RequireCors()</code>, <code>.AddEndpointFilter()</code>, or <code>.WithOpenApi()</code> once on the group and all children share it.',
        'Groups are composable: you can call a separate method that receives the group and adds its own endpoints, keeping Program.cs tidy for large APIs.',
        'Nesting groups is supported: <code>var v2 = app.MapGroup("/api/v2"); var orders = v2.MapGroup("/orders");</code> gives <code>/api/v2/orders/…</code>.',
      ],
    },
    {
      heading: 'Attribute routing on controllers',
      points: [
        'Controller classes decorated with <code>[ApiController]</code> use <strong>attribute routing</strong>. Apply <code>[Route("api/[controller]")]</code> at the class level; action-level attributes like <code>[HttpGet("{id}")]</code> append to the class prefix.',
        '<code>[controller]</code> is a token replaced at startup with the controller name (minus the "Controller" suffix). <code>[action]</code> similarly inserts the action method name.',
        'Attribute routes take precedence over conventional routes. Multiple route attributes on one action create multiple routes to the same handler.',
        'Conventional routing (<code>app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}")</code>) is the MVC-style alternative. It is order-sensitive: first match wins. Attribute routing is preferred for API controllers.',
      ],
    },
    {
      heading: 'Link generation and named endpoints',
      points: [
        'Hard-coding URLs in your app is fragile. ASP.NET Core\'s <code>LinkGenerator</code> service generates URLs from endpoint names and route values — if you rename a route, links update automatically.',
        'Name a minimal-API endpoint: <code>app.MapGet("/orders/{id}", ...).WithName("GetOrder")</code>. Then generate its URL: <code>linkGen.GetPathByName("GetOrder", new { id = 42 })</code> → <code>/orders/42</code>.',
        'In controllers, <code>Url.Action("ActionName", "ControllerName", new { id = 42 })</code> does the same via the <code>IUrlHelper</code> injected into the controller.',
        'Named routes / endpoints are also what typed HTTP clients (Kiota, NSwag) use to reference operations in generated code, and what the OpenAPI document references as <code>operationId</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Minimal API Routes',
      language: 'csharp',
      code: `// ── Basic CRUD with minimal APIs ─────────────────────────────────────
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Parameter binding from route, query, body is automatic
app.MapGet("/products",
    ([AsParameters] ProductQuery q, IProductService svc) =>
        svc.List(q.Category, q.Page));

app.MapGet("/products/{id:int}",
    (int id, IProductService svc) =>
        svc.FindById(id) is { } p ? Results.Ok(p) : Results.NotFound());

app.MapPost("/products",
    (CreateProductRequest req, IProductService svc) =>
    {
        var product = svc.Create(req);
        return Results.CreatedAtRoute("GetProduct", new { id = product.Id }, product);
    });

app.MapGet("/products/{id:int}", (int id) => { /* ... */ })
   .WithName("GetProduct");              // named endpoint for CreatedAtRoute

app.MapPut("/products/{id:int}",
    (int id, UpdateProductRequest req, IProductService svc) =>
        svc.Update(id, req) ? Results.NoContent() : Results.NotFound());

app.MapDelete("/products/{id:int}",
    (int id, IProductService svc) =>
        svc.Delete(id) ? Results.NoContent() : Results.NotFound());

app.Run();

// ── Parameter sources ─────────────────────────────────────────────────
// int id           → from route segment {id}
// string? category → from query string ?category=...
// [FromBody] T req → from request body (JSON)
// [FromHeader] string key → from request header
// [FromServices] ISvc s → resolved from DI (can omit [FromServices] in .NET 7+)`,
    },
    {
      label: 'Route Constraints',
      language: 'csharp',
      code: `// ── Built-in constraints ─────────────────────────────────────────────
app.MapGet("/orders/{id:int}",       (int id)    => \$"Order {id}");
app.MapGet("/orders/{code:guid}",    (Guid code) => \$"Order {code}");
app.MapGet("/users/{name:alpha}",    (string name) => \$"User {name}");
app.MapGet("/files/{name:minlength(3)}", (string name) => \$"File {name}");

// Chained constraints — ALL must pass
app.MapGet("/scores/{value:int:range(0,100)}", (int value) => \$"Score {value}");

// Regex constraint
app.MapGet("/slugs/{slug:regex(^[a-z0-9-]+$)}", (string slug) => \$"Slug {slug}");

// ── Optional and default parameters ──────────────────────────────────
// {page?}  — optional; null if absent from URL
app.MapGet("/articles/{category}/{page:int?}",
    (string category, int? page) => \$"Category {category}, page {page ?? 1}");

// {sort=name}  — has default; "name" if absent
app.MapGet("/items/{sort=name}",
    (string sort) => \$"Sorted by {sort}");

// ── Catch-all ─────────────────────────────────────────────────────────
// Matches /files/docs/2024/report.pdf
app.MapGet("/files/{**path}", (string path) => \$"File path: {path}");

// ── Precedence — more specific routes registered first ────────────────
app.MapGet("/users/me",          () => "current user");   // more specific
app.MapGet("/users/{id:int}",    (int id) => \$"user {id}");`,
    },
    {
      label: 'MapGroup',
      language: 'csharp',
      code: `// ── Group endpoints under a shared prefix ────────────────────────────
var api = app.MapGroup("/api/v1")
             .WithOpenApi()
             .RequireAuthorization();    // all child endpoints require auth

// Products sub-group — adds /api/v1/products prefix
var products = api.MapGroup("/products");
products.MapGet("/",        ProductHandlers.List);
products.MapGet("/{id:int}", ProductHandlers.Get).WithName("GetProduct");
products.MapPost("/",       ProductHandlers.Create);
products.MapPut("/{id:int}", ProductHandlers.Update);
products.MapDelete("/{id:int}", ProductHandlers.Delete);

// Orders sub-group — /api/v1/orders, allows anonymous for listing
var orders = api.MapGroup("/orders");
orders.MapGet("/", OrderHandlers.List).AllowAnonymous();
orders.MapGet("/{id:int}", OrderHandlers.Get);
orders.MapPost("/", OrderHandlers.Create);

// ── Separate method to keep Program.cs clean ─────────────────────────
static void MapProductEndpoints(RouteGroupBuilder group)
{
    group.MapGet("/",        ProductHandlers.List);
    group.MapGet("/{id:int}", ProductHandlers.Get);
    // ...
}

api.MapGroup("/products").Apply(MapProductEndpoints);

// Extension method pattern
static RouteGroupBuilder Apply(this RouteGroupBuilder group,
    Action<RouteGroupBuilder> configure) { configure(group); return group; }`,
    },
    {
      label: 'Controller Routing',
      language: 'csharp',
      code: `// ── Attribute routing on controllers ─────────────────────────────────
[ApiController]
[Route("api/[controller]")]             // token: expands to "api/Products"
public class ProductsController : ControllerBase
{
    // GET api/products
    [HttpGet]
    public IActionResult GetAll() => Ok(_svc.List());

    // GET api/products/42
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        var p = _svc.FindById(id);
        return p is null ? NotFound() : Ok(p);
    }

    // POST api/products
    [HttpPost]
    public IActionResult Create([FromBody] CreateProductRequest req)
    {
        var product = _svc.Create(req);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    // PUT api/products/42
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] UpdateProductRequest req)
        => _svc.Update(id, req) ? NoContent() : NotFound();

    // DELETE api/products/42
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
        => _svc.Delete(id) ? NoContent() : NotFound();

    // Multiple routes to the same action
    [HttpGet("{id:int}")]
    [HttpGet("by-id/{id:int}")]   // also reachable via /api/products/by-id/42
    public IActionResult Alias(int id) => Ok(_svc.FindById(id));
}

// Register controller routing
app.MapControllers();`,
    },
  ];

  challenge: Challenge = {
    title: 'Versioned API with MapGroup',
    language: 'csharp',
    description: `Build a minimal API with two route groups:
1. <code>/api/v1/todos</code> — GET returns a static list; POST creates a todo stored in a shared in-memory list.
2. <code>/api/v2/todos</code> — GET returns the same list but each item includes a <code>createdAt</code> timestamp.
Both groups require an <code>X-Api-Key: devhub</code> header (enforce via an endpoint filter on each group).
Add a <code>GET /api/v1/todos/{id:int}</code> that returns 404 if not found.`,
    hints: [
      'Use app.MapGroup("/api/v1/todos") and app.MapGroup("/api/v2/todos")',
      'An endpoint filter: group.AddEndpointFilter(async (ctx, next) => { check header; await next(ctx); })',
      'Store todos in a List<Todo> registered as a singleton in DI',
      'V2 can project the list to include CreatedAt by mapping the same Todo with a new anonymous type',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<List<Todo>>();
var app = builder.Build();

// TODO: create /api/v1/todos group with X-Api-Key filter
// TODO: GET / returns list
// TODO: GET /{id:int} returns single or 404
// TODO: POST / creates a todo

// TODO: create /api/v2/todos group with X-Api-Key filter
// TODO: GET / returns list with createdAt timestamp

app.Run();

public record Todo(int Id, string Title, bool Done, DateTime CreatedAt);`,
    solution: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(new List<Todo>
{
    new(1, "Learn ASP.NET Core", false, DateTime.UtcNow.AddDays(-2)),
    new(2, "Build an API",       true,  DateTime.UtcNow.AddDays(-1)),
});
var app = builder.Build();

static EndpointFilterDelegate ApiKeyFilter(EndpointFilterFactoryContext _, EndpointFilterDelegate next)
    => async ctx =>
    {
        if (!ctx.HttpContext.Request.Headers.TryGetValue("X-Api-Key", out var key) || key != "devhub")
        {
            ctx.HttpContext.Response.StatusCode = 401;
            return Results.Unauthorized();
        }
        return await next(ctx);
    };

var v1 = app.MapGroup("/api/v1/todos").AddEndpointFilterFactory(ApiKeyFilter);

v1.MapGet("/", (List<Todo> todos) => Results.Ok(todos));

v1.MapGet("/{id:int}", (int id, List<Todo> todos) =>
    todos.FirstOrDefault(t => t.Id == id) is { } todo
        ? Results.Ok(todo) : Results.NotFound());

v1.MapPost("/", (Todo todo, List<Todo> todos) =>
{
    var newTodo = todo with { Id = todos.Count + 1, CreatedAt = DateTime.UtcNow };
    todos.Add(newTodo);
    return Results.Created(\$"/api/v1/todos/{newTodo.Id}", newTodo);
});

var v2 = app.MapGroup("/api/v2/todos").AddEndpointFilterFactory(ApiKeyFilter);

v2.MapGet("/", (List<Todo> todos) =>
    Results.Ok(todos.Select(t => new { t.Id, t.Title, t.Done, t.CreatedAt })));

app.Run();

public record Todo(int Id, string Title, bool Done, DateTime CreatedAt);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which route constraint ensures a segment matches only a valid integer?',
      options: [
        '{id:number}',
        '{id:int}',
        '{id:integer}',
        '{id:numeric}',
      ],
      answer: 1,
      explanation: '<code>{id:int}</code> is the built-in constraint that matches only segments parseable as a 32-bit integer. The router skips to the next route if the constraint fails — no 400 is returned, the route simply does not match.',
    },
    {
      q: 'What benefit does app.MapGroup() provide beyond grouping routes under a prefix?',
      options: [
        'It enables HTTP/2 for all child endpoints',
        'It allows all child endpoints to share filters, metadata (auth, CORS, OpenAPI), and middleware applied to the group',
        'It makes child endpoint handlers run in parallel',
        'It converts all child routes to attribute-based routing',
      ],
      answer: 1,
      explanation: '<code>MapGroup()</code> returns a <code>RouteGroupBuilder</code>. Calling <code>.RequireAuthorization()</code>, <code>.WithOpenApi()</code>, or <code>.AddEndpointFilter()</code> on it applies the metadata to all endpoints in the group — you write it once instead of on every <code>MapGet/Post/…</code>.',
    },
    {
      q: 'In a controller with [Route("api/[controller]")], what URL does [HttpGet("{id}")] on method GetById produce?',
      options: [
        '/api/[controller]/GetById/{id}',
        '/api/GetById/{id}',
        '/api/Products/{id}  (where "Products" is the controller name without "Controller")',
        '/api/controller/{id}',
      ],
      answer: 2,
      explanation: 'The <code>[controller]</code> token is replaced with the class name minus the "Controller" suffix. So <code>ProductsController</code> with <code>[Route("api/[controller]")]</code> gives the prefix <code>api/Products</code>. Adding <code>[HttpGet("{id}")]</code> produces <code>api/Products/{id}</code>.',
    },
    {
      q: 'What does .WithName("GetProduct") on a MapGet endpoint enable?',
      options: [
        'It makes the endpoint accessible via that name as an alternative URL',
        'It sets the endpoint name used by LinkGenerator, CreatedAtRoute, and OpenAPI operationId',
        'It registers the endpoint as a named route in the router only for controller use',
        'It restricts the endpoint to authenticated users with the role "GetProduct"',
      ],
      answer: 1,
      explanation: '<code>WithName()</code> assigns an endpoint name. You reference it in <code>Results.CreatedAtRoute("GetProduct", new { id })</code> to generate a Location header, and <code>LinkGenerator.GetPathByName("GetProduct", ...)</code> for URL generation. It also becomes the <code>operationId</code> in the OpenAPI document.',
    },
    {
      q: 'What route template segment matches the remainder of the URL including forward slashes?',
      options: [
        '{path*}',
        '{path:rest}',
        '{**path}',
        '{path:any}',
      ],
      answer: 2,
      explanation: 'The <strong>catch-all</strong> parameter uses the <code>**</code> prefix: <code>{**path}</code>. It matches everything from that point to the end of the URL, including slashes. For example, <code>/files/{**path}</code> matches <code>/files/docs/2024/report.pdf</code> with <code>path = "docs/2024/report.pdf"</code>.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does ASP.NET Core choose between two routes that could both match a URL?',
      a: 'Endpoint routing uses a precedence algorithm: literal segments outrank parameter segments, and constrained parameters outrank unconstrained ones. For example, <code>/users/me</code> (literal) wins over <code>/users/{id}</code> (parameter) for the URL <code>/users/me</code>. Among equally specific routes, the first one registered wins — so register more specific routes first.',
    },
    {
      q: 'When should I use minimal APIs versus controller-based routing?',
      a: 'Minimal APIs are ideal for microservices, serverless functions, or small focused APIs where convention over configuration is welcome and teams are small. Controllers shine for large APIs with complex action filters, content negotiation, view rendering, or teams that prefer the explicit structure. In .NET 8+ the two can coexist in one app, so you can mix them where each fits best.',
    },
    {
      q: 'Can I apply middleware to only specific routes?',
      a: 'Yes, in two ways. With <code>app.MapGroup()</code> you attach endpoint filters and metadata to a group. With <code>app.Map("/admin", branch => { branch.UseAuthentication(); ... })</code> you build a full sub-pipeline for a path prefix. For middleware that needs to run on a per-request basis based on the matched endpoint, check <code>context.GetEndpoint()?.Metadata</code> inside any middleware registered after <code>UseRouting()</code>.',
    },
    {
      q: 'What is the difference between route values, query string, and model binding?',
      a: 'Route values come from the URL path segments (e.g., <code>{id}</code>). Query strings are <code>?key=value</code> pairs appended to the URL. Model binding is the automatic conversion of both — plus headers, form fields, and the request body — into method parameters. In minimal APIs the source is inferred by position: path segments → route, simple types not in the route → query, complex types → JSON body. Use <code>[FromRoute]</code>, <code>[FromQuery]</code>, <code>[FromBody]</code> to be explicit.',
    },
    {
      q: 'How do I generate URLs for named endpoints from within a service or background task?',
      a: 'Inject <code>LinkGenerator</code> (from <code>Microsoft.AspNetCore.Routing</code>) into your service. Call <code>linkGen.GetPathByName("EndpointName", new { id = 42 })</code> to get the path, or <code>GetUriByName()</code> with an <code>HttpContext</code> to get the full URL. For background tasks where no request is active, you can inject <code>IHttpContextAccessor</code> (register it in DI) or pass the base URL from configuration.',
    },
  ];
}
