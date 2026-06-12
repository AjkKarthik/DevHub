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
  selector: 'app-aspnet-api-versioning',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './api-versioning.html',
  styleUrl: './api-versioning.scss',
})
export class AspnetApiVersioning {

  quickRef: QuickRefItem[] = [
    { name: 'AddApiVersioning()',          type: 'method',    desc: 'Registers versioning services; configure strategies here' },
    { name: 'AddVersionedApiExplorer()',   type: 'method',    desc: 'Integrates versioning with API Explorer for Swagger/OpenAPI' },
    { name: '[ApiVersion("2.0")]',         type: 'decorator', desc: 'Declares the version(s) a controller or endpoint supports' },
    { name: '[MapToApiVersion("2.0")]',    type: 'decorator', desc: 'Maps a single action to one version inside a multi-version controller' },
    { name: '[Deprecated]',               type: 'decorator', desc: 'Marks a version as deprecated — clients see it in the response' },
    { name: 'AssumeDefaultVersionWhenUnspecified', type: 'keyword', desc: 'Applies the default version when the caller omits the version' },
    { name: 'ReportApiVersions',          type: 'keyword',   desc: 'Adds api-supported-versions / api-deprecated-versions headers' },
    { name: 'IApiVersioningFeature',      type: 'interface', desc: 'Access the negotiated version inside a handler at runtime' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Versioning Strategies',
      points: [
        '<strong>URL segment</strong> (<code>/api/v1/products</code>) is the most explicit — version is visible in every URL, easy to test in a browser, and easy to document.',
        '<strong>Query string</strong> (<code>?api-version=2.0</code>) keeps URLs clean but is easy to overlook in docs. Good for optional versioning or when URL changes break existing link contracts.',
        '<strong>Header</strong> (<code>x-api-version: 2.0</code>) keeps URLs clean and is popular in B2B APIs, but is invisible without a tool like Swagger UI or curl.',
        'All three strategies can be enabled simultaneously — the negotiator picks the first match in the configured order. Consumers choose the strategy that fits their client.',
      ],
    },
    {
      heading: 'Setting Up Asp.Versioning',
      points: [
        'Install <code>Asp.Versioning.Http</code> (minimal APIs) or <code>Asp.Versioning.Mvc</code> (controllers). Call <code>builder.Services.AddApiVersioning()</code> with your strategy and defaults.',
        '<code>AssumeDefaultVersionWhenUnspecified = true</code> allows existing clients that don\'t send a version to keep working — essential for non-breaking rollout.',
        '<code>ReportApiVersions = true</code> adds <code>api-supported-versions</code> and <code>api-deprecated-versions</code> response headers so clients can discover what is available.',
      ],
    },
    {
      heading: 'Versioning Controllers',
      points: [
        'Decorate the controller with <code>[ApiVersion("1.0")]</code>. For actions that differ between versions in the same controller, add <code>[MapToApiVersion("2.0")]</code> to the method.',
        'Mark old versions <code>[ApiVersion("1.0", Deprecated = true)]</code> before removal. Deprecated versions still work — clients see the <code>api-deprecated-versions</code> response header.',
        'Create separate controller classes per version for large surface-area changes: <code>ProductsV1Controller</code> / <code>ProductsV2Controller</code>. Both can share a service layer.',
      ],
    },
    {
      heading: 'Versioning Minimal APIs',
      points: [
        'Create a <code>NewApiVersionSet()</code> and attach it to route groups with <code>.WithApiVersionSet(versionSet)</code>. Map each endpoint to its supported version(s) with <code>.MapToApiVersion(1)</code>.',
        'Access the negotiated version at runtime via <code>HttpContext.GetRequestedApiVersion()</code>.',
        'Version-aware OpenAPI: call <code>AddOpenApi("v1")</code> and <code>AddOpenApi("v2")</code> and filter endpoints per version in the document options.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'csharp',
      code: `// NuGet: Asp.Versioning.Mvc (controllers) or Asp.Versioning.Http (minimal)
builder.Services.AddApiVersioning(opts =>
{
    opts.DefaultApiVersion               = new ApiVersion(1, 0);
    opts.AssumeDefaultVersionWhenUnspecified = true;
    opts.ReportApiVersions               = true;
    opts.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),          // /api/v1/…
        new QueryStringApiVersionReader(),         // ?api-version=1.0
        new HeaderApiVersionReader("x-api-version") // x-api-version: 1.0
    );
});`,
    },
    {
      label: 'Controller Versioning',
      language: 'csharp',
      code: `[ApiController]
[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int}")]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1(int id)
        => Ok(new { id, format = "legacy" });

    [HttpGet("{id:int}")]
    [MapToApiVersion("2.0")]
    public IActionResult GetV2(int id)
        => Ok(new { id, name = "Laptop", price = 999.99m });
}

// Deprecated controller — version still works, clients see the header
[ApiController]
[ApiVersion("0.9", Deprecated = true)]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsLegacyController : ControllerBase
{
    [HttpGet] public IActionResult Get() => Ok("Legacy v0.9");
}`,
    },
    {
      label: 'Minimal API Versioning',
      language: 'csharp',
      code: `// NuGet: Asp.Versioning.Http
var versionSet = app.NewApiVersionSet()
    .HasApiVersion(new ApiVersion(1))
    .HasApiVersion(new ApiVersion(2))
    .ReportApiVersions()
    .Build();

var products = app.MapGroup("/api/v{apiVersion:apiVersion}/products")
    .WithApiVersionSet(versionSet);

products.MapGet("/", () => new[] { new { id = 1, name = "Laptop" } })
        .MapToApiVersion(1)
        .MapToApiVersion(2);

products.MapGet("/{id:int}",
    (int id, HttpContext ctx) =>
    {
        var version = ctx.GetRequestedApiVersion()?.MajorVersion;
        return version == 2
            ? Results.Ok(new { id, name = "Laptop", price = 999.99m })
            : Results.Ok(new { id, format = "legacy" });
    });`,
    },
    {
      label: 'Versioned OpenAPI',
      language: 'csharp',
      code: `// One OpenAPI document per API version (.NET 9+)
builder.Services.AddOpenApi("v1");
builder.Services.AddOpenApi("v2");

// Filter endpoints into the correct document
builder.Services.Configure<OpenApiOptions>("v1", opts =>
    opts.ShouldInclude = (desc) =>
        desc.ActionDescriptor.EndpointMetadata
            .OfType<ApiVersionMetadata>()
            .Any(m => m.IsApiVersionNeutral ||
                      m.MappedApiVersions.Contains(new ApiVersion(1))));

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/v1.json", options =>
        options.DocumentName = "v1");
    app.MapOpenApi("/openapi/v2.json", options =>
        options.DocumentName = "v2");
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Version a Products API',
    language: 'csharp',
    description: 'Set up URL-segment API versioning for a Products controller. Requirements: (1) Register AddApiVersioning with URL segment reader, default version 1.0, AssumeDefaultVersionWhenUnspecified = true, and ReportApiVersions = true. (2) Create a controller that supports v1 and v2 at /api/v{version}/products. (3) GET in v1 returns { id, legacy: true }. (4) GET in v2 returns { id, name, price }. (5) Mark v1 as Deprecated.',
    hints: [
      'Route template: [Route("api/v{version:apiVersion}/[controller]")]',
      '[ApiVersion("1.0", Deprecated = true)] marks the version deprecated',
      '[MapToApiVersion("1.0")] and [MapToApiVersion("2.0")] on each action',
      'ReportApiVersions = true adds the api-supported-versions response header',
    ],
    starterCode: `// NuGet: Asp.Versioning.Mvc
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
// TODO: AddApiVersioning with URL segment, default v1, assume default, report versions

var app = builder.Build();
app.MapControllers();
app.Run();

// TODO: ProductsController supporting v1 (deprecated) and v2
// v1: GET returns { id, legacy = true }
// v2: GET returns { id, name = "Laptop", price = 999.99 }`,
    solution: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddApiVersioning(opts =>
{
    opts.DefaultApiVersion = new ApiVersion(1, 0);
    opts.AssumeDefaultVersionWhenUnspecified = true;
    opts.ReportApiVersions = true;
    opts.ApiVersionReader = new UrlSegmentApiVersionReader();
});

var app = builder.Build();
app.MapControllers();
app.Run();

[ApiController]
[ApiVersion("1.0", Deprecated = true)]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int}")]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1(int id)
        => Ok(new { id, legacy = true });

    [HttpGet("{id:int}")]
    [MapToApiVersion("2.0")]
    public IActionResult GetV2(int id)
        => Ok(new { id, name = "Laptop", price = 999.99m });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which versioning strategy makes the version most visible and easiest to test in a browser?',
      options: ['Header versioning', 'Query-string versioning', 'URL-segment versioning', 'Media-type versioning'],
      answer: 2,
      explanation: 'URL-segment versioning (/api/v1/products) embeds the version in the URL. It is immediately visible, bookmarkable, and works in any browser or tool without setting headers.',
    },
    {
      q: 'What does AssumeDefaultVersionWhenUnspecified = true do?',
      options: [
        'Returns a 400 Bad Request when no version is supplied',
        'Applies the configured DefaultApiVersion when the caller omits a version',
        'Makes all endpoints versionless',
        'Generates a default v1.0 controller automatically',
      ],
      answer: 1,
      explanation: 'When a request arrives without a version identifier, the negotiator uses DefaultApiVersion. This allows existing unversioned clients to keep working during a versioning roll-out.',
    },
    {
      q: 'What does [ApiVersion("1.0", Deprecated = true)] do?',
      options: [
        'Removes the v1.0 endpoints from the server',
        'Returns 410 Gone for all v1.0 requests',
        'Keeps v1.0 working but adds it to the api-deprecated-versions response header',
        'Logs a warning for every v1.0 request',
      ],
      answer: 2,
      explanation: 'Deprecated = true does NOT break the version — it signals clients via the api-deprecated-versions header that they should migrate. The endpoints continue to function.',
    },
    {
      q: 'How do you map a single action to only version 2 within a multi-version controller?',
      options: [
        '[HttpGet][Version("2.0")]',
        '[MapToApiVersion("2.0")]',
        '[ApiVersionRoute("2.0")]',
        '[VersionOnly(2)]',
      ],
      answer: 1,
      explanation: '[MapToApiVersion("2.0")] on a method restricts it to that version. Actions without [MapToApiVersion] are available in all versions declared on the controller.',
    },
    {
      q: 'ReportApiVersions = true adds which response headers?',
      options: [
        'api-version and api-status',
        'x-version and x-deprecated',
        'api-supported-versions and api-deprecated-versions',
        'accept-version and content-version',
      ],
      answer: 2,
      explanation: 'When ReportApiVersions is enabled, every response includes api-supported-versions (all active versions) and api-deprecated-versions (versions marked Deprecated = true).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I start versioning my API?',
      a: 'Version from the first public release — retrofitting versioning onto an existing unversioned API requires routing changes that break existing clients. Use v1 immediately; it costs nothing and gives you a clean upgrade path.',
    },
    {
      q: 'What is the difference between Deprecated and removing a version?',
      a: 'Deprecated keeps the version working and signals clients via response headers that they should migrate. Actually removing the version should come after a communicated sunset period — typically 6–12 months after marking Deprecated. Removing early breaks clients.',
    },
    {
      q: 'Can I use multiple versioning strategies simultaneously?',
      a: 'Yes. ApiVersionReader.Combine() lets you register URL-segment, query-string, and header readers together. The negotiator tries them in order and uses the first match. This lets clients choose the strategy that suits them.',
    },
    {
      q: 'How do I generate separate Swagger / OpenAPI docs per version?',
      a: 'With Swashbuckle call AddSwaggerGen with one SwaggerDoc per version and configure SwaggerGenOptions to filter endpoints by version. With the .NET 9 built-in generator call AddOpenApi("v1") / AddOpenApi("v2") and filter using document options or the versioning integration NuGet package.',
    },
    {
      q: 'Should controller actions or entire controllers be versioned?',
      a: 'Both patterns are valid. [MapToApiVersion] on individual actions suits small surface-area changes in a single controller. Separate controller classes (ProductsV1Controller / ProductsV2Controller) are cleaner for large rewrites — they avoid cluttering one class and allow independent testing.',
    },
  ];
}
