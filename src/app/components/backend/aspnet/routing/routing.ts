import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-routing',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './routing.html',
  styleUrl: './routing.scss',
})
export class AspnetRouting {

  quickRef: QuickRefItem[] = [
    { name: 'app.MapGet(pattern, handler)',   type: 'method',     desc: 'Registers a GET endpoint for the given route pattern; handler parameters are auto-bound from route, query, body, or DI.', since: '.NET 6+' },
    { name: 'app.MapPost / Put / Delete',     type: 'method',     desc: 'Same as MapGet for other HTTP verbs; MapMethods() registers multiple verbs on one handler.', since: '.NET 6+' },
    { name: '{id:int}',                       type: 'constraint', desc: 'Route constraint — only matches if segment is parseable as int. Skips to the next route if unmatched.', since: 'Core 1+' },
    { name: '{slug:regex(^[a-z-]+$)}',        type: 'constraint', desc: 'Regex constraint on a route segment. Multiple constraints chained with colons: {n:alpha:minlength(3)}.', since: 'Core 1+' },
    { name: '{name?}',                        type: 'syntax',     desc: 'Optional route parameter — omitted segment sets parameter to null. Combine with default: {page:int=1}.', since: 'Core 1+' },
    { name: '{**rest}',                       type: 'syntax',     desc: 'Catch-all parameter that matches the remainder of the path including slashes.', since: 'Core 1+' },
    { name: 'app.MapGroup(prefix)',           type: 'method',     desc: 'Groups endpoints under a shared path prefix; filters, auth, CORS, and OpenAPI metadata apply to all children.', since: '.NET 7+' },
    { name: '[Route] / [HttpGet]',            type: 'decorator',  desc: 'Attribute routing on controllers; [controller] and [action] tokens expand at startup. First attribute wins order.', since: 'Core 1+' },
    { name: 'LinkGenerator',                  type: 'class',      desc: 'DI service that generates URLs from endpoint names and route values — route-rename-safe alternative to string URLs.', since: 'Core 2.2+' },
    { name: '.WithName("endpoint-name")',     type: 'method',     desc: 'Assigns a name used by LinkGenerator, Results.CreatedAtRoute(), and OpenAPI operationId.', since: '.NET 6+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Endpoint routing — the two-stage model',
      points: [
        'ASP.NET Core uses <strong>endpoint routing</strong> since Core 3. Route matching happens in two stages: <code>UseRouting()</code> inspects the URL against all registered endpoints and stores the match result in <code>HttpContext.GetEndpointFeature()</code>; the terminal execution step (implicit in .NET 6+) then runs the matched handler.',
        'The two-stage model is what makes the middleware pipeline composable: middleware registered <em>between</em> <code>UseRouting()</code> and endpoint execution can inspect the matched endpoint — including its metadata (auth policies, CORS policies, rate-limit policies) — before the handler runs. That is why <code>UseAuthentication</code> and <code>UseAuthorization</code> sit in this window.',
        'In .NET 6+ minimal APIs, calling <code>app.MapGet()</code> implicitly registers both routing and execution, so you rarely need explicit <code>UseRouting()</code>/<code>UseEndpoints()</code> calls. But if you need middleware that reads endpoint metadata, add explicit <code>UseRouting()</code> before that middleware.',
        'An endpoint is anything with a route and a handler: minimal-API lambdas, controller actions, Razor Pages, SignalR hubs, and gRPC services all participate in the same routing table and are subject to the same middleware pipeline.',
        'You can inspect the matched endpoint from any middleware: <code>var ep = context.GetEndpoint()</code>. Its <code>Metadata</code> collection contains all attributes, policies, and <code>WithName()</code> annotations — useful for conditional middleware behaviour without hard-coded path checks.',
      ],
    },
    {
      heading: 'Route templates and constraints',
      points: [
        'Route templates mix literals and parameters: <code>/products/{id}/reviews/{page}</code>. Literal segments match exactly. Parameter segments (<code>{name}</code>) capture any non-empty, non-slash string by default and make the value available as a route value.',
        '<strong>Constraints</strong> narrow matching: <code>{id:int}</code> only matches integer segments; <code>{code:length(3)}</code> matches exactly 3-char strings; <code>{price:decimal:min(0)}</code> chains constraints with colons. A segment that fails a constraint causes the router to skip to the next candidate route — it does <em>not</em> return a 400.',
        'Built-in constraints include: <code>int</code>, <code>long</code>, <code>double</code>, <code>bool</code>, <code>guid</code>, <code>datetime</code>, <code>alpha</code>, <code>minlength(n)</code>, <code>maxlength(n)</code>, <code>length(n)</code>, <code>min(n)</code>, <code>max(n)</code>, <code>range(min,max)</code>, <code>regex(expr)</code>. Custom constraints implement <code>IRouteConstraint</code>.',
        '<strong>Optional parameters</strong> end with <code>?</code>: <code>{name?}</code>. <strong>Default values</strong> use <code>=</code>: <code>{page=1}</code>. <strong>Catch-alls</strong> use <code>**</code>: <code>{**path}</code> captures the rest of the URL including slashes — useful for file serving and proxy routes.',
        'Route <strong>precedence</strong> is computed automatically: literal segments outrank constrained parameters, which outrank unconstrained ones. Among equal-precedence routes the first registered wins. Register more-specific routes before more-general ones when you need fine control.',
      ],
    },
    {
      heading: 'MapGroup — shared prefix and shared behaviour',
      points: [
        '<code>app.MapGroup("/api/v1")</code> returns a <code>RouteGroupBuilder</code>. All endpoints mapped on it automatically inherit the path prefix — no need to repeat it on every route or maintain it in a constant.',
        'Groups inherit metadata: call <code>.RequireAuthorization()</code>, <code>.RequireCors()</code>, <code>.AddEndpointFilter()</code>, or <code>.WithOpenApi()</code> once on the group and every child endpoint shares it. An individual child can still override — for example, <code>.AllowAnonymous()</code> on a child endpoint lifts authorization from the group.',
        'Groups are composable: extract a method that receives a <code>RouteGroupBuilder</code> and registers its own endpoints. Pass a group to it to keep <code>Program.cs</code> clean and enable reusable endpoint modules.',
        'Nesting groups is supported: <code>var v2 = app.MapGroup("/api/v2"); var orders = v2.MapGroup("/orders");</code> gives <code>/api/v2/orders/…</code>. Each nesting level inherits metadata from all parent groups.',
        'Endpoint filters on a group run around every child endpoint handler. They receive an <code>EndpointFilterInvocationContext</code> and a <code>next</code> delegate — same pattern as middleware but scoped to the group\'s endpoint set rather than the full pipeline.',
      ],
    },
    {
      heading: 'Attribute routing on controllers',
      points: [
        'Controller classes decorated with <code>[ApiController]</code> use <strong>attribute routing</strong>. Apply <code>[Route("api/[controller]")]</code> at the class level; action-level attributes like <code>[HttpGet("{id}")]</code> append to the class prefix to form the final URL pattern.',
        '<code>[controller]</code> is a token replaced at startup with the controller name minus the "Controller" suffix: <code>ProductsController</code> → <code>Products</code>. <code>[action]</code> similarly inserts the action method name — useful for Razor Pages-style naming conventions.',
        'Attribute routes take precedence over conventional routes. Multiple route attributes on one action create multiple URL paths to the same handler — useful for versioning (<code>[HttpGet("v1/{id}")] [HttpGet("v2/{id}")]</code>).',
        'Conventional routing (<code>app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}")</code>) is the MVC-style alternative. It is order-sensitive: first match wins. Attribute routing is strongly preferred for API controllers because route templates are explicit and co-located with the handler.',
        '<code>[ApiController]</code> automatically enables model state validation (400 returned before the action runs), binding source inference ([FromBody] for complex types, [FromRoute] for route params, [FromQuery] for everything else), and problem details error responses — reduce boilerplate in every action.',
      ],
    },
    {
      heading: 'Link generation and named endpoints',
      points: [
        'Hard-coding URLs in your app is fragile. ASP.NET Core\'s <code>LinkGenerator</code> service generates URLs from endpoint names and route values — if you rename or restructure a route, links update automatically without searching for strings.',
        'Name a minimal-API endpoint: <code>app.MapGet("/orders/{id}", ...).WithName("GetOrder")</code>. Then generate its URL: <code>linkGen.GetPathByName("GetOrder", new { id = 42 })</code> → <code>/orders/42</code>, or <code>GetUriByName()</code> with <code>HttpContext</code> for a fully qualified URL.',
        'In <code>Results.CreatedAtRoute("GetOrder", new { id })</code> the framework calls <code>LinkGenerator</code> internally to build the <code>Location</code> header. In controllers, <code>CreatedAtAction(nameof(GetById), new { id })</code> does the same.',
        'Named routes also appear as <code>operationId</code> in the generated OpenAPI document, and typed HTTP clients (Kiota, NSwag) reference operations by this name in generated code — a consistent naming convention saves significant refactoring effort.',
        'Avoid <code>Url.Content()</code> or <code>Request.Scheme + "://" + Request.Host</code> string concatenation for URLs. They break under reverse proxies. Use <code>LinkGenerator.GetUriByName()</code> which respects <code>UseForwardedHeaders()</code> or <code>X-Forwarded-*</code> settings.',
      ],
    },
    {
      heading: 'Route precedence, ambiguity, and debugging',
      points: [
        'Route precedence is computed at startup: literal segments rank highest, then route-constrained parameters, then unconstrained parameters, then catch-alls. This means <code>/users/me</code> always wins over <code>/users/{id}</code> for the URL <code>/users/me</code> regardless of registration order.',
        'Among routes of equal computed precedence, <strong>registration order</strong> is the tie-breaker: first registered wins. For minimal APIs this is code order in <code>Program.cs</code>; for controllers it is the order <code>app.MapControllers()</code> discovers them (alphabetical by assembly scanning).',
        'Ambiguity at startup (two routes with identical precedence and the same template) throws <code>AmbiguousMatchException</code> — the app fails to start. This is intentional; ASP.NET Core refuses to silently pick one. Resolve by adding a constraint, changing a path, or using <code>MapMethods()</code> to distinguish by HTTP verb.',
        'Debug routing mismatches with the routing diagnostics middleware (Development only): set <code>ASPNETCORE_DETAILEDERRORS=true</code> and call <code>app.UseRouting()</code> explicitly — the developer exception page shows which routes were considered and why each was skipped.',
        'For production debugging, log at <code>Debug</code> level in the <code>Microsoft.AspNetCore.Routing</code> namespace to see route matching decisions per request. <code>endpoint.DisplayName</code> on the matched endpoint gives the controller action or lambda signature — useful for audit trails.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Minimal API Routes',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Parameter binding from route, query, body, and DI is automatic
app.MapGet("/products",
    ([AsParameters] ProductQuery q, IProductService svc) =>
        svc.List(q.Category, q.Page));

app.MapGet("/products/{id:int}",
    (int id, IProductService svc) =>
        svc.FindById(id) is { } p ? Results.Ok(p) : Results.NotFound())
   .WithName("GetProduct");     // named endpoint — used by CreatedAtRoute

app.MapPost("/products",
    (CreateProductRequest req, IProductService svc) =>
    {
        var product = svc.Create(req);
        return Results.CreatedAtRoute("GetProduct", new { id = product.Id }, product);
    });

app.MapPut("/products/{id:int}",
    (int id, UpdateProductRequest req, IProductService svc) =>
        svc.Update(id, req) ? Results.NoContent() : Results.NotFound());

app.MapDelete("/products/{id:int}",
    (int id, IProductService svc) =>
        svc.Delete(id) ? Results.NoContent() : Results.NotFound());

app.Run();

// ── Parameter source inference ────────────────────────────────────────
// int id           → from route segment {id}
// string? category → from query string ?category=...
// [FromBody] T req → from request body (JSON)
// [FromHeader(Name="X-Key")] string key → from request header
// IMyService svc   → resolved from DI (no attribute needed in .NET 7+)`,
    },
    {
      label: 'Route Constraints',
      language: 'csharp',
      code: `// ── Built-in constraints ─────────────────────────────────────────────
app.MapGet("/orders/{id:int}",         (int id)    => \$"Order {id}");
app.MapGet("/orders/{code:guid}",      (Guid code) => \$"Order {code}");
app.MapGet("/users/{name:alpha}",      (string name) => \$"User {name}");
app.MapGet("/files/{name:minlength(3)}", (string name) => \$"File {name}");

// ── Chained constraints — ALL must pass ───────────────────────────────
app.MapGet("/scores/{value:int:range(0,100)}", (int value) => \$"Score {value}");

// ── Regex constraint ──────────────────────────────────────────────────
app.MapGet("/slugs/{slug:regex(^[a-z0-9-]+\$)}", (string slug) => \$"Slug {slug}");

// ── Optional and default parameters ──────────────────────────────────
// {page?}  — optional; null if absent from URL
app.MapGet("/articles/{category}/{page:int?}",
    (string category, int? page) => \$"Category {category}, page {page ?? 1}");

// {sort=name}  — default value "name" if segment absent
app.MapGet("/items/{sort=name}", (string sort) => \$"Sorted by {sort}");

// ── Catch-all ─────────────────────────────────────────────────────────
// Matches /files/docs/2024/report.pdf → path = "docs/2024/report.pdf"
app.MapGet("/files/{**path}", (string path) => \$"File path: {path}");

// ── Precedence — more specific routes win regardless of order ─────────
app.MapGet("/users/{id:int}",    (int id) => \$"user {id}");   // constrained
app.MapGet("/users/me",          () => "current user");         // literal — always wins`,
    },
    {
      label: 'MapGroup',
      language: 'csharp',
      code: `// ── Group endpoints under a shared prefix ────────────────────────────
var api = app.MapGroup("/api/v1")
             .WithOpenApi()
             .RequireAuthorization();    // all children require auth by default

// Products sub-group — /api/v1/products
var products = api.MapGroup("/products");
products.MapGet("/",         ProductHandlers.List);
products.MapGet("/{id:int}", ProductHandlers.Get).WithName("GetProduct");
products.MapPost("/",        ProductHandlers.Create);
products.MapPut("/{id:int}", ProductHandlers.Update);
products.MapDelete("/{id:int}", ProductHandlers.Delete);

// Orders — /api/v1/orders; listing is public, others require auth
var orders = api.MapGroup("/orders");
orders.MapGet("/", OrderHandlers.List).AllowAnonymous();  // overrides group auth
orders.MapGet("/{id:int}", OrderHandlers.Get);
orders.MapPost("/", OrderHandlers.Create);

// ── Endpoint filter on the group ──────────────────────────────────────
// Filter runs around EVERY endpoint in the group
products.AddEndpointFilter(async (ctx, next) =>
{
    if (!ctx.HttpContext.Request.Headers.ContainsKey("X-Api-Version"))
        return Results.BadRequest("X-Api-Version header required");
    return await next(ctx);
});

// ── Keep Program.cs clean with a separate registration method ─────────
static RouteGroupBuilder MapProductEndpoints(RouteGroupBuilder group)
{
    group.MapGet("/",         ProductHandlers.List);
    group.MapGet("/{id:int}", ProductHandlers.Get);
    // ... more endpoints
    return group;
}

api.MapGroup("/products").Apply(MapProductEndpoints);

static RouteGroupBuilder Apply(this RouteGroupBuilder g, Func<RouteGroupBuilder, RouteGroupBuilder> fn) => fn(g);`,
    },
    {
      label: 'Controller Routing',
      language: 'csharp',
      code: `// ── Attribute routing on controllers ─────────────────────────────────
[ApiController]
[Route("api/[controller]")]             // [controller] expands to "Products"
public class ProductsController(IProductService svc) : ControllerBase
{
    // GET api/products
    [HttpGet]
    public IActionResult GetAll() => Ok(svc.List());

    // GET api/products/42
    [HttpGet("{id:int}", Name = "GetProduct")]
    public IActionResult GetById(int id)
    {
        var p = svc.FindById(id);
        return p is null ? NotFound() : Ok(p);
    }

    // POST api/products
    [HttpPost]
    public IActionResult Create([FromBody] CreateProductRequest req)
    {
        var product = svc.Create(req);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    // PUT api/products/42
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] UpdateProductRequest req)
        => svc.Update(id, req) ? NoContent() : NotFound();

    // DELETE api/products/42
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
        => svc.Delete(id) ? NoContent() : NotFound();

    // Multiple route attributes — both paths reach the same action
    [HttpGet("by-slug/{slug}")]
    [HttpGet("alias/{slug}")]
    public IActionResult BySlug(string slug) => Ok(svc.FindBySlug(slug));
}

app.MapControllers();`,
    },
    {
      label: 'Link generation',
      language: 'csharp',
      code: `// ── Generate URLs from named endpoints ───────────────────────────────
app.MapGet("/orders/{id:int}", (int id) => Results.Ok(id))
   .WithName("GetOrder");

// In an endpoint handler — use HttpContext
app.MapPost("/orders", (CreateOrderRequest req, LinkGenerator linkGen, HttpContext ctx) =>
{
    var order = new Order(1, req.Description);

    // Generate path: /orders/1
    var path = linkGen.GetPathByName("GetOrder", new { id = order.Id });

    // Generate absolute URL respecting X-Forwarded-* headers
    var url = linkGen.GetUriByName(ctx, "GetOrder", new { id = order.Id });

    return Results.Created(path, order);
});

// ── From a service (inject LinkGenerator) ────────────────────────────
public class NotificationService(LinkGenerator linkGen, IHttpContextAccessor ctx)
{
    public string BuildOrderUrl(int orderId)
        => linkGen.GetUriByName(ctx.HttpContext!, "GetOrder", new { id = orderId })
           ?? throw new InvalidOperationException("Endpoint not found");
}

// DI registration
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<NotificationService>();

// ── In controllers ────────────────────────────────────────────────────
[HttpGet("{id:int}", Name = "GetProduct")]
public IActionResult GetById(int id) => Ok(svc.FindById(id));

[HttpPost]
public IActionResult Create(CreateProductRequest req)
{
    var p = svc.Create(req);
    // CreatedAtAction uses IUrlHelper (wraps LinkGenerator internally)
    return CreatedAtAction(nameof(GetById), new { id = p.Id }, p);
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Repeating prefix and metadata vs MapGroup',
      before: `// Every route repeats the prefix, auth, and OpenAPI tag
app.MapGet("/api/v1/products",      ProductHandlers.List)
   .RequireAuthorization().WithTags("Products").WithOpenApi();
app.MapGet("/api/v1/products/{id}", ProductHandlers.Get)
   .RequireAuthorization().WithTags("Products").WithOpenApi();
app.MapPost("/api/v1/products",     ProductHandlers.Create)
   .RequireAuthorization().WithTags("Products").WithOpenApi();`,
      after: `// MapGroup — one declaration, all children inherit
var products = app.MapGroup("/api/v1/products")
                  .RequireAuthorization()
                  .WithTags("Products")
                  .WithOpenApi();

products.MapGet("/",         ProductHandlers.List);
products.MapGet("/{id:int}", ProductHandlers.Get);
products.MapPost("/",        ProductHandlers.Create);`,
      note: 'MapGroup eliminates repetition of prefix, authorization, CORS, and OpenAPI configuration. Individual endpoints still override where needed — for example, adding .AllowAnonymous() on a specific child.',
    },
    {
      title: 'Hard-coded URL strings vs LinkGenerator',
      before: `// Hard-coded URL — breaks silently when route is renamed
app.MapPost("/orders", (CreateOrderRequest req) =>
{
    var order = Create(req);
    // BUG: if the GET route is renamed or moved, this is never updated
    return Results.Created(\$"/orders/{order.Id}", order);
});`,
      after: `// LinkGenerator — route-rename-safe
app.MapGet("/orders/{id:int}", (int id) => Results.Ok(id)).WithName("GetOrder");

app.MapPost("/orders", (CreateOrderRequest req, LinkGenerator links, HttpContext ctx) =>
{
    var order = Create(req);
    var path = links.GetPathByName(ctx, "GetOrder", new { id = order.Id });
    return Results.Created(path, order);
});`,
      note: 'LinkGenerator builds URLs from endpoint names and route values. Renaming the GET route path updates every link automatically at startup — zero string hunting.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Registering a specific route after a generic one of equal precedence',
      wrong: `// BUG: /users/{id} registered first — captures "me" before /users/me is reached
app.MapGet("/users/{id}", (string id) => \$"user {id}");  // catches /users/me
app.MapGet("/users/me",   () => "current user");           // never reached`,
      right: `// Specific literal routes win by precedence regardless of order
// But to be safe and readable, register specific routes first:
app.MapGet("/users/me",   () => "current user");           // literal — always wins
app.MapGet("/users/{id}", (string id) => \$"user {id}");  // parameter — fallback`,
      explanation: 'Route precedence computation means literal segments outrank parameter segments — /users/me always wins over /users/{id} for the URL /users/me regardless of registration order. However, among routes of equal precedence, first registered wins. Register more-specific routes before more-general ones to make intent clear and avoid surprises.',
    },
    {
      title: 'Omitting app.MapControllers() when using controller-based routing',
      wrong: `var app = builder.Build();
// controller endpoints are defined in ProductsController...
// but MapControllers() was never called — no routes are registered
app.Run();
// Every request returns 404`,
      right: `var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();   // ← registers all [ApiController] routes
app.Run();`,
      explanation: 'Controller action methods are discovered and mapped as endpoints only when app.MapControllers() is called. Forgetting it means no controller routes exist — every request to a controller action returns 404 with no error. There is no build-time warning.',
    },
    {
      title: 'Using {id} without a type constraint on an integer ID endpoint',
      wrong: `// BUG: {id} matches any string — /products/abc reaches this handler
app.MapGet("/products/{id}", (int id) => svc.FindById(id));
// Non-numeric path → model binding fails → unhandled exception or 400 without detail`,
      right: `// Constraint ensures only numeric segments match — non-numeric returns 404 (no route)
app.MapGet("/products/{id:int}", (int id) => svc.FindById(id));`,
      explanation: 'Without a constraint, {id} matches any string and model binding attempts to parse it as int. This produces a 400 model validation error (with [ApiController]) or an unhandled exception. The constraint {id:int} causes non-matching URLs to skip this route entirely, returning a clean 404 — better REST behaviour and no exception noise in logs.',
    },
    {
      title: 'Calling .AllowAnonymous() in the wrong place overrides group auth for all children',
      wrong: `var api = app.MapGroup("/api").RequireAuthorization();

// Intention: allow public listing, require auth elsewhere
api.AllowAnonymous();         // BUG: called on the GROUP — disables auth for all children
api.MapGet("/items",    ItemHandlers.List);    // anonymous — intended
api.MapPost("/items",   ItemHandlers.Create);  // also anonymous — NOT intended`,
      right: `var api = app.MapGroup("/api").RequireAuthorization(); // group requires auth

// Override on the specific endpoint, not the group
api.MapGet("/items",    ItemHandlers.List).AllowAnonymous(); // public
api.MapPost("/items",   ItemHandlers.Create);                // still requires auth`,
      explanation: 'AllowAnonymous() is an additive metadata marker. When called on the RouteGroupBuilder it applies to all child endpoints, silently disabling the group-level RequireAuthorization for every route. Call it on individual MapGet/MapPost calls to exempt only the intended endpoints.',
    },
    {
      title: 'Using string URL concatenation instead of LinkGenerator under a reverse proxy',
      wrong: `// BUG: breaks when app is behind a proxy with a path prefix (/myapp/*)
app.MapPost("/orders", (HttpRequest req) =>
{
    var locationUrl = \$"{req.Scheme}://{req.Host}/orders/1";
    // Behind proxy: req.Host is internal host, not external — wrong URL returned
    return Results.Created(locationUrl, new { Id = 1 });
});`,
      right: `app.MapGet("/orders/{id:int}", (int id) => Results.Ok(id)).WithName("GetOrder");

app.MapPost("/orders", (LinkGenerator links, HttpContext ctx) =>
{
    var url = links.GetUriByName(ctx, "GetOrder", new { id = 1 });
    // Respects X-Forwarded-Host / X-Forwarded-Prefix set by UseForwardedHeaders()
    return Results.Created(url, new { Id = 1 });
});`,
      explanation: 'String URL concatenation using Request.Scheme and Request.Host uses internal server addresses, not the external addresses seen by clients behind load balancers or reverse proxies. LinkGenerator.GetUriByName() respects UseForwardedHeaders() and X-Forwarded-* settings, producing the correct external URL in all deployment environments.',
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
      'An endpoint filter: group.AddEndpointFilter(async (ctx, next) => { check header; return await next(ctx); })',
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
      explanation: '<code>{id:int}</code> is the built-in constraint matching only 32-bit integer segments. When the constraint fails, the router skips to the next candidate route — no 400 is returned, the route simply does not match.',
    },
    {
      q: 'What benefit does app.MapGroup() provide beyond grouping routes under a shared prefix?',
      options: [
        'It enables HTTP/2 for all child endpoints',
        'It lets all child endpoints share filters, metadata (auth, CORS, OpenAPI), and endpoint-level configuration applied once to the group',
        'It makes child endpoint handlers run in parallel for better throughput',
        'It converts child routes to attribute routing automatically',
      ],
      answer: 1,
      explanation: '<code>MapGroup()</code> returns a <code>RouteGroupBuilder</code>. Calling <code>.RequireAuthorization()</code>, <code>.WithOpenApi()</code>, or <code>.AddEndpointFilter()</code> on it applies the metadata to all endpoints registered in the group — you write it once instead of on every <code>MapGet/Post/…</code>.',
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
      explanation: 'The <code>[controller]</code> token is replaced with the class name minus the "Controller" suffix. <code>ProductsController</code> with <code>[Route("api/[controller]")]</code> gives prefix <code>api/Products</code>. Adding <code>[HttpGet("{id}")]</code> produces <code>api/Products/{id}</code>.',
    },
    {
      q: 'What does .WithName("GetProduct") on a MapGet endpoint enable?',
      options: [
        'It makes the endpoint accessible via that name as an alternative URL path',
        'It sets the endpoint name used by LinkGenerator, Results.CreatedAtRoute(), and the OpenAPI operationId',
        'It registers the endpoint for controller use only',
        'It restricts the endpoint to authenticated users with the "GetProduct" role',
      ],
      answer: 1,
      explanation: '<code>WithName()</code> assigns an endpoint name. Reference it in <code>Results.CreatedAtRoute("GetProduct", new { id })</code> to generate a Location header, or <code>LinkGenerator.GetPathByName("GetProduct", ...)</code> for URL generation. It also becomes the <code>operationId</code> in the OpenAPI document.',
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
      explanation: 'The <strong>catch-all</strong> parameter uses the <code>**</code> prefix: <code>{**path}</code>. It matches everything from that point to the end of the URL, including slashes. <code>/files/{**path}</code> matches <code>/files/docs/2024/report.pdf</code> with <code>path = "docs/2024/report.pdf"</code>.',
    },
    {
      q: 'Why does the two-stage endpoint routing model (UseRouting + execution) matter for middleware?',
      options: [
        'It allows multiple pipelines to run in parallel for the same request',
        'Middleware between UseRouting() and execution can inspect matched-endpoint metadata (auth policies, CORS, rate-limit) before the handler runs — enabling auth middleware to read per-endpoint attributes',
        'It is only relevant for controller-based apps; minimal APIs use a single stage',
        'It reduces startup time by deferring route compilation until the first request',
      ],
      answer: 1,
      explanation: 'UseRouting() stores the matched endpoint on HttpContext. Middleware registered after it can call context.GetEndpoint() to see the matched route\'s metadata — for example, whether it has [Authorize] or a CORS policy. This is why UseAuthentication and UseAuthorization must be placed between UseRouting and endpoint execution, not before UseRouting.',
    },
    {
      q: 'What happens when two routes have identical templates and equal precedence?',
      options: [
        'ASP.NET Core picks the most recently registered one',
        'The app starts and routes to both handlers randomly',
        'ASP.NET Core throws AmbiguousMatchException at startup — the app refuses to start',
        'The first matching HTTP request picks a winner and the choice is cached',
      ],
      answer: 2,
      explanation: 'Route ambiguity is a startup-time error. ASP.NET Core throws AmbiguousMatchException when two routes are indistinguishable — it refuses to guess which handler to invoke. Resolve by adding a constraint, changing a path, or using MapMethods() to differentiate by HTTP verb.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'How does ASP.NET Core choose between two routes that could both match a URL?', a: 'Endpoint routing uses a computed precedence: literal segments outrank constrained parameters, which outrank unconstrained ones, which outrank catch-alls. <code>/users/me</code> (literal) always wins over <code>/users/{id}</code> (parameter) for the URL <code>/users/me</code> regardless of registration order. Among routes of equal computed precedence, the first one registered wins. Register more-specific routes before more-general ones to make intent clear.' },
    { q: 'When should I use minimal APIs versus controller-based routing?', a: 'Minimal APIs are ideal for microservices, serverless functions, or small focused APIs where convention over configuration is welcome and teams are small. Controllers shine for large APIs with complex action filters, content negotiation, view rendering, or teams that prefer explicit structure. In .NET 8+ the two coexist in one app — use whichever is clearest for each part of the surface area.' },
    { q: 'Can I apply middleware to only specific routes?', a: 'Yes, in two ways. With <code>app.MapGroup()</code> you attach endpoint filters and metadata to a group. With <code>app.Map("/admin", branch => { branch.UseAuthentication(); ... })</code> you build a full sub-pipeline for a path prefix — the branch has its own middleware chain. For per-request middleware that needs to check the matched endpoint, call <code>context.GetEndpoint()?.Metadata</code> inside any middleware registered after <code>UseRouting()</code>.' },
    { q: 'What is the difference between route values, query string, and model binding?', a: 'Route values come from URL path segments (<code>{id}</code>). Query strings are <code>?key=value</code> pairs appended after the path. Model binding automatically converts both — plus headers, form fields, and the request body — into handler parameters. In minimal APIs the source is inferred: path segments → route, simple types not in the route → query, complex types → JSON body. Use <code>[FromRoute]</code>, <code>[FromQuery]</code>, <code>[FromBody]</code>, or <code>[FromHeader]</code> to be explicit.' },
    { q: 'How do I generate URLs for named endpoints from within a service or background task?', a: 'Inject <code>LinkGenerator</code> into your service. Call <code>linkGen.GetPathByName("EndpointName", new { id = 42 })</code> for a path, or <code>GetUriByName(httpContext, ...)</code> for a fully qualified URL. For background tasks with no active request, inject <code>IHttpContextAccessor</code> or pass the base URL from <code>IConfiguration</code>. Avoid Request.Scheme + Request.Host concatenation — it breaks behind reverse proxies.' },
    { q: 'How do route constraints interact with model binding — does a failed constraint return a 400?', a: 'No. Route constraints operate during <em>route matching</em>: a failed constraint causes the router to skip that route and try the next candidate. If no route matches, the result is a 404 — not a 400. Model binding errors (wrong type after matching) return a 400 (with <code>[ApiController]</code>). Use constraints (<code>{id:int}</code>) to keep type errors out of logs and return semantically correct 404s for malformed paths.' },
    { q: 'What is the [AsParameters] attribute in minimal APIs?', a: '<code>[AsParameters]</code> tells the minimal-API parameter binder to look at the <em>properties</em> of the parameter type instead of treating the whole object as a body. It lets you group related query-string or route parameters into a record/class: <code>record ProductQuery(string? Category, int Page = 1)</code> with <code>[AsParameters] ProductQuery q</code> as a handler parameter. The framework binds each property from query, route, or header independently.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core endpoint routing separates URL matching (UseRouting) from handler execution — middleware between the two stages can inspect matched endpoint metadata; MapGroup and LinkGenerator replace repetitive prefix/auth strings and hard-coded URL building.',
    mustKnow: [
      'Two-stage model: UseRouting stores the match; middleware after it can read endpoint metadata before execution',
      'Route precedence: literals > constrained params > unconstrained params > catch-alls; first registered wins ties',
      'Constraints ({id:int}) narrow matching — a failed constraint skips the route and returns 404, not a 400',
      'MapGroup inherits prefix, auth, CORS, filters, and OpenAPI tags to all child endpoints; AllowAnonymous() overrides per child',
      '.WithName() on an endpoint enables LinkGenerator, Results.CreatedAtRoute(), and OpenAPI operationId',
      '[controller] / [action] tokens in attribute routing expand to class/method name at startup',
      'Ambiguous routes (same template, equal precedence) throw AmbiguousMatchException at startup — the app refuses to start',
    ],
    interviewFocus: [
      'Why does the two-stage routing model matter for authentication and authorization middleware?',
      'How does route precedence work, and when does registration order matter?',
      'What is the difference between app.Map() (permanent branch) and app.UseWhen() (rejoins)?',
      'How do you share authorization, CORS, and filters across multiple endpoints without repeating them?',
      'Why should you use LinkGenerator instead of string URL concatenation in a reverse-proxy environment?',
    ],
  };
}
