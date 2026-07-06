import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-onstarting-callbacks-lifo-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './onstarting-callbacks-run-lifo-order-last-registered-fires-first.html',
  styleUrl: './onstarting-callbacks-run-lifo-order-last-registered-fires-first.scss',
})
export class OnstartingCallbacksRunLifoOrderLastRegisteredFiresFirstSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows ONE OnStarting callback per example — with only one registered, the ordering question never comes up at all',
      points: [
        'The main Middleware Pipeline page\'s examples (correlation ID, elapsed-time header) each register EXACTLY ONE <code>OnStarting</code> callback. The moment a SECOND middleware in the SAME pipeline also registers its own <code>OnStarting</code> callback, a genuinely surprising ordering rule applies: callbacks fire in <strong>LIFO (last-in, first-out) order</strong> — the LAST callback REGISTERED is the FIRST one to actually RUN, the exact reverse of what "registration order" would naturally suggest.',
      ],
    },
    {
      heading: 'OnStarting callbacks are pushed onto an internal STACK, not appended to a queue — this is why the order reverses',
      points: [
        'Internally, <code>HttpResponse.OnStarting(callback)</code> pushes the callback onto a stack-like structure. When the response actually begins (the first byte is about to be written), that stack is popped and each callback invoked in POP order — meaning the callback that was pushed LAST (registered most recently, i.e., by the middleware CLOSEST to the actual endpoint in the "Russian doll" pipeline) fires FIRST, and the callback registered EARLIEST (by the OUTERMOST middleware, closer to where the main page\'s own <code>ExceptionHandler</code> sits) fires LAST.',
        'This mirrors a genuinely intuitive engineering reason once understood: the middleware CLOSEST to the actual endpoint has the MOST UP-TO-DATE, most specific information about what just happened (the actual response that was produced) — firing its callback FIRST lets it potentially influence what happens before broader, more general OUTER middleware get their turn.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two OnStarting callbacks registered by two different middleware — order matters',
      language: 'csharp',
      code: `var app = builder.Build();

// Registered FIRST (outermost in the "Russian doll" pipeline):
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        Console.WriteLine("Callback A (registered 1st, OUTER middleware) firing");
        context.Response.Headers["X-Outer"] = "A";
        return Task.CompletedTask;
    });
    await next(context);
});

// Registered SECOND (closer to the endpoint, INNER middleware):
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        Console.WriteLine("Callback B (registered 2nd, INNER middleware) firing");
        context.Response.Headers["X-Inner"] = "B";
        return Task.CompletedTask;
    });
    await next(context);
});

app.MapGet("/", () => "Hello");

// ACTUAL OUTPUT ORDER when a request comes in:
// "Callback B (registered 2nd, INNER middleware) firing"   <- fires FIRST
// "Callback A (registered 1st, OUTER middleware) firing"   <- fires SECOND
//
// Both headers still end up on the response either way (order of
// HEADER VALUES is unaffected) — but if either callback's LOGIC
// depends on the OTHER having already run (e.g., reading a header the
// other callback is expected to have already set), the LIFO order can
// produce genuinely wrong, timing-dependent results.`,
    },
    {
      label: 'Where this actually bites — a callback that depends on another callback\'s side effect',
      language: 'csharp',
      code: `// Middleware A (registered FIRST/OUTER) — wants to read a value that
// middleware B ALSO sets via its own OnStarting callback:
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        // Because of LIFO firing order, middleware B's callback
        // (registered SECOND/INNER) has ALREADY run by the time THIS
        // callback executes — so this DOES find the header, even
        // though A was registered BEFORE B in Program.cs:
        if (context.Response.Headers.TryGetValue("X-Request-Id", out var id))
            context.Response.Headers["X-Combined-Log-Id"] = \$"outer-saw-{id}";
        else
            context.Response.Headers["X-Combined-Log-Id"] = "outer-saw-nothing";
        return Task.CompletedTask;
    });
    await next(context);
});

// Middleware B (registered SECOND/INNER) — sets X-Request-Id:
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Request-Id"] = Guid.NewGuid().ToString("N");
        return Task.CompletedTask;
    });
    await next(context);
});

// RESULT with THIS specific registration order: "X-Combined-Log-Id"
// ends up as "outer-saw-<real-id>" — A's callback DOES see B's header,
// specifically BECAUSE LIFO order runs B (registered later) first.
//
// The genuinely dangerous part: if a developer later REORDERS these
// two app.Use() calls in Program.cs for an unrelated reason (moving A
// after B), the LIFO firing order FLIPS along with it, and A's
// callback would SUDDENLY see "outer-saw-nothing" instead — a working
// dependency between two callbacks silently breaks purely from
// reordering registration, with no compiler warning of any kind.`,
    },
    {
      label: 'The safer pattern — do not rely on cross-callback ordering at all',
      language: 'csharp',
      code: `// Rather than depending on LIFO firing order between two SEPARATE
// OnStarting registrations (which is easy to get backwards, and can
// shift if middleware registration order in Program.cs changes for
// unrelated reasons), compute and store any VALUE one callback needs
// from another BEFORE calling next() — using context.Items, which is
// available immediately, not tied to response-start timing at all:

app.Use(async (context, next) =>
{
    var requestId = Guid.NewGuid().ToString("N");
    context.Items["RequestId"] = requestId;   // available IMMEDIATELY,
                                                // no OnStarting needed
                                                // for OTHER middleware
                                                // to read this value

    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Request-Id"] = (string)context.Items["RequestId"]!;
        return Task.CompletedTask;
    });

    await next(context);
});

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        // Reads context.Items directly — NOT dependent on the OTHER
        // middleware's OnStarting callback having already fired,
        // since context.Items was populated BEFORE next() was ever
        // called, well before either OnStarting callback runs at all:
        var requestId = context.Items["RequestId"] as string ?? "unknown";
        context.Response.Headers["X-Combined-Log-Id"] = \$"combined-{requestId}";
        return Task.CompletedTask;
    });
    await next(context);
});
// Now correct REGARDLESS of which OnStarting callback happens to fire
// first — the dependency is on context.Items (set before next()),
// not on ordering between two OnStarting registrations at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has THREE middleware components, each registering its own <code>OnStarting</code> callback that appends a timing measurement to a shared list stored in <code>context.Items["Timings"]</code>. They expect the list to end up in REGISTRATION order (middleware 1\'s timing first, then 2\'s, then 3\'s) when logged after the response completes. Explain the actual order the list ends up in, and why.',
    hint: 'Apply the LIFO rule directly: the OnStarting callback registered LAST fires FIRST — trace through what "appends to a list" means when the callbacks fire in the REVERSE of the order the team assumed.',
    solution: `app.Use(async (context, next) =>
{
    context.Items["Timings"] = new List<string>();
    context.Response.OnStarting(() =>
    {
        ((List<string>)context.Items["Timings"]!).Add("Middleware1");
        return Task.CompletedTask;
    });
    await next(context);
});

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        ((List<string>)context.Items["Timings"]!).Add("Middleware2");
        return Task.CompletedTask;
    });
    await next(context);
});

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        ((List<string>)context.Items["Timings"]!).Add("Middleware3");
        return Task.CompletedTask;
    });
    await next(context);
});

// THE TEAM'S ASSUMPTION: the list will read ["Middleware1",
// "Middleware2", "Middleware3"] — matching registration order.
//
// THE ACTUAL RESULT: ["Middleware3", "Middleware2", "Middleware1"] —
// the EXACT REVERSE of registration order.
//
// WHY: OnStarting callbacks fire in LIFO order — the callback
// registered LAST (Middleware3's, since it is registered third/
// innermost in the pipeline) is the FIRST to actually execute when the
// response starts. It runs its "Add" call first, so "Middleware3" ends
// up FIRST in the list. Then Middleware2's callback fires, adding
// "Middleware2" SECOND. Finally Middleware1's callback (registered
// FIRST, but firing LAST due to LIFO order) adds "Middleware1" LAST.
//
// This is a genuinely easy assumption to get wrong, since EVERYTHING
// ELSE about the middleware pipeline (the main page's own "Russian
// doll" execution order for the code BEFORE and AFTER "await next()")
// runs in a way that DOES match registration-order intuition for the
// PRE-next() code — OnStarting callbacks are the one specific
// mechanism in the whole pipeline model that behaves according to a
// DIFFERENT (LIFO, stack-based) rule, precisely because they are
// deferred and fire independently of the normal nested-call unwind
// order the rest of the pipeline follows.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'multiple OnStarting callbacks registered by different middleware components fire in the SAME order the middleware itself was registered, just like the code that runs before "await next()".',
      reality: 'OnStarting callbacks fire in LIFO (last-in, first-out) order — the callback registered LAST (by the middleware closest to the endpoint) fires FIRST, the exact reverse of registration order.',
    },
    {
      thought: 'if one OnStarting callback depends on another having already set a value (like a response header), registering the DEPENDENT callback in a middleware registered EARLIER in Program.cs guarantees it runs after the one it depends on.',
      reality: 'because of the LIFO firing rule, a callback registered in an EARLIER (outer) middleware actually fires LATER than one registered in a LATER (inner) middleware — the safe pattern is storing shared values in context.Items before calling next(), rather than relying on cross-callback ordering at all.',
    },
    {
      thought: 'OnStarting callback ordering follows the same "Russian doll" nested-execution model the rest of the middleware pipeline uses.',
      reality: 'OnStarting callbacks are deferred onto an internal stack and fire independently of the normal pipeline unwind order — they are the one specific mechanism in the pipeline model governed by a genuinely different (LIFO) rule from everything else described in the main topic page.',
    },
  ];
}
