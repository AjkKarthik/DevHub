import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-csrf-middleware-redundancy-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './manual-validation-middleware-and-useantiforgery-are-redundant-not-layered.html',
  styleUrl: './manual-validation-middleware-and-useantiforgery-are-redundant-not-layered.scss',
})
export class ManualValidationMiddlewareAndUseantiforgeryAreRedundantNotLayeredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Different Tabs, Same Job',
      points: [
        'The main page presents "Minimal API (.NET 8+)" (app.UseAntiforgery() + .WithRequireAntiforgery()) and "Manual Validation" (a hand-rolled AntiforgeryMiddleware calling IAntiforgery.ValidateRequestAsync() directly) as if they were two separate techniques for two separate scenarios — but they solve the EXACT SAME problem: validating the antiforgery token pair on state-changing requests. The manual middleware pattern exists for scenarios where the built-in UseAntiforgery() middleware and WithRequireAntiforgery() extension do not fit (e.g. custom validation logic beyond pass/fail) — it is not meant to run ALONGSIDE the built-in one on the same endpoints.',
        'Registering BOTH on the same request pipeline means whichever runs FIRST determines what actually happens on an invalid token: UseAntiforgery() short-circuits with its own built-in 400 response before the custom middleware\'s ValidateRequestAsync() call and its friendlier catch block ever run — making the custom middleware\'s specific error-handling code an unreachable dead path for any endpoint both apply to.',
      ],
    },
    {
      heading: 'When the Manual Middleware Actually Adds Something',
      points: [
        'The one legitimate reason to keep a custom AntiforgeryMiddleware alongside — or instead of — UseAntiforgery() is to do something the built-in short-circuit cannot: return a DIFFERENT status code or response body than the default, or run additional logic (logging, metrics, a custom problem-details response) around the validation call. If that is the goal, the custom middleware needs to run BEFORE UseAntiforgery() in the pipeline — otherwise the built-in middleware\'s own failure response wins and the custom logic never executes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Registering both — order determines which failure response wins',
      language: 'csharp',
      code: `// Custom middleware FIRST — it wins on failure.
app.UseMiddleware<AntiforgeryMiddleware>();   // the page's own "Manual Validation" example
app.UseAntiforgery();                          // the page's own ".NET 8+" built-in middleware

app.MapPost("/orders", Handler).WithRequireAntiforgery();

// A request with an invalid token never reaches UseAntiforgery() at all —
// AntiforgeryMiddleware's own catch block already wrote a 400 response
// and returned, without calling next().`,
    },
    {
      label: 'Swap the order — the custom message becomes dead code',
      language: 'csharp',
      code: `// Built-in middleware FIRST — it wins on failure instead.
app.UseAntiforgery();
app.UseMiddleware<AntiforgeryMiddleware>();

app.MapPost("/orders", Handler).WithRequireAntiforgery();

// A request with a missing/invalid token never reaches AntiforgeryMiddleware
// at all — UseAntiforgery() already short-circuited with ITS OWN 400
// response. AntiforgeryMiddleware's custom "Invalid antiforgery token."
// message becomes unreachable dead code for every endpoint covered by
// WithRequireAntiforgery().`,
    },
    {
      label: 'Test — proving which failure response actually wins',
      language: 'csharp',
      code: `[Fact]
public async Task Custom_Middleware_Registered_First_Determines_The_Failure_Response()
{
    // Factory configured with AntiforgeryMiddleware BEFORE app.UseAntiforgery().
    var client = _factoryWithCustomFirst.CreateClient();

    var response = await client.PostAsync("/orders",
        new StringContent("{}", Encoding.UTF8, "application/json"));   // no token at all

    var body = await response.Content.ReadAsStringAsync();

    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    Assert.Equal("Invalid antiforgery token.", body);   // AntiforgeryMiddleware's own message won
}

[Fact]
public async Task Builtin_Middleware_Registered_First_Makes_Custom_Message_Unreachable()
{
    // Factory configured with app.UseAntiforgery() BEFORE AntiforgeryMiddleware.
    var client = _factoryWithBuiltinFirst.CreateClient();

    var response = await client.PostAsync("/orders",
        new StringContent("{}", Encoding.UTF8, "application/json"));

    var body = await response.Content.ReadAsStringAsync();

    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    Assert.NotEqual("Invalid antiforgery token.", body);   // the custom message never ran
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants a custom JSON problem-details body (not the framework\'s default plain-text 400) on antiforgery failures, but otherwise wants to keep using .WithRequireAntiforgery() and UseAntiforgery() for everything else. Given the ordering rule above, where should the custom middleware go, and what should it do differently from the page\'s own AntiforgeryMiddleware example?',
    hint: 'Think about what needs to run BEFORE the built-in short-circuit has a chance to fire, and whether the custom middleware should still call ValidateRequestAsync() itself or let UseAntiforgery() do that part.',
    solution: `The custom middleware needs to run BEFORE app.UseAntiforgery() in the
pipeline — otherwise, exactly as shown above, the built-in middleware's
own default failure response wins and the custom one never executes.

But rather than duplicating ValidateRequestAsync() itself (which would
validate the token TWICE — once in the custom middleware, once again
in UseAntiforgery() right after, if the custom one lets a valid request
through), the better design has the custom middleware wrap the CALL TO
next() in a try/catch for AntiforgeryValidationException, positioned
right before UseAntiforgery():

    app.Use(async (ctx, next) =>
    {
        try { await next(ctx); }
        catch (AntiforgeryValidationException)
        {
            ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Antiforgery validation failed",
                Status = 400,
            });
        }
    });
    app.UseAntiforgery();   // this is what actually throws on a bad token

This way, UseAntiforgery() still does the real validation work exactly
once — no duplicate ValidateRequestAsync() call — and the wrapping
middleware only exists to reshape whatever exception UseAntiforgery()
throws into the team's preferred response format.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "Manual Validation" custom middleware and its ".NET 8+" UseAntiforgery() section are two complementary layers of protection meant to be used together.',
      reality: 'they solve the exact same problem — registering both means whichever validates FIRST in the pipeline determines the actual failure response, and the other\'s error-handling logic becomes unreachable dead code for any endpoint they both cover.',
    },
    {
      thought: 'if both middlewares are registered, a request with an invalid token gets validated (and potentially rejected) twice, so it is at least harmless redundancy.',
      reality: 'whichever runs first short-circuits the pipeline on failure — the second middleware\'s ValidateRequestAsync() call never executes at all for a failing request, since next() is never called to reach it.',
    },
    {
      thought: 'customizing the antiforgery failure response requires replacing UseAntiforgery() with the hand-rolled ValidateRequestAsync() approach entirely.',
      reality: 'wrapping app.UseAntiforgery() in a try/catch middleware registered just before it reshapes the SAME exception UseAntiforgery() already throws, without validating the token a second time — keeping the built-in middleware doing the real work while only customizing the response format.',
    },
  ];
}
