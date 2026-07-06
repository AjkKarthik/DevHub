import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-endpoint-filter-isolation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-endpoint-filter-isolation-no-test-server.html',
  styleUrl: './testing-endpoint-filter-isolation-no-test-server.scss',
})
export class TestingEndpointFilterIsolationNoTestServerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ValidationFilter<T> is exactly the kind of short-circuit logic that needs a test proving BOTH outcomes — and neither requires a running server',
      points: [
        'The main Minimal APIs page\'s "Endpoint Filters" section shows a <code>ValidationFilter&lt;T&gt;</code> that either returns <code>Results.ValidationProblem(...)</code> directly (short-circuiting the handler) or calls <code>await next(ctx)</code> to let the handler run. Because <code>IEndpointFilter.InvokeAsync</code> is a plain interface method taking an <code>EndpointFilterInvocationContext</code> and an <code>EndpointFilterDelegate</code>, it can be tested by constructing that context directly and passing a FAKE <code>next</code> delegate — no <code>WebApplicationFactory</code>, no real HTTP request, no routing needed at all.',
      ],
    },
    {
      heading: 'A fake "next" delegate that records whether it was called lets a test prove the short-circuit behavior directly — distinguishing "handler ran" from "handler was skipped"',
      points: [
        'The critical thing to verify about ANY endpoint filter is not just WHAT it returns, but WHETHER it calls <code>next(ctx)</code> at all — a filter with an inverted condition might return the correct-looking error message while still accidentally calling <code>next</code> and letting an invalid request reach the handler anyway. A fake delegate that simply sets a boolean flag and returns a sentinel result makes this directly observable in a test, independent of whatever the real handler would have done.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the main page\'s own ValidationFilter<T> — both the short-circuit AND the pass-through path',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.Http;

public class ValidationFilterTests
{
    // A fake CreateProductDto with a validation attribute, matching the
    // shape the main page's own filter is designed to validate:
    public record CreateProductDto(
        [property: Required] string? Name,
        [property: Range(0.01, double.MaxValue)] decimal Price);

    private static EndpointFilterInvocationContext BuildContext(object arg)
    {
        // EndpointFilterInvocationContext can be constructed directly in
        // a test — no routing, no HTTP pipeline, no real request needed:
        var httpContext = new DefaultHttpContext();
        return EndpointFilterInvocationContext.Create(httpContext, arg);
    }

    [Fact]
    public async Task InvalidDto_ShortCircuits_NeverCallsNext()
    {
        var filter = new ValidationFilter<CreateProductDto>();
        var invalidDto = new CreateProductDto(Name: null, Price: -5m);   // both rules broken
        var ctx = BuildContext(invalidDto);

        var nextWasCalled = false;
        EndpointFilterDelegate fakeNext = _ =>
        {
            nextWasCalled = true;          // proves whether the handler
            return ValueTask.FromResult<object?>(Results.Ok());   // would have run
        };

        var result = await filter.InvokeAsync(ctx, fakeNext);

        // BOTH assertions matter: the filter returned a validation
        // problem AND the handler was never reached. A filter with an
        // inverted condition bug could satisfy the first assertion by
        // coincidence while still calling next() — this second
        // assertion is what actually proves the short-circuit worked:
        Assert.IsType<HttpValidationProblemDetails>(
            Assert.IsAssignableFrom<Microsoft.AspNetCore.Http.HttpResults.ValidationProblem>(result).ProblemDetails);
        Assert.False(nextWasCalled, "The handler should never run for an invalid DTO");
    }

    [Fact]
    public async Task ValidDto_CallsNext_HandlerResultPassesThrough()
    {
        var filter = new ValidationFilter<CreateProductDto>();
        var validDto = new CreateProductDto(Name: "Widget", Price: 9.99m);
        var ctx = BuildContext(validDto);

        var nextWasCalled = false;
        EndpointFilterDelegate fakeNext = _ =>
        {
            nextWasCalled = true;
            return ValueTask.FromResult<object?>(Results.Ok("handler ran"));
        };

        var result = await filter.InvokeAsync(ctx, fakeNext);

        // For a VALID dto, the filter's own return value should be
        // WHATEVER the handler (fakeNext) returned — proving the filter
        // is a transparent pass-through, not accidentally swallowing or
        // replacing the handler's actual result:
        Assert.True(nextWasCalled);
        Assert.Equal("handler ran",
            (result as Microsoft.AspNetCore.Http.HttpResults.Ok<string>)?.Value);
    }
}`,
    },
    {
      label: 'The bug this test style actually catches — an inverted validation condition that STILL calls next()',
      language: 'csharp',
      code: `// A subtly broken ValidationFilter<T> — the condition is INVERTED,
// so it calls next() when validation FAILS instead of when it PASSES:
public class BrokenValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var arg = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (arg is null) return Results.BadRequest("Missing body");

        var errors = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(arg, new ValidationContext(arg), errors, true);

        // BUG: this condition is backwards — it returns the validation
        // problem when 'isValid' is TRUE (should be FALSE), meaning a
        // VALID request gets rejected, and an INVALID request silently
        // falls through to 'return await next(ctx)' at the bottom:
        if (isValid)
            return Results.ValidationProblem(
                errors.GroupBy(e => e.MemberNames.FirstOrDefault() ?? "")
                      .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage!).ToArray()));

        return await next(ctx);   // reached for INVALID input — the real bug
    }
}

// A test asserting ONLY "did we get a ValidationProblem back" for the
// invalid-input case would actually FAIL here (correctly catching the
// bug, since the broken filter calls next() instead) — but a WEAKER
// test that only checks "the handler's result type looks right" and
// never asserts on 'nextWasCalled' explicitly could miss WHY the test
// failed, or worse, pass entirely if the fake handler happens to also
// return something that looks superficially like a validation problem.
// The 'nextWasCalled' boolean flag from the previous tab is what makes
// the test's failure message immediately diagnostic: it directly says
// "the handler ran when it shouldn't have" rather than a vague
// assertion mismatch.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The tests in this subtopic construct an <code>EndpointFilterInvocationContext</code> directly and pass a hand-written fake <code>next</code> delegate. Identify one thing about a REAL request pipeline that this testing approach does NOT verify, and explain why an integration test would still be needed for full confidence in a chain of MULTIPLE filters.',
    hint: 'Consider what happens when TWO OR MORE filters are chained via multiple .AddEndpointFilter() calls on the same endpoint — does testing each filter in isolation prove anything about the ORDER they actually execute in, or how they interact with each other\'s short-circuit behavior?',
    solution: `Testing a single filter in isolation, as this subtopic does, proves that
filter's OWN short-circuit logic is correct — but it says nothing about
FILTER ORDERING or INTERACTION when multiple filters are chained on the
same endpoint via several .AddEndpointFilter() calls. The main page's own
theory section states the execution order explicitly ("filter 1 before →
filter 2 before → handler → filter 2 after → filter 1 after") — but that
ordering is a property of how ASP.NET Core's endpoint filter PIPELINE
composes multiple registered filters together, not a property any single
filter's InvokeAsync method can prove on its own.

A real chain of filters introduces failure modes that isolated
per-filter tests cannot catch:

1. If Filter A short-circuits (returns without calling next), does
   Filter B ever run? (It shouldn't — but only an integration test with
   BOTH filters actually registered on the same endpoint proves this.)
2. If Filter B's "after next()" logic depends on something Filter A set
   up in ITS "before next()" logic (e.g., a value stashed in
   HttpContext.Items), isolated tests of each filter never exercise that
   interaction at all.
3. The literal registration ORDER on the endpoint (which filter's
   .AddEndpointFilter() call comes first) determines actual execution
   order — a typo swapping two .AddEndpointFilter() calls in Program.cs
   is invisible to any test that constructs and invokes each filter
   directly, since that test never goes through the endpoint's actual
   registered filter pipeline.

For full confidence, an integration test using WebApplicationFactory
that sends a real request through the ENDPOINT (with its full,
correctly-ordered filter chain attached) is still necessary — the
isolated unit tests in this subtopic are fast and precise for verifying
ONE filter's OWN logic, but they are a complement to, not a
replacement for, at least some end-to-end coverage of the actual
registered pipeline.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing an IEndpointFilter requires spinning up a WebApplicationFactory and sending a real HTTP request through the full pipeline.',
      reality: 'IEndpointFilter.InvokeAsync is a plain interface method — constructing an EndpointFilterInvocationContext directly and passing a hand-written fake next delegate tests the filter\'s logic in complete isolation, with no server, no routing, and no real HTTP request involved.',
    },
    {
      thought: 'asserting that a filter returns the correct-looking result (like a ValidationProblem) for invalid input is sufficient to prove the short-circuit behavior works correctly.',
      reality: 'a filter with an inverted condition bug can still call next() even while returning what looks like the correct error result in some code paths — explicitly asserting whether the fake next delegate was actually invoked is what catches this class of bug, not just checking the returned result\'s type.',
    },
    {
      thought: 'testing each endpoint filter in isolation is sufficient to guarantee a chain of multiple filters on the same endpoint behaves correctly together.',
      reality: 'filter ordering and inter-filter interaction (like one filter\'s before-logic setting up state a later filter\'s after-logic depends on) are properties of the ENDPOINT\'s actual registered filter pipeline — only an integration test exercising the real chain, in its real registration order, can verify these.',
    },
  ];
}
