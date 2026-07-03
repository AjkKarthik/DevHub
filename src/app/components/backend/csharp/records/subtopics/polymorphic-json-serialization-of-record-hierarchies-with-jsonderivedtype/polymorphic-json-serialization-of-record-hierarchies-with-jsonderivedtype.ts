import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-polymorphic-json-serialization-of-record-hierarchies-with-jsonderivedtype-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './polymorphic-json-serialization-of-record-hierarchies-with-jsonderivedtype.html',
  styleUrl: './polymorphic-json-serialization-of-record-hierarchies-with-jsonderivedtype.scss',
})
export class PolymorphicJsonSerializationOfRecordHierarchiesWithJsonderivedtypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-line mention that hides a real problem',
      points: [
        'The main topic\'s Q&A says "System.Text.Json supports records with init properties from .NET 5 onward" — true, but incomplete for the exact record-inheritance scenario the main page itself demonstrates: <code>record Animal(string Name)</code> and <code>record Dog(string Name, string Breed) : Animal(Name)</code>. Serializing a <code>List&lt;Animal&gt;</code> containing a mix of <code>Animal</code> and <code>Dog</code> instances by DEFAULT loses the <code>Dog</code>-specific <code>Breed</code> property entirely — <code>System.Text.Json</code> serializes based on the STATIC (compile-time) type of the collection, not the RUNTIME type of each element, unless you explicitly configure polymorphic serialization.',
      ],
    },
    {
      heading: 'Why the default behavior drops derived-record data',
      points: [
        '<code>JsonSerializer.Serialize(animals)</code> where <code>animals</code> is <code>List&lt;Animal&gt;</code> only looks at <code>Animal</code>\'s own declared properties when deciding what to write — even for elements that are ACTUALLY <code>Dog</code> instances at runtime, <code>Breed</code> is silently omitted from the JSON output. This is a genuinely easy mistake to make with record hierarchies specifically, because the main topic\'s own <code>EqualityContract</code> section establishes that <code>Dog</code> IS meaningfully distinct from <code>Animal</code> at the type level — it is natural to assume serialization respects that distinction automatically, but by default it does not.',
      ],
    },
    {
      heading: 'JsonDerivedType and JsonPolymorphic — .NET 7+',
      points: [
        'Decorate the BASE record with <code>[JsonPolymorphic]</code> and one <code>[JsonDerivedType(typeof(Dog), "dog")]</code> attribute per derived type: <code>[JsonPolymorphic] [JsonDerivedType(typeof(Dog), "dog")] public record Animal(string Name);</code> — this tells the serializer to inspect each element\'s ACTUAL runtime type and include a discriminator field (<code>"dog"</code>) plus all of that type\'s properties, including <code>Breed</code>.',
        'On deserialization, the discriminator field is read FIRST to determine which concrete record type to construct — <code>JsonSerializer.Deserialize&lt;List&lt;Animal&gt;&gt;(json)</code> correctly produces actual <code>Dog</code> instances (not just <code>Animal</code> instances with the extra JSON properties silently dropped) as long as the discriminator matches a registered <code>JsonDerivedType</code>.',
        'The discriminator PROPERTY NAME itself is configurable via <code>[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]</code> — the default is <code>"$type"</code>, which can collide with API contracts that already use a <code>$type</code>-shaped field for something else, so check this if integrating with an existing JSON schema.',
      ],
    },
    {
      heading: 'What this means for the "records as event payloads" use case',
      points: [
        'The main topic recommends records for "event sourcing payloads (OrderPlaced, UserRegistered)" — if these events share a common base record (e.g. <code>DomainEvent</code>) and get serialized to an event STORE as JSON, this exact polymorphic-serialization gap is directly relevant: without <code>JsonDerivedType</code> configuration, deserializing a stored event log back into <code>List&lt;DomainEvent&gt;</code> would silently produce base-type instances missing each event\'s specific data — a serious, easy-to-miss data-loss bug for precisely the use case the main topic recommends records for.',
        'For a GROWING set of derived event types (a real event-sourcing system might have dozens), registering each one via a <code>[JsonDerivedType]</code> attribute keeps the mapping explicit and centralized on the base type — an intentional design trade-off (you must remember to add a new attribute for every new event record) rather than something that "just works" automatically as inheritance and equality do elsewhere in the record system.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent data-loss problem (default behavior)',
      language: 'csharp',
      code: `using System.Text.Json;

public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

List<Animal> animals = [new Animal("Generic"), new Dog("Rex", "Husky")];

string json = JsonSerializer.Serialize(animals);
Console.WriteLine(json);
// [{"Name":"Generic"},{"Name":"Rex"}]
//
// Breed is SILENTLY MISSING for the Dog instance! System.Text.Json only
// looked at the STATIC type (Animal) of the List<Animal>, not each
// element's actual runtime type — exactly the kind of data loss that's
// easy to miss until you notice Breed is always empty after a round trip.

var roundTripped = JsonSerializer.Deserialize<List<Animal>>(json);
Console.WriteLine(roundTripped![1].GetType().Name); // "Animal" — NOT "Dog"!
// The second element deserializes back as a plain Animal, permanently
// losing the fact it was ever a Dog at all.`,
    },
    {
      label: 'The fix — [JsonPolymorphic] + [JsonDerivedType]',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;

[JsonPolymorphic]
[JsonDerivedType(typeof(Animal), "animal")]
[JsonDerivedType(typeof(Dog), "dog")]
public record Animal(string Name);

public record Dog(string Name, string Breed) : Animal(Name);

List<Animal> animals = [new Animal("Generic"), new Dog("Rex", "Husky")];

string json = JsonSerializer.Serialize(animals);
Console.WriteLine(json);
// [{"$type":"animal","Name":"Generic"},{"$type":"dog","Name":"Rex","Breed":"Husky"}]
//
// A "$type" discriminator field is added, and Breed is now correctly
// included for the Dog element.

var roundTripped = JsonSerializer.Deserialize<List<Animal>>(json);
Console.WriteLine(roundTripped![1].GetType().Name); // "Dog" — correct!
Console.WriteLine(((Dog)roundTripped[1]).Breed);    // "Husky" — data preserved`,
    },
    {
      label: 'Custom discriminator name — avoiding a $type collision',
      language: 'csharp',
      code: `using System.Text.Json.Serialization;

// If your API contract already uses "$type" for something else, rename
// the discriminator field explicitly:
[JsonPolymorphic(TypeDiscriminatorPropertyName = "eventKind")]
[JsonDerivedType(typeof(OrderPlaced), "order-placed")]
[JsonDerivedType(typeof(UserRegistered), "user-registered")]
public abstract record DomainEvent(DateTime OccurredAt);

public record OrderPlaced(DateTime OccurredAt, int OrderId, decimal Total)
    : DomainEvent(OccurredAt);

public record UserRegistered(DateTime OccurredAt, string Email)
    : DomainEvent(OccurredAt);

List<DomainEvent> log =
[
    new OrderPlaced(DateTime.UtcNow, 42, 199.99m),
    new UserRegistered(DateTime.UtcNow, "alice@example.com"),
];

string json = JsonSerializer.Serialize(log);
// [{"eventKind":"order-placed","OccurredAt":"...","OrderId":42,"Total":199.99},
//  {"eventKind":"user-registered","OccurredAt":"...","Email":"alice@example.com"}]

// Round-tripping this event log correctly reconstructs each concrete
// event type — critical for an event-sourcing system replaying history.
var restored = JsonSerializer.Deserialize<List<DomainEvent>>(json);
Console.WriteLine(restored![0] is OrderPlaced);     // True
Console.WriteLine(restored[1] is UserRegistered);   // True`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third derived record, <code>Cat(string Name, bool IsIndoor)</code>, to the <code>Animal</code> hierarchy — register it with <code>[JsonDerivedType(typeof(Cat), "cat")]</code>, then verify a mixed <code>List&lt;Animal&gt;</code> containing all three types round-trips correctly through JSON.',
    hint: 'Add public record Cat(string Name, bool IsIndoor) : Animal(Name); and a matching [JsonDerivedType(typeof(Cat), "cat")] attribute on Animal alongside the existing Dog registration. Add a Cat instance to the list, serialize, deserialize, and check roundTripped[2] is Cat and its IsIndoor value.',
    solution: `[JsonPolymorphic]
[JsonDerivedType(typeof(Animal), "animal")]
[JsonDerivedType(typeof(Dog), "dog")]
[JsonDerivedType(typeof(Cat), "cat")]
public record Animal(string Name);

public record Dog(string Name, string Breed) : Animal(Name);
public record Cat(string Name, bool IsIndoor) : Animal(Name);

List<Animal> animals =
[
    new Animal("Generic"),
    new Dog("Rex", "Husky"),
    new Cat("Whiskers", true),
];

string json = JsonSerializer.Serialize(animals);
var roundTripped = JsonSerializer.Deserialize<List<Animal>>(json);

Console.WriteLine(roundTripped![2] is Cat);              // True
Console.WriteLine(((Cat)roundTripped[2]).IsIndoor);       // True
Console.WriteLine(((Cat)roundTripped[2]).Name);            // "Whiskers"`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'serializing a <code>List&lt;Animal&gt;</code> that actually contains some <code>Dog</code> instances automatically includes each Dog\'s Breed property, since System.Text.Json is aware of the object\'s real type.',
      reality: 'by default, System.Text.Json serializes based on the STATIC (compile-time) type of the collection (Animal), not each element\'s runtime type — Breed is silently omitted unless you explicitly configure polymorphic serialization with [JsonPolymorphic] and [JsonDerivedType].',
    },
    {
      thought: 'the record inheritance and EqualityContract mechanics the main topic describes automatically extend to JSON serialization — since Dog and Animal are meaningfully distinct types, serialization respects that distinction too.',
      reality: 'EqualityContract only affects equality comparisons — it has no bearing on serialization at all. Polymorphic JSON output requires its own separate, explicit configuration via [JsonDerivedType] attributes on the base record.',
    },
    {
      thought: 'for the "event sourcing payloads" use case the main topic recommends records for, this polymorphic-serialization concern only matters for large or complex event hierarchies, not simple event logs.',
      reality: 'ANY base-record event type with more than one derived event type serialized as a collection hits this exact silent-data-loss bug — even a system with just two event types (OrderPlaced, UserRegistered) needs [JsonDerivedType] configuration to avoid losing event-specific data on every serialize/deserialize round trip.',
    },
  ];
}
