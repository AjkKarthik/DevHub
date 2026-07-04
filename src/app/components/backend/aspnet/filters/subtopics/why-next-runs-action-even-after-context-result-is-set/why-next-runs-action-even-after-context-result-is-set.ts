import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-next-runs-action-anyway-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-next-runs-action-even-after-context-result-is-set.html',
  styleUrl: './why-next-runs-action-even-after-context-result-is-set.scss',
})
export class WhyNextRunsActionEvenAfterContextResultIsSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own first Common Mistake states the SYMPTOM ("the action executes anyway and its result overwrites yours") without explaining the MECHANISM that makes this happen',
      points: [
        'The main Filters page\'s first Common Mistake shows setting <code>ctx.Result = new UnauthorizedResult();</code> and then STILL calling <code>await next();</code> — and states the consequence: "the action executes anyway and its result overwrites yours." The natural assumption a developer might make is that the FRAMEWORK checks whether <code>context.Result</code> is already set before deciding whether to run the next step. It does not — at least not at the point <code>next()</code> is called.',
      ],
    },
    {
      heading: 'ActionExecutionDelegate (the "next" parameter) is simply a delegate pointing at the next step in the pipeline — invoking it unconditionally runs that next step, regardless of what context.Result already contains',
      points: [
        'Calling <code>await next()</code> inside a filter\'s <code>OnActionExecutionAsync</code> does exactly one thing: it invokes whatever comes NEXT in the pipeline — either the next registered filter, or (if this is the innermost filter) the action method itself. This invocation is UNCONDITIONAL: <code>next()</code> has no built-in check for "has <code>context.Result</code> already been set by an earlier step?" It simply calls the next delegate in the chain, and that next delegate (if it is the ACTION itself) runs to completion and PRODUCES ITS OWN <code>IActionResult</code>, which then gets assigned to <code>context.Result</code> — silently OVERWRITING whatever value was set before <code>next()</code> was called.',
        'The check that WOULD have prevented the action from running lives one level UP, in the FRAMEWORK\'s own filter-invocation loop — the code that decides "should I even call this filter\'s <code>OnActionExecutionAsync</code> in the first place" for the NEXT filter in the sequence. But by the time a filter has ALREADY called <code>next()</code>, that decision has already been made and cannot be undone — the correct place to make that check is BEFORE calling <code>next()</code>, inside the CURRENT filter\'s own code, by simply not calling it (returning early instead).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing exactly what happens when a filter sets Result AND still calls next() — the main page\'s own broken example',
      language: 'csharp',
      code: `public async Task OnActionExecutionAsync(
    ActionExecutingContext ctx, ActionExecutionDelegate next)
{
    ctx.Result = new UnauthorizedResult();   // Step 1: sets Result to 401

    await next();   // Step 2: THIS is where the bug actually happens.
    // 'next()' does NOT look at 'ctx.Result' before deciding whether to
    // proceed. It is simply a delegate that, when invoked, runs the
    // NEXT step in the chain — which, since this is the innermost
    // filter, IS the action method itself:
    //
    //   1. The action method 'Create(CreateDto dto)' runs to completion,
    //      exactly as if 'ctx.Result' had never been touched.
    //   2. The action returns, say, 'Ok()' — an IActionResult.
    //   3. The MVC framework's action-invocation machinery assigns
    //      THIS NEW result to 'ctx.Result' (specifically,
    //      ActionExecutingContext and ActionExecutedContext share the
    //      underlying context object across the filter pipeline, and
    //      the action's return value becomes the new Result AFTER the
    //      action completes) — silently REPLACING the
    //      UnauthorizedResult that was set in Step 1.
    //
    // The client receives 200 OK from the action's own Ok() call —
    // the 401 UnauthorizedResult set in Step 1 was completely discarded,
    // because nothing in the pipeline ever re-checked 'ctx.Result'
    // between Step 1 and the action actually running.
}`,
    },
    {
      label: 'The fix, and WHY it works — returning early means next() is simply never called at all',
      language: 'csharp',
      code: `public async Task OnActionExecutionAsync(
    ActionExecutingContext ctx, ActionExecutionDelegate next)
{
    if (!IsAuthorised(ctx))
    {
        ctx.Result = new UnauthorizedResult();
        return;   // <-- THE FIX: simply never invoke 'next()' at all.
    }

    await next();   // only reached when authorization succeeds
}

// WHY THIS WORKS: the short-circuit is not some special "cancel"
// signal recognized by the framework — it is the ABSENCE of a call to
// 'next()'. Since 'next()' is the ONLY mechanism that advances the
// pipeline to the next filter or the action, simply not calling it
// means NOTHING further in the pipeline ever runs. The action method
// is never invoked, no subsequent filter's OnActionExecutionAsync
// runs, and 'ctx.Result' retains the UnauthorizedResult set moments
// earlier — because nothing after this point in the pipeline has any
// opportunity to overwrite it.

// THIS is also exactly why 'await next()' being OPTIONAL (rather than
// something the framework calls automatically after every filter) is
// the entire mechanism that makes short-circuiting possible at all —
// if the framework ITSELF called the next step automatically
// regardless of what a filter did, there would be NO WAY to skip the
// action from inside a filter, since the framework, not the filter,
// would control whether the next step ran.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that "next() is simply an unconditional delegate call, not a checked operation," predict what happens if a filter calls "await next()" TWICE in the same OnActionExecutionAsync method — once normally, then again by accident (e.g. a copy-paste mistake duplicating the line). Explain the observable consequence.',
    hint: 'Consider that if next() unconditionally invokes "whatever comes next" (the next filter, or the action itself), calling it a second time would invoke that SAME next step a second time — what would that mean for an action method that, say, increments a counter or inserts a database row each time it runs?',
    solution: `Calling "await next()" twice in the same filter would invoke the SAME
next pipeline step (the next filter, or the action itself, if this is
the innermost filter) TWICE — running it a second time with no
awareness that it already ran once. For an action method with side
effects — inserting a database row, incrementing a counter, sending an
email, charging a payment — this means the side effect happens TWICE
for what the client perceives as a SINGLE request.

Concretely:

public async Task OnActionExecutionAsync(
    ActionExecutingContext ctx, ActionExecutionDelegate next)
{
    var executed1 = await next();   // Runs the action — e.g. creates an order
    // ... some unrelated logic here, perhaps a copy-paste accident ...
    var executed2 = await next();   // BUG: runs the action AGAIN —
                                      // creates a SECOND, duplicate order
}

Because next() has no internal state tracking "have I already been
called once for this request," there is nothing in the framework that
detects or prevents this — the SAME mechanism that makes short-circuiting
possible (an unconditional, un-tracked delegate call) is exactly what
makes double-invocation a silent, undetected bug rather than something
that throws an obvious exception.

This reinforces the core lesson from this subtopic: next() carries NO
built-in safety net in either direction — it does not automatically
skip the action if Result was already set (as this subtopic's main
content covers), and it does not prevent being called more than once
either. Both directions of this "unconditional delegate" behavior place
the entire responsibility for correct control flow on the filter's own
code — call it exactly once, only when you intend the pipeline to
proceed, and never call it when you intend to short-circuit.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the ASP.NET Core filter pipeline automatically checks whether context.Result has already been set before deciding whether to invoke the action.',
      reality: 'next() is simply an unconditional delegate call to whatever comes next in the pipeline — it has no built-in check for whether Result was already set, which is exactly why a filter that sets Result AND still calls next() sees the action run and overwrite that Result anyway.',
    },
    {
      thought: 'short-circuiting a filter pipeline requires a special API or signal (like a "Cancel()" method) that tells the framework to stop processing.',
      reality: 'short-circuiting is achieved simply by NOT calling next() at all — since next() is the only mechanism that advances the pipeline, its absence means nothing further ever runs, with no special cancellation API needed.',
    },
    {
      thought: 'calling await next() more than once in the same filter is either impossible or automatically prevented by the framework.',
      reality: 'next() has no built-in tracking of how many times it has already been called — invoking it twice runs the next pipeline step (including the action itself, with any side effects) twice, silently, with nothing in the framework detecting or preventing the duplication.',
    },
  ];
}
