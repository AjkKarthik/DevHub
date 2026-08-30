import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Main Page Names Pipeline Behaviors, But Never Shows the Order They Run In',
    points: [
      'Mistake #4 on the main page tells you to register <code>IPipelineBehavior&lt;,&gt;</code> ' +
      'implementations for validation, logging, and transactions — but only ever registers ONE ' +
      '(<code>ValidationBehavior</code>). It never shows what happens with two or more behaviors registered ' +
      'at once, or which one runs first.',
      'MediatR\'s pipeline behaviors wrap each other like the layers of an onion, and — like a middleware ' +
      'pipeline in ASP.NET Core — the ORDER they run in is determined entirely by REGISTRATION order: the ' +
      'FIRST behavior registered becomes the OUTERMOST layer, running before every other behavior on the way ' +
      'in, and after every other behavior on the way back out.',
      'This matters concretely: if <code>LoggingBehavior</code> is registered before ' +
      '<code>ValidationBehavior</code>, a request that FAILS validation still gets logged as "starting," ' +
      'because logging runs before validation ever gets a chance to short-circuit the request. Swap the ' +
      'registration order and that stops being true.',
    ],
  },
  {
    heading: 'Reading the Execution Order From Registration Code Alone',
    points: [
      'Given <code>services.AddTransient(typeof(IPipelineBehavior&lt;,&gt;), typeof(A))</code> followed by ' +
      '<code>services.AddTransient(typeof(IPipelineBehavior&lt;,&gt;), typeof(B))</code>, the runtime order is ' +
      'always: A\'s pre-handler code -> B\'s pre-handler code -> the actual handler -> B\'s post-handler code ' +
      '-> A\'s post-handler code. A wraps B, which wraps the handler.',
      'A common, correct convention is to register cross-cutting behaviors from OUTERMOST intent to INNERMOST: ' +
      'logging first (see everything, including failures), then validation (reject bad input before it does ' +
      'any real work), then a transaction wrapper closest to the handler (only open a database transaction for ' +
      'requests that already passed validation).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Registration Order = Wrap Order',
    language: 'csharp',
    code: `public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        Console.WriteLine($"[Logging] Starting {typeof(TRequest).Name}");
        var response = await next();
        Console.WriteLine($"[Logging] Finished {typeof(TRequest).Name}");
        return response;
    }
}

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        Console.WriteLine($"[Validation] Checking {typeof(TRequest).Name}");
        if (request is CreateOrderCommand { Total: <= 0 })
            throw new ValidationException("Total must be positive");
        Console.WriteLine($"[Validation] Passed {typeof(TRequest).Name}");
        return await next();
    }
}

// Registered LOGGING FIRST, then VALIDATION:
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// A VALID CreateOrderCommand prints:
// [Logging] Starting CreateOrderCommand
// [Validation] Checking CreateOrderCommand
// [Validation] Passed CreateOrderCommand
// ... handler runs ...
// [Logging] Finished CreateOrderCommand

// An INVALID CreateOrderCommand (Total <= 0) prints:
// [Logging] Starting CreateOrderCommand
// [Validation] Checking CreateOrderCommand
// -> ValidationException thrown here. The handler never runs, and
//    "[Logging] Finished" never prints either — LoggingBehavior's
//    own "await next()" call is what threw, so its own post-handler
//    line is skipped too, propagating the exception straight up.
//    LOGGING is still the FIRST thing printed even for a request
//    that fails validation, because it is the OUTERMOST layer.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If the registration order above were REVERSED — <code>ValidationBehavior</code> registered before ' +
    '<code>LoggingBehavior</code> — would an invalid <code>CreateOrderCommand</code> still print ' +
    '"[Logging] Starting CreateOrderCommand" before the <code>ValidationException</code> is thrown?',
  hint:
    'The first behavior REGISTERED becomes the OUTERMOST wrapper. With the order reversed, which behavior is ' +
    'now outermost — the one that runs FIRST on the way in?',
  solution:
    'No. With ValidationBehavior registered first, it becomes the OUTERMOST layer instead of LoggingBehavior. ' +
    'An invalid command would now print "[Validation] Checking CreateOrderCommand" and throw the ' +
    'ValidationException immediately — LoggingBehavior, now the INNER layer, never even gets a chance to run, ' +
    'since ValidationBehavior never calls next() to reach it. Nothing about "[Logging] Starting" prints at ' +
    'all in this ordering, for either a valid or invalid command\'s failure path — the whole point of the ' +
    'exercise is that this outcome is controlled purely by which behavior was registered first, not by ' +
    'anything about what the behaviors themselves do.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Pipeline behaviors run in some fixed, framework-defined order — logging always first, ' +
      'validation always second, regardless of how they\'re registered.',
    reality:
      'There is no built-in ordering at all. MediatR runs behaviors in exactly the order they were registered ' +
      'with the DI container — the FIRST one registered is the OUTERMOST wrapper. Swapping two ' +
      '<code>AddTransient</code> calls swaps the resulting execution order, with no other code change needed.',
  },
  {
    thought: 'Since the main page\'s own mistake #4 only shows ONE behavior (ValidationBehavior), ordering ' +
      'never actually matters in a MediatR pipeline — it only becomes relevant with 3+ behaviors.',
    reality:
      'Ordering already matters with exactly two behaviors, as this subtopic\'s own example shows — whether ' +
      'LoggingBehavior sees a request that later fails validation depends entirely on whether it was ' +
      'registered before or after ValidationBehavior. A single behavior just happens to make the question ' +
      'moot, not the pattern itself.',
  },
];

@Component({
  selector: 'app-mediator-pipeline-behavior-order',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pipeline-behavior-order.html',
  styleUrl: './pipeline-behavior-order.scss',
})
export class PipelineBehaviorOrderSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
