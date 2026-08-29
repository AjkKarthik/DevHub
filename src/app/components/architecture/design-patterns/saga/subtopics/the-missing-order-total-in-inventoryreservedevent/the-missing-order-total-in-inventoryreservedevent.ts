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
    heading: 'A Field Used That Was Never Passed Along',
    points: [
      'The main page\'s own "Choreography Saga" codeTab has <code>InventoryReservedConsumer.Consume()</code> calling <code>gateway.ChargeAsync(ctx.Message.OrderId, ctx.Message.Amount)</code> — but tracing where <code>InventoryReservedEvent</code> is actually CONSTRUCTED, in <code>OrderPlacedConsumer</code> one method above, it only ever passes two values: <code>new InventoryReservedEvent(ctx.Message.OrderId, reservationId)</code>. There is no <code>Amount</code> anywhere in that constructor call.',
      'This is the same category of bug seen elsewhere in this hub — a downstream method referencing a property on an object that the upstream code never actually populated — just this time crossing a SERVICE boundary (a published event), not a single class.',
      'The order\'s total IS known — it\'s right there in <code>PlaceOrderHandler</code>\'s own <code>OrderPlacedEvent(order.Id, cmd.Items, order.Total)</code> — but Inventory Service, the only consumer of THAT event, never forwards it into the NEXT event it publishes.',
    ],
  },
  {
    heading: 'Why Choreography Makes This Easy to Miss',
    points: [
      'This is exactly the trade-off the main page\'s own theory names: "Choreography: looser coupling, harder to trace the overall flow." Each consumer reads correctly IN ISOLATION — <code>OrderPlacedConsumer</code> looks complete, <code>InventoryReservedConsumer</code> looks complete — the gap only exists in the DATA CONTRACT between them, invisible from reading either file alone.',
      'An Orchestration saga (the main page\'s OTHER codeTab) would surface this differently: the saga STATE (<code>OrderSagaState.Total</code>) is explicit and centrally visible, making a missing field more likely to be noticed during design — one more concrete reason orchestration trades looser coupling for easier debugging, as the main page\'s own theory already states in general terms.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Amount Never Forwarded',
    language: 'csharp',
    code: `public class OrderPlacedConsumer(IInventoryRepository repo, IPublishEndpoint bus)
    : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> ctx)
    {
        var reservationId = await repo.ReserveAsync(ctx.Message.OrderId, ctx.Message.Items);
        // ctx.Message.Total exists on OrderPlacedEvent right here —
        // but it never makes it into the published event below.
        await bus.Publish(new InventoryReservedEvent(ctx.Message.OrderId, reservationId));
    }
}

public class InventoryReservedConsumer(IPaymentGateway gateway, IPublishEndpoint bus)
    : IConsumer<InventoryReservedEvent>
{
    public async Task Consume(ConsumeContext<InventoryReservedEvent> ctx)
    {
        // ctx.Message.Amount does not exist on InventoryReservedEvent
        // as constructed above — this does not compile.
        var result = await gateway.ChargeAsync(ctx.Message.OrderId, ctx.Message.Amount);
        // ...
    }
}`,
  },
  {
    label: 'After — Total Threaded Through',
    language: 'csharp',
    code: `public class OrderPlacedConsumer(IInventoryRepository repo, IPublishEndpoint bus)
    : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> ctx)
    {
        var reservationId = await repo.ReserveAsync(ctx.Message.OrderId, ctx.Message.Items);
        // Forward the total — Payment Service has no other source for it.
        await bus.Publish(new InventoryReservedEvent(ctx.Message.OrderId, reservationId, ctx.Message.Total));
    }
}

public class InventoryReservedConsumer(IPaymentGateway gateway, IPublishEndpoint bus)
    : IConsumer<InventoryReservedEvent>
{
    public async Task Consume(ConsumeContext<InventoryReservedEvent> ctx)
    {
        var result = await gateway.ChargeAsync(ctx.Message.OrderId, ctx.Message.Total);
        // ...
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose the fix instead re-fetched the order total by having Payment Service query the Order database directly (rather than reading it off the event). What NEW cross-service coupling would that introduce, and how does it compare to just adding one more field to <code>InventoryReservedEvent</code>?',
  hint: 'Think about what "Choreography: services react to events independently" (the main page\'s own definition) assumes about how a service gets the data it needs.',
  solution: `// Querying the Order database directly would make Payment Service
// depend on Order Service's OWN database schema and availability —
// a much heavier coupling than one extra field on an event message.
// It also breaks the "each service owns its own data" boundary
// choreography sagas are built around: Payment Service would now
// need network/DB access to a completely different service's store,
// and would fail (or need its own retry/timeout handling) whenever
// that store is briefly unavailable -- exactly the kind of dependency
// choreography is meant to avoid by passing data through events
// instead. Adding the field to the event is strictly simpler and
// keeps Payment Service's only dependency on Inventory Service being
// "whatever InventoryReservedEvent happens to carry."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>OrderPlacedEvent</code> already has a <code>Total</code> field, Payment Service can just read it directly from that event.',
    reality: 'Payment Service never subscribes to <code>OrderPlacedEvent</code> at all in this choreography — only Inventory Service does. Payment Service only reacts to <code>InventoryReservedEvent</code>, which is a DIFFERENT message published by a DIFFERENT service. Whatever data Payment Service needs has to be present on the SPECIFIC event it actually consumes, not just present SOMEWHERE upstream in the flow.',
  },
  {
    thought: 'This kind of missing-field bug is unique to strongly-typed languages like C# — a JSON-based event system would just silently omit the field at runtime instead.',
    reality: 'A dynamically-typed or JSON-based system would fail just as surely, only later and less clearly — <code>ctx.Message.Amount</code> would come back <code>undefined</code>/<code>null</code> at runtime instead of failing to compile, and <code>ChargeAsync</code> would either throw on a null amount or, worse, silently charge <code>0</code>/<code>NaN</code>. The strongly-typed version is actually the SAFER failure mode here — it refuses to compile instead of shipping a silent data bug to production.',
  },
];

@Component({
  selector: 'app-dp-saga-missing-total',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-order-total-in-inventoryreservedevent.html',
  styleUrl: './the-missing-order-total-in-inventoryreservedevent.scss',
})
export class TheMissingOrderTotalInInventoryreservedeventSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
