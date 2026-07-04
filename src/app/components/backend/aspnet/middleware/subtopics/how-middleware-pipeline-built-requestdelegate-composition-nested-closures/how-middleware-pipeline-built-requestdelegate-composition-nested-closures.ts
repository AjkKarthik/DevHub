import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-middleware-pipeline-built-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-middleware-pipeline-built-requestdelegate-composition-nested-closures.html',
  styleUrl: './how-middleware-pipeline-built-requestdelegate-composition-nested-closures.scss',
})
export class HowMiddlewarePipelineBuiltRequestdelegateCompositionNestedClosuresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Russian doll" analogy is not just a helpful mental model — it describes the LITERAL implementation, built ONCE at startup, not evaluated fresh per request',
      points: [
        'The main Middleware Pipeline page describes the pipeline as "a nested stack" and notes "the pipeline is built once at startup as a chain of RequestDelegate instances and reused for every request." This subtopic covers exactly HOW that "chain of RequestDelegate instances" gets built — it is not a list the runtime iterates through at request time, checking each item in turn; it is a single, deeply NESTED CLOSURE, compiled once, where each middleware\'s compiled delegate directly calls the NEXT one baked in as a captured variable.',
      ],
    },
    {
      heading: 'Every app.Use() call wraps the CURRENT pipeline-so-far in a new function that captures it as "next" — building the chain from the INSIDE OUT, in reverse of registration order',
      points: [
        '<code>IApplicationBuilder.Build()</code> works by starting with a default 404 delegate (the innermost "doll") and then applying each registered middleware component\'s factory function IN REVERSE registration order, each time wrapping the CURRENT delegate as the new one\'s captured "next" parameter. The FIRST middleware registered ends up as the OUTERMOST wrapper (since it is applied LAST in this reverse construction), and the LAST middleware registered ends up closest to the innermost terminal delegate — matching exactly the observable behavior that the first-registered middleware runs first and gets the LAST word on the way out.',
        'The result of <code>Build()</code> is a SINGLE <code>RequestDelegate</code> — one <code>Func&lt;HttpContext, Task&gt;</code> — that, when invoked, executes the ENTIRE chain through ordinary nested method calls (each middleware\'s compiled code literally calls <code>await next(context)</code>, where <code>next</code> is the closure-captured delegate for whatever comes after it). There is no "loop over a list of middleware" happening at request time at all — it is functionally identical to deeply nested function calls, exactly like manually writing <code>A(B(C(D(context))))</code>.',
      ],
    },
    {
      heading: 'This explains why conditionally registering middleware inside an "if" block works perfectly, but there is no way to add middleware to an ALREADY-BUILT pipeline afterward',
      points: [
        'The main page\'s own environment-branching pattern (registering different middleware inside <code>if (app.Environment.IsDevelopment())</code>) works completely naturally BECAUSE this is all still happening during the ONE-TIME <code>Build()</code>-equivalent construction phase — the <code>if</code> statement simply decides WHICH factory functions get applied when composing the nested closure, exactly like choosing which functions to call when manually building a chain of function calls in ordinary code. Once the FINAL composed <code>RequestDelegate</code> exists (analogous to the sealed <code>IServiceProvider</code> from the previous subtopic\'s own DI-container discussion), there is no mechanism to insert a NEW link into that already-compiled chain — you would need to rebuild the entire chain from scratch.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pipeline, in registration order',
      language: 'csharp',
      code: `var app = builder.Build();

app.UseExceptionHandler("/error");   // registered 1st
app.UseHttpsRedirection();           // registered 2nd
app.UseRouting();                    // registered 3rd
app.UseAuthorization();              // registered 4th
app.MapGet("/hello", () => "Hi!");   // terminal endpoint

app.Run();

// Observable behavior: for an incoming request, ExceptionHandler runs
// FIRST (outermost), then HttpsRedirection, then Routing, then
// Authorization, then finally the /hello endpoint — and on the way
// BACK out, they unwind in the OPPOSITE order (Authorization's
// post-next() code, then Routing's, then HttpsRedirection's, then
// ExceptionHandler's, which is why it can catch exceptions from ALL
// of them).`,
    },
    {
      label: 'What Build() conceptually does — composing from the INSIDE OUT, in reverse',
      language: 'csharp',
      code: `// Conceptually, IApplicationBuilder.Build() does something like this
// (heavily simplified, illustrating the actual composition mechanism):

RequestDelegate BuildPipeline(List<Func<RequestDelegate, RequestDelegate>> components)
{
    // Start with the innermost "doll" — a default terminal delegate
    // (roughly: "no endpoint matched, return 404"):
    RequestDelegate pipeline = context =>
    {
        context.Response.StatusCode = 404;
        return Task.CompletedTask;
    };

    // Walk the REGISTERED components in REVERSE order, each time
    // wrapping the CURRENT pipeline as the new component's captured
    // "next" — building the chain from the inside out:
    for (int i = components.Count - 1; i >= 0; i--)
    {
        pipeline = components[i](pipeline);
        // Each middleware "factory" function captures the CURRENT
        // "pipeline" value as its own private "next" variable, via an
        // ordinary C# closure — this is EXACTLY the same mechanism
        // that lets a lambda capture any other local variable.
    }

    return pipeline;   // the FINAL, single composed RequestDelegate
}

// Applying this to [ExceptionHandler, HttpsRedirection, Routing, Authorization]:
// - Start: pipeline = the 404 delegate
// - Apply Authorization LAST-registered-but-FIRST-composed: pipeline =
//   Authorization(next: 404-delegate)
// - Apply Routing: pipeline = Routing(next: Authorization(...))
// - Apply HttpsRedirection: pipeline = HttpsRedirection(next: Routing(...))
// - Apply ExceptionHandler (FIRST registered, so processed LAST here):
//   pipeline = ExceptionHandler(next: HttpsRedirection(...))
//
// FINAL RESULT: ExceptionHandler is the OUTERMOST wrapper — exactly
// matching the "registered first = runs first, catches everything
// downstream" behavior the main page describes.`,
    },
    {
      label: 'Why this is literally nested function calls, not a loop over a list',
      language: 'csharp',
      code: `// The FINAL composed pipeline, once built, behaves EXACTLY like this
// manually-written nested call chain (illustrative, not the literal
// generated code, but functionally identical in structure):

async Task InvokeFullPipeline(HttpContext context)
{
    await ExceptionHandlerMiddleware(context, next: async ctx =>
    {
        await HttpsRedirectionMiddleware(ctx, next: async ctx2 =>
        {
            await RoutingMiddleware(ctx2, next: async ctx3 =>
            {
                await AuthorizationMiddleware(ctx3, next: async ctx4 =>
                {
                    await EndpointDelegate(ctx4);   // the innermost "doll"
                });
            });
        });
    });
}

// There is NO "for each middleware in this list, call it" loop
// happening on EVERY request — the entire nested structure above was
// ALREADY COMPILED, ONCE, when Build() ran at startup. Handling a
// request is just CALLING this one, already-fully-formed, deeply
// nested RequestDelegate — the SAME reason ordinary nested function
// calls in any C# program have no per-call "which function comes
// next" lookup overhead: the call graph is fixed at compile
// (here: pipeline-build) time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two developers register the SAME three middleware components but in DIFFERENT files, expecting registration order to not matter since "the pipeline just runs all of them." One developer registers <code>UseAuthorization()</code> before <code>UseRouting()</code>. Using the reverse-composition mechanism from this subtopic, explain PRECISELY why this specific ordering mistake produces a runtime error or unexpected behavior, tracing through how Build() would compose it.',
    hint: 'Trace through the SAME reverse-composition process this subtopic describes, but with UseAuthorization() appearing BEFORE UseRouting() in the registration list — consider what "next" UseAuthorization\'s compiled delegate would end up capturing, and whether the endpoint metadata UseAuthorization needs to read would actually be available at that point in the chain.',
    solution: `// The MISTAKEN registration order:
app.UseAuthorization();   // registered 1st (WRONG position)
app.UseRouting();         // registered 2nd
app.MapGet("/admin", [Authorize] () => "secret");

// TRACING THROUGH THE SAME REVERSE-COMPOSITION PROCESS:
// - Start: pipeline = 404-delegate (or the endpoint-execution delegate)
// - Apply UseRouting (registered 2nd, so composed FIRST in the reverse
//   walk): pipeline = RoutingMiddleware(next: endpoint-execution-delegate)
//   — Routing's job is to MATCH the request path against registered
//   endpoints and store the result (including [Authorize] metadata) on
//   HttpContext, THEN call next().
// - Apply UseAuthorization (registered 1st, so composed LAST — meaning
//   it becomes the OUTERMOST wrapper): pipeline =
//   AuthorizationMiddleware(next: RoutingMiddleware(...))
//
// THE RESULTING COMPOSED CHAIN, in EXECUTION order: Authorization runs
// FIRST, and THEN calls next(), which is Routing.
//
// WHY THIS BREAKS: Authorization's job is to read the MATCHED
// ENDPOINT'S metadata (does it require [Authorize]? which policy?) —
// but at the moment Authorization actually runs, ROUTING HAS NOT RUN
// YET (it is the NEXT delegate, not something that already executed).
// HttpContext has NO matched-endpoint information available when
// Authorization inspects it, because Authorization is now the
// OUTERMOST wrapper, executing BEFORE Routing populates that data.
//
// The concrete symptom: Authorization either can't find any
// [Authorize] requirement to enforce at all (since no endpoint is
// "matched" yet from its perspective) and lets everything through
// unchecked, OR — depending on the exact ASP.NET Core version and
// configuration — throws an explicit exception at startup
// ("Endpoint routing does not support..." or similar), specifically
// because the framework detects Authorization is composed in a
// position where it cannot possibly do its job correctly.
//
// THE FIX (matching the main page's own required ordering):
app.UseRouting();          // FIRST — populates endpoint metadata
app.UseAuthorization();    // SECOND — now has metadata to read
app.MapGet("/admin", [Authorize] () => "secret");
// Reverse-composing THIS order: Routing becomes the OUTER wrapper,
// Authorization becomes the INNER one — meaning Routing genuinely
// runs and populates its metadata BEFORE Authorization's turn comes,
// which is exactly the dependency the main page's ordering rule exists
// to satisfy.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the ASP.NET Core middleware pipeline works by iterating through a list of registered middleware components on every incoming request, checking each one in turn.',
      reality: 'the pipeline is compiled ONCE, at startup, into a single deeply-nested RequestDelegate (function) where each middleware\'s compiled code directly calls the NEXT one via an ordinary closure-captured variable — handling a request is just invoking this one pre-built function, with no per-request iteration or lookup at all.',
    },
    {
      thought: 'the middleware composed FIRST in the resulting pipeline (built via Build()) corresponds to whichever middleware is registered LAST in Program.cs, since Build() processes registrations "in reverse."',
      reality: 'the OBSERVABLE execution order still matches registration order exactly — the first-registered middleware runs first and becomes the outermost wrapper; the reverse-order construction is an internal implementation detail of HOW the nested closures get built, not a reversal of the resulting behavior.',
    },
    {
      thought: 'a middleware ordering mistake like UseAuthorization() before UseRouting() is caught by the compiler or produces a clear, universal error message.',
      reality: 'the failure mode depends on what the misordered middleware actually needs from HttpContext state that a LATER middleware would have populated — it can silently let requests through unchecked, throw at request time, or (in some configurations) throw an explicit startup-time exception, but it is a logical/data-flow bug, not something the C# compiler can detect.',
    },
  ];
}
