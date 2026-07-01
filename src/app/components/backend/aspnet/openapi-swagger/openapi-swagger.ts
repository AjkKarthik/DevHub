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
  selector: 'app-aspnet-openapi-swagger',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './openapi-swagger.html',
  styleUrl: './openapi-swagger.scss',
})
export class AspnetOpenApiSwagger {

  prerequisites: Prerequisite[] = [
    { label: 'Minimal APIs', route: '/aspnet/minimal-apis' },
    { label: 'Controllers & Actions', route: '/aspnet/controllers' },
    { label: 'Error Handling', route: '/aspnet/error-handling' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddOpenApi()',           type: 'method',  desc: '.NET 9+ built-in: registers OpenAPI document generation' },
    { name: 'MapOpenApi()',           type: 'method',  desc: 'Exposes the OpenAPI JSON at /openapi/{name}.json' },
    { name: '.WithSummary()',         type: 'method',  desc: 'Short one-line description on a minimal API endpoint' },
    { name: '.WithDescription()',     type: 'method',  desc: 'Longer markdown description for the OpenAPI operation' },
    { name: '.WithTags()',            type: 'method',  desc: 'Groups endpoints in the Swagger/Scalar UI sidebar' },
    { name: '.Produces<T>()',         type: 'method',  desc: 'Declares a success response shape for OpenAPI' },
    { name: '.ProducesProblem()',     type: 'method',  desc: 'Declares a ProblemDetails error response in the spec' },
    { name: '.ExcludeFromDescription()', type: 'method', desc: 'Hides the endpoint from the generated OpenAPI spec' },
    { name: 'TypedResults',          type: 'class',   desc: 'Compile-time response types — OpenAPI infers schema without attributes' },
    { name: 'SwaggerUI / Scalar',    type: 'keyword', desc: 'UI that renders the OpenAPI spec as interactive docs' },
    { name: 'NSwag / Kiota',         type: 'keyword', desc: 'Generate typed C#/TypeScript clients from the spec' },
    { name: 'Results<T1,T2>',        type: 'type',    desc: 'Union return type for minimal APIs — OpenAPI infers all response shapes' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Built-in OpenAPI (.NET 9+)',
      points: [
        '<code>builder.Services.AddOpenApi()</code> registers the document-generation services. <code>app.MapOpenApi()</code> exposes the spec at <code>/openapi/v1.json</code> (the document name defaults to "v1"). No Swashbuckle package needed.',
        'The document is built from endpoint metadata — route templates, TypedResults types, <code>.Produces&lt;T&gt;()</code>, <code>.WithSummary()</code>, XML doc comments, and endpoint filters that implement <code>IEndpointMetadataProvider</code>.',
        'Enable the Swagger UI in development by installing <strong>Scalar.AspNetCore</strong> and calling <code>app.MapScalarApiReference()</code>, or Swashbuckle for the classic UI — never expose either in production without authentication.',
        'Multiple document versions: <code>AddOpenApi("v1")</code> + <code>AddOpenApi("v2")</code> + two <code>MapOpenApi()</code> calls. Pair with Asp.Versioning for route-based versioning.',
        'The built-in generator is AOT-compatible and produces smaller binaries. For existing .NET 8 or controller-heavy apps, Swashbuckle remains the most feature-rich option.',
        'Call <code>app.MapOpenApi().RequireAuthorization()</code> to restrict spec access in non-development environments — the spec exposes your entire API surface.',
      ],
    },
    {
      heading: 'Enriching Minimal API Operations',
      points: [
        'Chain <code>.WithSummary("Get product by ID")</code>, <code>.WithDescription("Returns 404 when not found")</code>, and <code>.WithTags("Products")</code> on each endpoint or on a <code>MapGroup()</code> to apply to all group members.',
        '<code>.Produces&lt;T&gt;(200)</code> and <code>.ProducesProblem(404)</code> declare response shapes explicitly. With <code>TypedResults</code> and <code>Results&lt;T1,T2&gt;</code> return types, the generator infers these at compile time — no attributes needed.',
        '<code>.ExcludeFromDescription()</code> hides an endpoint (health check, internal redirect, error page) from the spec entirely — clients should never call these directly.',
        '<code>.WithOpenApi(op => { op.Summary = "…"; op.Deprecated = true; return op; })</code> gives direct access to the OpenApiOperation object for fine-grained control.',
        'Use <code>Results&lt;Ok&lt;T&gt;, NotFound, BadRequest&lt;ProblemDetails&gt;&gt;</code> union return types — the OpenAPI generator enumerates all generic type parameters and adds them as separate response entries in the spec.',
        '<code>.WithName("GetProductById")</code> sets the operationId used by client generators to name methods — choose stable, meaningful names to avoid breaking generated clients.',
      ],
    },
    {
      heading: 'Controllers & XML Doc Comments',
      points: [
        'Enable XML documentation in the <code>.csproj</code>: <code>&lt;GenerateDocumentationFile&gt;true&lt;/GenerateDocumentationFile&gt;</code>. With Swashbuckle, pass the XML file path to <code>c.IncludeXmlComments(path)</code>.',
        'Use <code>/// &lt;summary&gt;</code> on action methods and <code>/// &lt;response code="404"&gt;</code> to document status codes. These appear directly in Swagger UI and in generated clients as doc comments.',
        '<code>[ProducesResponseType&lt;T&gt;(200)]</code> and <code>[ProducesResponseType&lt;ProblemDetails&gt;(404)]</code> on controller actions declare response types in the spec. Prefer generic forms (<code>&lt;T&gt;</code>) over non-generic for schema accuracy.',
        '<code>[Produces("application/json")]</code> on the controller or action restricts content negotiation and sets the response content type in the spec — always add this on API controllers.',
        'Add <code>[SwaggerOperation(Summary = "…", Tags = new[] { "Products" })]</code> (Swashbuckle attribute) for richer metadata without cluttering XML comments.',
        'For controller-based auth documentation, call <code>c.AddSecurityDefinition("Bearer", ...)</code> + <code>c.AddSecurityRequirement(...)</code> in <code>AddSwaggerGen()</code> to add the Authorise button in Swagger UI.',
      ],
    },
    {
      heading: 'Generating Typed Clients (NSwag / Kiota)',
      points: [
        '<strong>NSwag</strong>: run <code>nswag openapi2csclient</code> or add the NSwag MSBuild target (<code>&lt;NSwagGenerate&gt;</code>) to regenerate a C# client on each build — keeps the spec and client in sync automatically.',
        '<strong>Kiota</strong> (Microsoft): <code>kiota generate -l CSharp -o ./ApiClient -d openapi.json</code> generates a modern client with request builders and models. Supports TypeScript, Python, Java, Ruby, Go, and PHP.',
        'Version your spec (<code>AddOpenApi("v2")</code>) before removing or changing fields — generated clients break on breaking changes. Communicate deprecations via <code>op.Deprecated = true</code> in the spec.',
        'Use operationId (<code>.WithName()</code>) as the method name in generated clients — stable, descriptive names prevent churn in generated code when routes change.',
        'For TypeScript frontends, Kiota or NSwag both generate strongly typed fetch/axios clients with models that match the server\'s response DTOs — no hand-written interfaces.',
        'Check the generated client into source control and diff it in PRs — breaking changes in the spec become visible in the generated code diff before they reach consumers.',
      ],
    },
    {
      heading: 'Security Definitions and API Versioning',
      points: [
        'Document bearer JWT auth: <code>c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" })</code> — adds the Authorise button in Swagger UI.',
        'Apply security globally: <code>c.AddSecurityRequirement(new OpenApiSecurityRequirement { ... })</code> in <code>AddSwaggerGen</code>. For selective application, use <code>[AllowAnonymous]</code> on endpoints that don\'t need auth.',
        'With <strong>Asp.Versioning.Http</strong>, add <code>builder.Services.AddApiVersioning()</code> + <code>AddOpenApi("v1")</code> / <code>AddOpenApi("v2")</code>. Use <code>IApiVersionDescriptionProvider</code> to enumerate versions and create one Swagger document per version.',
        'Scalar supports authentication configuration via <code>.WithPreferredScheme("Bearer").WithDefaultHttpClient()</code> — sets the default for "Try it out" calls.',
        'Gate the UI in production with <code>.RequireAuthorization("InternalOnly")</code> on the <code>MapScalarApiReference()</code> or <code>UseSwaggerUI()</code> path — or conditionally register only in Development.',
        'Operationally, keep the OpenAPI spec as a first-class CI artifact: generate it during build and run a diff against the published spec to catch unintentional breaking changes before deployment.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Built-in .NET 9',
      language: 'csharp',
      code: `// Program.cs (.NET 9+)
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();           // registers document generation

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                    // /openapi/v1.json
    app.MapScalarApiReference();         // /scalar/v1  (Scalar.AspNetCore NuGet)
}

var products = app.MapGroup("/products").WithTags("Products");

products.MapGet("/{id:int}",
    async (int id, IProductService svc) =>
    {
        var p = await svc.FindAsync(id);
        return p is null
            ? (Results<Ok<Product>, NotFound>)TypedResults.NotFound()
            : TypedResults.Ok(p);
    })
    .WithSummary("Get product by ID")
    .WithDescription("Returns 404 when the product does not exist.")
    .WithName("GetProductById");          // operationId for client generators

products.MapPost("/",
    async (CreateProductDto dto, IProductService svc) =>
    {
        var p = await svc.CreateAsync(dto);
        return TypedResults.Created(\`/products/\${p.Id}\`, p);
    })
    .WithSummary("Create a product")
    .ProducesProblem(400);               // explicit — body validation can fail

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

    // Bearer auth button in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type          = SecuritySchemeType.Http,
        Scheme        = "bearer",
        BearerFormat  = "JWT",
        Description   = "Enter your JWT token below"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        }, []
    }});
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
    /// <response code="404">Product not found — returns ProblemDetails.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType<Product>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> Get(int id,
        [FromServices] IProductService svc)
    {
        var p = await svc.FindAsync(id);
        return p is null ? NotFound() : Ok(p);
    }

    /// <summary>Creates a new product.</summary>
    /// <response code="201">Product created. Location header points to the new resource.</response>
    /// <response code="400">Validation failed.</response>
    [HttpPost]
    [ProducesResponseType<Product>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Product>> Create(
        CreateProductDto dto, [FromServices] IProductService svc)
    {
        var p = await svc.CreateAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = p.Id }, p);
    }
}`,
    },
    {
      label: 'NSwag Client Gen',
      language: 'csharp',
      code: `// nswag.json  (runs on MSBuild — regenerates client on each build)
{
  "runtime": "Net90",
  "documentGenerator": {
    "fromDocument": {
      "url": "http://localhost:5000/openapi/v1.json"
    }
  },
  "codeGenerators": {
    "openApiToCSharpClient": {
      "namespace": "MyApp.Client",
      "className": "{controller}Client",
      "output": "ApiClient.g.cs",
      "generateClientInterfaces": true,
      "generateResponseClasses": true,
      "exceptionClass": "ApiException"
    }
  }
}

// Generated usage (interface-backed for testing)
public class OrderService(IProductsClient client)
{
    public async Task<Product> GetOrThrowAsync(int id)
    {
        var p = await client.GetProductByIdAsync(id);
        return p ?? throw new NotFoundException(\$"Product {id} not found");
    }
}`,
    },
    {
      label: 'Scalar Setup',
      language: 'csharp',
      code: `// NuGet: Scalar.AspNetCore
// Program.cs
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                     // spec at /openapi/v1.json
    app.MapScalarApiReference(opts =>     // UI at /scalar/v1
        opts
            .WithTitle("DevHub API")
            .WithTheme(ScalarTheme.Moon)
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithPreferredScheme("Bearer"));
}

// Protect in staging — require an internal role
app.MapScalarApiReference()
   .RequireAuthorization("InternalOnly");

// Multiple versions
builder.Services.AddOpenApi("v1");
builder.Services.AddOpenApi("v2");

app.MapOpenApi("/openapi/{documentName}.json");
app.MapScalarApiReference(o => o.WithOpenApiRoutePattern("/openapi/{documentName}.json"));`,
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
    .WithDescription("Returns 404 when the product does not exist.")
    .WithName("GetProductById");

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
      explanation: 'AddOpenApi() registers the document-generation services in DI. MapOpenApi() exposes the generated spec as an HTTP endpoint at /openapi/v1.json (default document name "v1").',
    },
    {
      q: 'When you use TypedResults with Results<Ok<T>, NotFound>, what OpenAPI advantage do you get?',
      options: [
        'The endpoint runs faster at runtime',
        'Response schemas are inferred at compile time without [ProducesResponseType] attributes',
        'Swagger UI is automatically included',
        'The endpoint is excluded from the spec',
      ],
      answer: 1,
      explanation: 'TypedResults return types carry generic type parameters. OpenAPI source generators inspect these at compile time to generate accurate response schemas — no runtime attributes needed.',
    },
    {
      q: 'Which method hides an endpoint entirely from the generated OpenAPI spec?',
      options: ['.WithTags("hidden")', '.ExcludeFromDescription()', '.ProducesNoContent()', '.WithOpenApi(null)'],
      answer: 1,
      explanation: '.ExcludeFromDescription() marks the endpoint so OpenAPI document generators skip it. Use for health-check endpoints, internal redirects, and error re-execution paths.',
    },
    {
      q: 'What does .WithTags("Products") do in OpenAPI context?',
      options: [
        'Sets the HTTP header X-Tags on responses',
        'Groups the endpoint under a "Products" section in the Swagger/Scalar UI',
        'Adds caching tags to the response',
        'Restricts the endpoint to users with the Products role',
      ],
      answer: 1,
      explanation: '.WithTags() sets the OpenAPI "tags" array on the operation. Swagger UI and Scalar use this to group endpoints into named sections in the sidebar navigation.',
    },
    {
      q: 'Scalar / Swagger UI should be exposed in production without authentication.',
      options: [
        'True — they are read-only documentation',
        'False — they expose the full API surface and should be protected or disabled',
        'True, but only for GET endpoints',
        'False — they must be completely removed in production',
      ],
      answer: 1,
      explanation: 'Swagger UI / Scalar expose your full API contract including schemas and example payloads. Protect with .RequireAuthorization() or conditionally register only in Development.',
    },
    {
      q: 'What does .WithName("GetProductById") set in the OpenAPI spec?',
      options: [
        'The route template display name',
        'The operationId used by client generators to name methods',
        'The Swagger UI sidebar label',
        'The HTTP method override',
      ],
      answer: 1,
      explanation: '.WithName() sets the operationId in the OpenAPI spec. NSwag and Kiota use operationId as the method name in generated clients — stable, descriptive IDs prevent churn when routes change.',
    },
    {
      q: 'To enable XML doc comments in Swashbuckle, which .csproj property must be set?',
      options: [
        '<EnableXmlDocs>true</EnableXmlDocs>',
        '<GenerateDocumentationFile>true</GenerateDocumentationFile>',
        '<IncludeXmlComments>true</IncludeXmlComments>',
        '<XmlDocumentation>true</XmlDocumentation>',
      ],
      answer: 1,
      explanation: 'GenerateDocumentationFile tells the compiler to output an XML file with all triple-slash comments. You then pass its path to c.IncludeXmlComments() in AddSwaggerGen().',
    },
    {
      q: 'Which Microsoft tool generates strongly-typed clients from an OpenAPI spec and supports TypeScript, Python, Java, and more?',
      options: ['Swagger Codegen', 'NSwag', 'Kiota', 'AutoRest'],
      answer: 2,
      explanation: 'Kiota (by Microsoft) generates modern request-builder-style clients for C#, TypeScript, Python, Java, Go, Ruby, and PHP from any OpenAPI 3 spec. It is the recommended tool for multi-language client generation.',
    },
    {
      q: 'How do you add bearer JWT authentication to the Swagger UI "Authorise" button?',
      options: [
        'Add [Authorize] to the controller — Swashbuckle detects it automatically',
        'Call c.AddSecurityDefinition("Bearer", ...) + c.AddSecurityRequirement(...) in AddSwaggerGen()',
        'Set app.UseAuthentication() before app.UseSwagger()',
        'Set bearer = true in swaggerui options',
      ],
      answer: 1,
      explanation: 'AddSecurityDefinition registers the security scheme (type, scheme, bearerFormat). AddSecurityRequirement applies it globally so every operation shows the lock icon and the "Authorise" button appears in the UI.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between the built-in .NET 9 OpenAPI and Swashbuckle?',
      a: 'The built-in generator (Microsoft.AspNetCore.OpenApi) is leaner and AOT-compatible. Swashbuckle (Swashbuckle.AspNetCore) has a larger ecosystem, richer controller-attribute support, and more customisation options. For new .NET 9+ projects, prefer the built-in generator; for existing .NET 8 or controller-heavy apps, Swashbuckle remains the standard choice.',
    },
    {
      q: 'Do I need .Produces<T>() if I use TypedResults?',
      a: 'No. With TypedResults and Results<T1,T2> return types, the OpenAPI source generator infers response schemas at compile time. .Produces<T>() and .ProducesProblem() are still useful when the generator cannot infer the type — for example, IResult-returning lambdas with runtime branching or controller actions.',
    },
    {
      q: 'A team registers a global AddSecurityRequirement() for Bearer auth so every endpoint shows the lock icon in Swagger UI, but a handful of endpoints (health checks, a public webhook receiver) are intentionally anonymous. Does the global security requirement cause Swagger UI to send an Authorization header on requests to those anonymous endpoints even though they do not need one?',
      a: 'Yes, by default a global AddSecurityRequirement() applies the security scheme to every operation in the generated spec, so Swagger UI\'s "Try it out" feature will include whatever bearer token was entered via Authorise on every request, including ones to endpoints that never check it — this is usually harmless (the anonymous endpoint just ignores an unnecessary header) but is misleading documentation, since the OpenAPI spec now falsely implies those endpoints require authentication when they do not. The fix is either applying the security requirement per-operation instead of globally (attaching it only to operations that actually need it, via operation filters or explicit metadata), or explicitly clearing the security requirement for specific anonymous endpoints so the generated spec and Swagger UI accurately reflect which endpoints are actually open.',
    },
    {
      q: 'How do I version the OpenAPI document alongside API versioning?',
      a: 'With Asp.Versioning, call AddOpenApi("v1") and AddOpenApi("v2") and configure the version selector in AddApiVersioning. Each version gets its own spec at /openapi/v1.json and /openapi/v2.json. Wire Scalar or Swagger UI to list both documents via the version dropdown.',
    },
    {
      q: 'Can NSwag and Kiota generate TypeScript clients too?',
      a: 'Yes. NSwag supports TypeScript with Angular, Fetch, and Axios variants. Kiota supports TypeScript, Python, Java, Go, PHP, and Ruby in addition to C#. Kiota is the Microsoft-recommended tool for multi-language client generation at scale.',
    },
    {
      q: 'How should I handle breaking changes in my API spec?',
      a: 'Introduce a new version (AddOpenApi("v2")) before removing or changing fields. Mark deprecated operations with op.Deprecated = true in WithOpenApi(). Keep v1 alive for a deprecation period, then remove it. Generate the spec as a CI artifact and diff it against the published spec to catch unintentional breaking changes before deployment.',
    },
    {
      q: 'Why is .WithName() important for generated clients?',
      a: '.WithName() sets the operationId in the OpenAPI spec. Client generators (NSwag, Kiota) use operationId as the method name. Without it, generators derive names from routes — which change when routes are refactored, causing churn in generated client code and breaking callers.',
    },
    {
      q: 'Should I expose the OpenAPI spec endpoint in production?',
      a: 'Only with authentication. The spec reveals your entire API surface, parameter names, schemas, and error shapes — useful for attackers. Either disable it completely in production, or restrict the MapOpenApi() and Scalar/Swagger UI endpoints with .RequireAuthorization("InternalOnly"). Many teams expose a static spec file (generated at build time) via a CDN instead.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Exposing Swagger UI / Scalar in production without auth',
      wrong: `// Program.cs — no environment check
app.MapOpenApi();
app.MapScalarApiReference();   // ❌ — open to the internet in production`,
      right: `if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();   // ✓ — development only
}
// OR protect in staging/prod:
app.MapScalarApiReference().RequireAuthorization("InternalOnly");`,
      explanation: 'Swagger UI and Scalar expose your entire API surface — routes, schemas, parameter names, error shapes. In production, either disable them or require authentication.',
    },
    {
      title: 'Using IResult return type and losing response schema inference',
      wrong: `app.MapGet("/products/{id:int}", async (int id, IProductService svc) =>
{
    var p = await svc.FindAsync(id);
    return p is null ? Results.NotFound() : Results.Ok(p);  // ❌ IResult — no type info
});
// OpenAPI spec: responses: {} — no schema generated`,
      right: `app.MapGet("/products/{id:int}",
    async (int id, IProductService svc) =>
    {
        var p = await svc.FindAsync(id);
        return p is null
            ? (Results<Ok<Product>, NotFound>)TypedResults.NotFound()
            : TypedResults.Ok(p);   // ✓ — compiler knows both shapes
    });
// OpenAPI spec includes Ok<Product> and NotFound schemas`,
      explanation: 'Results.Ok() returns IResult — the generator has no type to inspect. TypedResults.Ok<T>() carries the generic parameter; Results<T1,T2> tells the generator about every possible response.',
    },
    {
      title: 'Forgetting AddEndpointsApiExplorer() with Swashbuckle for minimal APIs',
      wrong: `builder.Services.AddSwaggerGen();   // ❌ — minimal API endpoints not discovered
// Swagger UI shows 0 endpoints`,
      right: `builder.Services.AddEndpointsApiExplorer();  // ✓ — discovers minimal API endpoints
builder.Services.AddSwaggerGen();`,
      explanation: 'Swashbuckle uses IApiDescriptionProvider to discover endpoints. For minimal APIs, AddEndpointsApiExplorer() registers the provider. Without it, the generated spec is empty. (The built-in .NET 9 generator does not need this call.)',
    },
    {
      title: 'Omitting operationId (.WithName) on endpoints used by client generators',
      wrong: `products.MapGet("/{id:int}", handler);   // ❌ — no operationId
// NSwag generates: GetProductsIdAsync — or a random name
// Route rename → generated method name changes → callers break`,
      right: `products.MapGet("/{id:int}", handler)
    .WithName("GetProductById");   // ✓ — stable operationId
// NSwag always generates: GetProductByIdAsync
// Route can change without touching the generated client`,
      explanation: '.WithName() sets a stable operationId. Without it, generators derive names from routes — which change when routes are refactored, causing generated client method names to change and breaking callers.',
    },
    {
      title: 'Generating XML docs but not passing the file path to IncludeXmlComments',
      wrong: `// .csproj: <GenerateDocumentationFile>true</GenerateDocumentationFile>
builder.Services.AddSwaggerGen();   // ❌ — XML file generated but not wired in
// Swagger UI shows no summaries`,
      right: `var xmlFile = \`\${Assembly.GetExecutingAssembly().GetName().Name}.xml\`;
var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
builder.Services.AddSwaggerGen(c =>
    c.IncludeXmlComments(xmlPath));   // ✓ — summaries appear in Swagger UI`,
      explanation: 'GenerateDocumentationFile outputs the XML file but Swashbuckle does not read it automatically. You must explicitly pass the file path to IncludeXmlComments() for summaries and response comments to appear.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'OpenAPI documents your API surface as a machine-readable spec; AddOpenApi()+MapOpenApi() is the .NET 9 built-in way, while Swashbuckle+Scalar provide richer UIs and client generation via NSwag or Kiota.',
    mustKnow: [
      'AddOpenApi() + MapOpenApi() is the .NET 9 built-in approach; Swashbuckle needs AddEndpointsApiExplorer() for minimal APIs',
      'TypedResults + Results<T1,T2> enables compile-time schema inference — no [ProducesResponseType] attributes needed',
      '.WithName() sets operationId — critical for stable generated client method names',
      '.ExcludeFromDescription() hides internal endpoints (health checks, error pages) from the spec',
      'Never expose Swagger UI / Scalar in production without authentication',
      'AddSecurityDefinition + AddSecurityRequirement adds the JWT Authorise button to Swagger UI',
      'Kiota is the Microsoft-recommended tool for generating typed clients across multiple languages from OpenAPI specs',
    ],
    interviewFocus: [
      'What is the difference between AddOpenApi() and AddSwaggerGen()/Swashbuckle?',
      'Why does TypedResults enable better OpenAPI schema generation than Results.Ok()?',
      'Why is .WithName() important for generated API clients?',
      'How do you secure Swagger UI in a production environment?',
      'What is the difference between NSwag and Kiota for client generation?',
    ],
  };
}
