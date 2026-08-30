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
  templateUrl: './does-the-channel-switch-really-decouple-which-factory.html',
  styleUrl: './does-the-channel-switch-really-decouple-which-factory.scss'
})
export class DoesTheChannelSwitchReallyDecoupleWhichFactorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page\'s own first mistake, reappearing inside its own recommended fix',
      points: [
        'The page\'s mistakes block names this precisely: "Switching on enum instead of using subclasses" — a type switch mapping a key to a concrete product, with the explanation "every new type forces an edit to the switch. Factory Method moves the variation into new subclasses."',
        'The "DI Approach" codeTab\'s own <code>NotificationFactory.Create(string channel)</code> does exactly this same shape internally: a switch statement mapping a channel key (<code>"email"</code>, <code>"sms"</code>, <code>"push"</code>) to a concrete product. Adding a fourth channel means editing this SAME switch statement — the identical structural cost mistake #1 warns against.',
        'This is not a contradiction the page states outright, but it is a real tension worth naming directly: the "modern," DI-registered alternative reintroduces the same type-switching shape the page elsewhere singles out as the thing Factory Method exists to avoid.',
      ]
    },
    {
      heading: 'What the DI approach actually trades away, and what it actually keeps',
      points: [
        'The DI approach genuinely solves something the classic inheritance-based pattern does not: TESTABILITY without a class hierarchy. <code>INotificationFactory</code> can be mocked directly in a unit test; there is no <code>NotificationService</code> subclass to instantiate or subclass further just to test a caller.',
        'What it does NOT solve is the Open/Closed cost mistake #1 names — adding a new channel still means editing the <code>Create()</code> switch, the same way adding a new <code>NotificationType</code> enum case would mean editing the ORIGINAL wrong example\'s switch. The variation point simply moved from a `NotificationType` switch inside a Creator to a `channel` string switch inside a Factory — the switch itself did not go away.',
        'This matches what the page\'s own QnA on alternatives already says, read carefully: "injecting factory interfaces... is preferred over the inheritance-based Factory Method pattern because it avoids deep inheritance hierarchies" — the QnA\'s own justification is about AVOIDING INHERITANCE, not about preserving Open/Closed. The DI approach is a genuinely good tradeoff, but OCP-preservation specifically is not the reason to reach for it — that benefit is unique to the classic, subclass-based pattern.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same switch shape, two different classes',
      language: 'csharp',
      code: `// MISTAKE #1's OWN "wrong" EXAMPLE (from this page)
INotification Create(NotificationType type) => type switch
{
    NotificationType.Email => new EmailNotification(),
    NotificationType.Sms   => new SmsNotification(),
    // Adding new types requires editing this switch
};

// THE "DI Approach" CODETAB (also from this page) -- same shape
public class NotificationFactory : INotificationFactory
{
    public INotification Create(string channel) => channel switch
    {
        "email" => new EmailNotification(),
        "sms"   => new SmsNotification(),
        "push"  => new PushNotification(),
        // Adding a new channel ALSO requires editing this switch --
        // structurally identical to the "wrong" example above.
        _ => throw new ArgumentException($"Unknown channel: {channel}")
    };
}

// WHAT ACTUALLY PRESERVES OCP -- back to the classic, subclass-based
// version. Adding WhatsAppNotification means adding a new
// ConcreteCreator, with ZERO edits to any existing switch statement:
public class WhatsAppNotification : INotification
{
    public void Send(string recipient, string message) =>
        Console.WriteLine($"WhatsApp → {recipient}: {message}");
}

public class WhatsAppService : NotificationService
{
    protected override INotification CreateNotification() => new WhatsAppNotification();
}
// NotificationService, EmailService, SmsService: all UNTOUCHED.
// This is the OCP guarantee the DI-factory's internal switch does not have.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Since the DI Approach uses dependency injection, it must be at least as Open/Closed-compliant as the classic subclass version — DI is a more modern technique." Does using DI automatically preserve the Open/Closed guarantee the classic pattern has?',
    hint: 'Does registering an interface in a DI container change what has to happen INSIDE that interface\'s own implementation when a new case is added?',
    solution: 'No -- DI and Open/Closed compliance are orthogonal concerns, and this is a real example of that. DI solves HOW a dependency gets supplied to a consumer (constructor injection instead of `new`) -- it says nothing about HOW the dependency\'s own internal logic decides which concrete type to produce. The registered `NotificationFactory` still has to decide, somewhere inside itself, which concrete product to build for a given channel -- and in the codeTab as written, that decision is a switch statement, which means adding a new channel still means editing that switch. DI made the FACTORY testable and injectable; it did not make the factory\'s own internal type-selection logic immune to needing edits for new cases. Preserving OCP specifically requires the classic subclass-per-Creator structure (or a genuinely open-ended mechanism like a runtime-registered dictionary of factories) -- DI alone does not provide it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "DI Approach" codeTab is presented as the modern alternative to the classic pattern, so it must preserve every benefit the classic pattern has, including Open/Closed compliance.',
      reality: 'Per this subtopic\'s theory, the DI approach trades the classic pattern\'s Open/Closed guarantee for a different benefit (testability without an inheritance hierarchy) — its own internal switch statement has the exact same "must edit existing code for new cases" cost the page\'s own mistake #1 warns against.'
    },
    {
      thought: 'Dependency injection is inherently more Open/Closed-compliant than direct instantiation, since it is a more modern, flexible technique.',
      reality: 'Per this subtopic\'s theory, DI solves a completely different problem (how a dependency reaches its consumer) from Open/Closed compliance (whether adding a new case requires editing existing code) — a DI-registered class can still contain a type-switch that needs editing for every new case, exactly like the classic pattern\'s own anti-pattern example.'
    },
    {
      thought: 'Since the page\'s mistakes block and its "DI Approach" codeTab appear in different sections, they are making independent points that do not need to be checked against each other.',
      reality: 'Per this subtopic\'s theory, checking a page\'s own codeTabs against its own stated principles elsewhere on the SAME page — not just for outright contradictions, but for unstated tensions like this one — is exactly the kind of cross-check that surfaces real, worthwhile nuance.'
    }
  ];
}
