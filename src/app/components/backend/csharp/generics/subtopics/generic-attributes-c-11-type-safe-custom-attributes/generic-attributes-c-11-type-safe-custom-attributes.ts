import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-generic-attributes-c-11-type-safe-custom-attributes-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './generic-attributes-c-11-type-safe-custom-attributes.html',
  styleUrl: './generic-attributes-c-11-type-safe-custom-attributes.scss',
})
export class GenericAttributesC11TypeSafeCustomAttributesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A brand-new C# 11 feature the main topic never mentions',
      points: [
        'Every generic construct on the main Generics page is a class, method, interface, or delegate — C# 11 added a FIFTH place generics can appear: attributes. <code>public class ValidatorAttribute&lt;T&gt; : Attribute where T : IValidator</code> lets an attribute itself carry a type parameter, applied as <code>[Validator&lt;EmailValidator&gt;]</code> — genuinely new syntax, not just an application of existing generic rules.',
      ],
    },
    {
      heading: 'The problem generic attributes solve — type-safe attribute arguments',
      points: [
        'BEFORE C# 11, an attribute needing to reference a TYPE as configuration had to accept a <code>System.Type</code> parameter: <code>[Validator(typeof(EmailValidator))]</code> — this compiles even if <code>EmailValidator</code> does NOT actually implement whatever interface the validation logic expects, since <code>typeof(...)</code> accepts ANY type with no constraint checking. The mistake is only caught at RUNTIME, typically via reflection code that tries to cast the type and fails.',
        'A generic attribute makes this a COMPILE-TIME check: <code>public class ValidatorAttribute&lt;T&gt; : Attribute where T : IValidator</code> constrains <code>T</code> exactly like a generic class would — <code>[Validator&lt;NotAValidator&gt;]</code> (where <code>NotAValidator</code> does not implement <code>IValidator</code>) is a COMPILE ERROR, catching the mistake immediately instead of at runtime reflection time, potentially in production.',
      ],
    },
    {
      heading: 'The restriction — only CLOSED constructed types are allowed',
      points: [
        'A generic attribute\'s type argument must be a fully CLOSED type (a concrete, specific type like <code>EmailValidator</code> or even <code>List&lt;string&gt;</code>) — you CANNOT use an open/unbound generic type parameter from the attribute\'s own containing generic class or method as the attribute\'s type argument, since attribute arguments must be resolvable to a single concrete type at compile time, with no ambiguity about which specialization applies.',
        'This means generic attributes work well for attaching STATIC, known-at-compile-time type metadata (a specific validator class, a specific serializer type) but cannot be used to propagate an "outer" unbound type parameter INTO an attribute on a member of a generic class — that specific composition is not supported.',
      ],
    },
    {
      heading: 'Practical use cases — beyond just validation',
      points: [
        'Custom serialization/converter attributes: <code>[JsonConverter&lt;MyCustomConverter&gt;]</code>-style patterns (conceptually similar to how <code>System.Text.Json</code>\'s own attributes work, though the BCL\'s actual <code>JsonConverterAttribute</code> predates generic attributes and still uses <code>typeof</code>) become possible to write with compile-time type safety in your OWN attribute designs going forward.',
        'Dependency-injection-style "resolve this concrete implementation" markers: <code>[Handler&lt;OrderCreatedHandler&gt;]</code> on an event type, constrained to <code>where T : IEventHandler&lt;TEvent&gt;</code>, lets reflection-based wiring code discover the correct handler type with the compiler having ALREADY verified it satisfies the handler contract — eliminating an entire class of "attached the wrong handler type" bugs that would otherwise only surface when the DI container tries to instantiate it at startup.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before C# 11 — Type parameter, no compile-time safety',
      language: 'csharp',
      code: `public interface IValidator
{
    bool IsValid(string value);
}

public class EmailValidator : IValidator
{
    public bool IsValid(string value) => value.Contains('@');
}

public class NotAValidator { } // does NOT implement IValidator

// Old-style attribute — accepts ANY System.Type, no constraint checking
public class ValidatorAttribute : Attribute
{
    public Type ValidatorType { get; }
    public ValidatorAttribute(Type validatorType) => ValidatorType = validatorType;
}

[Validator(typeof(EmailValidator))]  // correct usage
public class UserEmail { }

[Validator(typeof(NotAValidator))]   // COMPILES — but NotAValidator isn't a validator!
public class BrokenExample { }
// The mistake is only discovered at RUNTIME, when reflection code tries to
// cast an instance of NotAValidator to IValidator and fails.`,
    },
    {
      label: 'C# 11 — Generic attribute with a compile-time constraint',
      language: 'csharp',
      code: `public interface IValidator
{
    bool IsValid(string value);
}

public class EmailValidator : IValidator
{
    public bool IsValid(string value) => value.Contains('@');
}

public class NotAValidator { }

// C# 11 generic attribute — the constraint is enforced by the COMPILER
public class ValidatorAttribute<T> : Attribute where T : IValidator
{
}

[Validator<EmailValidator>]   // compiles — EmailValidator implements IValidator
public class UserEmail { }

// [Validator<NotAValidator>]  // COMPILE ERROR — NotAValidator does not
                                // satisfy the 'where T : IValidator' constraint.
                                // Caught immediately, not at runtime reflection time.

// Reading the attribute back via reflection still works the same way,
// but now you have a compile-time GUARANTEE the type is actually valid:
var attr = typeof(UserEmail).GetCustomAttributesData()[0];
Console.WriteLine(attr.AttributeType.GetGenericArguments()[0].Name); // "EmailValidator"`,
    },
    {
      label: 'A DI-style handler-registration pattern',
      language: 'csharp',
      code: `public interface IEventHandler<TEvent>
{
    Task HandleAsync(TEvent evt);
}

public record OrderCreatedEvent(int OrderId);

public class OrderCreatedHandler : IEventHandler<OrderCreatedEvent>
{
    public Task HandleAsync(OrderCreatedEvent evt)
    {
        Console.WriteLine($"Handling order {evt.OrderId}");
        return Task.CompletedTask;
    }
}

// Generic attribute constrained to the SPECIFIC event type it decorates —
// the compiler verifies THandler actually handles TEvent, not just any type.
public class HandledByAttribute<TEvent, THandler> : Attribute
    where THandler : IEventHandler<TEvent>
{
}

[HandledBy<OrderCreatedEvent, OrderCreatedHandler>]  // compiles — correct pairing
public record OrderCreatedEventMarker;

// A wrong pairing is caught at compile time:
// public class UnrelatedHandler : IEventHandler<string> { ... }
// [HandledBy<OrderCreatedEvent, UnrelatedHandler>]  // COMPILE ERROR —
//   UnrelatedHandler does not implement IEventHandler<OrderCreatedEvent>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second validator, <code>PhoneValidator : IValidator</code>, and attach it to a new marker class <code>UserPhone</code> using the generic <code>ValidatorAttribute&lt;T&gt;</code> from the second code tab — then write a one-line comment explaining what specifically would happen if you tried <code>[Validator&lt;string&gt;]</code> instead.',
    hint: 'Define public class PhoneValidator : IValidator { public bool IsValid(string value) => value.All(char.IsDigit); }, then apply [Validator<PhoneValidator>] to a new public class UserPhone { }. For the comment: string does not implement IValidator, so [Validator<string>] would be a compile error against the "where T : IValidator" constraint.',
    solution: `public class PhoneValidator : IValidator
{
    public bool IsValid(string value) => value.All(char.IsDigit);
}

[Validator<PhoneValidator>]  // compiles — PhoneValidator implements IValidator
public class UserPhone { }

// [Validator<string>] would be a COMPILE ERROR — string does not implement
// IValidator, so it fails the "where T : IValidator" constraint on
// ValidatorAttribute<T>, exactly like passing an unconstrained type to any
// other generic constraint would.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'attributes have always been able to accept a type parameter the same way generic classes and methods can.',
      reality: 'generic attributes (public class Foo<T> : Attribute) are a NEW C# 11 feature — before that, attributes needing type-based configuration had to accept a System.Type argument via typeof(...), with no compile-time constraint checking at all.',
    },
    {
      thought: 'a generic attribute\'s type argument can be an open/unbound generic type parameter borrowed from the containing generic class or method.',
      reality: 'a generic attribute\'s type argument must be a fully CLOSED, concrete type resolvable at compile time — you cannot propagate an outer unbound type parameter into an attribute this way.',
    },
    {
      thought: 'the main benefit of a generic attribute over the old typeof(...) pattern is purely stylistic — [Validator&lt;EmailValidator&gt;] just looks cleaner than [Validator(typeof(EmailValidator))].',
      reality: 'the real benefit is a genuine COMPILE-TIME safety improvement — a generic attribute\'s where T : IValidator constraint is enforced by the compiler, rejecting an invalid type argument immediately, whereas the old typeof(...) pattern accepts any type and only fails later at runtime reflection time.',
    },
  ];
}
