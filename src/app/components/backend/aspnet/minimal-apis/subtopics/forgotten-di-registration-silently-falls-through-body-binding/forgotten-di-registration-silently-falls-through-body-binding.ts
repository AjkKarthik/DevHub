import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-forgotten-di-registration-fallthrough-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './forgotten-di-registration-silently-falls-through-body-binding.html',
  styleUrl: './forgotten-di-registration-silently-falls-through-body-binding.scss',
})
export class ForgottenDiRegistrationSilentlyFallsThroughBodyBindingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "service types are resolved automatically... no [FromServices] attribute needed" as a simple fact — but never says what happens when the framework GUESSES a parameter is a service, and it isn\'t registered',
      points: [
        'The main Minimal APIs page\'s quiz explains: "if a parameter type is registered in the DI container it is resolved from the container automatically." The mechanism behind this: ASP.NET Core queries <code>IServiceProviderIsService.IsService(parameterType)</code> for each handler parameter when the endpoint\'s request delegate is built. If that query returns TRUE, the parameter is treated as DI-resolved. If it returns FALSE — including the case where a developer simply FORGOT to register the service — the framework does not throw a clear "service not registered" error. Instead, it silently falls through to the SAME complex-type-from-body inference the main page describes for ordinary DTOs.',
      ],
    },
    {
      heading: 'A forgotten service registration produces a confusing 400 Bad Request (or a null-bound parameter) instead of the clear, loud DI exception a constructor-injected controller would throw for the exact same mistake',
      points: [
        'Contrast this with controllers: forgetting to register a service that a controller\'s CONSTRUCTOR depends on throws a clear, immediate <code>InvalidOperationException: "Unable to resolve service for type \'IProductService\' while attempting to activate \'ProductsController\'"</code> — a loud, unambiguous failure the moment that controller is first activated. A minimal API handler parameter of the SAME unregistered service type produces no such clear signal: since <code>IsService()</code> returns false for it, the framework assumes it must be a request-body parameter, and a GET request (which typically has no body) or a POST request whose JSON does not match that type\'s shape produces a vague binding failure or a silently null-bound parameter — with no message anywhere mentioning dependency injection at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A forgotten service registration — the handler parameter silently stops being treated as a DI service',
      language: 'csharp',
      code: `public interface IProductService
{
    Task<Product?> FindAsync(int id);
}

public class ProductService : IProductService
{
    public Task<Product?> FindAsync(int id) => /* ... */;
}

// Program.cs — THE BUG: this registration line was never added
// (perhaps removed during a refactor, or simply forgotten):
//
//     builder.Services.AddScoped<IProductService, ProductService>();
//
// It is MISSING from this Program.cs entirely.

var app = builder.Build();

app.MapGet("/products/{id:int}", async (int id, IProductService svc) =>
{
    var product = await svc.FindAsync(id);
    return product is null ? Results.NotFound() : Results.Ok(product);
});

app.Run();

// WHAT ACTUALLY HAPPENS: because IProductService is NOT registered,
// IServiceProviderIsService.IsService(typeof(IProductService)) returns
// FALSE when this endpoint's request delegate is built. The parameter
// binding logic does NOT throw "service not registered" — it falls
// through to ordinary parameter-source inference. IProductService is an
// INTERFACE (a "complex" type by the same simple/complex check covered
// in the Controllers subtopic on binding inference), so it gets treated
// as a [FromBody] parameter instead:
//
//   GET /products/5
//
// produces NOT a clear DI error, but something like:
//
//   400 Bad Request
//   { "svc": ["The svc field is required."] }
//
// — a validation error blaming a PARAMETER NAMED "svc", which looks
// nothing like a dependency injection problem to a developer debugging
// this for the first time.`,
    },
    {
      label: 'The same mistake in a controller — a loud, unambiguous DI exception at controller activation time',
      language: 'csharp',
      code: `[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService svc) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> Get(int id)
    {
        var product = await svc.FindAsync(id);
        return product is null ? NotFound() : product;
    }
}

// Program.cs — SAME missing registration:
//
//     builder.Services.AddScoped<IProductService, ProductService>();
//     ^ also missing here
//
// WHAT ACTUALLY HAPPENS: the very first request that reaches
// ProductsController throws immediately, during controller activation
// — BEFORE any action method even runs:
//
//   System.InvalidOperationException: Unable to resolve service for
//   type 'IProductService' while attempting to activate
//   'ProductsController'.
//
// This is UNAMBIGUOUS — it names the exact missing service type and the
// exact class that needed it. Compare this to the minimal API case in
// the previous tab, where the SAME missing registration produces a
// generic validation error blaming a parameter name, with no mention of
// dependency injection anywhere in the error message.

// THE PRACTICAL TAKEAWAY: because minimal API parameter binding treats
// "not a registered service" as equivalent to "just a normal complex-type
// parameter" rather than as a distinct error case, a forgotten DI
// registration is measurably HARDER to diagnose in a minimal API handler
// than the exact same mistake in a controller's constructor.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that a forgotten DI registration produces a confusing validation error rather than a clear DI exception in a minimal API handler, propose a concrete way to catch this class of mistake in CI, similar in spirit to the reflection-based EventId collision test from the ASP.NET Logging subtopics.',
    hint: 'Consider that every minimal API endpoint\'s handler delegate has a known parameter list (via reflection on the delegate\'s Method property) — could a startup-time check enumerate every mapped endpoint\'s parameters and verify each one is EITHER a recognized simple/route/query type OR actually registered in the DI container?',
    solution: `A concrete CI-run check: a startup-time (or dedicated integration test)
verification that walks every registered endpoint's handler delegate,
inspects its parameters via reflection, and for each parameter that
"looks like" a service type (an interface, or a class with no
registered TypeConverter — i.e., NOT a route/query-eligible simple
type, and NOT a recognized special type like HttpContext or
CancellationToken) explicitly asserts that
IServiceProviderIsService.IsService(parameterType) returns true against
the app's REAL, fully-configured DI container:

[Fact]
public void EveryMinimalApiHandler_ServiceLikeParameters_AreActuallyRegistered()
{
    var app = CreateTestHost();   // builds the real app with all real registrations
    var isService = app.Services.GetRequiredService<IServiceProviderIsService>();

    var endpointDataSource = app.Services.GetRequiredService<EndpointDataSource>();

    foreach (var endpoint in endpointDataSource.Endpoints.OfType<RouteEndpoint>())
    {
        var methodInfo = endpoint.Metadata.GetMetadata<MethodInfo>();
        if (methodInfo is null) continue;

        foreach (var param in methodInfo.GetParameters())
        {
            // Skip known non-service special parameters and simple types
            // that legitimately bind from route/query (using the same
            // "simple type" TypeConverter check from the Controllers
            // binding-inference subtopic):
            if (IsSimpleOrSpecialParameterType(param.ParameterType)) continue;

            // For everything else that LOOKS like it should be a
            // service (an interface, or a class with no [FromBody]-style
            // DTO markers), assert it is actually registered:
            if (LooksLikeAServiceType(param.ParameterType))
            {
                Assert.True(isService.IsService(param.ParameterType),
                    $"Endpoint '{endpoint.DisplayName}' has parameter " +
                    $"'{param.Name}' of type '{param.ParameterType.Name}' that " +
                    "looks like a service dependency but is NOT registered in DI " +
                    "— this will silently fall through to body/query binding " +
                    "instead of throwing a clear DI error.");
            }
        }
    }
}

This test runs against the REAL DI container configuration (via a test
host built the same way the production app is), catching a forgotten
registration for ANY minimal API endpoint in one pass — without needing
per-endpoint manual test cases, and specifically encoding the exact
distinction ("looks like a service, but isn't registered") that this
subtopic identifies as the root cause of the confusing failure mode.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a minimal API handler parameter of an unregistered service type throws a clear "service not found" exception, the same way a controller constructor would.',
      reality: 'IServiceProviderIsService.IsService() simply returns false for an unregistered type, and the framework silently treats the parameter as an ordinary complex-type-from-body parameter instead — producing a confusing validation error rather than a DI exception.',
    },
    {
      thought: 'DI parameter inference in minimal APIs and constructor injection in controllers fail the same way for the same missing-registration mistake.',
      reality: 'a controller throws an immediate, unambiguous InvalidOperationException naming the exact missing service type at controller activation — a minimal API handler with the same missing registration produces a generic validation error blaming a parameter name, with no mention of dependency injection at all.',
    },
    {
      thought: 'the "no [FromServices] needed" convenience in minimal APIs has no downside compared to explicit constructor injection.',
      reality: 'the convenience comes at the cost of a much less diagnostic failure mode when a registration is forgotten — a tradeoff worth knowing when debugging a confusing 400 response that turns out to actually be a missing DI registration.',
    },
  ];
}
