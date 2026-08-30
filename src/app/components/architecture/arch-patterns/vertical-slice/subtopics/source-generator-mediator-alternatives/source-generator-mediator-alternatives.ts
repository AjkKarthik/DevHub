import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './source-generator-mediator-alternatives.html',
  styleUrl: './source-generator-mediator-alternatives.scss'
})
export class SourceGeneratorMediatorAlternativesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Not just a licensing swap — a genuinely different dispatch mechanism',
      points: [
        'The previous subtopic covered MediatR\'s 2025 licensing change and briefly named free alternatives (Mediator, Wolverine) without explaining what actually differs technically. The key difference isn\'t just "free vs. paid" — MediatR\'s original design dispatches requests to handlers using REFLECTION (looking up the registered handler type at runtime), while newer alternatives like Mediator (by martinothamar) use C# SOURCE GENERATORS to produce the dispatch code at COMPILE TIME instead.',
        'This is a real architectural difference in how the SAME conceptual pattern (the page\'s own "in-process mediator dispatches commands/queries to their handlers") gets implemented, not just a cosmetic branding difference between competing libraries.',
      ]
    },
    {
      heading: 'Why the dispatch mechanism matters in practice',
      points: [
        'Reflection-based dispatch (MediatR\'s original approach) resolves which handler to call at runtime, using reflection to scan registered types — this adds a small but real per-call performance cost, and errors (like a missing or duplicate handler registration) only surface when that specific request type is actually dispatched at runtime.',
        'Source-generator-based dispatch (Mediator, and similar libraries) generates the actual handler-lookup code at COMPILE TIME, based on the same <code>IRequestHandler&lt;TRequest, TResponse&gt;</code> pattern the page\'s own code samples already use — this eliminates the runtime reflection cost entirely and can surface certain configuration errors (like a request type with no registered handler) as compile errors instead of runtime failures.',
        'The tradeoff isn\'t all one-directional: source generators add their own build-time compilation overhead, and some very dynamic registration patterns that reflection-based approaches support flexibly can be harder to express in a source-generator model — the choice depends on what a specific project actually needs.',
      ]
    },
    {
      heading: 'Why this doesn\'t change anything about Vertical Slice Architecture itself',
      points: [
        'Every code sample on this page\'s own "Command + Handler" and "Query Slice" tabs uses the <code>IRequestHandler&lt;TRequest, TResponse&gt;</code> interface pattern — this pattern is what any of these mediator libraries (MediatR, Mediator, Wolverine) implement, just with different dispatch mechanisms under the hood. Swapping the underlying library is a composition-root/dependency-injection concern, not a change to how any individual slice\'s command, handler, or validator is written.',
        'This is a concrete example of the page\'s own "Minimal Coupling" principle working as intended even outside cross-slice boundaries: because slices depend on the ABSTRACT mediator pattern (send a command, get a handler\'s response) rather than a SPECIFIC library\'s implementation details, swapping the underlying mediator library is a genuinely low-risk, largely mechanical change.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reflection-based vs. source-generator dispatch',
      language: 'typescript',
      code: `interface MediatorImplementation {
  library: string;
  dispatchMechanism: 'reflection' | 'source-generator';
  handlerResolutionTiming: 'runtime' | 'compile-time';
}

const implementations: MediatorImplementation[] = [
  {
    library: 'MediatR (original design)',
    dispatchMechanism: 'reflection',
    handlerResolutionTiming: 'runtime',
    // Handler lookup happens when mediator.send() is actually called --
    // a missing handler registration only surfaces at that point.
  } as MediatorImplementation,
  {
    library: 'Mediator (martinothamar), and similar source-generator libraries',
    dispatchMechanism: 'source-generator',
    handlerResolutionTiming: 'compile-time',
    // The dispatch code (which handler to call for which request type)
    // is GENERATED during compilation -- a request type with no
    // registered handler can surface as a compile error instead of
    // waiting until that code path actually runs in production.
  } as MediatorImplementation,
];

// What stays IDENTICAL regardless of which library is chosen -- the
// page's own pattern, unchanged:
interface IRequestHandler<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}
// Every slice's command/query/handler classes are written exactly
// the same way against this shape, no matter which mediator library
// is wired up at the composition root.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is deciding between MediatR and a source-generator-based mediator library like Mediator for a new Vertical Slice application. Beyond licensing cost, what is the actual TECHNICAL difference between the two approaches, and does switching libraries require rewriting any individual slice\'s command/handler code?',
    hint: 'MediatR resolves which handler to call using reflection at runtime. What does a source-generator-based library do differently, and at what point in the build/run process?',
    solution: 'The core technical difference is WHEN and HOW the handler is resolved: MediatR\'s original design uses reflection to look up the registered handler at RUNTIME, when mediator.send() is actually called. A source-generator-based library like Mediator instead generates the dispatch code at COMPILE TIME, based on the same IRequestHandler<TRequest, TResponse> pattern -- eliminating the runtime reflection cost and potentially catching a missing handler registration as a compile error instead of a runtime failure. Switching libraries does NOT require rewriting any individual slice\'s command, handler, or validator code, since every slice is written against the abstract IRequestHandler pattern rather than any specific library\'s internals -- only the composition-root wiring (how handlers get registered and how the mediator itself is instantiated) needs to change.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MediatR and newer alternatives like Mediator are essentially interchangeable branding of the same underlying implementation, differing mainly in price and popularity.',
      reality: 'Per this subtopic\'s theory, they use genuinely different dispatch mechanisms — reflection-based runtime handler lookup (MediatR\'s original design) versus source-generator-based compile-time dispatch (Mediator and similar libraries) — a real architectural difference in HOW the same conceptual pattern gets implemented, not just a naming or pricing difference.'
    },
    {
      thought: 'Switching a Vertical Slice application from one mediator library to another would require rewriting each feature slice\'s command, handler, and validator classes to match the new library\'s specific API.',
      reality: 'Per this subtopic\'s theory, every slice is written against the abstract <code>IRequestHandler&lt;TRequest, TResponse&gt;</code> pattern the page\'s own code samples already demonstrate — swapping the underlying mediator library is a composition-root/dependency-injection change, not something that touches individual slices\' own command or handler code.'
    },
    {
      thought: 'Source-generator-based dispatch is strictly superior to reflection-based dispatch in every way, making it the obvious default choice for any new project.',
      reality: 'Per this subtopic\'s theory, the tradeoff isn\'t one-directional — source generators add their own build-time compilation overhead, and some highly dynamic handler-registration patterns reflection-based approaches support flexibly can be harder to express in a source-generator model; the right choice depends on a specific project\'s actual needs, not a blanket "always pick the newer approach" rule.'
    }
  ];
}
