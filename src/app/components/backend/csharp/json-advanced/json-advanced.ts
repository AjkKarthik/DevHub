import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';

@Component({
  selector: 'app-csharp-json-advanced',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './json-advanced.html',
  styleUrl: './json-advanced.scss',
})
export class CsharpJsonAdvanced {

  prerequisites: Prerequisite[] = [
    { label: 'Generics',    route: '/csharp/generics' },
    { label: 'Attributes',  route: '/csharp/attributes' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'JsonSerializer',              type: 'class',    desc: 'Static API: Serialize<T>(), Deserialize<T>(), SerializeAsync(), DeserializeAsync()', since: '.NET Core 3.0' },
    { name: 'JsonSerializerOptions',       type: 'class',    desc: 'Shared options object — configure once, reuse everywhere (not thread-safe to mutate after first use)', since: '.NET Core 3.0' },
    { name: '[JsonPropertyName]',          type: 'accessor', desc: 'Override JSON property name: [JsonPropertyName("first_name")]', since: '.NET Core 3.0' },
    { name: '[JsonIgnore]',                type: 'accessor', desc: 'Exclude a property from serialization/deserialization', since: '.NET Core 3.0' },
    { name: '[JsonConverter]',             type: 'accessor', desc: 'Attach a custom JsonConverter<T> to a property or type', since: '.NET Core 3.0' },
    { name: 'JsonConverter<T>',            type: 'class',    desc: 'Base class for custom converters — override Read() and Write()', since: '.NET Core 3.0' },
    { name: '[JsonPolymorphic]',           type: 'accessor', desc: '.NET 7+ — enables polymorphic serialization with discriminator type fields', since: '.NET 7' },
    { name: 'JsonSourceGenerationContext', type: 'class',    desc: 'Source-generated serialization — zero runtime reflection, AOT-safe, 3–5× faster', since: '.NET 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'System.Text.Json vs Newtonsoft.Json',
      points: [
        'System.Text.Json shipped in .NET Core 3.0 as the built-in, high-performance alternative to Newtonsoft.Json (Json.NET). It is UTF-8 native, allocation-efficient, and AOT-compatible. ASP.NET Core 3.0+ uses it by default.',
        'Key differences: STJ is strict by default (no comments, trailing commas) and case-sensitive property matching by default. Newtonsoft is lenient and case-insensitive. STJ does not support some Json.NET features out of the box — dynamic types, $type polymorphism, certain custom contract resolvers.',
        'Migration from Newtonsoft is often straightforward but watch for: <code>PropertyNameCaseInsensitive = true</code> (needed to match Json.NET default behaviour), missing <code>JsonConstructor</code> attribute on non-default constructors, and differences in how reference loops and null values are handled.',
        'When to stay on Newtonsoft: complex polymorphism with $type, dynamic deserialization to ExpandoObject, existing codebase with heavy JsonConverter<> customisations that rely on Json.NET internals, or third-party libraries that require it.',
      ],
    },
    {
      heading: 'JsonSerializerOptions — configure once, share everywhere',
      points: [
        'Creating a new <code>JsonSerializerOptions</code> instance per call is expensive — it builds an internal reflection cache each time. Create one static/singleton instance and reuse it.',
        'Key options: <code>PropertyNamingPolicy = JsonNamingPolicy.CamelCase</code> (auto camelCase for all properties), <code>PropertyNameCaseInsensitive = true</code> (tolerate casing differences), <code>DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull</code> (omit null properties), <code>WriteIndented = true</code> (pretty-print), <code>ReferenceHandler = ReferenceHandler.Preserve</code> (handle circular references).',
        'In ASP.NET Core, configure once in <code>builder.Services.Configure&lt;JsonOptions&gt;(o =&gt; ...)</code> or via <code>AddJsonOptions</code> on the MVC builder. All controllers and minimal API responses use that configuration automatically.',
        'Options instances are immutable once any serialization call has been made against them. Attempting to mutate shared options after first use throws <code>InvalidOperationException</code>. Always configure all options before the first use.',
      ],
    },
    {
      heading: 'Custom JsonConverter<T>',
      points: [
        'When the built-in serialization does not produce the format you need — dates, enums as strings with custom names, union types, compressed structs — write a custom <code>JsonConverter&lt;T&gt;</code>. Override <code>Read(ref Utf8JsonReader, Type, JsonSerializerOptions)</code> and <code>Write(Utf8JsonWriter, T, JsonSerializerOptions)</code>.',
        'Register converters globally via <code>options.Converters.Add(new MyConverter())</code>, or per-property via <code>[JsonConverter(typeof(MyConverter))]</code>. Property-level converters take precedence over global ones.',
        'The <code>Utf8JsonReader</code> and <code>Utf8JsonWriter</code> APIs are the low-level, allocation-free primitives used inside converters. They operate on <code>ReadOnlySpan&lt;byte&gt;</code> and <code>Memory&lt;byte&gt;</code> — no intermediate strings for property names or string values.',
        'Enum converters are a common need: by default STJ serialises enums as integers. Use <code>options.Converters.Add(new JsonStringEnumConverter())</code> to serialise enums as their string names, or write a custom converter for custom name mappings.',
      ],
    },
    {
      heading: 'Polymorphic serialization — .NET 7+',
      points: [
        '.NET 7 introduced first-class polymorphic serialization via <code>[JsonPolymorphic]</code> and <code>[JsonDerivedType]</code> attributes. Decorate the base class with these to opt in: the serialiser automatically writes a <code>$type</code> discriminator and deserialises to the correct derived type.',
        'Before .NET 7, polymorphism required custom converters or Newtonsoft. The new attributes work with the source generator, making polymorphic serialisation AOT-safe for the first time.',
        'Use <code>[JsonDerivedType(typeof(Circle), typeDiscriminator: "circle")]</code> on the base class for each derived type. The discriminator value is written as <code>"$type": "circle"</code> in JSON. Customize the discriminator property name via <code>[JsonPolymorphic(TypeDiscriminatorPropertyName = "@kind")]</code>.',
        'Limitation: the derived types must be known at compile time (listed as attributes). For fully open-ended type hierarchies or third-party types, a custom converter is still needed.',
      ],
    },
    {
      heading: 'Source generation — AOT and performance',
      points: [
        'Reflection-based serialisation cannot be used in Native AOT builds — the trimmer removes the metadata reflection needs. Source generation is the solution: a Roslyn source generator analyses your types at compile time and emits optimised serialisation code with no runtime reflection.',
        'Define a partial class that inherits from <code>JsonSerializerContext</code> and annotates each type you want to serialise with <code>[JsonSerializable(typeof(MyClass))]</code>. The source generator emits a full <code>TypeInfo&lt;T&gt;</code> for each type.',
        'Use the generated context: <code>JsonSerializer.Serialize(obj, MyContext.Default.MyClass)</code>. The context also satisfies the <code>JsonTypeInfo&lt;T&gt;</code> parameter accepted by ASP.NET Core minimal APIs — enabling AOT-safe response serialisation.',
        'Even outside of AOT, source generation is 3–5× faster than reflection-based serialisation and has significantly lower allocation overhead. It is worth enabling in any performance-sensitive serialisation path.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Options & attributes',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;

// Shared, reused options — configure ONCE
var options = new JsonSerializerOptions
{
    PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
    PropertyNameCaseInsensitive = true,
    DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
    WriteIndented               = true,
    Converters                  = { new JsonStringEnumConverter() },
};

public class UserProfile
{
    [JsonPropertyName("user_id")]        // custom name in JSON
    public int Id { get; set; }

    public string FirstName { get; set; } = "";  // → "firstName" (camelCase policy)

    [JsonIgnore]                          // never serialized
    public string PasswordHash { get; set; } = "";

    [JsonPropertyName("role")]
    public UserRole Role { get; set; }   // → "Admin" as string (JsonStringEnumConverter)

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? Score { get; set; }      // omitted when null
}

public enum UserRole { Admin, Member, Guest }

// Serialize
string json = JsonSerializer.Serialize(
    new UserProfile { Id = 1, FirstName = "Alice", Role = UserRole.Admin },
    options);
// {"user_id":1,"firstName":"Alice","role":"Admin"}

// Deserialize — case-insensitive, tolerates "User_Id" in JSON
var user = JsonSerializer.Deserialize<UserProfile>(json, options)!;`,
    },
    {
      label: 'Custom converter',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;

// Custom converter: DateTime serialized as Unix timestamp (long)
public class UnixTimestampConverter : JsonConverter<DateTime>
{
    private static readonly DateTime Epoch =
        new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public override DateTime Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        long timestamp = reader.GetInt64();
        return Epoch.AddSeconds(timestamp);
    }

    public override void Write(
        Utf8JsonWriter writer,
        DateTime value,
        JsonSerializerOptions options)
    {
        long timestamp = (long)(value.ToUniversalTime() - Epoch).TotalSeconds;
        writer.WriteNumberValue(timestamp);
    }
}

public class Event
{
    public string Name { get; set; } = "";

    [JsonConverter(typeof(UnixTimestampConverter))]  // per-property
    public DateTime StartedAt { get; set; }
}

// Or register globally:
var opts = new JsonSerializerOptions();
opts.Converters.Add(new UnixTimestampConverter());

var e = new Event { Name = "Launch", StartedAt = new DateTime(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc) };
string json = JsonSerializer.Serialize(e, opts);
// {"Name":"Launch","StartedAt":1717243200}`,
    },
    {
      label: 'Polymorphic serialization (.NET 7+)',
      language: 'csharp',
      code: `using System.Text.Json.Serialization;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "$type")]
[JsonDerivedType(typeof(Circle),    typeDiscriminator: "circle")]
[JsonDerivedType(typeof(Rectangle), typeDiscriminator: "rect")]
[JsonDerivedType(typeof(Triangle),  typeDiscriminator: "triangle")]
public abstract class Shape
{
    public string Color { get; set; } = "black";
    public abstract double Area();
}

public class Circle : Shape
{
    public double Radius { get; set; }
    public override double Area() => Math.PI * Radius * Radius;
}

public class Rectangle : Shape
{
    public double Width  { get; set; }
    public double Height { get; set; }
    public override double Area() => Width * Height;
}

public class Triangle : Shape
{
    public double Base   { get; set; }
    public double Height { get; set; }
    public override double Area() => 0.5 * Base * Height;
}

// Serialize a list of mixed shapes
var shapes = new List<Shape>
{
    new Circle    { Radius = 5, Color = "red" },
    new Rectangle { Width = 4, Height = 6, Color = "blue" },
};

string json = JsonSerializer.Serialize(shapes);
// [{"$type":"circle","Radius":5,"Color":"red"},{"$type":"rect","Width":4,"Height":6,"Color":"blue"}]

// Deserialize back — returns correct derived types automatically
var restored = JsonSerializer.Deserialize<List<Shape>>(json)!;
foreach (var shape in restored)
    Console.WriteLine(\$"{shape.GetType().Name}: {shape.Area():F2}");`,
    },
    {
      label: 'Source generation',
      language: 'csharp',
      code: `using System.Text.Json.Serialization;

// 1. Define your models
public class Product
{
    public int    Id       { get; set; }
    public string Name     { get; set; } = "";
    public decimal Price   { get; set; }
    public bool   InStock  { get; set; }
}

public class PagedResult<T>
{
    public IList<T> Items     { get; set; } = [];
    public int      TotalCount { get; set; }
    public int      Page       { get; set; }
}

// 2. Define the source generation context
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    WriteIndented = false)]
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(List<Product>))]
[JsonSerializable(typeof(PagedResult<Product>))]
public partial class AppJsonContext : JsonSerializerContext { }

// 3. Use the generated context — zero runtime reflection
var product = new Product { Id = 1, Name = "Widget", Price = 9.99m, InStock = true };

// Serialize
string json = JsonSerializer.Serialize(product, AppJsonContext.Default.Product);

// Deserialize
var restored = JsonSerializer.Deserialize(json, AppJsonContext.Default.Product);

// In ASP.NET Core minimal API — AOT safe:
// app.MapGet("/products/{id}", (int id) => new Product { Id = id, Name = "Widget" })
//    .Produces<Product>()
//    .WithMetadata(new JsonSerializableAttribute(typeof(Product)));

// Register context with ASP.NET Core
// builder.Services.ConfigureHttpJsonOptions(opts =>
//     opts.SerializerOptions.TypeInfoResolverChain.Add(AppJsonContext.Default));`,
    },
    {
      label: 'Utf8JsonReader & streaming',
      language: 'csharp',
      code: `using System.Text.Json;

// Stream large JSON without loading it all into memory
static async IAsyncEnumerable<Product> ReadProductsStreamAsync(Stream stream)
{
    // DeserializeAsyncEnumerable — reads one element at a time
    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

    await foreach (var product in JsonSerializer.DeserializeAsyncEnumerable<Product>(
        stream, options))
    {
        if (product is not null)
            yield return product;
    }
}

// Low-level Utf8JsonReader — process JSON without allocating intermediate objects
static void ExtractFieldsFromJson(ReadOnlySpan<byte> utf8Json)
{
    var reader = new Utf8JsonReader(utf8Json, isFinalBlock: true, state: default);

    while (reader.Read())
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.PropertyName:
                string propName = reader.GetString()!;
                reader.Read();  // advance to value

                switch (propName)
                {
                    case "id":    Console.WriteLine(\$"ID: {reader.GetInt32()}");    break;
                    case "name":  Console.WriteLine(\$"Name: {reader.GetString()}"); break;
                    case "price": Console.WriteLine(\$"Price: {reader.GetDecimal()}"); break;
                }
                break;
        }
    }
}

// JsonDocument — DOM-style access for unknown-schema JSON
using var doc = JsonDocument.Parse("""{"status":"ok","count":42,"tags":["a","b"]}""");
JsonElement root = doc.RootElement;
Console.WriteLine(root.GetProperty("status").GetString());   // ok
Console.WriteLine(root.GetProperty("count").GetInt32());     // 42
foreach (var tag in root.GetProperty("tags").EnumerateArray())
    Console.WriteLine(tag.GetString());  // a, b`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Newtonsoft.Json vs System.Text.Json',
      before: `// Newtonsoft.Json (Json.NET)
using Newtonsoft.Json;

var settings = new JsonSerializerSettings
{
    NullValueHandling = NullValueHandling.Ignore,
    ContractResolver  = new CamelCasePropertyNamesContractResolver(),
    Converters        = { new StringEnumConverter() },
};

string json    = JsonConvert.SerializeObject(obj, settings);
MyType result  = JsonConvert.DeserializeObject<MyType>(json, settings)!;`,
      after: `// System.Text.Json — built-in, AOT-compatible, faster
using System.Text.Json;
using System.Text.Json.Serialization;

// Create ONCE, reuse everywhere (reflection cache built once)
private static readonly JsonSerializerOptions _opts = new()
{
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNamingPolicy   = JsonNamingPolicy.CamelCase,
    Converters             = { new JsonStringEnumConverter() },
};

string json   = JsonSerializer.Serialize(obj, _opts);
MyType result = JsonSerializer.Deserialize<MyType>(json, _opts)!;`,
      note: 'System.Text.Json is 3–5× faster than Newtonsoft, with lower allocations. Use source generation for AOT scenarios.',
      language: 'csharp',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a new JsonSerializerOptions per call',
      wrong: `// SLOW: builds reflection cache on every call — significant overhead in hot paths
string json = JsonSerializer.Serialize(obj, new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,
});`,
      right: `// FAST: create once (static or DI singleton), reuse everywhere
private static readonly JsonSerializerOptions _opts = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,
};

string json = JsonSerializer.Serialize(obj, _opts);`,
      explanation: 'JsonSerializerOptions builds an internal reflection/metadata cache the first time it is used. Creating a new instance per call rebuilds this cache every time, which is 10–100× slower than reusing a shared instance. The static/singleton pattern is the documented best practice.',
    },
    {
      title: 'Mutating shared JsonSerializerOptions after first use',
      wrong: `private static readonly JsonSerializerOptions _opts = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
};

// Later, somewhere else:
_opts.WriteIndented = true;   // THROWS: InvalidOperationException
// Options are frozen after the first serialization call`,
      right: `// Configure all options BEFORE first use
private static readonly JsonSerializerOptions _opts = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,   // set everything upfront
};

// For per-call variations: create a new options instance for that specific use
// and do not share it`,
      explanation: 'After the first call to Serialize or Deserialize with a given options instance, STJ marks it as "read-only" and throws if you try to change it. Configure all options before the instance is ever used in serialisation.',
    },
    {
      title: 'Expecting case-insensitive property matching by default',
      wrong: `// STJ is case-SENSITIVE by default — this returns null for "firstName" vs "FirstName"
string json = """{"firstName":"Alice","lastName":"Smith"}""";
var user = JsonSerializer.Deserialize<User>(json);
// user.FirstName = null!  (property is "FirstName" in C#, "firstName" in JSON)`,
      right: `// Option 1: set PropertyNameCaseInsensitive = true
var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
var user = JsonSerializer.Deserialize<User>(json, opts);

// Option 2: use [JsonPropertyName] on the C# property
public class User
{
    [JsonPropertyName("firstName")] public string FirstName { get; set; } = "";
}

// Option 3: use CamelCase naming policy on both serialize and deserialize
var opts2 = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };`,
      explanation: 'Unlike Newtonsoft.Json, System.Text.Json is case-sensitive by default. Set PropertyNameCaseInsensitive = true on your shared options, or use CamelCase naming policy, to match the Newtonsoft default behaviour.',
    },
    {
      title: 'Using JsonDocument without disposing it',
      wrong: `static string GetStatus(string json)
{
    // JsonDocument rents memory from ArrayPool — leaks if not disposed
    var doc = JsonDocument.Parse(json);
    return doc.RootElement.GetProperty("status").GetString() ?? "";
}`,
      right: `static string GetStatus(string json)
{
    using var doc = JsonDocument.Parse(json);
    return doc.RootElement.GetProperty("status").GetString() ?? "";
}

// If you need to return a JsonElement that outlives the using block,
// clone it first:
static JsonElement GetStatusElement(string json)
{
    using var doc = JsonDocument.Parse(json);
    return doc.RootElement.GetProperty("status").Clone();  // copies to independent memory
}`,
      explanation: 'JsonDocument rents memory from ArrayPool<byte>.Shared for performance. If you do not dispose it, that memory is never returned to the pool. Always use "using var" or call .Dispose() explicitly. If a JsonElement needs to outlive the document, call .Clone() to copy its data.',
    },
  ];

  challenge: Challenge = {
    title: 'Polymorphic event log serializer',
    language: 'csharp',
    description: `Build a polymorphic JSON event log system:
1. An abstract EventBase class with EventId (Guid), OccurredAt (DateTime), and EventType (string discriminator)
2. Three derived types: UserRegistered (Email, Username), OrderPlaced (OrderId, TotalAmount), PaymentFailed (OrderId, Reason, AttemptCount)
3. Use [JsonPolymorphic] and [JsonDerivedType] for automatic serialization
4. Serialize a mixed list of events to JSON and deserialize back — verify the correct concrete types are restored
5. Custom converter for DateTime — serialize as ISO-8601 string with UTC offset`,
    hints: [
      '[JsonPolymorphic(TypeDiscriminatorPropertyName = "eventType")] on base class',
      '[JsonDerivedType(typeof(UserRegistered), "user.registered")] etc.',
      'JsonConverter<DateTime> — writer.WriteStringValue(value.ToString("o")); reader.GetString() then DateTime.Parse()',
      'List<EventBase> with mixed types — STJ resolves to correct derived type on deserialize',
      'Verify with: restored.OfType<OrderPlaced>().First().TotalAmount',
    ],
    starterCode: `using System.Text.Json;
using System.Text.Json.Serialization;

// TODO: define EventBase (abstract) with JsonPolymorphic + JsonDerivedType attributes
// TODO: define UserRegistered, OrderPlaced, PaymentFailed derived classes
// TODO: write IsoDateTimeConverter : JsonConverter<DateTime>

// Test:
var events = new List<EventBase>
{
    new UserRegistered { Email = "alice@example.com", Username = "alice" },
    new OrderPlaced    { OrderId = "ORD-001", TotalAmount = 149.99m },
    new PaymentFailed  { OrderId = "ORD-001", Reason = "Insufficient funds", AttemptCount = 2 },
};

string json  = JsonSerializer.Serialize(events);
Console.WriteLine(json);

var restored = JsonSerializer.Deserialize<List<EventBase>>(json)!;
foreach (var e in restored)
    Console.WriteLine(\$"{e.GetType().Name}: {e.OccurredAt:O}");`,
    solution: `using System.Text.Json;
using System.Text.Json.Serialization;

public class IsoDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
        => DateTime.Parse(r.GetString()!);

    public override void Write(Utf8JsonWriter w, DateTime v, JsonSerializerOptions o)
        => w.WriteStringValue(v.ToUniversalTime().ToString("o"));
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "eventType")]
[JsonDerivedType(typeof(UserRegistered), "user.registered")]
[JsonDerivedType(typeof(OrderPlaced),    "order.placed")]
[JsonDerivedType(typeof(PaymentFailed),  "payment.failed")]
public abstract class EventBase
{
    public Guid   EventId    { get; init; } = Guid.NewGuid();

    [JsonConverter(typeof(IsoDateTimeConverter))]
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}

public class UserRegistered : EventBase
{
    public string Email    { get; set; } = "";
    public string Username { get; set; } = "";
}

public class OrderPlaced : EventBase
{
    public string  OrderId     { get; set; } = "";
    public decimal TotalAmount { get; set; }
}

public class PaymentFailed : EventBase
{
    public string OrderId      { get; set; } = "";
    public string Reason       { get; set; } = "";
    public int    AttemptCount { get; set; }
}

var opts = new JsonSerializerOptions { WriteIndented = true };
var events = new List<EventBase>
{
    new UserRegistered { Email = "alice@example.com", Username = "alice" },
    new OrderPlaced    { OrderId = "ORD-001", TotalAmount = 149.99m },
    new PaymentFailed  { OrderId = "ORD-001", Reason = "Insufficient funds", AttemptCount = 2 },
};

string json  = JsonSerializer.Serialize(events, opts);
Console.WriteLine(json);

var restored = JsonSerializer.Deserialize<List<EventBase>>(json, opts)!;
foreach (var e in restored)
    Console.WriteLine(\$"{e.GetType().Name}: {e.OccurredAt:O}");

// Verify concrete types
Console.WriteLine(restored[1] is OrderPlaced op ? \$"Amount: {op.TotalAmount}" : "wrong type");`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct way to share a JsonSerializerOptions instance for best performance?',
      options: [
        'Create a new instance on every call to JsonSerializer.Serialize — this ensures fresh state',
        'Create a static readonly instance configured before first use — the internal cache is built once and reused',
        'Use JsonSerializerOptions.Default — it is the recommended shared instance for all scenarios',
        'Create one instance per thread using ThreadLocal<JsonSerializerOptions>',
      ],
      answer: 1,
      explanation: 'JsonSerializerOptions builds an expensive internal reflection cache on first use. Creating a new instance per call repeats this work every time. A static readonly instance configured upfront builds the cache once and amortises the cost across all calls. JsonSerializerOptions.Default exists but has minimal configuration.',
    },
    {
      q: 'System.Text.Json is case-sensitive for property matching by default. Which option enables case-insensitive matching?',
      options: [
        'options.NamingPolicy = JsonNamingPolicy.CaseInsensitive',
        'options.PropertyNameCaseInsensitive = true',
        'options.AllowCaseVariants = true',
        'options.DeserializationPolicy = DeserializationPolicy.Flexible',
      ],
      answer: 1,
      explanation: 'PropertyNameCaseInsensitive = true enables case-insensitive property name matching during deserialization. Without this, "firstName" in JSON will not match "FirstName" in C#. This is the most common source of null properties when migrating from Newtonsoft.Json, which is case-insensitive by default.',
    },
    {
      q: 'What is the primary benefit of using source generation with JsonSerializerContext?',
      options: [
        'It automatically discovers and registers all types in the assembly',
        'It enables runtime polymorphism without any attributes',
        'It generates optimised serialization code at compile time — no runtime reflection, AOT-safe, faster',
        'It provides better error messages when JSON is malformed',
      ],
      answer: 2,
      explanation: 'Source generation analyses your types at compile time and emits type-specific serialisation code. This eliminates runtime reflection (which is trimmed in Native AOT) and produces 3–5× faster, lower-allocation serialisation compared to the reflection-based default.',
    },
    {
      q: 'When using JsonDocument, what must you do to use a JsonElement after the document is disposed?',
      options: [
        'Copy the element to a string and re-parse later',
        'Call JsonElement.Clone() to get an independent copy that does not reference the document\'s memory',
        'Keep a reference to the JsonDocument — the element remains valid as long as you hold the reference',
        'Nothing — JsonElement values are value types that do not reference the document memory',
      ],
      answer: 1,
      explanation: 'JsonDocument rents memory from ArrayPool. When disposed, that memory is returned to the pool and may be reused. A JsonElement from a disposed document references invalid memory. Calling .Clone() creates an independent copy of the element\'s data that outlives the document.',
    },
    {
      q: 'How do you enable polymorphic deserialization in System.Text.Json without a custom converter?',
      options: [
        'Use [JsonDerived] on derived types and pass TypeNameHandling.All in options',
        'Use [JsonPolymorphic] on the base class and [JsonDerivedType] for each derived type (.NET 7+)',
        'Register derived types in JsonSerializerOptions.PolymorphicTypes collection',
        'Polymorphic deserialization requires a custom JsonConverter<T> in all .NET versions',
      ],
      answer: 1,
      explanation: '.NET 7 added [JsonPolymorphic] and [JsonDerivedType] attributes. Decorate the base class with these to opt in to automatic discriminator writing and type resolution. Before .NET 7, a custom converter was required. The new approach also works with source generation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I handle circular references in System.Text.Json?',
      a: 'Set options.ReferenceHandler = ReferenceHandler.Preserve — this adds $id and $ref properties to the JSON to track references and prevent infinite loops. For read-only scenarios where you want to ignore cycles rather than preserve them, use ReferenceHandler.IgnoreCycles (.NET 6+). Newtonsoft\'s default ReferenceLoopHandling.Ignore behaviour is equivalent to IgnoreCycles.',
    },
    {
      q: 'How do I deserialize JSON to a Dictionary<string, object> or dynamic type?',
      a: 'STJ does not support dynamic or ExpandoObject natively. Use JsonDocument and JsonElement for DOM-style access to unknown-schema JSON. For Dictionary<string, JsonElement>, use JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json). If you need the full dynamic convenience of Newtonsoft, staying on Json.NET for that scenario is a valid choice.',
    },
    {
      q: 'Can System.Text.Json handle records and init-only properties?',
      a: 'Yes — STJ fully supports C# records (positional and class-based) and init-only setters. For positional records, it uses the primary constructor. For deserialization into types with no default constructor, mark the constructor with [JsonConstructor]. Init-only properties (public string Name { get; init; }) work without any attribute in .NET 5+.',
    },
    {
      q: 'How do I serialize enums as strings instead of numbers?',
      a: 'Add new JsonStringEnumConverter() to options.Converters. This uses the enum member name by default. For custom name mappings (e.g., snake_case), pass a JsonNamingPolicy to the constructor: new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower). In .NET 8+, you can also use [JsonStringEnumMemberName("custom_name")] on individual enum values.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'System.Text.Json is the built-in, high-performance, AOT-safe JSON library. Reuse a static <code>JsonSerializerOptions</code> instance, write custom <code>JsonConverter&lt;T&gt;</code> for non-standard formats, use <code>[JsonPolymorphic]</code> for derived types, and source generation for zero-reflection serialization.',
    mustKnow: [
      'Create JsonSerializerOptions ONCE (static/singleton) — rebuilding per call is 10–100× slower',
      'STJ is case-sensitive by default: set <code>PropertyNameCaseInsensitive = true</code> to match Newtonsoft',
      '<code>JsonStringEnumConverter</code> → enums as strings; <code>JsonConverter&lt;T&gt;</code> for custom formats',
      '<code>[JsonPolymorphic] + [JsonDerivedType]</code> — discriminator-based polymorphism (.NET 7+)',
      'Source generation (<code>JsonSerializerContext</code>) — compile-time code, zero reflection, AOT-safe, 3–5× faster',
      '<code>JsonDocument</code> — always use <code>using</code>; call <code>.Clone()</code> if element outlives document',
    ],
    interviewFocus: [
      '<strong>STJ vs Newtonsoft?</strong> — STJ: faster, AOT-safe, strict defaults; Newtonsoft: lenient, richer feature set',
      '<strong>JsonSerializerOptions reuse?</strong> — static shared instance; mutating after first use throws',
      '<strong>Polymorphism?</strong> — [JsonPolymorphic] + [JsonDerivedType] (.NET 7+); custom converter before that',
      '<strong>AOT?</strong> — source generation with JsonSerializerContext; no runtime reflection',
    ],
  };
}
