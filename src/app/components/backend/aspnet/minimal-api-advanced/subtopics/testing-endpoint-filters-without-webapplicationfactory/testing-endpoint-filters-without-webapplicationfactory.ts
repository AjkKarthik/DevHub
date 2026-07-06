import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-endpoint-filters-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-endpoint-filters-without-webapplicationfactory.html',
  styleUrl: './testing-endpoint-filters-without-webapplicationfactory.scss',
})
export class TestingEndpointFiltersWithoutWebapplicationfactorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ValidationFilter<T> and LoggingFilter examples are never shown being tested — and IEndpointFilter.InvokeAsync() is an ordinary interface method, exactly like a Hub method or a custom IHealthCheck, testable by constructing an EndpointFilterInvocationContext directly, with no host, no routing, and no real HTTP request involved',
      points: [
        '<code>EndpointFilterInvocationContext</code> is created via the static <code>EndpointFilterInvocationContext.Create(httpContext, arg1, arg2, ...)</code> factory method — passing whatever arguments the handler under test would normally receive, in the SAME order the real handler\'s parameter list declares them. A test then calls <code>filter.InvokeAsync(context, next)</code> directly, supplying its own <code>EndpointFilterDelegate</code> for <code>next</code> — a simple lambda the test controls completely, letting it assert whether the filter called through to it or short-circuited.',
        'This mirrors exactly the technique used for testing SignalR hub methods and custom health checks elsewhere in this hub: find the plain interface method the framework eventually calls, construct its required context object directly, and invoke it — bypassing the actual HTTP/routing machinery entirely while still exercising the REAL filter class\'s REAL logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the main page\'s own ValidationFilter<T> directly',
      language: 'csharp',
      code: `public class ValidationFilterTests
{
    private readonly IValidator<CreateUserRequest> _validator =
        Substitute.For<IValidator<CreateUserRequest>>();

    [Fact]
    public async Task InvokeAsync_ShortCircuits_When_Validation_Fails()
    {
        var filter = new ValidationFilter<CreateUserRequest>(_validator);
        var invalidRequest = new CreateUserRequest { Name = "" };

        var failure = new ValidationResult(new[]
        {
            new ValidationFailure("Name", "Name is required."),
        });
        _validator.ValidateAsync(invalidRequest, Arg.Any<CancellationToken>())
                  .Returns(failure);

        // Construct the context exactly the way the real pipeline would —
        // the SAME argument the handler would have received:
        var httpContext = new DefaultHttpContext();
        var invocationContext = EndpointFilterInvocationContext.Create(
            httpContext, invalidRequest);

        var nextWasCalled = false;
        EndpointFilterDelegate next = _ =>
        {
            nextWasCalled = true;   // proves whether the filter passed through
            return ValueTask.FromResult<object?>(Results.Ok());
        };

        var result = await filter.InvokeAsync(invocationContext, next);

        Assert.False(nextWasCalled);   // short-circuited — next() never ran
        Assert.IsType<ValidationProblem>(result);
    }

    [Fact]
    public async Task InvokeAsync_Calls_Next_When_Validation_Passes()
    {
        var filter = new ValidationFilter<CreateUserRequest>(_validator);
        var validRequest = new CreateUserRequest { Name = "Alice" };

        _validator.ValidateAsync(validRequest, Arg.Any<CancellationToken>())
                  .Returns(new ValidationResult());   // no errors

        var invocationContext = EndpointFilterInvocationContext.Create(
            new DefaultHttpContext(), validRequest);

        var nextWasCalled = false;
        EndpointFilterDelegate next = _ =>
        {
            nextWasCalled = true;
            return ValueTask.FromResult<object?>(Results.Ok("proceeded"));
        };

        var result = await filter.InvokeAsync(invocationContext, next);

        Assert.True(nextWasCalled);   // proceeded to the handler
    }
}`,
    },
    {
      label: 'Testing a filter that reads request metadata, not just handler arguments',
      language: 'csharp',
      code: `// The main page's own LoggingFilter reads ctx.HttpContext.Request
// directly, rather than the arguments list — this is testable the
// same way, by configuring the DefaultHttpContext's Request:
public class LoggingFilterTests
{
    [Fact]
    public async Task InvokeAsync_Logs_Method_And_Path_Then_Proceeds()
    {
        var filter = new LoggingFilter();

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = "POST";
        httpContext.Request.Path   = "/api/products";

        var invocationContext = EndpointFilterInvocationContext.Create(httpContext);

        var nextWasCalled = false;
        EndpointFilterDelegate next = _ =>
        {
            nextWasCalled = true;
            return ValueTask.FromResult<object?>(Results.Ok());
        };

        using var consoleOutput = new StringWriter();
        Console.SetOut(consoleOutput);

        await filter.InvokeAsync(invocationContext, next);

        Assert.True(nextWasCalled);   // a logging filter should ALWAYS proceed
        Assert.Contains("[POST] /api/products", consoleOutput.ToString());
    }
}
// This test would have caught a real regression: a logging filter
// that accidentally short-circuits (forgets to call next()) breaks
// EVERY endpoint it's attached to — a silent, catastrophic bug this
// kind of direct unit test catches in milliseconds, without needing
// to spin up the whole app and hit a real route.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues these direct filter tests are redundant with a WebApplicationFactory-based integration test that hits the real /api/users endpoint and asserts a 400 response for an invalid request. Identify what the direct unit test proves that the integration test cannot, and vice versa.',
    hint: 'The integration test proves the WHOLE PIPELINE (routing, filter registration, DI, serialization) produces the right HTTP response for one specific scenario. The direct unit test proves the FILTER CLASS ITSELF behaves correctly for a range of inputs, in isolation. Which one is faster to run many variations of, and which one catches a WIRING mistake (like forgetting AddEndpointFilter<T>() on the endpoint)?',
    solution: `The direct unit test proves the FILTER's OWN logic is correct across
many input variations — cheaply and quickly, since there's no host
startup, no real HTTP round trip, no DI container to build. It is
ideal for exhaustively covering the filter's decision logic: multiple
validation failure shapes, edge cases in the short-circuit condition,
whether next() gets called in every branch that should call it. But
it CANNOT prove the filter is actually WIRED UP correctly on the real
endpoint — a missing .AddEndpointFilter<ValidationFilter<T>>() call on
the actual MapPost() registration, or the filter never being resolved
from DI at all (the main page's own "Forgetting to register endpoint
filters as services" Common Mistake), is invisible to a test that only
ever constructs the filter directly and calls InvokeAsync() on it.

The integration test proves the OPPOSITE thing: that the real endpoint,
with its real registration and DI wiring, produces the correct HTTP
response for genuine requests. It is the ONLY test that would catch a
forgotten .AddEndpointFilter<T>() call or a DI registration gap — but
it is comparatively expensive to run many input variations through,
since each one is a real HTTP round trip through the full pipeline.

Neither test is redundant with the other; they cover DIFFERENT failure
classes. A reasonable split: a SMALL number of integration tests
proving the endpoint is correctly wired (one happy path, one failure
path, enough to prove the plumbing is connected), and a LARGER number
of direct unit tests against the filter class itself covering its full
decision-logic surface — exactly the same "fast unit test for logic,
slower integration test for wiring" split that applies to custom
IHealthCheck implementations and SignalR hub methods covered elsewhere
in this hub.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a custom IEndpointFilter requires a full WebApplicationFactory hitting the real endpoint over HTTP, since filters are a routing/pipeline concept.',
      reality: 'InvokeAsync(context, next) is an ordinary interface method — EndpointFilterInvocationContext.Create(httpContext, ...args) constructs the context directly, and a test-controlled EndpointFilterDelegate lambda for next lets the test assert whether the filter proceeded or short-circuited, with no host or real HTTP request involved.',
    },
    {
      thought: 'a WebApplicationFactory integration test asserting the correct HTTP status code for one invalid request is sufficient coverage for a validation filter\'s behavior.',
      reality: 'that test proves the endpoint is correctly wired for ONE scenario but is expensive to run many input variations through — a direct unit test against the filter class itself is far cheaper for exhaustively covering its decision logic (multiple failure shapes, edge cases), while the integration test remains the only one that catches a missing AddEndpointFilter<T>() registration.',
    },
    {
      thought: 'a filter that reads request metadata (like the main page\'s own LoggingFilter reading HttpContext.Request.Method and Path) cannot be tested without a real incoming HTTP request.',
      reality: 'a DefaultHttpContext can have its Request.Method and Request.Path set directly in a test, then passed into EndpointFilterInvocationContext.Create() — the filter reads exactly the same properties it would from a real request, with no actual network request needed.',
    },
  ];
}
