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
  selector: 'app-aspnet-openapi-swagger',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './openapi-swagger.html',
  styleUrl: './openapi-swagger.scss',
})
export class AspnetOpenApiSwagger {

  quickRef: QuickRefItem[] = [
    { name: 'AddOpenApi()',          type: 'method',  desc: '.NET 9+ built-in: registers OpenAPI document generation' },
    { name: 'MapOpenApi()',          type: 'method',  desc: 'Exposes the OpenAPI JSON at /openapi/{name}.json' },
    { name: '.WithSummary()',        type: 'method',  desc: 'Short one-line description on a minimal API endpoint' },
    { name: '.WithDescription()',    type: 'method',  desc: 'Longer markdown description for the OpenAPI operation' },
    { name: '.WithTags()',           type: 'method',  desc: 'Groups endpoints in the Swagger UI sidebar' },
    { name: '.Produces<T>()',        type: 'method',  desc: 'Declares a success response shape for OpenAPI' },
    { name: '.ProducesProblem()',    type: 'method',  desc: 'Declares a ProblemDetails error response' },
    { name: 'TypedResults',         type: 'class',   desc: 'Compile-time response types — OpenAPI infers schema without attributes' },
    { name: 'SwaggerUI / Scalar',   type: 'keyword',    desc: 'UI that renders the OpenAPI spec as interactive docs' },
    { name: 'NSwag / Kiota',        type: 'keyword',    desc: 'Generate typed C#/TypeScript clients from the spec' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Built-in OpenAPI (.NET 9+)',
      points: [
        '<code>builder.Services.AddOpenApi()</code> registers the document-generation services. <code>app.MapOpenApi()</code> exposes the spec at <code>/openapi/v1.json</code> (the document name defaults to "v1"). No Swashbuckle package needed.',
        'The document is built from endpoint metadata — route templates, TypedResults types, <code>.Produces&lt;T&gt;()</code>, <code>.WithSummary()</code>, and XML doc comments. The more metadata you add, the richer the spec.',
        'Enable the Swagger UI in development by installing <strong>Scalar.AspNetCore</strong> or <strong>Swashbuckle.AspNetCore.SwaggerUI</strong> and calling <code>app.MapScalarApiReference()</code> / <code>app.UseSwaggerUI()</code> — never expose UI in production without auth.',
      ],
    },
    {
      heading: 'Enriching Minimal API Operations',
      points: [
        'Chain <code>.WithSummary("Get product by ID")</code>, <code>.WithDescription("Returns 404 when the product does not exist")</code>, and <code>.WithTags("Products")</code> on each endpoint or on a <code>MapGroup()</code> to tag the whole group at once.',
        '<code>.Produces&lt;T&gt;(200)</code> and <code>.ProducesProblem(404)</code> declare response shapes. With <code>TypedResults</code> and <code>Results&lt;T1,T2&gt;</code> return types the generator infers these automatically — no need for the attributes.',
        '<code>.ExcludeFromDescription()</code> hides an endpoint (health check, internal redirect) from the spec entirely.',
      ],
    },
    {
      heading: 'Controllers & XML Doc Comments',
      points: [
        'Enable XML documentation in the <code>.csproj</code>: <code>&lt;GenerateDocumentationFile&gt;true&lt;/GenerateDocumentationFile&gt;</code>. Add the XML file path to Swashbuckle\'s <code>IncludeXmlComments()</code>.',
        'Use <code>/// &lt;summary&gt;</code> on action methods and <code>[ProducesResponseType&lt;T&gt;(200)]</code> on the controller for Swashbuckle. For the built-in .NET 9 generator, use <code>.WithOpenApi(op =&gt; { op.Summary = "…"; return op; })</code>.',
        '<code>[SwaggerOperation]</code> and <code>[SwaggerResponse]</code> (Swashbuckle) give finer control over the Swagger metadata from controller attributes.',
      ],
    },
    {
      heading: 'Generating Typed Clients (NSwag / Kiota)',
      points: [
        '<strong>NSwag</strong>: run <code>nswag openapi2csclient</code> to generate a C# client from the spec. Add the NSwag MSBuild target to regenerate on build — the spec and client stay in sync.',
        '<strong>Kiota</strong> (Microsoft): <code>kiota generate -l CSharp -o ./ApiClient -d openapi.json</code> generates a modern client with request builders and models. Supports TypeScript, Python, Java, and more.',
        'Version your spec (<code>AddOpenApi("v2")</code>) before removing or changing fields — generated clients break when the spec changes incompatibly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Built-in .NET 9',
      language: 'csharp',
      code: `// Program.cs (.NET 9+)
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();           // adds document generation

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                    // /openapi/v1.json
    app.MapScalarApiReference();         // /scalar/v1  (Scalar NuGet)
}

var products = app.MapGroup("/products").WithTags("Products");

products.MapGet("/{id:int}",
    async Task<Results<Ok<Product>, NotFound>> (int id, IProductService svc) =>
    {
        var p = await svc.FindAsync(id);
        return p is null ? TypedResults.NotFound() : TypedResults.Ok(p);
    })
    .WithSummary("Get product by ID")
    .WithDescription("Returns 404 when the product does not exist.");

products.MapPost("/",
    async Task<Created<Product>> (CreateProductDto dto, IProductService svc) =>
    {
        var p = await svc.CreateAsync(dto);
        return TypedResults.Created(\`/products/\${p.Id}\`, p);
    })
    .WithSummary("Create a product")
    .Produces<Product>(201)
    .ProducesProblem(400);

app.Run();`,
    },
    {
      label: 'Swashbuckle (.NET 8)',
      language: 'csharp',
      code: `// NuGet: Swashbuckle.AspNetCore
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "My API", Version = "v1" });

    // Include XML doc comments
    var xml = Path.Combine(AppContext.BaseDirectory,
        \`\${Assembly.GetExecutingAssembly().GetName().Name}.xml\`);
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API v1"));
}`,
    },
    {
      label: 'Controller XML Docs',
      language: 'csharp',
      code: `/// <summary>Manages the product catalogue.</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    /// <summary>Returns a single product.</summary>
    /// <param name="id">The product identifier.</param>
    /// <response code="200">Product found.</response>
    /// <response code="404">Product not found.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType<Product>(200)]
    [ProducesResponseType<ProblemDetails>(404)]
    public async Task<ActionResult<Product>> Get(int id, IProductService svc)
    {
        var p = await svc.FindAsync(id);
        return p is null ? NotFound() : Ok(p);
    }
}`,
    },
    {
      label: 'NSwag Client Gen',
      language: 'csharp',
      code: `// nswag.json  (runs on MSBuild — regenerates client on each build)
{
  "runtime": "Net80",
  "defaultVariables": null,
  "documentGenerator": {
    "fromDocument": {
      "url": "http://localhost:5000/openapi/v1.json",
      "output": null
    }
  },
  "codeGenerators": {
    "openApiToCSharpClient": {
      "namespace": "MyApp.Client",
      "className": "{controller}Client",
      "output": "ApiClient.g.cs",
      "generateClientInterfaces": true
    }
  }
}

// Generated usage
var client = new ProductsClient(new HttpClient { BaseAddress = new("http://localhost:5000") });
var product = await client.GetAsync(42);`,
    },
    {
      label: 'Scalar Setup',
      language: 'csharp',
      code: `// NuGet: Scalar.AspNetCore
// Program.cs
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                   // spec at /openapi/v1.json
    app.MapScalarApiReference(opts =>   // UI at /scalar/v1
        opts.WithTitle("My API")
            .WithTheme(ScalarTheme.Moon)
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient));
}

// Protect Swagger UI in staging/production:
app.MapScalarApiReference().RequireAuthorization("InternalOnly");`,
    },
  ];

  challenge: Challenge = {
    title: 'Document a Products API',
    language: 'csharp',
    description: 'Set up .NET 9 OpenAPI for a minimal Products API. Requirements: (1) Register AddOpenApi() and MapOpenApi(). (2) Add a GET /products/{id:int} endpoint using TypedResults.Ok<Product> or NotFound — the spec should infer both response types. (3) Enrich the endpoint with WithSummary, WithDescription, and WithTags("Products"). (4) Add a POST /products endpoint that returns TypedResults.Created<Product>.',
    hints: [
      'AddOpenApi() registers the generator; MapOpenApi() exposes /openapi/v1.json',
      'TypedResults return types are inferred automatically — no .Produces() needed',
      'Chain .WithSummary().WithDescription().WithTags() on the endpoint or MapGroup',
      'TypedResults.Created($"/products/{p.Id}", p) returns 201 with a Location header',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
// TODO: register OpenAPI

var app = builder.Build();
// TODO: expose the OpenAPI spec (dev only)

var products = app.MapGroup("/products");

// TODO: GET /{id:int} — returns Ok<Product> or NotFound, with summary/tags
// TODO: POST / — returns Created<Product>

app.Run();

record Product(int Id, string Name, decimal Price);
record CreateProductDto(string Name, decimal Price);`,
    solution: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

var store = new List<Product> { new(1, "Laptop", 999.99m) };

var products = app.MapGroup("/products").WithTags("Products");

products.MapGet("/{id:int}",
    (int id) =>
    {
        var p = store.FirstOrDefault(x => x.Id == id);
        return p is null
            ? (Results<Ok<Product>, NotFound>)TypedResults.NotFound()
            : TypedResults.Ok(p);
    })
    .WithSummary("Get product by ID")
    .WithDescription("Returns 404 when the product does not exist.");

products.MapPost("/",
    (CreateProductDto dto) =>
    {
        var p = new Product(store.Count + 1, dto.Name, dto.Price);
        store.Add(p);
        return TypedResults.Created(\`/products/\${p.Id}\`, p);
    })
    .WithSummary("Create a product");

app.Run();

record Product(int Id, string Name, decimal Price);
record CreateProductDto(string Name, decimal Price);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which two calls enable the built-in .NET 9 OpenAPI document generation?',
      options: [
        'AddSwaggerGen() + UseSwagger()',
        'AddOpenApi() + MapOpenApi()',
        'AddEndpointsApiExplorer() + MapOpenApi()',
        'AddOpenApi() + UseOpenApi()',
      ],
      answer: 1,
      explanation: 'AddOpenApi() registers the document-generation services. MapOpenApi() exposes the generated spec as an HTTP endpoint (default: /openapi/v1.json).',
    },
    {
      q: 'When you use TypedResults with Results<Ok<T>, NotFound>, what OpenAPI advantage do you get?',
      options: [
        'The endpoint runs faster',
        'Response schemas are inferred at compile time without [ProducesResponseType] attributes',
        'Swagger UI is automatically included',
        'The endpoint is excluded from the spec',
      ],
      answer: 1,
      explanation: 'TypedResults return types carry generic type parameters. OpenAPI source generators can inspect these at compile time to generate accurate response schemas — no runtime attributes needed.',
    },
    {
      q: 'Which method hides an endpoint entirely from the generated OpenAPI spec?',
      options: ['.WithTags("hidden")', '.ExcludeFromDescription()', '.ProducesNoContent()', '.WithOpenApi(null)'],
      answer: 1,
      explanation: '.ExcludeFromDescription() marks the endpoint so OpenAPI document generators skip it. Useful for health-check endpoints, internal redirects, and error endpoints.',
    },
    {
      q: 'What does .WithTags("Products") do?',
      options: [
        'Sets the HTTP header X-Tags on responses',
        'Groups the endpoint under a "Products" section in the Swagger/Scalar UI',
        'Adds caching tags to the response',
        'Restricts the endpoint to users with the Products role',
      ],
      answer: 1,
      explanation: '.WithTags() sets the OpenAPI "tags" array on the operation. Swagger UI and Scalar use this to group endpoints into named sections in the sidebar.',
    },
    {
      q: 'Swagger UI and Scalar should be exposed in production without authentication.',
      options: ['True — they are read-only documentation', 'False — they expose your API surface and should be protected or disabled', 'True, but only for GET endpoints', 'False — they must be disabled completely in production'],
      answer: 1,
      explanation: 'Swagger UI / Scalar expose your full API contract including schemas and example payloads. In production, either disable them or require authentication (e.g., .RequireAuthorization("InternalOnly")).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between the built-in .NET 9 OpenAPI and Swashbuckle?',
      a: 'The built-in generator (Microsoft.AspNetCore.OpenApi) is leaner and AOT-compatible. Swashbuckle (Swashbuckle.AspNetCore) has a larger ecosystem, richer controller-attribute support, and more customisation options. For new .NET 9+ projects, prefer the built-in generator; for existing .NET 8 or controller-heavy apps, Swashbuckle is still the standard choice.',
    },
    {
      q: 'Do I need .Produces<T>() if I use TypedResults?',
      a: 'No. With TypedResults and Results<T1,T2> return types the OpenAPI source generator infers response schemas at compile time. .Produces<T>() and .ProducesProblem() are still useful when the generator cannot infer the type — for example, IResult-returning lambdas or controller actions.',
    },
    {
      q: 'How do I add bearer token authentication to Swagger UI?',
      a: 'With Swashbuckle, call c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { ... }) and c.AddSecurityRequirement(...) in AddSwaggerGen(). With Scalar, call .WithDefaultHttpClient() and configure authentication via .WithPreferredScheme("Bearer"). The UI then shows an Authorise button.',
    },
    {
      q: 'How do I version the OpenAPI document alongside API versioning?',
      a: 'With Asp.Versioning, call AddOpenApi("v1") and AddOpenApi("v2") and configure the version selector in AddApiVersioning. Each version gets its own spec at /openapi/v1.json and /openapi/v2.json. Wire Swagger UI to list both documents.',
    },
    {
      q: 'Can NSwag and Kiota generate TypeScript clients too?',
      a: 'Yes. NSwag supports TypeScript (Angular, Fetch, Axios). Kiota supports TypeScript, Python, Java, Go, PHP, and Ruby in addition to C#. Kiota is the Microsoft-recommended tool for generating clients from OpenAPI specs at scale.',
    },
  ];
}
