import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-enum-value-stability-serialization-compatibility-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './enum-value-stability-serialization-compatibility.html',
  styleUrl: './enum-value-stability-serialization-compatibility.scss',
})
export class EnumValueStabilitySerializationCompatibilitySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows auto-incrementing values — never the reordering trap',
      points: [
        'The main Static, Partial & Enums page\'s <code>DayOfWeek</code> example shows values auto-incrementing from an explicit start (<code>Monday = 1</code>, then 2, 3...). It never addresses what happens when a PUBLISHED enum\'s member ORDER (and therefore its auto-assigned integer values) changes later — a real, silent data-corruption risk anywhere the underlying integer is persisted or transmitted.',
      ],
    },
    {
      heading: 'The core problem — auto-incremented values are POSITIONAL, not semantic',
      points: [
        'When an enum member has NO explicit value (<code>Pending, Processing, Shipped, ...</code> as in the main page\'s own <code>OrderStatus</code>), its integer value is simply "one more than the previous member" — a purely POSITIONAL fact about the SOURCE CODE\'s declaration order, with no inherent connection to what the value MEANS.',
        'If a database column, a JSON payload, a message queue, or a binary-serialized cache stores the INTEGER value of an enum (not its name), that stored integer is only meaningful as long as the enum\'s declaration order in code never changes — inserting a new member in the MIDDLE of the list, or reordering existing members, silently shifts every subsequent member\'s value, corrupting the meaning of any ALREADY-STORED data without any compiler warning or runtime error.',
      ],
    },
    {
      heading: 'A concrete example of the corruption',
      points: [
        'Given the main page\'s own <code>OrderStatus { Pending, Processing, Shipped, Delivered, Cancelled }</code> (values 0-4), imagine a database has thousands of rows storing the integer <code>2</code> to mean <code>Shipped</code>. If a developer later inserts a NEW member <code>Returned</code> between <code>Processing</code> and <code>Shipped</code> — a seemingly harmless, purely additive-looking change — <code>Shipped</code>\'s value silently shifts from 2 to 3, and EVERY existing database row storing <code>2</code> now means something completely different (<code>Returned</code>) the moment the new code deploys, with zero compile-time or runtime warning.',
      ],
    },
    {
      heading: 'The fix — always assign explicit values for anything persisted or transmitted',
      points: [
        'The single, reliable fix is exactly what the main page\'s OWN <code>HttpStatusCode</code> example already demonstrates (but does not connect to THIS specific risk): assign EXPLICIT integer values to every member (<code>Ok = 200, Created = 201, ...</code>) — new members can then be added ANYWHERE in the declaration without shifting any existing member\'s value, because each value is now independent of declaration order entirely.',
        'For any enum whose integer value will ever be stored in a database, serialized to JSON/binary, sent over a message queue, or persisted in ANY form outside the currently-running process, explicit values are not a style preference — they are a correctness requirement. Purely positional (implicit) values are only safe for enums whose values NEVER outlive a single process execution (e.g. a purely in-memory, never-persisted state flag).',
      ],
    },
    {
      heading: 'A complementary defense — prefer string-based serialization where possible',
      points: [
        'For JSON specifically, <code>System.Text.Json</code>\'s <code>JsonStringEnumConverter</code> serializes enums as their NAME (<code>"Shipped"</code>) rather than their underlying integer — this sidesteps the entire reordering risk for JSON payloads specifically, since renaming a member is a much rarer, much more deliberately visible change than silently shifting an implicit value. This does not help database columns or binary formats that store raw integers, where explicit values remain the only defense.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — a seemingly harmless insertion silently corrupts stored data',
      language: 'csharp',
      code: `// v1 — the main topic's own OrderStatus, deployed to production,
// with THOUSANDS of database rows storing these integer values:
public enum OrderStatus
{
    Pending,     // 0
    Processing,  // 1
    Shipped,     // 2  <- many existing rows store the integer 2 here
    Delivered,   // 3
    Cancelled,   // 4
}

// v2 — a developer adds a new status, seemingly harmlessly, in the
// "logical" position (after Processing, before Shipped):
public enum OrderStatus
{
    Pending,     // 0
    Processing,  // 1
    Returned,    // 2  <- NEW — silently takes the value Shipped used to have!
    Shipped,     // 3  <- shifted from 2 to 3, with ZERO warning
    Delivered,   // 4  <- shifted from 3 to 4
    Cancelled,   // 5  <- shifted from 4 to 5
}

// Every EXISTING database row that stored the integer 2 (meaning
// "Shipped" under v1) is now silently reinterpreted as "Returned" under
// v2 the moment this code deploys — a genuine, silent data-corruption
// bug with NO compiler warning, NO runtime exception, nothing.`,
    },
    {
      label: 'The fix — explicit values make insertion order-independent',
      language: 'csharp',
      code: `// FIXED — every member has an EXPLICIT value, independent of
// declaration order entirely (same principle as the main topic's own
// HttpStatusCode example, applied here specifically to prevent the
// reordering trap):
public enum OrderStatus
{
    Pending    = 0,
    Processing = 1,
    Shipped    = 2,
    Delivered  = 3,
    Cancelled  = 4,
}

// Now a NEW member can be added ANYWHERE in the declaration, with ANY
// unused value, without disturbing any existing member's meaning:
public enum OrderStatusFixed
{
    Pending    = 0,
    Processing = 1,
    Returned   = 10,  // NEW — given an unused value, added wherever
                       // convenient in the source, no existing values move
    Shipped    = 2,   // STILL 2 — completely undisturbed by the insertion
    Delivered  = 3,
    Cancelled  = 4,
}

// Every existing database row storing "2" still correctly means
// "Shipped" — inserting Returned had ZERO effect on any existing value.`,
    },
    {
      label: 'A complementary defense for JSON — serialize by name, not by number',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;

public enum OrderStatus { Pending = 0, Processing = 1, Shipped = 2 }

public class Order
{
    // Without JsonStringEnumConverter, System.Text.Json serializes the
    // RAW INTEGER by default — inheriting the exact same reordering risk
    // as a database column:
    public OrderStatus Status { get; set; }
}

var options = new JsonSerializerOptions
{
    Converters = { new JsonStringEnumConverter() }
};

var order = new Order { Status = OrderStatus.Shipped };
Console.WriteLine(JsonSerializer.Serialize(order, options));
// {"Status":"Shipped"}  <- serialized by NAME, not by number 2

// A future reordering that changes Shipped's underlying integer value
// has ZERO effect on this JSON payload's meaning, since "Shipped" (the
// STRING) is what's actually stored — a genuinely different, complementary
// defense specifically for JSON. This does NOT help a raw database
// column storing an int, or a binary serializer that persists the
// underlying numeric value directly — explicit values remain the only
// defense for those.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "We use JsonStringEnumConverter everywhere, so we never need explicit enum values anymore — reordering is always safe." Identify the gap in this reasoning, using a concrete example of a persistence mechanism that JsonStringEnumConverter does not protect.',
    hint: 'Think about every PLACE an enum\'s underlying integer value might end up persisted, not just JSON API responses. Consider a database column, a message queue payload using a binary serializer, a distributed cache, a legacy system integration, or even .ToString("D") formatting used for compact logging/storage — none of these necessarily go through System.Text.Json with the string converter configured.',
    solution: `// The gap: JsonStringEnumConverter only protects the SPECIFIC path of
// "this exact enum, serialized through THIS SPECIFIC JsonSerializer
// configuration, to JSON." It does nothing for every OTHER place the
// enum's raw integer value might be persisted:

// 1. A DATABASE COLUMN storing the enum as int (e.g. via EF Core's
//    default int mapping, or raw ADO.NET code) — completely unaffected
//    by any JSON serializer configuration; still stores/reads the raw
//    positional integer.
public class OrderEntity
{
    public int StatusRaw { get; set; } // EF Core default enum mapping —
                                         // stores the raw int, regardless
                                         // of any JSON converter setup
}

// 2. A message queue using a BINARY serializer (MessagePack, Protobuf
//    without explicit enum mapping, raw BinaryFormatter) — these
//    typically serialize enums by their underlying numeric value too,
//    entirely independent of System.Text.Json's configuration.

// 3. Legacy log files or exports using "status.ToString(\"D\")" or an
//    explicit (int)status cast for compact storage — bypasses
//    JsonStringEnumConverter entirely since it's not going through JSON
//    serialization at all.

// 4. A DIFFERENT service/team's OWN deserializer that does not happen
//    to configure JsonStringEnumConverter, even if your own service does
//    — the STRING protection is per-serializer-configuration, not a
//    property of the enum type itself.

// The conclusion: JsonStringEnumConverter is a genuinely useful,
// complementary defense specifically for JSON payloads — but explicit
// enum values remain the ONLY defense that protects EVERY persistence
// path simultaneously, regardless of serializer choice or configuration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'inserting a new enum member is always a safe, purely additive change, since existing code that references other members by NAME continues to compile and work correctly.',
      reality: 'while code referencing members by NAME does keep working, any PERSISTED data storing the enum\'s raw integer VALUE (database columns, binary-serialized caches, message queues) silently corrupts if the new member shifts subsequent members\' auto-assigned values — a risk invisible at compile time and invisible until the corrupted data is later read back.',
    },
    {
      thought: 'using JsonStringEnumConverter for JSON serialization is a complete solution to the enum-reordering risk.',
      reality: 'JsonStringEnumConverter only protects the specific path of JSON serialized through a JsonSerializer configured with it — database columns storing raw integers, binary serializers, message queues, and legacy int-based logging or exports remain fully exposed to the reordering risk.',
    },
    {
      thought: 'explicit enum values are only a style preference — implicit, auto-incrementing values work identically in every practical scenario.',
      reality: 'explicit values are a correctness requirement for any enum whose integer value is ever persisted or transmitted outside the currently-running process — implicit values are only safe for purely in-memory, never-persisted state that cannot outlive a single process execution.',
    },
  ];
}
