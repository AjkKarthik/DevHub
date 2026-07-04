import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-filters-execution-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-filters-execute-in-documented-pipeline-order.html',
  styleUrl: './testing-filters-execute-in-documented-pipeline-order.scss',
})
export class TestingFiltersExecuteInDocumentedPipelineOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Global Registration example registers two filters in a specific order — but nothing on the page proves they actually execute in THAT order rather than some other order',
      points: [
        'The main Filters page\'s "Global Registration" code tab registers <code>RequestTimingFilter</code> before <code>DomainExceptionFilter</code>, with the comment "// outermost" and "// second" — implying registration order determines execution order. Testing a SINGLE filter in isolation (as covered in the sibling Minimal APIs subtopic on testing an endpoint filter) proves that filter\'s OWN logic works — it says NOTHING about whether multiple REGISTERED filters actually execute in the sequence the developer intended. This is exactly the gap identified but not filled in that sibling subtopic\'s own "Where this fits" exercise.',
      ],
    },
    {
      heading: 'An integration test using WebApplicationFactory, with each filter appending its own name to a SHARED, request-scoped list, directly proves the actual execution sequence — including entry AND exit order',
      points: [
        'Since filters wrap each other (the mental model the main page itself uses — "FIFO in, LIFO out" for endpoint filters, and a fixed Authorization → Resource → Action → Exception → Result order for MVC filters), the only way to directly OBSERVE the real sequence is to have each filter record something identifiable at both its "before next()" and "after next()" points, then assert on the full recorded sequence after the request completes — rather than assuming registration order alone determines behavior without proof.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Instrumenting the main page\'s own two filters to record their actual execution sequence',
      language: 'csharp',
      code: `// A request-scoped list every filter appends to — registered as
// Scoped so each HTTP request gets its own fresh list:
public class ExecutionLog
{
    public List<string> Entries { get; } = [];
}

public class RequestTimingFilter(ExecutionLog log) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        log.Entries.Add("Timing:before");
        var executed = await next();
        log.Entries.Add("Timing:after");
    }
}

public class DomainExceptionAwareFilter(ExecutionLog log) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        log.Entries.Add("Domain:before");
        var executed = await next();
        log.Entries.Add("Domain:after");
    }
}

// Program.cs — SAME registration order as the main page's own example:
builder.Services.AddScoped<ExecutionLog>();
builder.Services.AddScoped<RequestTimingFilter>();
builder.Services.AddScoped<DomainExceptionAwareFilter>();
builder.Services.AddControllers(o =>
{
    o.Filters.Add<RequestTimingFilter>();          // registered FIRST
    o.Filters.Add<DomainExceptionAwareFilter>();   // registered SECOND
});

// A test-only endpoint that exposes the recorded sequence so a test
// can inspect it directly:
[HttpGet("test/filter-order")]
public IActionResult FilterOrder([FromServices] ExecutionLog log)
    => Ok(log.Entries);`,
    },
    {
      label: 'The integration test — proving the ACTUAL sequence, not just trusting registration order',
      language: 'csharp',
      code: `public class FilterOrderTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public FilterOrderTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task RegisteredFilters_ExecuteInRegistrationOrder_OutermostFirst()
    {
        // The endpoint itself returns 200 with a JSON array — but the
        // MEANINGFUL assertion is on the SEQUENCE captured during the
        // request, which the endpoint reads back from the SAME
        // ExecutionLog instance the filters wrote to (since both are
        // Scoped, they share the same instance within one request):
        var response = await _client.GetAsync("/api/test/filter-order");
        var sequence = await response.Content.ReadFromJsonAsync<string[]>();

        // This directly proves the "FIFO in, LIFO out" nesting model
        // the main page describes for endpoint filters ALSO applies to
        // MVC action filters registered via options.Filters.Add<T>() in
        // the SAME order they were added — RequestTimingFilter (added
        // first) is OUTERMOST, so its "before" entry comes first and
        // its "after" entry comes LAST:
        Assert.Equal(new[]
        {
            "Timing:before",   // outermost filter's before-hook runs FIRST
            "Domain:before",   // innermost filter's before-hook runs SECOND
            "Domain:after",    // innermost filter's after-hook runs FIRST on the way out
            "Timing:after",    // outermost filter's after-hook runs LAST on the way out
        }, sequence);
    }
}

// WHAT THIS TEST ACTUALLY CATCHES: if a future refactor accidentally
// SWAPS the two options.Filters.Add<T>() calls in Program.cs (a typo,
// or a merge conflict resolved incorrectly), this test's assertion on
// the EXACT sequence fails immediately — whereas testing each filter
// in isolation (verifying RequestTimingFilter's OWN before/after logic,
// and separately verifying DomainExceptionAwareFilter's OWN before/after
// logic) would still pass, since each filter's INTERNAL logic remains
// correct even when their RELATIVE registration order is wrong.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The test in this subtopic only proves the ORDER of two action filters registered via options.Filters.Add&lt;T&gt;(). Extend the scenario to prove where an IEndpointFilter (as covered in the Minimal APIs subtopics) fits relative to these MVC action filters, given the main page\'s own Q&A states "IEndpointFilter executes first" on controllers.',
    hint: 'Consider adding an IEndpointFilter to the SAME controller action (endpoint filters can be applied to controller actions too, via endpoint metadata) and having it append its own entry to the shared ExecutionLog — where would its entry need to appear in the expected sequence for the test to pass?',
    solution: `Extending the test to include an IEndpointFilter on the SAME action
requires the endpoint filter to ALSO append to the shared ExecutionLog,
and the expected sequence to place its entries at the very OUTSIDE of
the recorded chain — before "Timing:before" and after "Timing:after" —
matching the main page's own stated claim that "IEndpointFilter executes
first" (and, by the same wrap-around logic, exits last):

public class LoggingEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var log = ctx.HttpContext.RequestServices.GetRequiredService<ExecutionLog>();
        log.Entries.Add("Endpoint:before");
        var result = await next(ctx);
        log.Entries.Add("Endpoint:after");
        return result;
    }
}

// Applied to the SAME controller action via endpoint metadata:
// (exact registration syntax for applying IEndpointFilter to a
// controller action varies by ASP.NET Core version, but conceptually
// it attaches the same way .AddEndpointFilter() does for minimal APIs)

[Fact]
public async Task EndpointFilterWrapsOutsideAllMvcActionFilters()
{
    var response = await _client.GetAsync("/api/test/filter-order");
    var sequence = await response.Content.ReadFromJsonAsync<string[]>();

    Assert.Equal(new[]
    {
        "Endpoint:before",   // IEndpointFilter runs OUTSIDE the MVC pipeline entirely
        "Timing:before",
        "Domain:before",
        "Domain:after",
        "Timing:after",
        "Endpoint:after",    // exits LAST, confirming it wraps everything else
    }, sequence);
}

This test directly encodes the main page's own claim from its Q&A
section — "The IEndpointFilter executes first" — as an EXECUTABLE,
verifiable assertion rather than a sentence a developer has to trust and
remember. The broader principle established across both this subtopic
and the Minimal APIs testing subtopic: any claim about RELATIVE ordering
between multiple independent pipeline components (whether they're all
MVC action filters, or a mix of endpoint filters and action filters)
needs an integration test that observes the ACTUAL sequence — no amount
of testing each component in isolation can substitute for that.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing each filter\'s own OnActionExecutionAsync logic in isolation is sufficient to guarantee multiple registered filters execute in the intended relative order.',
      reality: 'isolated filter tests prove each filter\'s OWN before/after logic is correct — they say nothing about whether the actual REGISTRATION order in Program.cs produces the intended nesting, which only an integration test observing the real, combined execution sequence can verify.',
    },
    {
      thought: 'the comment "// outermost" and "// second" next to filter registration calls in Program.cs is sufficient documentation of execution order — trusting the comment is enough.',
      reality: 'a comment is not enforced by the compiler or any test — a future refactor that reorders the registration calls (a merge conflict, a copy-paste mistake) breaks the intended nesting silently, with no signal other than a dedicated test that asserts on the actual observed sequence.',
    },
    {
      thought: 'IEndpointFilter and IActionFilter belong to entirely separate pipelines that never interact or nest around each other on the same controller action.',
      reality: 'per the main page\'s own Q&A, IEndpointFilter DOES apply to controllers via endpoint metadata and executes OUTSIDE the MVC pipeline entirely — meaning it wraps around every IActionFilter, IExceptionFilter, and IResultFilter registered for that action, a relationship that can be directly proven with a shared execution-order log.',
    },
  ];
}
