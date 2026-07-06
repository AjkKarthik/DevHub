import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nested-group-filters-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nested-group-filters-execute-outside-in-like-middleware.html',
  styleUrl: './nested-group-filters-execute-outside-in-like-middleware.scss',
})
export class NestedGroupFiltersExecuteOutsideInLikeMiddlewareSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Route Groups" code tab nests a groups.MapGroup("/{userId:int}/orders") sub-group under users, and separately its "Group Auth + Metadata" example attaches a filter to a top-level group — but never shows what happens when BOTH an outer group AND an inner, nested group each have their OWN filter attached',
      points: [
        'When a request reaches an endpoint mapped through a chain of nested groups, filters execute in the order they were ATTACHED across the WHOLE hierarchy, from outermost group inward, then the endpoint\'s OWN filters last — and each filter WRAPS the ones registered after it, exactly like ASP.NET Core middleware wraps the next middleware in the pipeline. The outer group\'s filter code BEFORE its <code>await next(ctx)</code> call runs FIRST; the inner group\'s filter code before ITS <code>next()</code> call runs SECOND; the handler runs; then the inner filter\'s code AFTER its <code>next()</code> call runs; then the outer filter\'s code after ITS <code>next()</code> call runs LAST.',
        'This is precisely the same nesting/wrapping mental model as the standard ASP.NET Core middleware pipeline — outer wraps inner, both "before" phases run in registration order going IN, both "after" phases run in REVERSE order coming OUT — applied one level up, at the route-group hierarchy rather than the whole-app middleware chain.',
      ],
    },
    {
      heading: 'A concrete consequence: a LOGGING filter attached to an OUTER group cannot see or influence what an INNER group\'s AUTH-CHECK filter decides, because the outer filter\'s "before" code has ALREADY run and committed to calling next() before the inner filter even starts — but the outer filter\'s "after" code DOES get to see whatever the inner filter (or the handler) ultimately returned, since it runs after everything nested inside it completes',
      points: [
        'This means an outer "request timing" filter that measures elapsed time around its <code>await next(ctx)</code> call correctly captures the FULL duration of everything nested inside it — the inner group\'s filters AND the handler — because its own "after" code, where it would compute and log elapsed time, only runs once the ENTIRE inner chain has finished. An inner filter attempting the same timing measurement only captures whatever ran from ITS OWN registration point inward, not anything the outer filter\'s "before" phase did first.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Nested groups, each with their own filter — tracing the actual execution order',
      language: 'csharp',
      code: `public class TracingFilter(string label) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        Console.WriteLine($"[{label}] BEFORE");
        var result = await next(ctx);
        Console.WriteLine($"[{label}] AFTER");
        return result;
    }
}

// Matches the main page's own nesting shape — an OUTER group ("users")
// and an INNER, nested group ("orders") — each with its OWN filter:
var users = app.MapGroup("/api/users")
    .AddEndpointFilter(new TracingFilter("OUTER-users"));

var orders = users.MapGroup("/{userId:int}/orders")
    .AddEndpointFilter(new TracingFilter("INNER-orders"));

orders.MapGet("/", (int userId) =>
{
    Console.WriteLine("[HANDLER] running");
    return Results.Ok(Array.Empty<object>());
})
.AddEndpointFilter(new TracingFilter("ENDPOINT-own"));

// A request to GET /api/users/42/orders prints, IN THIS EXACT ORDER:
//   [OUTER-users] BEFORE
//   [INNER-orders] BEFORE
//   [ENDPOINT-own] BEFORE
//   [HANDLER] running
//   [ENDPOINT-own] AFTER
//   [INNER-orders] AFTER
//   [OUTER-users] AFTER
//
// Outermost registration wraps everything — its BEFORE runs first,
// its AFTER runs LAST — exactly matching standard ASP.NET Core
// middleware nesting semantics, just one level up at the group
// hierarchy instead of app.Use() calls.`,
    },
    {
      label: 'A test proving the wrap order, and why an inner filter can\'t see an outer filter\'s "before" decision',
      language: 'csharp',
      code: `[Fact]
public async Task Nested_Group_Filters_Execute_Outside_In_Then_Unwind_Inside_Out()
{
    var executionOrder = new List<string>();

    IEndpointFilter TracingFilter(string label) =>
        new RecordingFilter(label, executionOrder);

    await using var app = new TestWebApp(builder =>
    {
        var users = builder.MapGroup("/api/users")
            .AddEndpointFilter(TracingFilter("outer"));
        var orders = users.MapGroup("/{userId:int}/orders")
            .AddEndpointFilter(TracingFilter("inner"));
        orders.MapGet("/", () => Results.Ok());
    });

    await app.CreateClient().GetAsync("/api/users/42/orders");

    Assert.Equal(
        new[] { "outer-before", "inner-before", "inner-after", "outer-after" },
        executionOrder);
    // Proves the wrap order EXACTLY — outer's before is first, outer's
    // after is last, matching the middleware-nesting mental model.
}

// Why an outer LOGGING filter can't be influenced by an inner AUTH
// filter's decision made AFTER the outer's own "before" phase already
// committed to calling next() — the outer filter has no way to know
// what the inner filter will decide, only what it ultimately RETURNS:
public class OuterTimingFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var sw = Stopwatch.StartNew();
        // At THIS point, the outer filter has already decided to
        // proceed — it cannot "undo" that decision based on what an
        // INNER filter later chooses to do (short-circuit or not):
        var result = await next(ctx);
        sw.Stop();

        // But it DOES correctly see and can act on whatever the WHOLE
        // nested chain ultimately produced — including an inner
        // filter's short-circuit result:
        Console.WriteLine($"Total nested duration: {sw.ElapsedMilliseconds}ms");
        return result;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team attaches an authentication-check filter to an OUTER group and a rate-limiting filter to an INNER, nested group, expecting the rate limiter to only ever run for requests that already passed authentication. A request with invalid credentials still shows the rate limiter\'s "before" log line executing. Explain precisely why, using the actual short-circuit mechanics of the outer filter.',
    hint: 'The outer auth filter, upon detecting invalid credentials, presumably returns an Unauthorized result WITHOUT calling await next(ctx). Does the request in the log actually reach that far, or is there a DIFFERENT reason the rate limiter\'s before-line appears — perhaps the auth filter is not actually short-circuiting the way the team assumes?',
    solution: `If the outer auth filter is correctly implemented — checking
credentials and returning an Unauthorized IResult WITHOUT calling
await next(ctx) when they're invalid — the inner rate-limiting
filter's "before" code should NEVER execute for that request, because
next() is precisely the call that hands control to whatever is nested
inside (the inner group's filters, then the handler). If the log line
appears anyway, the most likely explanation is that the auth filter is
NOT actually short-circuiting — it is calling await next(ctx)
regardless of the credential check's outcome, perhaps only setting a
response status code or writing to HttpContext.Response directly
without RETURNING early, and then falling through to next() at the end
of its method body regardless.

This is exactly the kind of mistake the main page's own theory
("attach with AddEndpointFilter... short-circuit by returning a result
directly") already warns about in the abstract, but this subtopic's
nesting scenario makes the CONSEQUENCE much larger: a short-circuit
bug in an OUTER group's filter doesn't just affect the immediately
next step — it means EVERY filter and handler nested inside that
group (potentially many endpoints across several nested sub-groups)
also unintentionally executes for requests that should have been
rejected at the outer layer. The blast radius of an outer filter's
short-circuit bug scales with how much is nested beneath it — which
is precisely why filters intended to gate access for a WHOLE group
(auth checks, in particular) deserve extra scrutiny and a dedicated
test proving next() is genuinely NOT called on the rejection path,
exactly like the direct-filter-testing technique covered earlier in
this set: construct the invocation context with invalid credentials,
supply a next delegate that sets a flag if called, and assert that
flag stays false.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a filter attached to an outer route group and a filter attached to a nested inner sub-group run independently, with no defined relationship to each other\'s execution order.',
      reality: 'they nest exactly like ASP.NET Core middleware — the outer group\'s filter code before its next() call runs first, the inner group\'s filter runs next, then the handler, then the inner filter\'s "after" code, then the outer filter\'s "after" code last, mirroring standard middleware wrap-around semantics one level up at the group hierarchy.',
    },
    {
      thought: 'an outer group\'s filter can inspect or react to what an inner, nested group\'s filter decides, since the outer filter "wraps" everything nested inside it.',
      reality: 'the outer filter\'s decision to call next() (or not) is made and committed BEFORE the inner filter even starts — it has no way to see or influence the inner filter\'s OWN decision-making, though it DOES correctly observe whatever the entire nested chain ultimately returns, once next() resolves.',
    },
    {
      thought: 'a short-circuit bug in an outer group\'s filter (accidentally calling next() when it should reject the request) is contained to that one filter\'s own immediate effect.',
      reality: 'because filters nest, a short-circuit bug in an OUTER group\'s filter lets execution fall through to EVERY filter and handler nested inside that group — potentially many endpoints across several sub-groups — making the blast radius of such a bug scale with everything registered beneath it, not just the one filter\'s own logic.',
    },
  ];
}
