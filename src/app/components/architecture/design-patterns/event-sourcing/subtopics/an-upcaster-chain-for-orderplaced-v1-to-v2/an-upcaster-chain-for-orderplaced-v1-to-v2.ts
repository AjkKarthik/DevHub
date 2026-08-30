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
    heading: 'Named Three Times, Shown Zero Times',
    points: [
      'Upcasting gets real coverage on the main page — a whole mistake block ("Not versioning events when the schema changes"), a dedicated quiz question, and a QnA answer — but every one of them describes the IDEA in prose. No codeTab shows an actual upcaster function running.',
      'The mistake block\'s own "wrong" example is exactly the scenario worth building out: <code>OrderPlaced(Guid Id, string CustomerEmail)</code> gets a new field, <code>CustomerId</code>, added later — and old events in the store were written BEFORE that field existed.',
      'The fix isn\'t deleting or rewriting those old events (events are immutable, per the main page\'s own "Changing or deleting past events" mistake) — it\'s transforming them into the NEW shape at READ time, every time they\'re loaded, while the stored bytes never change.',
    ],
  },
  {
    heading: 'What an Upcaster Actually Is',
    points: [
      'Mechanically, an upcaster is just a plain function: it takes the OLD event shape and RETURNS the new one, filling in whatever the new field needs from information the old shape doesn\'t have (a lookup, a default, a placeholder that later gets backfilled).',
      'The main page\'s own QnA already names the general pattern for a longer chain: "Upcaster chain: v1 -&gt; v2 -&gt; v3 (applied in sequence)" — each step only needs to know how to get from ITS version to the next one; the deserialiser applies the whole chain, not just one step, so a v1 event correctly reaches the CURRENT shape even after several schema changes.',
      'This slots directly into the main page\'s own <code>EventStore.Deserialise</code> method — that switch expression is exactly where "read the stored JSON, then figure out which shape it is and normalise it" belongs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two Event Versions + Upcaster',
    language: 'csharp',
    code: `// v1 — the ORIGINAL shape, still sitting in old rows in the store.
// Never edited after the fact — immutable, exactly as written.
public record OrderPlacedV1(Guid AggregateId, int Version, DateTimeOffset OccurredAt,
    string CustomerEmail, List<OrderItem> Items, decimal Total) : DomainEvent(AggregateId, Version, OccurredAt);

// v2 — the CURRENT shape every new event is written as, and the
// ONLY shape the rest of the application (Order.Apply, projections)
// needs to know about.
public record OrderPlacedV2(Guid AggregateId, int Version, DateTimeOffset OccurredAt,
    Guid CustomerId, List<OrderItem> Items, decimal Total) : DomainEvent(AggregateId, Version, OccurredAt);

// An upcaster: old shape in, new shape out. Nothing more.
public static class OrderPlacedUpcaster
{
    public static OrderPlacedV2 ToV2(OrderPlacedV1 old, ICustomerLookup customers)
    {
        // v1 only ever stored an email — v2 needs a stable CustomerId.
        // Resolve it via a lookup at READ time; the stored v1 bytes
        // are never touched.
        var customerId = customers.FindIdByEmail(old.CustomerEmail)
                          ?? CustomerId.Unknown;   // a documented fallback, not a crash

        return new OrderPlacedV2(old.AggregateId, old.Version, old.OccurredAt,
            customerId, old.Items, old.Total);
    }
}

// Deserialise now upcasts transparently — every OTHER piece of code
// that consumes DomainEvent objects only ever sees OrderPlacedV2.
public class EventStore(AppDbContext db, ICustomerLookup customers) : IEventStore
{
    private DomainEvent Deserialise(StoredEvent s) => s.EventType switch
    {
        // Old rows: deserialise as v1, then upcast immediately.
        nameof(OrderPlacedV1) => OrderPlacedUpcaster.ToV2(
            JsonSerializer.Deserialize<OrderPlacedV1>(s.Payload)!, customers),

        // New rows: already v2, no upcasting needed.
        nameof(OrderPlacedV2) => JsonSerializer.Deserialize<OrderPlacedV2>(s.Payload)!,

        nameof(OrderItemAdded) => JsonSerializer.Deserialize<OrderItemAdded>(s.Payload)!,
        nameof(OrderCancelled) => JsonSerializer.Deserialize<OrderCancelled>(s.Payload)!,
        _ => throw new UnknownEventTypeException(s.EventType)
    };

    // AppendAsync (unchanged from the main page) always writes new
    // events using whatever the CURRENT record type is — OrderPlacedV2
    // going forward. Old OrderPlacedV1 rows are never rewritten.
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A THIRD shape, <code>OrderPlacedV3</code>, later replaces <code>CustomerId</code> with a richer <code>CustomerRef</code> record. Following the QnA\'s own "v1 -&gt; v2 -&gt; v3" chain description, what does <code>Deserialise</code> need to do differently for an old v1 row versus an old v2 row, once v3 is the current shape?',
  hint: 'Think about how many upcast steps each old shape is now away from the current one.',
  solution: `// A stored v2 row needs exactly ONE upcast: V2 -> V3.
// A stored v1 row needs TWO upcasts applied in sequence: V1 -> V2,
// then that RESULT fed into V2 -> V3 -- it never jumps straight
// from V1 to V3 directly.

nameof(OrderPlacedV1) => OrderPlacedUpcasterV2ToV3.ToV3(
    OrderPlacedUpcaster.ToV2(
        JsonSerializer.Deserialize<OrderPlacedV1>(s.Payload)!, customers)),

nameof(OrderPlacedV2) => OrderPlacedUpcasterV2ToV3.ToV3(
    JsonSerializer.Deserialize<OrderPlacedV2>(s.Payload)!),

nameof(OrderPlacedV3) => JsonSerializer.Deserialize<OrderPlacedV3>(s.Payload)!,

// This is exactly why each upcaster only needs to know about ONE
// step of the chain -- composing them at read time handles any
// number of versions an old event might be behind.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Upcasting means going back and updating the old stored events to the new schema, just done carefully with a migration script.',
    reality: 'The stored bytes for an old event never change at all — that would violate the main page\'s own "events are immutable" rule. Upcasting happens ENTIRELY at read time, inside deserialisation: the old JSON is read exactly as originally written, THEN transformed in memory into the current shape, on every single load, forever. There is no one-time migration step.',
  },
  {
    thought: 'Once every OrderPlacedV1 row has been upcast at least once, the upcaster function can be safely deleted.',
    reality: 'The upcaster has to stay for as long as ANY v1 row still exists in the event store — which, since events are permanent, is typically forever (or until a deliberate data-retention/GDPR erasure policy removes old streams entirely). "Has this event type been upcast before" is not a per-event-store fact that changes; the SAME old row gets upcast again every time that aggregate is loaded.',
  },
];

@Component({
  selector: 'app-dp-es-upcaster',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './an-upcaster-chain-for-orderplaced-v1-to-v2.html',
  styleUrl: './an-upcaster-chain-for-orderplaced-v1-to-v2.scss',
})
export class AnUpcasterChainForOrderplacedV1ToV2Subtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
