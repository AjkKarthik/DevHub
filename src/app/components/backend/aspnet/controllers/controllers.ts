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
  selector: 'app-aspnet-controllers',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './controllers.html',
  styleUrl: './controllers.scss',
})
export class AspnetControllers {

  prerequisites: Prerequisite[] = [
    { label: 'Routing', route: '/aspnet/routing' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ControllerBase',            type: 'class',    desc: 'Base for API controllers — no view support' },
    { name: '[ApiController]',           type: 'decorator', desc: 'Enables auto-400, binding inference, ProblemDetails' },
    { name: 'ActionResult<T>',           type: 'class',    desc: 'Typed result — combines T and IActionResult in one return type' },
    { name: 'IActionResult',             type: 'interface', desc: 'Untyped action result — Ok(), NotFound(), etc.' },
    { name: '[Route("[controller]")]',   type: 'decorator', desc: 'Sets the route template for the controller class' },
    { name: '[HttpGet] / [HttpPost]',    type: 'decorator', desc: 'HTTP verb attributes with optional route template' },
    { name: '[ProducesResponseType]',    type: 'decorator', desc: 'Documents possible response types for OpenAPI/Swagger' },
    { name: 'Problem()',                 type: 'method',   desc: 'Returns RFC 9457 ProblemDetails response' },
    { name: 'CreatedAtAction()',         type: 'method',   desc: 'Returns 201 Created with a Location header' },
    { name: '[Consumes] / [Produces]',   type: 'decorator', desc: 'Declares accepted and returned media types' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ControllerBase vs Controller and [ApiController]',
      points: [
        'For Web APIs always inherit <code>ControllerBase</code>, not <code>Controller</code>. <code>Controller</code> adds <code>View()</code>, <code>ViewBag</code>, and <code>TempData</code> for MVC view rendering — dead weight in a pure JSON API that inflates the type surface and confuses developers.',
        '<code>[ApiController]</code> enables three key behaviours automatically: <strong>binding source inference</strong> (route values → <code>[FromRoute]</code>, body → <code>[FromBody]</code> for complex types, query string for primitives — no explicit attributes needed), <strong>automatic 400</strong> when <code>ModelState</code> is invalid before the action runs, and <strong>ProblemDetails</strong> error formatting for validation failures.',
        'Apply <code>[ApiController]</code> at the assembly level with <code>[assembly: ApiController]</code> to cover all controllers without repeating the attribute. Individual controllers that need to opt out use <code>[IgnoreApiController]</code>.',
        '<code>[ApiController]</code> also requires <code>[FromForm]</code> for multipart/form-data — without it, form fields are not bound from the request body. This is intentional: the inference rules would otherwise be ambiguous between body and form.',
        'Controllers are registered as transient services internally but activated per-request by the <code>IControllerActivator</code>. Constructor injection works normally — Scoped dependencies (DbContext) are safe because a new controller instance is created for every request.',
      ],
    },
    {
      heading: 'Action results and status codes',
      points: [
        'Prefer <code>ActionResult&lt;T&gt;</code> over <code>IActionResult</code> when the success body type is known. The generic parameter tells OpenAPI generators the 200 response schema, enabling accurate client code generation without extra <code>[ProducesResponseType]</code> annotations.',
        'You can return <code>T</code> directly from an <code>ActionResult&lt;T&gt;</code> action — the framework wraps it in a 200 OK response automatically. Use helper methods for other statuses: <code>Ok()</code>, <code>NotFound()</code>, <code>BadRequest()</code>, <code>NoContent()</code>, <code>Conflict()</code>, <code>UnprocessableEntity()</code>.',
        '<code>CreatedAtAction(nameof(GetById), new { id = item.Id }, item)</code> returns 201 Created with a <strong>Location header</strong> pointing to the newly created resource. This is the RESTful contract for POST — clients can follow the header to fetch the resource.',
        '<code>Problem(title, detail, statusCode, instance)</code> returns an RFC 9457 ProblemDetails body. Register <code>builder.Services.AddProblemDetails()</code> to enable automatic ProblemDetails for unhandled exceptions too.',
        '<code>[ProducesResponseType&lt;Product&gt;(200)]</code> and <code>[ProducesResponseType(404)]</code> document response shapes for Swagger UI and typed HTTP client generators (NSwag, Kiota). Without them, generators assume only one possible response type.',
        'Use <code>TypedResults</code> (<code>Results&lt;Ok&lt;T&gt;, NotFound&gt;</code> return type) for compile-time exhaustive response documentation — the compiler enforces that all declared response variants are actually returned and OpenAPI generation needs no extra attributes.',
      ],
    },
    {
      heading: 'Model binding and validation',
      points: [
        'With <code>[ApiController]</code>, binding source is inferred: route segment parameters bind from <code>[FromRoute]</code>, simple types not in the route bind from <code>[FromQuery]</code>, and complex types bind from <code>[FromBody]</code> (JSON by default).',
        'Use explicit binding attributes when inference is ambiguous: <code>[FromHeader(Name = "X-Api-Key")]</code>, <code>[FromForm]</code> for multipart, <code>[AsParameters]</code> for grouping query params into a record.',
        'Model validation runs automatically before the action when <code>[ApiController]</code> is present. Decorate DTOs with <code>[Required]</code>, <code>[StringLength]</code>, <code>[Range]</code>, <code>[EmailAddress]</code> — validation failures return 400 with a structured <code>ValidationProblemDetails</code> body.',
        'For complex cross-field validation, implement <code>IValidatableObject</code> on the DTO or use FluentValidation. The automatic 400 still fires — you don\'t need to check <code>ModelState.IsValid</code> manually.',
        'Never trust client-supplied IDs. When the route has <code>{id:int}</code> and the body has an <code>Id</code> property, they may disagree. Prefer ignoring the body ID entirely and using only the route value — or explicitly validate they match and return 400 if they don\'t.',
      ],
    },
    {
      heading: 'Dependency injection and per-action services',
      points: [
        'Inject services via the constructor. Controllers are instantiated per-request so Scoped services (DbContext, unit-of-work) are safe. Singleton services are also fine — they are shared across requests as expected.',
        'Use <code>[FromServices]</code> on an action parameter to inject a service needed only for that single action, avoiding a constructor parameter that bloats the class: <code>public IActionResult Send([FromServices] IEmailSender mailer)</code>.',
        'Avoid the service locator anti-pattern — never call <code>HttpContext.RequestServices.GetService&lt;T&gt;()</code> inside actions. It hides dependencies, prevents scope validation, and makes unit testing impossible without a real DI container.',
        'For action filters that need DI services, use <code>IFilterFactory</code> or <code>TypeFilterAttribute</code> — standard constructor injection on the filter class works when the filter is resolved from DI, not <code>new</code>-ed directly in an attribute.',
      ],
    },
    {
      heading: 'Routing, versioning, and conventions',
      points: [
        'Controller routing combines class-level <code>[Route("api/[controller]")]</code> with method-level <code>[HttpGet("{id:int}")]</code>. The <code>[controller]</code> token is replaced with the class name minus the "Controller" suffix at startup — <code>ProductsController</code> → <code>Products</code>.',
        'Apply multiple <code>[HttpGet]</code> or <code>[Route]</code> attributes on one action to register multiple URL paths for the same handler — useful for versioning (<code>[HttpGet("v1/{id}")]</code> and <code>[HttpGet("v2/{id}")]</code>) or legacy URL aliases.',
        'Route constraints on controllers work identically to minimal APIs: <code>{id:int}</code>, <code>{slug:alpha:minlength(3)}</code>, <code>{code:guid}</code>. Failed constraints skip the route and return 404, not 400.',
        'For API versioning, prefer the <code>Asp.Versioning</code> NuGet package. It adds URL-segment (<code>/api/v{version}/products</code>), query-string (<code>?api-version=2</code>), and header (<code>X-Api-Version: 2</code>) versioning with deprecation support.',
        'Conventional routing (<code>app.MapControllerRoute("default", "{controller}/{action}/{id?}")</code>) is primarily for MVC page apps. REST APIs should always use attribute routing — it is explicit, co-located with the handler, and does not rely on convention-matching order.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CRUD Controller',
      language: 'csharp',
      code: `[ApiController]
[Route("api/[controller]")]
public class TodosController : ControllerBase
{
    private static readonly List<TodoItem> _items = [];
    private static int _nextId = 1;

    [HttpGet]
    public ActionResult<IEnumerable<TodoItem>> GetAll() => Ok(_items);

    [HttpGet("{id:int}")]
    public ActionResult<TodoItem> Get(int id)
    {
        var item = _items.FirstOrDefault(x => x.Id == id);
        return item is null ? NotFound() : item;
    }

    [HttpPost]
    public ActionResult<TodoItem> Create(CreateTodoDto dto)
    {
        var item = new TodoItem(_nextId++, dto.Title);
        _items.Add(item);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, UpdateTodoDto dto)
    {
        var item = _items.FirstOrDefault(x => x.Id == id);
        if (item is null) return NotFound();
        item.Title  = dto.Title;
        item.IsDone = dto.IsDone;
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var item = _items.FirstOrDefault(x => x.Id == id);
        if (item is null) return NotFound();
        _items.Remove(item);
        return NoContent();
    }
}

record TodoItem(int Id, string Title) { public bool IsDone { get; set; } }
record CreateTodoDto(string Title);
record UpdateTodoDto(string Title, bool IsDone);`,
    },
    {
      label: 'Typed Results',
      language: 'csharp',
      code: `// Compile-time checked response union
[HttpGet("{id:int}")]
[ProducesResponseType<Product>(200)]
[ProducesResponseType(404)]
public async Task<Results<Ok<Product>, NotFound>> Get(int id)
{
    var product = await _products.FindAsync(id);
    return product is null
        ? TypedResults.NotFound()
        : TypedResults.Ok(product);
}

// Three possible outcomes
[HttpPost]
public async Task<Results<Created<Product>, BadRequest<string>, Conflict>> Create(
    CreateProductDto dto)
{
    if (await _products.ExistsAsync(dto.Sku))
        return TypedResults.Conflict();

    var product = await _products.CreateAsync(dto);
    return TypedResults.Created(\$"/api/products/{product.Id}", product);
}`,
    },
    {
      label: 'Problem Details',
      language: 'csharp',
      code: `// Registration
builder.Services.AddProblemDetails();

// Return structured errors
[HttpPost("reserve")]
public async Task<ActionResult<Reservation>> Reserve(ReserveDto dto)
{
    if (dto.CheckOut <= dto.CheckIn)
        return Problem(
            title:      "Invalid dates",
            detail:     "Check-out must be after check-in.",
            statusCode: StatusCodes.Status422UnprocessableEntity,
            instance:   HttpContext.Request.Path
        );

    try
    {
        var res = await _reservations.ReserveAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = res.Id }, res);
    }
    catch (RoomAlreadyBookedException ex)
    {
        return Conflict(new ProblemDetails {
            Title  = "Room unavailable",
            Detail = ex.Message,
            Status = 409
        });
    }
}`,
    },
    {
      label: 'Content Negotiation',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddControllers()
    .AddXmlSerializerFormatters();

// Accept: application/json → JSON response
// Accept: application/xml  → XML response

// Constrain at action level
[HttpGet]
[Produces("application/json")]       // only JSON regardless of Accept
[Consumes("application/json")]       // only accept JSON body
public IEnumerable<Product> GetJson() => _products;

// Format extension in URL: /products/1.json or /products/1.xml
[HttpGet("{id:int}.{format}")]
[FormatFilter]
public ActionResult<Product> GetFormatted(int id) => ...;`,
    },
  ];

  challenge: Challenge = {
    title: 'Products API Controller',
    language: 'csharp',
    description: 'Build a ProductsController that: uses [ApiController] and [Route("api/[controller]")], has GET /api/products (returns all), GET /api/products/{id:int} (returns one or 404), POST /api/products (creates, returns 201 with Location header), and DELETE /api/products/{id:int} (deletes, returns 204 or 404). Use an in-memory list.',
    hints: [
      'Inherit ControllerBase, not Controller',
      'Use ActionResult<T> for typed responses',
      'CreatedAtAction(nameof(Get), new { id = product.Id }, product) sets the Location header',
      'Return NoContent() for successful DELETE',
    ],
    starterCode: `[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private static readonly List<Product> _items = [];
    private static int _nextId = 1;

    // TODO: GET all products
    // TODO: GET product by id (404 if not found)
    // TODO: POST create product (201 Created)
    // TODO: DELETE product (204 or 404)
}

public record Product(int Id, string Name, decimal Price);
public record CreateProductDto(string Name, decimal Price);`,
    solution: `[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private static readonly List<Product> _items = [];
    private static int _nextId = 1;

    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll() => Ok(_items);

    [HttpGet("{id:int}")]
    public ActionResult<Product> Get(int id)
    {
        var item = _items.FirstOrDefault(x => x.Id == id);
        return item is null ? NotFound() : item;
    }

    [HttpPost]
    public ActionResult<Product> Create(CreateProductDto dto)
    {
        var product = new Product(_nextId++, dto.Name, dto.Price);
        _items.Add(product);
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var item = _items.FirstOrDefault(x => x.Id == id);
        if (item is null) return NotFound();
        _items.Remove(item);
        return NoContent();
    }
}

public record Product(int Id, string Name, decimal Price);
public record CreateProductDto(string Name, decimal Price);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does [ApiController] automatically do when ModelState is invalid?',
      options: ['Throws an exception', 'Returns 500', 'Returns 400 with a ProblemDetails body', 'Calls ModelState.Clear()'],
      answer: 2,
      explanation: '[ApiController] adds an implicit action filter that checks ModelState before the action runs and returns a 400 ValidationProblemDetails if invalid.',
    },
    {
      q: 'You want a controller action to return either a Product or a 404. Which return type is best?',
      options: ['IActionResult', 'Task<object>', 'ActionResult<Product>', 'ActionResult'],
      answer: 2,
      explanation: 'ActionResult<T> expresses the success type explicitly and lets the action return both T directly and IActionResult subtypes (NotFound, BadRequest, etc.).',
    },
    {
      q: 'Which helper method returns 201 Created and sets the Location header?',
      options: ['Ok()', 'Created(uri, data)', 'CreatedAtAction(actionName, routeValues, data)', 'StatusCode(201)'],
      answer: 2,
      explanation: 'CreatedAtAction generates the Location header by resolving the named action\'s URL via the route table — more robust than a hardcoded URI string.',
    },
    {
      q: 'Why should API controllers inherit ControllerBase rather than Controller?',
      options: [
        'Controller does not support async actions',
        'Controller adds MVC view helpers (View, ViewBag) that are unnecessary in APIs',
        'ControllerBase is faster because it uses Span<T>',
        'Controller is deprecated in .NET 8+',
      ],
      answer: 1,
      explanation: 'Controller inherits ControllerBase and adds view-rendering support. APIs have no use for these, so ControllerBase keeps the type surface clean.',
    },
    {
      q: 'Which attribute documents that an action can return HTTP 404 for OpenAPI tooling?',
      options: ['[Produces(404)]', '[ProducesResponseType(StatusCodes.Status404NotFound)]', '[SwaggerResponse(404)]', '[Returns(404)]'],
      answer: 1,
      explanation: '[ProducesResponseType] is the standard ASP.NET Core attribute that tells OpenAPI generators about possible status codes and response types.',
    },
    {
      q: 'With [ApiController], what happens when a complex type appears as an action parameter that is NOT in the route template?',
      options: [
        'It binds from query string',
        'It binds from the request body (JSON) automatically via binding source inference',
        'It throws an AmbiguousMatchException at startup',
        'It requires an explicit [FromBody] attribute — no inference for complex types',
      ],
      answer: 1,
      explanation: 'Binding source inference: complex types (classes, records) not matched by a route segment are inferred as <code>[FromBody]</code>. Simple types (int, string, Guid) not in the route are inferred as <code>[FromQuery]</code>. This eliminates boilerplate <code>[FromBody]</code> and <code>[FromQuery]</code> attributes in most actions.',
    },
    {
      q: 'You want one action to handle both /api/products/v1/{id} and /api/products/v2/{id}. How do you register both routes?',
      options: [
        'Use two separate action methods with the same body and different [HttpGet] attributes',
        'Apply multiple [HttpGet] or [Route] attributes on the same action method',
        'Register both routes in app.MapControllerRoute() with different defaults',
        'This is not possible — one action can only have one URL',
      ],
      answer: 1,
      explanation: 'Multiple <code>[HttpGet("v1/{id}")]</code> and <code>[HttpGet("v2/{id}")]</code> attributes on a single action method register both URLs to the same handler. This is useful for backward-compatible versioning — clients on either version reach the same logic.',
    },
    {
      q: 'What is the correct way to inject a service that is only needed in one action method?',
      options: [
        'Add it to the constructor and ignore it in all other actions',
        'Use HttpContext.RequestServices.GetRequiredService<T>() inside the action',
        'Use [FromServices] as an action parameter attribute',
        'Register it as a Transient and resolve it from a static field',
      ],
      answer: 2,
      explanation: '<code>[FromServices]</code> on an action parameter tells the binding system to resolve the argument from DI rather than from the request. This keeps the constructor lean — only services needed by multiple actions belong in the constructor. The DI container still manages lifetime correctly.',
    },
    {
      q: 'A controller action returns null from an ActionResult<Product> method. What HTTP response does the client receive?',
      options: [
        '204 No Content',
        '404 Not Found',
        '200 OK with a null JSON body',
        'A NullReferenceException — returning null is not allowed',
      ],
      answer: 2,
      explanation: 'Returning <code>null</code> from an <code>ActionResult&lt;T&gt;</code> action produces a 200 OK with a <code>null</code> JSON body — usually not the intended REST behaviour. Return <code>NotFound()</code> explicitly when the resource does not exist. The compiler does not prevent null returns, so this bug is easy to introduce silently.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use controllers vs minimal APIs?',
      a: 'Controllers are better for large teams (familiar MVC conventions, action filters, complex routing hierarchies). Minimal APIs are better for microservices, small APIs, or when you want less ceremony. Both can coexist in the same app.',
    },
    {
      q: 'Does [ApiController] affect route discovery?',
      a: 'No. [ApiController] only affects three runtime behaviours: binding source inference, automatic 400 on invalid ModelState, and multipart form-data annotation requirement. Routes are still determined by [Route] and [HttpVerb] attributes.',
    },
    {
      q: 'What is the difference between CreatedAtAction() and Created()?',
      a: 'CreatedAtAction() generates the Location URI from a named action using the route table — it\'s robust and refactor-safe. Created() takes a hardcoded URI string. Prefer CreatedAtAction() unless you cannot reference the action by name.',
    },
    {
      q: 'How do I return a 422 Unprocessable Entity instead of 400 for validation errors?',
      a: 'Configure ApiBehaviorOptions: services.Configure<ApiBehaviorOptions>(o => { o.InvalidModelStateResponseFactory = ctx => new UnprocessableEntityObjectResult(new ValidationProblemDetails(ctx.ModelState)); });',
    },
    {
      q: 'Can I inject scoped services into a controller?',
      a: 'Yes. Controllers are resolved per-request by the DI container, so they effectively have scoped lifetime. Injecting a scoped service (e.g., DbContext) into a controller constructor is safe.',
    },
    {
      q: 'What happens if I return null from an ActionResult<T> action?',
      a: 'ASP.NET Core serialises null as a JSON null body with 200 OK — usually undesirable. Return NotFound() or NoContent() explicitly instead.',
    },
    {
      q: 'How do I customise the automatic 400 response body that [ApiController] returns for validation failures?',
      a: 'Configure <code>ApiBehaviorOptions.InvalidModelStateResponseFactory</code> in <code>builder.Services.Configure&lt;ApiBehaviorOptions&gt;(o => { o.InvalidModelStateResponseFactory = ctx => new UnprocessableEntityObjectResult(new ValidationProblemDetails(ctx.ModelState)) { ContentTypes = { "application/problem+json" } }; })</code>. You can also return a completely custom object. This hook runs before the action when <code>ModelState</code> is invalid.',
    },
    {
      q: 'What is the difference between [Produces] on a controller and [ProducesResponseType] on an action?',
      a: '<code>[Produces("application/json")]</code> declares the <em>media type</em> the action or controller can return — it affects content negotiation and is surfaced in the OpenAPI document as the response content type. <code>[ProducesResponseType(200)]</code> or <code>[ProducesResponseType&lt;T&gt;(200)]</code> declares the <em>status code and body schema</em> for OpenAPI documentation. They serve different purposes and are complementary — you typically need both for a fully documented API endpoint.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Inheriting Controller instead of ControllerBase for APIs',
      wrong: `// BAD: Controller pulls in MVC view support — unnecessary in a pure API
public class ProductsController : Controller
{
    [HttpGet]
    public IActionResult GetAll() => Ok(_products);
}`,
      right: `// GOOD: ControllerBase is the correct base for API controllers
public class ProductsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll() => Ok(_products);
}`,
      explanation: 'Controller inherits ControllerBase and adds View(), PartialView(), ViewBag, and TempData — none of which are needed in a JSON API. Inheriting Controller increases the class surface, confuses developers, and can trigger unnecessary middleware (view component scanning). Always use ControllerBase for APIs.',
    },
    {
      title: 'Returning null instead of NotFound() when a resource does not exist',
      wrong: `[HttpGet("{id:int}")]
public ActionResult<Product> Get(int id)
{
    // BAD: null → 200 OK with null body; client cannot distinguish from "found but empty"
    return _products.FirstOrDefault(p => p.Id == id);
}`,
      right: `[HttpGet("{id:int}")]
public ActionResult<Product> Get(int id)
{
    var product = _products.FirstOrDefault(p => p.Id == id);
    // GOOD: 404 is the correct REST response for a missing resource
    return product is null ? NotFound() : product;
}`,
      explanation: 'Returning null from ActionResult<T> serialises to a 200 OK with a null JSON body. REST clients and generated HTTP clients interpret 200 as success and will try to deserialise null as a valid Product — crashing or silently corrupting state. Return NotFound() (404) for missing resources and NoContent() (204) when there is intentionally no body.',
    },
    {
      title: 'Checking ModelState.IsValid manually when [ApiController] is present',
      wrong: `[ApiController]
[HttpPost]
public IActionResult Create(CreateProductDto dto)
{
    // REDUNDANT: [ApiController] already returns 400 before this line runs
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var product = _service.Create(dto);
    return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
}`,
      right: `[ApiController]
[HttpPost]
public IActionResult Create(CreateProductDto dto)
{
    // GOOD: ModelState is already validated; if we're here, it's valid
    var product = _service.Create(dto);
    return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
}`,
      explanation: '[ApiController] registers an implicit action filter that checks ModelState before the action executes and short-circuits with a 400 ValidationProblemDetails if invalid. The manual check is dead code — it can never be reached with an invalid ModelState. Remove it to keep actions clean.',
    },
    {
      title: 'Using HttpContext.RequestServices (service locator) inside actions',
      wrong: `[HttpPost]
public IActionResult Create(CreateProductDto dto)
{
    // BAD: hidden dependency, bypasses scope validation, untestable
    var service = HttpContext.RequestServices.GetRequiredService<IProductService>();
    return Ok(service.Create(dto));
}`,
      right: `// GOOD: inject in the constructor — explicit, validated, testable
public class ProductsController(IProductService service) : ControllerBase
{
    [HttpPost]
    public IActionResult Create(CreateProductDto dto)
        => Ok(service.Create(dto));
}`,
      explanation: 'Using the service locator pattern inside actions hides dependencies from the constructor signature, prevents DI scope validation from detecting captive dependencies, and forces unit tests to set up an entire IServiceProvider. Constructor injection is explicit, automatically validated by the DI container, and trivial to mock in tests.',
    },
    {
      title: 'Using string URL in CreatedAtAction instead of action name',
      wrong: `[HttpPost]
public IActionResult Create(CreateProductDto dto)
{
    var product = _service.Create(dto);
    // BAD: hard-coded URL — breaks silently if the GET route is renamed or moves
    return Created(\$"/api/products/{product.Id}", product);
}`,
      right: `[HttpPost]
public IActionResult Create(CreateProductDto dto)
{
    var product = _service.Create(dto);
    // GOOD: URL is generated from the action name via the route table
    return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
}`,
      explanation: 'Created() with a hard-coded URL string breaks silently if the GET route is renamed, versioned, or moved — the Location header points to a 404 with no compile-time warning. CreatedAtAction() generates the URL from the route table at runtime, so it automatically follows route renames and remains correct after refactoring.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core API controllers inherit ControllerBase (not Controller), use [ApiController] for binding inference and automatic validation, and return ActionResult<T> for typed responses — CreatedAtAction, Problem(), and ProducesResponseType complete the REST contract.',
    mustKnow: [
      'Inherit <code>ControllerBase</code> for APIs — <code>Controller</code> adds MVC view support that is unnecessary and confusing',
      '<code>[ApiController]</code>: binding source inference, auto-400 on invalid ModelState, ProblemDetails format',
      '<code>ActionResult&lt;T&gt;</code> over <code>IActionResult</code> — exposes the success type to OpenAPI generators',
      '<code>CreatedAtAction(nameof(GetById), new { id }, obj)</code> — 201 Created with Location header generated from route table',
      '<code>Problem(title, detail, statusCode)</code> — RFC 9457 ProblemDetails response for domain errors',
      '<code>[ProducesResponseType&lt;T&gt;(200)]</code> and <code>[ProducesResponseType(404)]</code> — document all response variants for OpenAPI',
      '<code>[FromServices]</code> on action parameters — inject a service needed only in one action without bloating the constructor',
    ],
    interviewFocus: [
      'What does [ApiController] do beyond marking a class as a controller?',
      'Why use ActionResult<T> instead of IActionResult?',
      'How does CreatedAtAction differ from Created() with a URI string?',
      'What is binding source inference and how does it work with [ApiController]?',
      'How do you document multiple possible response types for a single action?',
    ],
  };
}
