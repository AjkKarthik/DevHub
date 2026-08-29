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
    heading: 'A Registered Type That Was Never Declared',
    points: [
      'The main page\'s own "MassTransit Built-In Outbox" codeTab opens with <code>x.AddConsumer&lt;OrderPlacedConsumer&gt;();</code> — but grep the WHOLE codeTab for a class named <code>OrderPlacedConsumer</code> and there isn\'t one. The only consumer actually defined, a few lines further down, is <code>PlaceOrderConsumer : IConsumer&lt;PlaceOrderCommand&gt;</code>.',
      'This is a plain, self-contained catch: no external research needed, just checking whether a TYPE NAME used in one line of a codeTab is actually DECLARED anywhere else in that same codeTab — the same discipline this hub applies to undeclared fields and methods, just applied to a generic type argument instead.',
      'As written, <code>AddConsumer&lt;OrderPlacedConsumer&gt;()</code> would fail with a CS0246 ("the type or namespace name \'OrderPlacedConsumer\' could not be found") the moment this file is compiled — registering a consumer TYPE that genuinely does not exist.',
    ],
  },
  {
    heading: 'Why the Class Is Correctly Named PlaceOrderConsumer, Not the Registration',
    points: [
      'The class handles <code>IConsumer&lt;PlaceOrderCommand&gt;</code> — a COMMAND (an imperative request: "place this order"), not an EVENT (a past-tense fact: "this order was placed"). The main page\'s own theory elsewhere in this hub (see the CQRS and Event Sourcing topics) already establishes commands are named in the imperative — <code>PlaceOrderCommand</code>, handled by something reacting to it — which is exactly what <code>PlaceOrderConsumer</code> correctly does.',
      'So the fix is on the REGISTRATION side, not the class name: <code>x.AddConsumer&lt;PlaceOrderConsumer&gt;()</code> — matching MassTransit\'s own convention of registering the concrete consumer class that implements <code>IConsumer&lt;TMessage&gt;</code>, not the message/event type it happens to publish afterward.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Undeclared Type',
    language: 'csharp',
    code: `builder.Services.AddMassTransit(x =>
{
    // OrderPlacedConsumer is never declared ANYWHERE in this file —
    // this line does not compile (CS0246: type or namespace not found).
    x.AddConsumer<OrderPlacedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");
        cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
        cfg.UseEntityFrameworkOutbox<AppDbContext>(ctx);
        cfg.ConfigureEndpoints(ctx);
    });
});

// The ONLY consumer actually defined in this codeTab:
public class PlaceOrderConsumer(AppDbContext db, IPublishEndpoint publish)
    : IConsumer<PlaceOrderCommand>
{
    // ...
}`,
  },
  {
    label: 'After — Registration Matches the Class',
    language: 'csharp',
    code: `builder.Services.AddMassTransit(x =>
{
    // Matches the concrete class defined below — this is the type
    // MassTransit actually needs to know about to route
    // PlaceOrderCommand messages to it.
    x.AddConsumer<PlaceOrderConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");
        cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
        cfg.UseEntityFrameworkOutbox<AppDbContext>(ctx);
        cfg.ConfigureEndpoints(ctx);
    });
});

public class PlaceOrderConsumer(AppDbContext db, IPublishEndpoint publish)
    : IConsumer<PlaceOrderCommand>
{
    // ...
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose a SECOND consumer is later added — <code>OrderPlacedNotifier : IConsumer&lt;OrderPlacedEvent&gt;</code> — that sends a confirmation email once <code>OrderPlacedEvent</code> is published. What line needs to be added to the registration block, and what mistake would repeat the ORIGINAL bug this subtopic just fixed?',
  hint: 'Think about which name goes inside <code>AddConsumer&lt;...&gt;()</code> — the message type, or the class that implements <code>IConsumer&lt;TMessage&gt;</code>.',
  solution: `// Correct addition — registers the CLASS, not the message type:
x.AddConsumer<OrderPlacedNotifier>();

// Repeating the original mistake would look like this instead —
// registering the EVENT type as if it were the consumer class:
x.AddConsumer<OrderPlacedEvent>();
// This fails to compile for the same reason as the original bug:
// OrderPlacedEvent does not implement IConsumer<T> at all — it's a
// message/event record, not a consumer class. AddConsumer<T>()
// always expects the CLASS that handles a message, never the
// message type itself.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>AddConsumer&lt;T&gt;()</code> registers "the thing that will happen when this event fires" — so naming it after the EVENT (<code>OrderPlacedConsumer</code>) makes sense even if no such class exists yet.',
    reality: '<code>AddConsumer&lt;T&gt;()</code> specifically requires <code>T</code> to be a CONCRETE CLASS implementing <code>IConsumer&lt;TMessage&gt;</code> — it is how MassTransit\'s DI container knows which class to instantiate and route a message to. There is no implicit "auto-generate a consumer from a name" behavior; if the type doesn\'t exist as an actual class in the project, the call is simply invalid, exactly like calling any other generic method with a type argument that was never declared.',
  },
  {
    thought: 'A mismatch like this would definitely be caught by the FIRST thing anyone does with the project — running it.',
    reality: 'It would be caught even earlier than that — this is a COMPILE-time error (CS0246), not a runtime one. The project would fail to build at all, before any test, any manual click-through, or any deployment could even begin. This makes it a lower-risk category of bug in one sense (impossible to ship silently) but also means catching it during CONTENT REVIEW, before a reader ever pastes the code into a real project, is exactly the right layer to fix it at.',
  },
];

@Component({
  selector: 'app-dp-outbox-addconsumer',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-mismatched-consumer-type-in-addconsumer.html',
  styleUrl: './the-mismatched-consumer-type-in-addconsumer.scss',
})
export class TheMismatchedConsumerTypeInAddconsumerSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
