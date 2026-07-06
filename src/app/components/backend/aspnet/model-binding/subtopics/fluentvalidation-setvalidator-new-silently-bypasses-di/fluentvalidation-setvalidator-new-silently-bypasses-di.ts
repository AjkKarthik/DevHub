import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-fluentvalidation-setvalidator-di-bypass-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './fluentvalidation-setvalidator-new-silently-bypasses-di.html',
  styleUrl: './fluentvalidation-setvalidator-new-silently-bypasses-di.scss',
})
export class FluentvalidationSetvalidatorNewSilentlyBypassesDiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own FluentValidation example calls "new OrderItemValidator()" directly inside the parent validator\'s constructor — this silently bypasses DI for the child validator',
      points: [
        'The main Model Binding page\'s FluentValidation section shows: <code>RuleForEach(x => x.Items).SetValidator(new OrderItemValidator());</code> inside <code>CreateOrderValidator</code>\'s constructor. This works perfectly fine as long as <code>OrderItemValidator</code> has a PARAMETERLESS constructor and needs no dependencies of its own. But the moment <code>OrderItemValidator</code> needs ANY constructor-injected dependency — a repository to check that a SKU actually exists, a currency-conversion service, anything registered in DI — <code>new OrderItemValidator()</code> either fails to compile (if the constructor requires arguments) or, worse, someone adds a PARAMETERLESS constructor overload specifically to make <code>new OrderItemValidator()</code> keep compiling, silently losing access to whatever the DI-injected constructor would have provided.',
      ],
    },
    {
      heading: 'Because CreateOrderValidator itself is typically registered as a singleton via AddValidatorsFromAssemblyContaining, its child validator instance is also constructed exactly ONCE, at the moment the parent validator is first resolved — not once per validation call',
      points: [
        'FluentValidation\'s <code>AddValidatorsFromAssemblyContaining&lt;T&gt;()</code> registers validators with a SINGLETON lifetime by default. Since <code>new OrderItemValidator()</code> runs INSIDE <code>CreateOrderValidator</code>\'s constructor, that single <code>OrderItemValidator</code> instance is created exactly once — the first time DI resolves <code>CreateOrderValidator</code> — and reused for EVERY subsequent validation of EVERY order, for the entire lifetime of the application. If <code>OrderItemValidator</code> were instead correctly injected via DI as its own <code>IValidator&lt;OrderItem&gt;</code>, its lifetime would be whatever it was registered with — but manually constructing it with <code>new</code> hard-codes singleton-like behavior regardless of what lifetime was intended, and completely bypasses the DI container\'s ability to manage it at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own CreateOrderValidator — fine until OrderItemValidator needs a dependency',
      language: 'csharp',
      code: `// The main page's own example, unchanged:
public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty()
            .WithMessage("Order must have at least one item");
        RuleForEach(x => x.Items).SetValidator(new OrderItemValidator());   // <-- 'new'
        When(x => x.IsExpedited, () =>
            RuleFor(x => x.DeliveryDate).NotNull().GreaterThan(DateTime.UtcNow));
    }
}

// This works fine as long as OrderItemValidator needs NOTHING beyond
// what it can construct itself:
public class OrderItemValidator : AbstractValidator<OrderItem>
{
    public OrderItemValidator()
    {
        RuleFor(x => x.Sku).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

// THE BUG APPEARS the moment a real business rule needs a DI service —
// e.g. checking the SKU actually exists in the product catalog:
public class OrderItemValidator : AbstractValidator<OrderItem>
{
    private readonly IProductCatalog _catalog;

    // Adding this constructor is the NATURAL next step for a real rule —
    // but it BREAKS 'new OrderItemValidator()' in CreateOrderValidator,
    // since that call site supplies zero arguments:
    public OrderItemValidator(IProductCatalog catalog)
    {
        _catalog = catalog;
        RuleFor(x => x.Sku).NotEmpty()
            .MustAsync(async (sku, _) => await _catalog.ExistsAsync(sku))
            .WithMessage("SKU does not exist in the catalog");
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}
// 'new OrderItemValidator()' now fails to COMPILE — a clear signal,
// but only because the constructor happens to be REQUIRED. A developer
// under time pressure might "fix" this by adding a parameterless
// overload that skips the catalog check entirely for the nested case —
// silently losing the actual business rule for items validated through
// CreateOrderValidator, while the STANDALONE OrderItemValidator (used
// directly for other endpoints) still enforces it correctly.`,
    },
    {
      label: 'The correct fix — inject the child validator via DI instead of constructing it manually',
      language: 'csharp',
      code: `// FIXED: CreateOrderValidator receives its child validator via DI,
// exactly like any other constructor-injected dependency:
public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator(IValidator<OrderItem> itemValidator)
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty()
            .WithMessage("Order must have at least one item");

        // 'itemValidator' was resolved by the DI container, so its OWN
        // constructor dependencies (IProductCatalog) were correctly
        // injected too — no 'new' anywhere in this chain:
        RuleForEach(x => x.Items).SetValidator(itemValidator);

        When(x => x.IsExpedited, () =>
            RuleFor(x => x.DeliveryDate).NotNull().GreaterThan(DateTime.UtcNow));
    }
}

// Registration is UNCHANGED — AddValidatorsFromAssemblyContaining<T>()
// already registers EVERY AbstractValidator<T> in the assembly,
// including OrderItemValidator, as its own DI-resolvable service:
builder.Services
    .AddFluentValidationAutoValidation()
    .AddValidatorsFromAssemblyContaining<CreateOrderValidator>();

// WHY THIS MATTERS BEYOND JUST "IT COMPILES": with DI-injected
// 'itemValidator', OrderItemValidator's OWN registered lifetime
// (typically Scoped for AddValidatorsFromAssemblyContaining, unlike
// the effectively-singleton behavior of 'new' inside a
// singleton-registered parent) is respected correctly — a Scoped
// IProductCatalog dependency inside OrderItemValidator resolves a
// fresh instance per request, exactly as intended, rather than being
// captured once and reused for the application's entire lifetime as a
// captive dependency inside a singleton-lifetime parent validator.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why manually constructing OrderItemValidator with "new" inside a SINGLETON-registered CreateOrderValidator creates a captive-dependency-like problem, even though OrderItemValidator is never itself explicitly registered as Singleton anywhere.',
    hint: 'Consider the main page\'s own earlier ASP.NET Dependency Injection topic, which describes a captive dependency as "a Scoped service injected into a Singleton lives as long as the singleton" — does constructing an object with new(), rather than resolving it through DI, still produce an equivalent lifetime problem?',
    solution: `Even though OrderItemValidator is never itself registered with an
explicit Singleton lifetime, calling "new OrderItemValidator()" inside
CreateOrderValidator's constructor produces the EXACT SAME PRACTICAL
EFFECT as a captive dependency, for a simple reason: the object is
constructed exactly ONCE, at the moment CreateOrderValidator itself is
first resolved (which happens once, since CreateOrderValidator is
registered as Singleton by AddValidatorsFromAssemblyContaining) — and
that single OrderItemValidator instance, along with anything IT
constructed internally (like a captured IProductCatalog reference, if
someone worked around the compile error by injecting IProductCatalog
into CreateOrderValidator itself and passing it through manually),
lives for the rest of the application's lifetime.

This is functionally identical to the captive-dependency problem
described in the ASP.NET Dependency Injection topic — a Scoped
IProductCatalog (say, one that internally holds a Scoped DbContext)
captured this way would behave as if it were Singleton: the SAME
DbContext instance reused across every single order validation, for
every request, forever — recreating the exact "Scoped service lives as
long as the Singleton that captured it" problem, just via manual
object construction rather than via DI constructor injection.

The key insight this exercise reinforces: DI's own lifetime-management
guarantees (Scoped services getting a fresh instance per request,
Transient services getting a fresh instance per resolution) ONLY apply
to objects the CONTAINER itself constructs. The moment code manually
calls "new SomeType()" instead of resolving it through DI — exactly as
the main page's own OrderItemValidator example does — all of the
container's lifetime guarantees for anything that manually-constructed
object depends on are silently bypassed, regardless of what lifetime
those dependencies were actually registered with.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling new OrderItemValidator() inside a parent validator\'s constructor is safe as long as OrderItemValidator itself is never explicitly registered with a Singleton lifetime in DI.',
      reality: 'the EFFECTIVE lifetime of a manually-constructed child validator matches whatever lifetime the PARENT validator has (typically Singleton, since AddValidatorsFromAssemblyContaining registers validators that way) — regardless of what lifetime the child validator would have received if it were resolved through DI instead.',
    },
    {
      thought: 'FluentValidation\'s SetValidator() only accepts a manually-constructed validator instance — there is no way to use dependency injection for a nested/child validator.',
      reality: 'injecting IValidator<TChild> as a constructor parameter on the parent validator (rather than calling new ChildValidator() inline) lets SetValidator() receive a properly DI-resolved instance, with its own constructor dependencies and intended lifetime fully respected.',
    },
    {
      thought: 'a compile error from adding a required constructor parameter to a validator is the only signal that a "new SomeValidator()" call site needs to be fixed.',
      reality: 'a developer under time pressure can silently work around that compile error by adding a parameterless constructor overload that skips the real business rule for the nested case — meaning the mistake can persist without any compiler signal at all once that workaround is in place.',
    },
  ];
}
