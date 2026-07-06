import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-unknown-type-discriminator-throws-jsonexception-not-forward-compatible-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './unknown-type-discriminator-throws-jsonexception-not-forward-compatible.html',
  styleUrl: './unknown-type-discriminator-throws-jsonexception-not-forward-compatible.scss',
})
export class UnknownTypeDiscriminatorThrowsJsonexceptionNotForwardCompatibleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Shape example only shows the HAPPY path — every derived type in the JSON is one the reader already knows about',
      points: [
        'The main System.Text.Json Advanced page demonstrates <code>[JsonPolymorphic]</code> and <code>[JsonDerivedType]</code> with <code>Circle</code>, <code>Rectangle</code>, and <code>Triangle</code> — and the deserializing side always has ALL THREE <code>[JsonDerivedType]</code> attributes present. This hides an important, very real production question: what happens when the JSON contains a <code>$type</code> value the CURRENT reader\'s <code>[JsonDerivedType]</code> list does not include at all?',
      ],
    },
    {
      heading: 'An unrecognized discriminator value throws JsonException at deserialize time — there is no silent skip, no fallback to the base type',
      points: [
        'When <code>JsonSerializer.Deserialize</code> encounters a <code>$type</code> discriminator value that does not match any <code>[JsonDerivedType]</code> registered on the base class, it throws a <code>JsonException</code> ("Unknown type discriminator...") — it does NOT silently deserialize as the abstract base class, does NOT skip that one array element while keeping the rest, and does NOT return null for that element. One unrecognized element anywhere in a JSON payload fails the ENTIRE deserialization call.',
      ],
    },
    {
      heading: 'This makes polymorphic serialization a genuine ROLLING-DEPLOYMENT hazard: an OLDER service version cannot read a NEWER derived type it does not yet know about',
      points: [
        'This matters enormously for any system where producers and consumers of polymorphic JSON are deployed independently — a message queue, an event log, a multi-service API surface during a rolling deployment. If Service A is upgraded first and starts emitting a NEW derived type (a new <code>Shape</code> subtype, or in the earlier <code>EventBase</code> topic\'s terms, a new event type), any Service B instance still running the OLD version — with an OLDER <code>[JsonDerivedType]</code> list that does not yet include the new type — throws on EVERY message containing that new type, until Service B is also upgraded. There is no automatic graceful degradation; it must be built deliberately.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s Shape hierarchy, reduced to TWO known types on the READER side',
      language: 'csharp',
      code: `// The READER only knows about Circle and Rectangle — Triangle was
// added to the WRITER's codebase in a later deploy the reader hasn't
// received yet:
[JsonPolymorphic(TypeDiscriminatorPropertyName = "$type")]
[JsonDerivedType(typeof(Circle),    typeDiscriminator: "circle")]
[JsonDerivedType(typeof(Rectangle), typeDiscriminator: "rect")]
// [JsonDerivedType(typeof(Triangle), typeDiscriminator: "triangle")]
// ^ this line does not exist yet in the OLDER reader's build
public abstract class Shape
{
    public string Color { get; set; } = "black";
}

public class Circle    : Shape { public double Radius { get; set; } }
public class Rectangle : Shape { public double Width { get; set; } public double Height { get; set; } }
public class Triangle  : Shape { public double Base { get; set; } public double Height { get; set; } }

// JSON produced by the NEWER writer, which DOES know about Triangle:
string json = """
[
  {"$type":"circle","Radius":5,"Color":"red"},
  {"$type":"triangle","Base":4,"Height":3,"Color":"green"}
]
""";

var shapes = JsonSerializer.Deserialize<List<Shape>>(json)!;
// System.Text.Json.JsonException: Unknown type discriminator 'triangle'.
//
// This throws for the ENTIRE list, even though the FIRST element
// (circle) is perfectly recognizable — there is no partial result,
// no silent skip of just the unrecognized element.`,
    },
    {
      label: 'A defensive pattern — a fallback "Unknown" derived type instead of a hard failure',
      language: 'csharp',
      code: `// [JsonDerivedType] does NOT support a wildcard/catch-all discriminator
// directly — but a custom converter CAN implement graceful fallback.
// This is a genuinely more involved pattern than the attribute-based one,
// used specifically where forward compatibility across independent
// deployments matters:
public class ShapeConverter : JsonConverter<Shape>
{
    public override Shape Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        string discriminator = doc.RootElement.GetProperty("$type").GetString()!;

        return discriminator switch
        {
            "circle" => doc.RootElement.Deserialize<Circle>(options)!,
            "rect"   => doc.RootElement.Deserialize<Rectangle>(options)!,
            // Unknown discriminators fall back to a placeholder type,
            // rather than throwing and losing the ENTIRE payload:
            _ => new UnknownShape { Color = doc.RootElement.GetProperty("Color").GetString() ?? "", RawType = discriminator },
        };
    }

    public override void Write(Utf8JsonWriter writer, Shape value, JsonSerializerOptions options)
        => throw new NotSupportedException("Writing handled by [JsonDerivedType] on the base class.");
}

public class UnknownShape : Shape
{
    public string RawType { get; set; } = "";  // preserves what discriminator was actually seen
}

// With [JsonConverter(typeof(ShapeConverter))] on Shape instead of the
// attribute pair, an unrecognized "triangle" becomes an UnknownShape
// instance rather than an exception — the REST of the list still
// deserializes successfully, and calling code can choose to skip or
// log UnknownShape instances rather than lose the entire batch.`,
    },
    {
      label: 'Why this specifically bites during rolling deployments, not single-instance upgrades',
      language: 'csharp',
      code: `// Service A (producer) — upgraded FIRST in a rolling deployment,
// now emits the new Triangle type as part of normal operation:
app.MapPost("/shapes", (Shape shape) => shapeQueue.Publish(shape));
// A client calls this with a Triangle — Service A serializes it fine,
// publishes {"$type":"triangle", ...} to a shared message queue.

// Service B (consumer) — an OLDER deployed instance, still running
// the PREVIOUS build, with a Shape hierarchy that has no Triangle
// registration at all yet:
shapeQueue.Subscribe(json =>
{
    var shape = JsonSerializer.Deserialize<Shape>(json)!;
    // JsonException thrown HERE, for every Triangle message, until
    // THIS specific instance is also redeployed with the updated code —
    // during a rolling deployment, this can be several minutes where
    // some consumer instances are updated and some are not, and EVERY
    // message routed to an outdated instance fails.
    ProcessShape(shape);
});

// This is precisely why systems with independently-deployed producers
// and consumers of polymorphic JSON (event queues, service meshes,
// public APIs versioned independently of their clients) often prefer
// the "UnknownShape" fallback pattern above over the strict attribute-
// only approach — a producer emitting a genuinely new type should
// degrade a CONSUMER gracefully, not take down its entire message
// processing pipeline.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An event-sourcing system stores polymorphic <code>EventBase</code>-derived events as JSON in an append-only log, using <code>[JsonPolymorphic]</code>/<code>[JsonDerivedType]</code>. A new event type is added six months later. Explain what happens when the system tries to REPLAY the entire historical event log after this change, and why replaying is actually SAFER than the live rolling-deployment scenario.',
    hint: 'Consider the DIRECTION of compatibility needed: replaying OLD events with a NEWER reader (which has strictly MORE [JsonDerivedType] entries than before) versus a rolling deployment where an OLDER reader must handle a NEWER event type it has never seen.',
    solution: `// The event log contains ONLY events from BEFORE the new type existed —
// every discriminator value in the historical log is one the reader's
// [JsonDerivedType] list has ALWAYS included, plus now some NEW entries
// for the type added six months later:
[JsonPolymorphic(TypeDiscriminatorPropertyName = "eventType")]
[JsonDerivedType(typeof(UserRegistered), "user.registered")]
[JsonDerivedType(typeof(OrderPlaced),    "order.placed")]
[JsonDerivedType(typeof(PaymentFailed),  "payment.failed")]
[JsonDerivedType(typeof(SubscriptionRenewed), "subscription.renewed")] // NEW, added 6 months later
public abstract class EventBase { /* ... */ }

// Replaying the ENTIRE historical log with this NEWER reader:
await foreach (var line in ReadEventLogLinesAsync())
{
    var evt = JsonSerializer.Deserialize<EventBase>(line)!;
    // SAFE — every discriminator value that EXISTS in the historical
    // log (user.registered, order.placed, payment.failed) was ALREADY
    // present in [JsonDerivedType] before this event was ever written.
    // The NEW "subscription.renewed" entry simply never appears in
    // OLD log lines at all, so it never gets exercised during replay
    // of history — adding NEW derived types is purely ADDITIVE from
    // the reader's perspective when reading OLD data.
    Replay(evt);
}

// WHY THIS DIRECTION IS SAFE, versus the rolling-deployment scenario:
// Replay only ever needs the reader to understand a SUBSET of what it
// currently knows — old data was written when FEWER types existed, so
// a newer, ADDITIVE reader (superset of types) can always read it.
//
// The DANGEROUS direction (the rolling-deployment case from the main
// theory) is the OPPOSITE: an OLDER reader (fewer known types) must
// read NEWER data that may reference a type added AFTER that reader's
// build — a reader can never "already know" about a type invented
// after it was compiled. This is why forward compatibility (old
// reader, new data) requires deliberate handling (a fallback converter,
// or coordinating deploy order so all consumers upgrade before any
// producer starts emitting the new type), while backward compatibility
// (new reader, old data) with [JsonDerivedType] is safe automatically,
// as long as no OLD discriminator name was ever REMOVED or renamed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an unrecognized $type discriminator value causes System.Text.Json to skip just that one element and continue deserializing the rest of a list.',
      reality: 'it throws a JsonException that fails the ENTIRE deserialize call — there is no partial result and no silent skip of individual unrecognized elements within a collection.',
    },
    {
      thought: 'polymorphic serialization with [JsonPolymorphic]/[JsonDerivedType] is automatically forward-compatible — older code can always read JSON produced by newer code.',
      reality: 'the OPPOSITE direction (newer reader, older data) is safe by default since old discriminators are a strict subset of new ones — but an older reader encountering a genuinely new discriminator value it was compiled before ever throws, requiring deliberate handling (a fallback converter or coordinated deploy ordering).',
    },
    {
      thought: 'this discriminator-mismatch risk only matters for public, third-party-facing APIs.',
      reality: 'it is equally a risk for internal systems with independently-deployed services sharing polymorphic JSON — message queues, event logs replayed across service boundaries, or any rolling deployment where producer and consumer instances briefly run different code versions simultaneously.',
    },
  ];
}
