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
  selector: 'app-aspnet-controllers',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './controllers.html',
  styleUrl: './controllers.scss',
})
export class AspnetControllers {

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
      heading: 'ControllerBase vs Controller',
      points: [
        'For Web APIs always inherit <code>ControllerBase</code>, not <code>Controller</code>. <code>Controller</code> adds View(), ViewBag, and TempData for MVC rendering — none of which are useful in a pure API.',
        '<code>[ApiController]</code> enables three key behaviours: <strong>binding source inference</strong> (no explicit [FromBody] needed), <strong>automatic 400</strong> when ModelState is invalid, and explicit <code>[FromForm]</code> requirement for multipart data.',
        'Apply <code>[ApiController]</code> at the assembly level to avoid repeating it: <code>[assembly: ApiController]</code>. Use <code>[IgnoreApiController]</code> on controllers that should opt out.',
      ],
    },
    {
      heading: 'Action Results & Status Codes',
      points: [
        'Prefer <code>ActionResult&lt;T&gt;</code> over <code>IActionResult</code> when the success type is known — it makes the return type explicit for OpenAPI generation.',
        'Return <code>T</code> directly for 200 OK, or use helpers: <code>Ok()</code>, <code>NotFound()</code>, <code>BadRequest()</code>, <code>NoContent()</code>, <code>Conflict()</code>, <code>UnprocessableEntity()</code>.',
        '<code>CreatedAtAction(nameof(Get), new { id }, obj)</code> returns 201 Created with a <strong>Location header</strong> pointing to the new resource.',
        '<code>[ProducesResponseType&lt;T&gt;(200)]</code> and <code>[ProducesResponseType(404)]</code> document response shapes for Swagger and generated clients.',
      ],
    },
    {
      heading: 'Content Negotiation',
      points: [
        'ASP.NET Core controllers support content negotiation out of the box — the client sends <code>Accept: application/xml</code> and the server picks the best formatter.',
        'Register XML support with <code>builder.Services.AddControllers().AddXmlSerializerFormatters()</code> — no action code changes needed.',
        'Use <code>[Produces("application/json")]</code> and <code>[Consumes("application/json")]</code> to constrain accepted/returned types at the action level.',
      ],
    },
    {
      heading: 'Dependency Injection in Controllers',
      points: [
        'Inject services via the constructor. Controllers are instantiated per-request so <strong>Scoped</strong> services (e.g., DbContext) are safe.',
        'Avoid the service locator anti-pattern — never call <code>HttpContext.RequestServices.GetService&lt;T&gt;()</code> inside actions.',
        'For property injection, use <code>[FromServices]</code> on action parameters when a dependency is only needed for one action.',
      ],
    },
    {
      heading: 'Routing & Constraints',
      points: [
        'Controller routing combines the class-level <code>[Route]</code> template with method-level <code>[HttpVerb]</code> templates. <code>[controller]</code> is replaced with the class name minus "Controller".',
        'Route constraints work the same as in minimal APIs: <code>{id:int}</code>, <code>{slug:alpha}</code>, <code>{version:apiVersion}</code>.',
        'Conventional routing (<code>app.MapControllerRoute</code>) is an alternative to attribute routing — useful for MVC page conventions but rarely used in pure APIs.',
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
  ];
}
