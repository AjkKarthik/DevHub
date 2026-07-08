import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-masstransit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-masstransit-consumers-and-request-reply-with-itestharness.html',
  styleUrl: './testing-masstransit-consumers-and-request-reply-with-itestharness.scss',
})
export class TestingMasstransitConsumersAndRequestReplyWithItestharnessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Q&A Names the Tool but Shows No Code',
      points: [
        'The main page\'s own "How do I test a consumer without a real broker?" answer names ITestHarness and harness.Consumed.Select&lt;T&gt;().Any() — but neither the OrderPlacedConsumer example nor the request-reply GetProductDetailsConsumer example is ever shown under test. AddMassTransitTestHarness() registers an in-memory bus purpose-built for tests: no RabbitMQ, no network, and a harness object that records every message consumed, published, or sent during the test for direct assertion.',
        'Testing a plain IConsumer&lt;T&gt; and testing an IRequestClient&lt;TRequest&gt; request-reply flow use the SAME harness but ASSERT differently: consumer tests check harness.Consumed for the inbound message type; request-reply tests instead call the request client directly and assert on the TYPED RESPONSE it returns, since the harness itself doesn\'t need separate assertions for the reply — resolving the awaited Task successfully already proves the round trip worked.',
      ],
    },
    {
      heading: 'Why a Consumed Assertion Alone Isn\'t Enough for Request-Reply',
      points: [
        'For a plain fire-and-forget consumer (like OrderPlacedConsumer), asserting harness.Consumed.Select&lt;OrderPlaced&gt;().Any() is a complete, sufficient proof that the message was received and processed. For a request-reply flow, that same style of assertion only proves the REQUEST arrived — it says nothing about whether ctx.RespondAsync() was ever called, whether the response TYPE matched what the caller expected, or whether the caller\'s await actually completed. The request-reply test must additionally await the IRequestClient&lt;T&gt; call itself and assert on its resolved response.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing a plain consumer with ITestHarness',
      language: 'csharp',
      code: `[Fact]
public async Task OrderPlacedConsumer_Consumes_The_Published_Message()
{
    await using var provider = new ServiceCollection()
        .AddMassTransitTestHarness(x =>
        {
            x.AddConsumer<OrderPlacedConsumer>();
        })
        .AddSingleton<IEmailService, FakeEmailService>()
        .BuildServiceProvider(true);

    var harness = provider.GetRequiredService<ITestHarness>();
    await harness.Start();

    var bus = provider.GetRequiredService<IPublishEndpoint>();
    await bus.Publish(new OrderPlaced(Guid.NewGuid(), "alice@example.com", 49.99m));

    // Proves the message was actually consumed — not just published.
    Assert.True(await harness.Consumed.Any<OrderPlaced>());

    var fakeEmail = (FakeEmailService)provider.GetRequiredService<IEmailService>();
    Assert.True(fakeEmail.WasCalled);   // proves the consumer's OWN logic ran, not just delivery
}`,
    },
    {
      label: 'Testing request-reply — asserting on the resolved response, not just Consumed',
      language: 'csharp',
      code: `[Fact]
public async Task GetProductDetails_Request_Reply_Returns_The_Product()
{
    await using var provider = new ServiceCollection()
        .AddMassTransitTestHarness(x =>
        {
            x.AddConsumer<GetProductDetailsConsumer>();
        })
        .BuildServiceProvider(true);

    var harness = provider.GetRequiredService<ITestHarness>();
    await harness.Start();

    var client = provider.GetRequiredService<IRequestClient<GetProductDetails>>();
    var productId = Guid.NewGuid();

    // The assertion that actually matters is on the AWAITED RESPONSE —
    // harness.Consumed.Any<GetProductDetails>() alone would only prove
    // the REQUEST arrived, saying nothing about the reply.
    var response = await client.GetResponse<ProductDetails>(new GetProductDetails(productId));

    Assert.Equal(productId, response.Message.Id);
    Assert.Equal("Widget", response.Message.Name);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a request-reply test that only asserts <code>await harness.Consumed.Any&lt;GetProductDetails&gt;()</code> is true, and argues this proves the request-reply flow works. What specific bug would this test fail to catch?',
    hint: 'Think about what would happen if GetProductDetailsConsumer received the request correctly but had a bug in the RESPONSE it built — e.g. forgot to call ctx.RespondAsync() at all, or responded with the wrong type.',
    solution: `Consumed.Any<GetProductDetails>() only proves the REQUEST message
arrived at the consumer — it says nothing about what happened
afterward. If GetProductDetailsConsumer's Consume method threw before
reaching ctx.RespondAsync(), or simply forgot to call RespondAsync()
at all, or responded with the wrong message type, the Consumed
assertion would still pass (the request WAS consumed), while the
caller's actual client.GetResponse<ProductDetails>(...) call would hang
until MassTransit's default request timeout (30 seconds) and then throw
a RequestTimeoutException — a completely different failure mode that
the Consumed-only test gives zero visibility into.

The correct assertion is on the RESOLVED RESPONSE itself — awaiting
client.GetResponse<ProductDetails>(...) and asserting on its Message
properties, exactly as the second code tab does. That single await
already proves the request was consumed, a response was sent, the
response type matched, and it arrived back at the caller — a Consumed
check only proves the FIRST of those four things.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a request-reply flow just means asserting harness.Consumed.Any&lt;TRequest&gt;() is true, the same way you\'d test a plain fire-and-forget consumer.',
      reality: 'that only proves the REQUEST arrived — it says nothing about whether a response was ever sent, whether it was the right type, or whether the caller\'s await actually resolved. Request-reply tests must assert on the response returned by IRequestClient&lt;T&gt; itself.',
    },
    {
      thought: 'ITestHarness requires a real (if local) message broker running for tests to work.',
      reality: 'AddMassTransitTestHarness() registers a fully in-memory bus purpose-built for tests — no broker, no network connection, and no external process is needed at all.',
    },
    {
      thought: 'if a consumer test asserts harness.Consumed.Any&lt;T&gt;() is true, that proves the consumer\'s business logic executed correctly.',
      reality: 'Consumed only proves the message was DELIVERED to the consumer — it says nothing about what the consumer\'s Consume method actually DID with it. Asserting on a side effect (like a fake service being called, as in the first example) is what proves the consumer\'s own logic ran.',
    },
  ];
}
