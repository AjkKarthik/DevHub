import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-masstransit',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './masstransit.html',
  styleUrl: './masstransit.scss',
})
export class AspnetMasstransit {

  quickRef: QuickRefItem[] = [
    { name: 'AddMassTransit()',           type: 'method',   desc: 'Registers bus, consumers, and transport in DI.' },
    { name: 'IConsumer<TMessage>',        type: 'interface','desc': 'Implement and override Consume(ConsumeContext<T>) to handle a message type.' },
    { name: 'ConsumeContext<T>',          type: 'class',    desc: 'Wraps the received message — access .Message, reply, fault, and headers.' },
    { name: 'IPublishEndpoint',           type: 'interface','desc': 'Inject to publish messages to all subscribed consumers (fan-out).' },
    { name: 'ISendEndpointProvider',      type: 'interface','desc': 'Inject to send a message to a specific queue/endpoint (point-to-point).' },
    { name: 'UsingRabbitMq()',            type: 'method',   desc: 'Configures RabbitMQ as the transport with host, vhost, and credentials.' },
    { name: 'UsingInMemory()',            type: 'method',   desc: 'In-process transport — ideal for testing or simple single-service scenarios.' },
    { name: '.AddConsumer<T>()',          type: 'method',   desc: 'Registers a consumer class and its default receive endpoint.' },
    { name: 'IRequestClient<TRequest>',   type: 'interface','desc': 'Request-reply pattern — sends a message and awaits a typed response.' },
    { name: 'AddSagaStateMachine<T>()',   type: 'method',   desc: 'Registers a saga state machine for orchestrating long-running workflows.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is MassTransit?',
      points: ['MassTransit is a message bus abstraction for .NET that supports RabbitMQ, Azure Service Bus, Amazon SQS, and more. It provides consumers, sagas, request-reply, and retry policies on top of the transport layer — you write transport-agnostic code that works with any broker.'],
    },
    {
      heading: 'Publish vs Send',
      points: ['Publish (IPublishEndpoint.Publish<T>) is fan-out — all consumers subscribed to a message type receive a copy. Send (ISendEndpointProvider.Send<T> to a specific address) is point-to-point — exactly one consumer receives the message. Use publish for events ("something happened"), send for commands ("do this specific thing").'],
    },
    {
      heading: 'Consumers and Receive Endpoints',
      points: ['A consumer is a class that implements IConsumer<T> and handles one message type. MassTransit creates a receive endpoint (a queue) for each consumer automatically. Multiple instances of the same consumer share one queue for load-balanced processing. Competing consumers scale out naturally — add more instances, not more queues.'],
    },
    {
      heading: 'Retry and Error Handling',
      points: ['Configure retry policies with UseMessageRetry — specify intervals and attempt counts. Messages that exhaust all retries go to the error queue (queue_name_error) for investigation. Use UseDelayedRedelivery for exponential backoff. The _error queue is your dead-letter queue; consume it to manually replay failed messages.'],
    },
    {
      heading: 'Sagas for Long-Running Workflows',
      points: ['A saga is a state machine that orchestrates a multi-step business process by responding to events and tracking state. MassTransit\'s MassTransitStateMachine<TSaga> lets you define states, events, and transitions with a DSL. Saga state is persisted in a database (EF Core, Redis, MongoDB) so workflows survive restarts.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup (RabbitMQ)',
      language: 'csharp',
      code: `// NuGet: MassTransit.RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Register all consumers in this assembly
    x.AddConsumers(typeof(Program).Assembly);

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host("rabbitmq://localhost", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        // Auto-configure receive endpoints from registered consumers
        cfg.ConfigureEndpoints(ctx);
    });
});`,
    },
    {
      label: 'Message & Consumer',
      language: 'csharp',
      code: `// Message contract (put in a shared library)
public record OrderPlaced(Guid OrderId, string CustomerEmail, decimal Total);

// Consumer
public class OrderPlacedConsumer(IEmailService email)
    : IConsumer<OrderPlaced>
{
    public async Task Consume(ConsumeContext<OrderPlaced> ctx)
    {
        var msg = ctx.Message;
        await email.SendOrderConfirmationAsync(msg.CustomerEmail, msg.OrderId);
        Console.WriteLine(\`Order \${msg.OrderId} confirmation sent.\`);
    }
}`,
    },
    {
      label: 'Publish & Send',
      language: 'csharp',
      code: `// Publish (all subscribers receive a copy)
app.MapPost("/orders", async (
    CreateOrderRequest req,
    IOrderService orderSvc,
    IPublishEndpoint bus) =>
{
    var order = await orderSvc.CreateAsync(req);
    await bus.Publish(new OrderPlaced(order.Id, req.Email, order.Total));
    return TypedResults.Created(\`/orders/\${order.Id}\`, order);
});

// Send to a specific queue (point-to-point)
app.MapPost("/orders/{id}/cancel", async (
    Guid id,
    ISendEndpointProvider sender) =>
{
    var endpoint = await sender.GetSendEndpoint(
        new Uri("queue:order-cancellation"));
    await endpoint.Send(new CancelOrder(id));
    return Results.Accepted();
});`,
    },
    {
      label: 'Retry Policy',
      language: 'csharp',
      code: `x.UsingRabbitMq((ctx, cfg) =>
{
    cfg.Host("rabbitmq://localhost");

    cfg.ReceiveEndpoint("order-placed", e =>
    {
        // Immediate retries: 3 attempts, 1s apart
        e.UseMessageRetry(r => r.Intervals(
            TimeSpan.FromSeconds(1),
            TimeSpan.FromSeconds(5),
            TimeSpan.FromSeconds(15)));

        // Exponential backoff redelivery (survives restarts)
        e.UseDelayedRedelivery(r => r.Intervals(
            TimeSpan.FromMinutes(5),
            TimeSpan.FromMinutes(30),
            TimeSpan.FromHours(1)));

        e.ConfigureConsumer<OrderPlacedConsumer>(ctx);
    });
});`,
    },
    {
      label: 'Request-Reply',
      language: 'csharp',
      code: `// Request message
public record GetProductDetails(Guid ProductId);
// Response message
public record ProductDetails(Guid Id, string Name, decimal Price);

// Consumer (runs in product service)
public class GetProductDetailsConsumer : IConsumer<GetProductDetails>
{
    public async Task Consume(ConsumeContext<GetProductDetails> ctx)
    {
        var product = /* fetch from DB */ new ProductDetails(
            ctx.Message.ProductId, "Widget", 9.99m);
        await ctx.RespondAsync(product);
    }
}

// Caller (runs in order service)
app.MapGet("/products/{id:guid}", async (
    Guid id,
    IRequestClient<GetProductDetails> client) =>
{
    var response = await client.GetResponse<ProductDetails>(
        new GetProductDetails(id));
    return Results.Ok(response.Message);
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Send when Publish is appropriate',
      wrong: `// Using Send for an event — only one consumer receives it
var ep = await sender.GetSendEndpoint(new Uri("queue:order-placed"));
await ep.Send(new OrderPlaced(orderId));`,
      right: `// Publish for events — all subscribers receive a copy
await bus.Publish(new OrderPlaced(orderId));`,
      explanation: 'Send is point-to-point (command). Publish is fan-out (event). Using Send for events means adding another service requires changing the publisher to send to a new queue.',
    },
    {
      title: 'Throwing exceptions without retry policy',
      wrong: `public async Task Consume(ConsumeContext<OrderPlaced> ctx)
{
    await _db.SaveAsync(ctx.Message); // throws on transient DB error → message lost
}`,
      right: `// Configure retry in the receive endpoint setup
e.UseMessageRetry(r => r.Intervals(1000, 5000, 15000));`,
      explanation: 'Without a retry policy, a transient exception moves the message to the error queue immediately. Always configure UseMessageRetry for transient failures.',
    },
    {
      title: 'Sharing message contracts across services without a shared library',
      wrong: `// OrderService.OrderPlaced vs PaymentService.OrderPlaced — different types`,
      right: `// Shared NuGet package or project: MyApp.Contracts containing OrderPlaced`,
      explanation: 'MassTransit routes by message type name. If producer and consumer define separate classes with the same name, serialization works, but coupling is fragile. Keep contracts in a shared project.',
    },
    {
      title: 'Blocking in Consume() with .Result or .Wait()',
      wrong: `public Task Consume(ConsumeContext<OrderPlaced> ctx)
{
    _email.SendAsync(ctx.Message.Email).Wait(); // deadlock risk
    return Task.CompletedTask;
}`,
      right: `public async Task Consume(ConsumeContext<OrderPlaced> ctx)
{
    await _email.SendAsync(ctx.Message.Email);
}`,
      explanation: 'MassTransit consumers run in an async context. Calling .Wait() or .Result can deadlock or exhaust thread-pool threads under load.',
    },
  ];

  challenge: Challenge = {
    title: 'Order Placed Publisher & Consumer',
    language: 'csharp',
    description: `Set up MassTransit with the in-memory transport to:
1. Define an OrderPlaced record with OrderId (Guid) and Total (decimal).
2. Create an OrderPlacedConsumer that logs "Order {Id} received, total {Total}".
3. Expose a POST /orders endpoint that publishes OrderPlaced.
4. Verify the consumer fires when the endpoint is called.`,
    hints: [
      'Use UsingInMemory — no broker needed for this exercise',
      'AddConsumers(typeof(Program).Assembly) registers all consumers automatically',
      'Inject IPublishEndpoint into the endpoint handler',
    ],
    starterCode: `public record OrderPlaced(Guid OrderId, decimal Total);

// TODO: create consumer
// TODO: configure MassTransit with in-memory transport
// TODO: add POST /orders endpoint`,
    solution: `public record OrderPlaced(Guid OrderId, decimal Total);

public class OrderPlacedConsumer : IConsumer<OrderPlaced>
{
    public Task Consume(ConsumeContext<OrderPlaced> ctx)
    {
        Console.WriteLine(\`Order \${ctx.Message.OrderId} received, total \${ctx.Message.Total:C}\`);
        return Task.CompletedTask;
    }
}

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderPlacedConsumer>();
    x.UsingInMemory((ctx, cfg) => cfg.ConfigureEndpoints(ctx));
});

var app = builder.Build();

app.MapPost("/orders", async (IPublishEndpoint bus) =>
{
    await bus.Publish(new OrderPlaced(Guid.NewGuid(), 99.99m));
    return Results.Accepted();
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between Publish and Send in MassTransit?',
      options: [
        'Publish is faster; Send is more reliable',
        'Publish fans out to all subscribers; Send goes to one specific endpoint',
        'Publish requires RabbitMQ; Send works in-memory',
        'They are identical — just different method names',
      ],
      answer: 1,
      explanation: 'Publish is fan-out: every consumer subscribed to the message type receives a copy. Send is point-to-point: you specify a queue and one consumer receives it.',
    },
    {
      q: 'What happens to a message after all retry attempts are exhausted?',
      options: [
        'It is silently discarded',
        'The consumer is restarted',
        'It moves to an error queue (queue_name_error)',
        'MassTransit throws an exception to the caller',
      ],
      answer: 2,
      explanation: 'After all retries fail, MassTransit moves the message to an error queue (suffixed _error) for investigation and manual replay.',
    },
    {
      q: 'Which interface do you implement to handle a specific message type?',
      options: ['IMessageHandler<T>', 'IConsumer<T>', 'ISubscriber<T>', 'IProcessor<T>'],
      answer: 1,
      explanation: 'IConsumer<T> with a Consume(ConsumeContext<T>) method is the standard way to handle messages in MassTransit.',
    },
    {
      q: 'Which transport should you use for integration tests without a broker?',
      options: ['UsingRabbitMq()', 'UsingAzureServiceBus()', 'UsingInMemory()', 'UsingActiveMq()'],
      answer: 2,
      explanation: 'UsingInMemory() runs the bus entirely in-process — no broker needed. Ideal for unit/integration tests.',
    },
    {
      q: 'What is a MassTransit saga used for?',
      options: [
        'Sending messages in bulk',
        'Orchestrating long-running multi-step workflows with persisted state',
        'Retrying failed messages',
        'Load-balancing consumers across queues',
      ],
      answer: 1,
      explanation: 'Sagas are state machines that track the progress of a business workflow across multiple messages and service boundaries, with state persisted to a database.',
    },
    {
      q: 'What is the MassTransit request/response pattern and how does IRequestClient<T> work?',
      options: [
        'IRequestClient<T> sends a message to a queue and returns a Task that resolves when a correlation ID matches in the error queue',
        'IRequestClient<T> publishes a request message and awaits a typed response — MassTransit uses a temporary response queue and correlates the reply automatically',
        'It is an HTTP wrapper that translates MassTransit messages to REST API calls',
        'It sends messages synchronously by blocking the consumer thread until a reply arrives',
      ],
      answer: 1,
      explanation: 'IRequestClient<T> sends a request message to the consumer\'s endpoint and awaits a response. MassTransit creates a temporary reply queue, embeds the reply address and correlation ID in the request, and the consumer calls context.RespondAsync<TResponse>(response). The IRequestClient resolves the Task when the correlated response arrives. Default timeout is 30 seconds.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Which message brokers does MassTransit support?',
      a: 'RabbitMQ, Azure Service Bus, Amazon SQS/SNS, ActiveMQ, Amazon MQ, Azure Event Hub, and in-memory. You switch transports by changing UsingXxx() in the configuration — consumer code is unchanged.',
    },
    {
      q: 'How do I test a consumer without a real broker?',
      a: 'Use MassTransit.Testing and the InMemoryTestHarness or the newer ITestHarness. Call harness.Start(), send/publish a message, then assert harness.Consumed.Select<T>().Any() is true. No real broker is needed.',
    },
    {
      q: 'What is the difference between UseMessageRetry and UseDelayedRedelivery?',
      a: 'UseMessageRetry performs immediate retries in-memory within the same consumer instance. UseDelayedRedelivery requeues the message to the broker with a delay (surviving restarts) using a scheduler. Use both: immediate retries for transient errors, delayed redelivery for longer backoff.',
    },
    {
      q: 'Can MassTransit work with minimal APIs?',
      a: 'Yes. Inject IPublishEndpoint or ISendEndpointProvider directly into the minimal API handler lambda. MassTransit is registered in DI and works the same way regardless of whether you use controllers or minimal APIs.',
    },
    {
      q: 'What is the Outbox pattern and does MassTransit support it?',
      a: 'The Outbox pattern writes messages to the database in the same transaction as the business entity change, ensuring the message is never lost if the broker is unavailable. MassTransit supports this natively with UseMessageData or the Entity Framework Outbox: cfg.UseEntityFrameworkOutbox<MyDbContext>(). Messages are stored to the database outbox table, then a background job delivers them to the broker. This guarantees at-least-once delivery without two-phase commit.',
    },
    {
      q: 'How do I configure MassTransit for Azure Service Bus?',
      a: 'Install MassTransit.Azure.ServiceBus.Core and call x.UsingAzureServiceBus((ctx, cfg) => { cfg.Host("Endpoint=sb://...;"); cfg.ConfigureEndpoints(ctx); }). Topics are created automatically for publish fan-out; queues for send point-to-point. Set RetryPolicy and PrefetchCount on the receive endpoint. Use Managed Identity authentication by omitting the key from the connection string and granting the app\'s identity the Service Bus Data Receiver/Sender roles.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MassTransit is a transport-agnostic message bus — define IConsumer<T> classes, publish events or send commands, and configure retry policies for resilient async messaging.',
    mustKnow: [
      'AddMassTransit() + UsingRabbitMq/UsingInMemory + ConfigureEndpoints(ctx)',
      'IConsumer<T>.Consume(ConsumeContext<T>) handles a message type — always async',
      'Publish = fan-out (events); Send = point-to-point (commands) — choose the right one',
      'UseMessageRetry for immediate retries; UseDelayedRedelivery for backoff that survives restarts',
      'Messages exhausting all retries go to queue_name_error for investigation',
      'IRequestClient<TRequest> for request-reply patterns across services',
    ],
    interviewFocus: [
      'Publish vs Send — which to use for events vs commands',
      'How retry and dead-letter queues work in MassTransit',
      'What a saga is and when to use one for distributed workflows',
      'How to test consumers without a real broker (InMemoryTestHarness)',
    ],
  };
}
