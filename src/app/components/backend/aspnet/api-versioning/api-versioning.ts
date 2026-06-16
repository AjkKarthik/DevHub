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
  selector: 'app-aspnet-api-versioning',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './api-versioning.html',
  styleUrl: './api-versioning.scss',
})
export class AspnetApiVersioning {

  prerequisites: Prerequisite[] = [
    { label: 'Controllers & Actions', route: '/aspnet/controllers' },
    { label: 'Routing', route: '/aspnet/routing' },
    { label: 'OpenAPI & Swagger', route: '/aspnet/openapi-swagger' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddApiVersioning()',                  type: 'method',    desc: 'Registers versioning services; configure strategies here' },
    { name: 'AddVersionedApiExplorer()',           type: 'method',    desc: 'Integrates versioning with API Explorer for Swagger/OpenAPI' },
    { name: '[ApiVersion("2.0")]',                 type: 'decorator', desc: 'Declares the version(s) a controller or endpoint supports' },
    { name: '[MapToApiVersion("2.0")]',            type: 'decorator', desc: 'Maps a single action to one version inside a multi-version controller' },
    { name: '[ApiVersion("1.0", Deprecated=true)]', type: 'decorator', desc: 'Keeps v1 working; adds it to api-deprecated-versions header' },
    { name: 'AssumeDefaultVersionWhenUnspecified', type: 'keyword',   desc: 'Applies the default version when the caller omits the version' },
    { name: 'ReportApiVersions',                  type: 'keyword',   desc: 'Adds api-supported-versions / api-deprecated-versions headers' },
    { name: 'UrlSegmentApiVersionReader',          type: 'class',     desc: 'Reads version from /api/v{version}/ URL segment' },
    { name: 'QueryStringApiVersionReader',         type: 'class',     desc: 'Reads version from ?api-version=2.0 query parameter' },
    { name: 'HeaderApiVersionReader',              type: 'class',     desc: 'Reads version from a custom HTTP header' },
    { name: 'ApiVersionReader.Combine()',          type: 'method',    desc: 'Enables multiple versioning strategies simultaneously' },
    { name: 'IApiVersioningFeature',               type: 'interface', desc: 'Access the negotiated version inside a handler at runtime' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Versioning Strategies',
      points: [
        '<strong>URL segment</strong> (<code>/api/v1/products</code>) is the most explicit — version is visible in every URL, easy to test in a browser, bookmarkable, and simple to document. The most widely adopted strategy.',
        '<strong>Query string</strong> (<code>?api-version=2.0</code>) keeps URLs clean but is easy to overlook. Good when URL changes would break existing link contracts (e.g., shared bookmarks, hardcoded client URLs).',
        '<strong>Header</strong> (<code>x-api-version: 2.0</code>) keeps URLs completely clean and is popular in B2B APIs, but is invisible in browser testing without tools like curl or Swagger UI.',
        '<strong>Media type</strong> (<code>Accept: application/vnd.api+json;version=2</code>) is the most REST-pure approach but the most complex to implement and consume — rarely seen outside large API platforms.',
        'All strategies can be enabled simultaneously via <code>ApiVersionReader.Combine()</code> — the negotiator picks the first match in configuration order, letting clients choose what suits them.',
        'Pick one primary strategy and stick to it per API. Mixing strategies across the same API confuses clients and complicates documentation.',
      ],
    },
    {
      heading: 'Setting Up Asp.Versioning',
      points: [
        'Install <code>Asp.Versioning.Http</code> (minimal APIs) or <code>Asp.Versioning.Mvc</code> (controllers). Call <code>builder.Services.AddApiVersioning()</code> with your strategy and defaults.',
        '<code>AssumeDefaultVersionWhenUnspecified = true</code> allows existing clients that don\'t send a version to keep working — essential for a non-breaking rollout onto an existing unversioned API.',
        '<code>ReportApiVersions = true</code> adds <code>api-supported-versions</code> and <code>api-deprecated-versions</code> response headers so clients can discover what is available and what is aging out.',
        '<code>DefaultApiVersion = new ApiVersion(1, 0)</code> sets the fallback version. Combined with <code>AssumeDefaultVersionWhenUnspecified</code>, unversioned requests hit v1.0.',
        'For controllers, also call <code>.AddMvc()</code> on the builder result (returned by <code>AddApiVersioning()</code>) to enable attribute routing integration.',
        'Validate your setup by hitting <code>/api/v1/products</code> and confirming <code>api-supported-versions: 1.0, 2.0</code> appears in the response headers.',
      ],
    },
    {
      heading: 'Versioning Controllers',
      points: [
        'Decorate the controller with <code>[ApiVersion("1.0")]</code>. Use <code>[Route("api/v{version:apiVersion}/[controller]")]</code> for URL-segment versioning — the <code>:apiVersion</code> constraint is required.',
        'For actions that differ between versions in the same class, add <code>[MapToApiVersion("2.0")]</code>. Actions without the attribute are available in ALL versions declared on the controller.',
        'Mark old versions <code>[ApiVersion("1.0", Deprecated = true)]</code> before removal. Deprecated versions still respond; clients see the <code>api-deprecated-versions</code> header.',
        'Create separate controller classes per version for large surface-area changes: <code>ProductsV1Controller</code> / <code>ProductsV2Controller</code>. Both can share a service layer and only differ in their DTOs and route attributes.',
        'For query-string or header versioning on controllers, the <code>[Route]</code> template does not need the <code>v{version}</code> segment — the version is read from the query/header by the negotiator.',
        'Use <code>[ApiVersionNeutral]</code> on utility controllers (health checks, metadata) that should respond regardless of the requested version.',
      ],
    },
    {
      heading: 'Versioning Minimal APIs',
      points: [
        'Create a version set with <code>app.NewApiVersionSet().HasApiVersion(new ApiVersion(1)).HasApiVersion(new ApiVersion(2)).Build()</code>.',
        'Attach the set to a route group with <code>.WithApiVersionSet(versionSet)</code>. Map each endpoint to its version(s) with <code>.MapToApiVersion(1)</code>.',
        'Access the negotiated version at runtime via <code>HttpContext.GetRequestedApiVersion()?.MajorVersion</code> — useful when one handler serves multiple versions with conditional logic.',
        'For URL-segment versioning on groups, include <code>/v{apiVersion:apiVersion}</code> in the group prefix: <code>app.MapGroup("/api/v{apiVersion:apiVersion}/products")</code>.',
        'Prefer separate handlers over runtime branching on version — it is cleaner, more testable, and lets you remove old handlers without touching the new ones.',
        'Combine versioning with <code>AddOpenApi("v1")</code> / <code>AddOpenApi("v2")</code> to generate separate spec files per version — each filtered to only include that version\'s endpoints.',
      ],
    },
    {
      heading: 'Deprecation and Sunset Strategy',
      points: [
        'Mark a version deprecated with <code>Deprecated = true</code> in <code>[ApiVersion]</code>. This does not break the version — it adds it to the <code>api-deprecated-versions</code> response header.',
        'Communicate sunset dates via the <code>Sunset</code> HTTP header (<code>Sunset: Sat, 31 Dec 2025 00:00:00 GMT</code>) on deprecated version responses — add it in a middleware or response filter.',
        'Follow a staged approach: announce deprecation → add Deprecated flag → add Sunset header → maintain for 6–12 months → remove. Never remove without the full notice period.',
        'Version your OpenAPI spec with the same version numbers — mark operations as <code>deprecated: true</code> in the spec when the API version is deprecated, giving clients both machine and human-readable signals.',
        'Generate clients with a known version (operationId stays stable). When you remove v1, clients on v1 clients break at compile time rather than at runtime — catch breaks during client regeneration.',
        'Track version usage in analytics/logs. If v1 still has significant traffic at sunset date, extend the timeline rather than breaking production clients.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'csharp',
      code: `// NuGet: Asp.Versioning.Mvc (controllers) or Asp.Versioning.Http (minimal)
builder.Services
    .AddApiVersioning(opts =>
    {
        opts.DefaultApiVersion                  = new ApiVersion(1, 0);
        opts.AssumeDefaultVersionWhenUnspecified = true;
        opts.ReportApiVersions                  = true;
        opts.ApiVersionReader = ApiVersionReader.Combine(
            new UrlSegmentApiVersionReader(),            // /api/v1/…
            new QueryStringApiVersionReader(),           // ?api-version=1.0
            new HeaderApiVersionReader("x-api-version") // x-api-version: 1.0
        );
    })
    .AddMvc();   // for controllers — enables [ApiVersion] attributes`,
    },
    {
      label: 'Controller Versioning',
      language: 'csharp',
      code: `// v{version:apiVersion} constraint is REQUIRED for URL-segment versioning
[ApiController]
[ApiVersion("1.0", Deprecated = true)]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    // Available in v1 ONLY
    [HttpGet("{id:int}")]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1(int id)
        => Ok(new { id, format = "legacy" });

    // Available in v2 ONLY
    [HttpGet("{id:int}")]
    [MapToApiVersion("2.0")]
    public IActionResult GetV2(int id)
        => Ok(new { id, name = "Laptop", price = 999.99m });

    // Available in ALL declared versions (no [MapToApiVersion])
    [HttpGet]
    public IActionResult GetAll() => Ok(new[] { 1, 2, 3 });
}

// Utility — responds regardless of version
[ApiVersionNeutral]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet] public IActionResult Health() => Ok("healthy");
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

var products = app
    .MapGroup("/api/v{apiVersion:apiVersion}/products")
    .WithApiVersionSet(versionSet);

// v1 handler — legacy format
products.MapGet("/", () => new[] { new { id = 1, name = "Laptop", format = "legacy" } })
        .MapToApiVersion(1);

// v2 handler — richer DTO
products.MapGet("/", () => new[] { new { id = 1, name = "Laptop", price = 999.99m, stock = 42 } })
        .MapToApiVersion(2);

// Shared across versions — use GetRequestedApiVersion when needed
products.MapGet("/{id:int}", (int id, HttpContext ctx) =>
{
    var v = ctx.GetRequestedApiVersion()?.MajorVersion;
    return v == 2
        ? Results.Ok(new { id, name = "Laptop", price = 999.99m })
        : Results.Ok(new { id, format = "legacy" });
});`,
    },
    {
      label: 'Versioned OpenAPI',
      language: 'csharp',
      code: `// .NET 9 built-in — one document per version
builder.Services.AddOpenApi("v1");
builder.Services.AddOpenApi("v2");

// Scalar with version switcher
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapScalarApiReference(opts =>
        opts.WithOpenApiRoutePattern("/openapi/{documentName}.json"));
}

// Swashbuckle — one SwaggerDoc per version
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "My API", Version = "v1" });
    c.SwaggerDoc("v2", new() { Title = "My API", Version = "v2" });
    c.OperationFilter<SwaggerDefaultValues>();  // propagates version info
});

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    c.SwaggerEndpoint("/swagger/v2/swagger.json", "v2");
});`,
    },
    {
      label: 'Sunset Headers',
      language: 'csharp',
      code: `// Middleware — adds Sunset header on deprecated version responses
app.Use(async (ctx, next) =>
{
    await next();

    var feature = ctx.Features.Get<IApiVersioningFeature>();
    var version = feature?.RequestedApiVersion;

    if (version?.MajorVersion == 1)
    {
        // RFC 8594 Sunset header
        ctx.Response.Headers["Sunset"] =
            "Sat, 31 Dec 2025 23:59:59 GMT";
        ctx.Response.Headers["Deprecation"] =
            "Tue, 01 Jan 2025 00:00:00 GMT";
        ctx.Response.Headers["Link"] =
            \`</api/v2/products>; rel="successor-version"\`;
    }
});`,
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
builder.Services
    .AddApiVersioning(opts =>
    {
        opts.DefaultApiVersion                  = new ApiVersion(1, 0);
        opts.AssumeDefaultVersionWhenUnspecified = true;
        opts.ReportApiVersions                  = true;
        opts.ApiVersionReader                   = new UrlSegmentApiVersionReader();
    })
    .AddMvc();

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
      explanation: 'URL-segment versioning (/api/v1/products) embeds the version in the URL. It is immediately visible, bookmarkable, and works in any browser or tool without setting headers or query params.',
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
      explanation: '[MapToApiVersion("2.0")] on a method restricts it to that version. Actions without [MapToApiVersion] are available in ALL versions declared on the controller.',
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
    {
      q: 'Which attribute marks a controller as responding regardless of the API version requested?',
      options: ['[AllVersions]', '[ApiVersionNeutral]', '[NoVersion]', '[AnyVersion]'],
      answer: 1,
      explanation: '[ApiVersionNeutral] makes a controller respond to all requests regardless of version. Useful for health check controllers, metadata endpoints, and internal infrastructure endpoints that should not be versioned.',
    },
    {
      q: 'For URL-segment versioning, which route constraint is required in the [Route] attribute?',
      options: [
        '{version:int}',
        '{apiVersion:apiVersion}',
        '{v:semver}',
        '{version:string}',
      ],
      answer: 1,
      explanation: 'The :apiVersion constraint in {version:apiVersion} (or {apiVersion:apiVersion}) tells the routing system to use the API versioning negotiator for that segment. Without it, URL-segment versioning does not work.',
    },
    {
      q: 'What HTTP header is defined by RFC 8594 to communicate a deprecated endpoint\'s removal date?',
      options: ['X-Deprecated', 'Sunset', 'Deprecation-Date', 'X-Remove-After'],
      answer: 1,
      explanation: 'RFC 8594 defines the Sunset header as an HTTP date indicating when the resource will no longer be available. The Deprecation header (RFC 9512) indicates when it was deprecated. Both are used together for clear client communication.',
    },
    {
      q: 'When using Asp.Versioning with controllers, which additional call is required after AddApiVersioning()?',
      options: [
        '.AddMvc()',
        '.AddRouting()',
        '.AddEndpointsApiExplorer()',
        '.AddControllerVersioning()',
      ],
      answer: 0,
      explanation: 'AddApiVersioning() returns a builder. Calling .AddMvc() on it wires versioning into the MVC pipeline so [ApiVersion] and [MapToApiVersion] attributes work on controllers and actions.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I start versioning my API?',
      a: 'Version from the first public release — retrofitting versioning onto an existing unversioned API requires routing changes that break existing clients. Use v1 immediately; it costs nothing and gives you a clean upgrade path when breaking changes are needed.',
    },
    {
      q: 'What is the difference between Deprecated and removing a version?',
      a: 'Deprecated keeps the version working and signals clients via response headers that they should migrate. Actually removing the version should come after a communicated sunset period — typically 6–12 months after marking Deprecated. Removing early breaks clients without warning.',
    },
    {
      q: 'Can I use multiple versioning strategies simultaneously?',
      a: 'Yes. ApiVersionReader.Combine() lets you register URL-segment, query-string, and header readers together. The negotiator tries them in order and uses the first match. This lets clients choose the strategy that suits them — URL for browsers, headers for API clients.',
    },
    {
      q: 'How do I generate separate Swagger / OpenAPI docs per version?',
      a: 'With Swashbuckle: call AddSwaggerGen with one SwaggerDoc per version and configure SwaggerGenOptions to filter endpoints by version using AddVersionedApiExplorer(). With .NET 9 built-in: call AddOpenApi("v1") / AddOpenApi("v2") and configure document filters to include only the relevant version\'s endpoints.',
    },
    {
      q: 'Should controller actions or entire controllers be versioned?',
      a: 'Both patterns are valid. [MapToApiVersion] on individual actions suits small surface-area changes in a single controller. Separate controller classes (ProductsV1Controller / ProductsV2Controller) are cleaner for large rewrites — they avoid cluttering one class and allow independent testing per version.',
    },
    {
      q: 'What is [ApiVersionNeutral] and when should I use it?',
      a: '[ApiVersionNeutral] marks a controller or endpoint to respond regardless of the API version in the request. Use it for health checks, metadata endpoints, authentication endpoints, and other infrastructure routes that should not change between API versions.',
    },
    {
      q: 'How do I handle version negotiation errors (unsupported version)?',
      a: 'By default Asp.Versioning returns 400 with an UnsupportedApiVersion error when a client requests a version that doesn\'t exist. You can customise this via ApiVersioningOptions.ErrorResponses to return a more informative ProblemDetails response, including the list of supported versions.',
    },
    {
      q: 'What is the recommended sunset period before removing a deprecated API version?',
      a: 'Typically 6–12 months from the Deprecated announcement — long enough for all client teams to migrate. Check your usage analytics before removing: if significant traffic still hits the old version, extend the timeline. Communicate via the Sunset HTTP header, email to registered API consumers, and changelog entries.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting .AddMvc() after AddApiVersioning() for controllers',
      wrong: `builder.Services.AddApiVersioning(opts =>
{
    opts.DefaultApiVersion = new ApiVersion(1, 0);
});
// ❌ [ApiVersion] attributes on controllers are silently ignored`,
      right: `builder.Services
    .AddApiVersioning(opts =>
    {
        opts.DefaultApiVersion = new ApiVersion(1, 0);
        opts.AssumeDefaultVersionWhenUnspecified = true;
    })
    .AddMvc();   // ✓ wires versioning into the MVC pipeline`,
      explanation: 'AddApiVersioning() returns a builder. Calling .AddMvc() on it is required to activate [ApiVersion] and [MapToApiVersion] attribute processing for controllers.',
    },
    {
      title: 'Missing :apiVersion constraint in the URL-segment route template',
      wrong: `[Route("api/v{version}/[controller]")]   // ❌ — {version} is just a string
// All requests route to the same controller regardless of version`,
      right: `[Route("api/v{version:apiVersion}/[controller]")]  // ✓
// The :apiVersion constraint activates the version negotiator`,
      explanation: 'Without the :apiVersion route constraint, the version segment is treated as an ordinary string parameter. The API versioning negotiator is never invoked and all version attributes are ignored.',
    },
    {
      title: 'Removing a deprecated version without a sunset period',
      wrong: `// Week 1: mark deprecated
[ApiVersion("1.0", Deprecated = true)]

// Week 2: remove the controller entirely ❌
// All v1 clients get 404 with no warning`,
      right: `// Month 1: mark deprecated + add Sunset header
[ApiVersion("1.0", Deprecated = true)]
// Add Sunset header: "Sunset: Sat, 31 Dec 2025 23:59:59 GMT"

// Month 7+: remove after confirming no significant v1 traffic ✓`,
      explanation: 'Removing a version without a sunset period breaks clients silently. Give consumers at least 6 months after marking Deprecated, communicate via the Sunset HTTP header, and verify traffic analytics before removal.',
    },
    {
      title: 'Actions without [MapToApiVersion] unintentionally exposed in all versions',
      wrong: `[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetV2Only() => Ok("new format");   // ❌ appears in v1 too
}`,
      right: `[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [MapToApiVersion("2.0")]    // ✓ restricted to v2 only
    public IActionResult GetV2Only() => Ok("new format");
}`,
      explanation: 'Without [MapToApiVersion], an action is available in ALL versions declared on the controller. If you intend an action for a specific version only, always add [MapToApiVersion].',
    },
    {
      title: 'Using AssumeDefaultVersionWhenUnspecified = false on an existing API',
      wrong: `// Migrating an existing unversioned API
builder.Services.AddApiVersioning(opts =>
{
    opts.DefaultApiVersion = new ApiVersion(1, 0);
    // opts.AssumeDefaultVersionWhenUnspecified = false (default) ❌
});
// Existing clients with no version header get 400 Bad Request`,
      right: `builder.Services.AddApiVersioning(opts =>
{
    opts.DefaultApiVersion                  = new ApiVersion(1, 0);
    opts.AssumeDefaultVersionWhenUnspecified = true;   // ✓
    // Existing clients continue to work without sending a version
});`,
      explanation: 'The default value of AssumeDefaultVersionWhenUnspecified is false — unversioned requests get 400. When adding versioning to an existing API, always set it to true to avoid breaking clients that were written before versioning was added.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'API versioning with Asp.Versioning lets you evolve your API non-disruptively by routing requests to different controller actions or handlers based on a URL segment, query string, or header version identifier.',
    mustKnow: [
      'Three strategies: URL segment (/v{version}/), query string (?api-version=), header (x-api-version:) — combinable via ApiVersionReader.Combine()',
      'AddApiVersioning() + .AddMvc() for controllers; + .AddMvc() is required or attributes are ignored',
      '[ApiVersion("1.0", Deprecated=true)] keeps the version working and signals clients via api-deprecated-versions header',
      '[MapToApiVersion] restricts an action to a specific version; without it, the action appears in ALL declared versions',
      'URL-segment versioning needs the :apiVersion route constraint: {version:apiVersion}',
      'AssumeDefaultVersionWhenUnspecified = true prevents 400 errors on existing unversioned clients during rollout',
      '[ApiVersionNeutral] makes a controller respond to any version — use for health checks and infrastructure endpoints',
    ],
    interviewFocus: [
      'What are the three versioning strategies and when would you choose each?',
      'What does AssumeDefaultVersionWhenUnspecified do and why is it important for existing APIs?',
      'What is the difference between Deprecated = true and removing a version?',
      'Why does [MapToApiVersion] matter — what happens without it?',
      'How do you generate separate OpenAPI documents per API version?',
    ],
  };
}
