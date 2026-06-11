import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-reflection',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './reflection.html',
  styleUrl: './reflection.scss',
})
export class CsharpReflection {

  quickRef: QuickRefItem[] = [
    { name: 'typeof(T)',                  type: 'operator',  desc: 'Compile-time operator that returns the Type object for a known type name', since: 'C# 1' },
    { name: 'obj.GetType()',              type: 'method',    desc: 'Runtime method that returns the actual (most-derived) Type of an instance', since: 'C# 1' },
    { name: 'Type.GetProperties()',       type: 'method',    desc: 'Returns PropertyInfo[] describing the public properties of a type', since: 'C# 1' },
    { name: 'PropertyInfo.GetValue()',    type: 'method',    desc: 'Reads a property value from an instance via reflection: prop.GetValue(obj)', since: 'C# 1' },
    { name: 'Activator.CreateInstance()', type: 'method',    desc: 'Creates an instance of a Type at runtime without using the new keyword', since: 'C# 1' },
    { name: '[AttributeUsage]',           type: 'decorator', desc: 'Declares which targets (class, property, method…) a custom attribute may decorate', since: 'C# 1' },
    { name: 'GetCustomAttribute<T>()',    type: 'method',    desc: 'Reads a single attribute instance of type T from a member, or null if absent', since: '.NET 4.5' },
    { name: 'BindingFlags',               type: 'type',      desc: 'Flags enum controlling which members reflection returns: NonPublic, Instance, Static…', since: 'C# 1' },
    { name: 'MemberInfo caching',         type: 'syntax',    desc: 'Store PropertyInfo/MethodInfo in a static dictionary — member lookup is the slow part', since: 'C# 1' },
    { name: 'Source generators',          type: 'syntax',    desc: 'Modern compile-time alternative to runtime reflection (System.Text.Json, Regex…)', since: '.NET 5+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What reflection is — typeof vs GetType()',
      points: [
        'Reflection lets code inspect and manipulate <em>metadata</em> at runtime: types, properties, methods, constructors, and attributes. Everything starts from a <code>System.Type</code> object.',
        '<code>typeof(Customer)</code> is resolved at <strong>compile time</strong> — you must know the type name. <code>obj.GetType()</code> is resolved at <strong>runtime</strong> and returns the actual most-derived type of the instance, even if the variable is typed as a base class or interface.',
        'For a variable <code>Animal a = new Dog();</code>, <code>typeof(Animal)</code> is <code>Animal</code> but <code>a.GetType()</code> is <code>Dog</code>. This distinction matters for polymorphic scenarios like serializers.',
        'You can also load a type by name with <code>Type.GetType("MyApp.Customer, MyApp")</code> — useful for plugin systems where the type name comes from configuration.',
      ],
    },
    {
      heading: 'Exploring type members',
      points: [
        '<code>Type</code> exposes the full shape of a type: <code>GetProperties()</code>, <code>GetMethods()</code>, <code>GetFields()</code>, <code>GetConstructors()</code>, <code>GetInterfaces()</code> — each returning <code>*Info</code> metadata objects.',
        'By default only <strong>public instance and static</strong> members are returned. Pass <code>BindingFlags</code> to widen or narrow the search: <code>BindingFlags.NonPublic | BindingFlags.Instance</code> reveals private members.',
        '<code>PropertyInfo</code> tells you the property name, type, and whether it can read/write (<code>CanRead</code>/<code>CanWrite</code>). <code>MethodInfo</code> exposes parameters and return type and can be invoked with <code>Invoke(obj, args)</code>.',
        'Reading a value is two steps: get the <code>PropertyInfo</code> from the <code>Type</code>, then call <code>prop.GetValue(instance)</code>. Writing uses <code>prop.SetValue(instance, value)</code>.',
      ],
    },
    {
      heading: 'Creating instances at runtime',
      points: [
        '<code>Activator.CreateInstance(type)</code> calls the parameterless constructor of a type known only at runtime. Overloads accept constructor arguments: <code>Activator.CreateInstance(type, arg1, arg2)</code>.',
        'The generic form <code>Activator.CreateInstance&lt;T&gt;()</code> is what the <code>new()</code> generic constraint uses under the hood.',
        'For repeated creation, <code>Activator</code> is slow — DI containers and serializers compile a creation delegate once (via expression trees or <code>RuntimeHelpers.GetUninitializedObject</code>) and reuse it.',
        'A classic use case: a plugin loader reads a class name from config, finds the <code>Type</code> in a loaded assembly, verifies it implements <code>IPlugin</code>, and instantiates it.',
      ],
    },
    {
      heading: 'Custom attributes — declaring and reading',
      points: [
        'An attribute is a class deriving from <code>System.Attribute</code>, by convention named with an <code>Attribute</code> suffix (which the compiler lets you omit at the use site: <code>[Required]</code> for <code>RequiredAttribute</code>).',
        '<code>[AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]</code> restricts where the attribute may appear and whether it can be applied more than once.',
        'Attributes are <strong>passive metadata</strong> — they do nothing by themselves. Some other code must read them via reflection: <code>prop.GetCustomAttribute&lt;RequiredAttribute&gt;()</code> or <code>GetCustomAttributes()</code> for multiples.',
        'Attribute constructor arguments and named properties must be compile-time constants (numbers, strings, enums, types) — you cannot pass arbitrary objects or lambdas.',
      ],
    },
    {
      heading: 'Real-world uses: serializers, validators, DI containers',
      points: [
        'JSON serializers walk <code>GetProperties()</code> to discover what to write, and honor attributes like <code>[JsonPropertyName]</code> and <code>[JsonIgnore]</code> to customize output.',
        'Validation frameworks (DataAnnotations, FluentValidation\'s attribute mode) read attributes like <code>[Required]</code> and <code>[Range]</code> from properties and apply the rules to values fetched with <code>GetValue</code>.',
        'DI containers reflect over constructors (<code>GetConstructors()</code>) to find the dependencies of a service, resolve each parameter recursively, then instantiate the object — this is "constructor injection" mechanically.',
        'Test frameworks (xUnit, NUnit) find test methods by scanning assemblies for methods decorated with <code>[Fact]</code> / <code>[Test]</code> attributes and invoke them via <code>MethodInfo.Invoke</code>.',
      ],
    },
    {
      heading: 'Performance, caching, and the move to source generators',
      points: [
        'Reflection is 10–100× slower than direct calls: member lookup does string-based searches, and <code>Invoke</code>/<code>GetValue</code> box arguments and bypass JIT inlining.',
        'The biggest win is <strong>caching</strong>: look up <code>PropertyInfo[]</code>/<code>MethodInfo</code> once per type and store them in a <code>static ConcurrentDictionary&lt;Type, …&gt;</code>. The lookup is the expensive part; reusing the cached <code>MemberInfo</code> is much cheaper.',
        'High-performance libraries go further: compile the cached metadata into delegates with expression trees (<code>Expression.Lambda</code>) so subsequent calls run at near-direct-call speed.',
        'The modern trend is to avoid runtime reflection entirely with <strong>source generators</strong>, which generate the serializer/validator code at compile time (e.g. <code>System.Text.Json</code> source-gen, <code>[GeneratedRegex]</code>). This is faster, trimming/AOT-friendly, and discoverable in the debugger — reflection-heavy code is the main blocker for Native AOT.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Type Basics',
      language: 'csharp',
      code: `// ── typeof vs GetType() ───────────────────────────────────────────────
public class Animal { public string Name { get; set; } = ""; }
public class Dog : Animal { public string Breed { get; set; } = ""; }

Animal a = new Dog { Name = "Rex", Breed = "Beagle" };

Console.WriteLine(typeof(Animal));   // Animal      — compile-time, declared type
Console.WriteLine(a.GetType());      // Dog         — runtime, actual type
Console.WriteLine(a.GetType() == typeof(Dog));     // True
Console.WriteLine(a is Animal);                     // True (is checks hierarchy)

// Load a type by name (plugin/config scenarios)
Type? byName = Type.GetType("System.Text.StringBuilder, System.Runtime");

// ── Exploring members ─────────────────────────────────────────────────
Type t = typeof(Dog);
Console.WriteLine(t.FullName);       // Dog
Console.WriteLine(t.BaseType);       // Animal

foreach (PropertyInfo p in t.GetProperties())
    Console.WriteLine($"{p.PropertyType.Name} {p.Name}  read={p.CanRead} write={p.CanWrite}");
// String Name   read=True write=True
// String Breed  read=True write=True

foreach (MethodInfo m in t.GetMethods().Where(m => m.DeclaringType == t))
    Console.WriteLine(m.Name);

// ── BindingFlags: include private members ─────────────────────────────
var privateFields = typeof(Dog).GetFields(
    BindingFlags.NonPublic | BindingFlags.Instance);
foreach (var f in privateFields)
    Console.WriteLine($"private field: {f.Name}");  // backing fields show up here`,
    },
    {
      label: 'Values & Instances',
      language: 'csharp',
      code: `// ── Reading and writing values via PropertyInfo ──────────────────────
public class Customer
{
    public int    Id    { get; set; }
    public string Name  { get; set; } = "";
    public string Email { get; set; } = "";
}

var customer = new Customer { Id = 7, Name = "Alice", Email = "a@example.com" };
Type type = customer.GetType();

// Read one property
PropertyInfo nameProp = type.GetProperty("Name")!;
object? value = nameProp.GetValue(customer);
Console.WriteLine(value);                     // Alice

// Write a property
nameProp.SetValue(customer, "Alicia");
Console.WriteLine(customer.Name);             // Alicia

// Generic "dump any object" helper — the heart of every serializer
static void Dump(object obj)
{
    foreach (var p in obj.GetType().GetProperties())
        Console.WriteLine($"{p.Name} = {p.GetValue(obj)}");
}
Dump(customer);
// Id = 7
// Name = Alicia
// Email = a@example.com

// ── Activator.CreateInstance ─────────────────────────────────────────
// Parameterless constructor
var c1 = (Customer)Activator.CreateInstance(typeof(Customer))!;

// With constructor arguments
var sb = (StringBuilder)Activator.CreateInstance(typeof(StringBuilder), "seed")!;

// Generic form — what the new() constraint uses internally
static T Create<T>() where T : new() => Activator.CreateInstance<T>();

// Plugin-style: type name from config, instance at runtime
string typeName = "Customer";   // imagine this came from appsettings.json
Type? plugin = Type.GetType(typeName);
if (plugin is not null)
{
    object instance = Activator.CreateInstance(plugin)!;
    Console.WriteLine($"Created {instance.GetType().Name}");
}`,
    },
    {
      label: 'Custom Attributes',
      language: 'csharp',
      code: `// ── Defining a custom attribute ───────────────────────────────────────
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
public class AuditableAttribute : Attribute
{
    public string Label { get; }
    public bool Sensitive { get; set; }          // optional named property

    public AuditableAttribute(string label) => Label = label;
}

[AttributeUsage(AttributeTargets.Class)]
public class TableAttribute : Attribute
{
    public string Name { get; }
    public TableAttribute(string name) => Name = name;
}

// ── Applying attributes ───────────────────────────────────────────────
[Table("customers")]
public class Customer
{
    [Auditable("Customer id")]
    public int Id { get; set; }

    [Auditable("Full name")]
    public string Name { get; set; } = "";

    [Auditable("Email address", Sensitive = true)]
    public string Email { get; set; } = "";

    public string InternalNotes { get; set; } = "";   // not audited
}

// ── Reading attributes via reflection ────────────────────────────────
Type t = typeof(Customer);

// Class-level attribute
var table = t.GetCustomAttribute<TableAttribute>();
Console.WriteLine(table?.Name);                       // customers

// Property-level attributes
foreach (PropertyInfo p in t.GetProperties())
{
    var audit = p.GetCustomAttribute<AuditableAttribute>();
    if (audit is null) continue;                      // skip undecorated props

    string flag = audit.Sensitive ? " [SENSITIVE]" : "";
    Console.WriteLine($"{audit.Label} -> {p.Name}{flag}");
}
// Customer id -> Id
// Full name -> Name
// Email address -> Email [SENSITIVE]

// Check existence without instantiating the attribute
bool isAudited = t.GetProperty("Name")!
    .IsDefined(typeof(AuditableAttribute), inherit: false);   // True`,
    },
    {
      label: 'Mini Validator',
      language: 'csharp',
      code: `// ── A DataAnnotations-style validator built from scratch ─────────────
[AttributeUsage(AttributeTargets.Property)]
public class RequiredAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Property)]
public class MaxLengthAttribute : Attribute
{
    public int Length { get; }
    public MaxLengthAttribute(int length) => Length = length;
}

public class RegisterRequest
{
    [Required]
    public string Username { get; set; } = "";

    [Required, MaxLength(100)]
    public string Email { get; set; } = "";

    [MaxLength(20)]
    public string? Nickname { get; set; }
}

public static class MiniValidator
{
    public static List<string> Validate(object obj)
    {
        var errors = new List<string>();

        foreach (PropertyInfo p in obj.GetType().GetProperties())
        {
            object? value = p.GetValue(obj);

            if (p.GetCustomAttribute<RequiredAttribute>() is not null
                && string.IsNullOrWhiteSpace(value as string))
                errors.Add($"{p.Name} is required.");

            var maxLen = p.GetCustomAttribute<MaxLengthAttribute>();
            if (maxLen is not null && value is string s && s.Length > maxLen.Length)
                errors.Add($"{p.Name} must be at most {maxLen.Length} characters.");
        }
        return errors;
    }
}

var request = new RegisterRequest
{
    Username = "",
    Email    = new string('x', 150),
    Nickname = "a-very-very-long-nickname",
};

foreach (var e in MiniValidator.Validate(request))
    Console.WriteLine(e);
// Username is required.
// Email must be at most 100 characters.
// Nickname must be at most 20 characters.`,
    },
    {
      label: 'Performance & Caching',
      language: 'csharp',
      code: `// ── The slow way: re-discover members on every call ──────────────────
static void DumpSlow(object obj)
{
    // GetProperties() does a fresh metadata walk EVERY time — avoid in hot paths
    foreach (var p in obj.GetType().GetProperties())
        Console.WriteLine($"{p.Name} = {p.GetValue(obj)}");
}

// ── The standard fix: cache MemberInfo per type ───────────────────────
public static class PropertyCache
{
    private static readonly ConcurrentDictionary<Type, PropertyInfo[]> _cache = new();

    public static PropertyInfo[] For(Type type) =>
        _cache.GetOrAdd(type, t => t.GetProperties());
}

static void DumpFast(object obj)
{
    // Lookup happens once per type; later calls hit the dictionary
    foreach (var p in PropertyCache.For(obj.GetType()))
        Console.WriteLine($"{p.Name} = {p.GetValue(obj)}");
}

// ── Even faster: compile a delegate once (what serializers do) ───────
// Expression trees turn cached metadata into near-native-speed calls.
// Covered in depth on the Expression Trees page — sketch:
PropertyInfo nameProp = typeof(Customer).GetProperty("Name")!;
var param  = Expression.Parameter(typeof(Customer), "c");
var access = Expression.Property(param, nameProp);
Func<Customer, string> getName =
    Expression.Lambda<Func<Customer, string>>(access, param).Compile();

var customer = new Customer { Name = "Alice" };
Console.WriteLine(getName(customer));   // Alice — compiled, no Invoke boxing

// ── The modern direction: source generators (mention only) ───────────
// Instead of inspecting types at RUNTIME, source generators emit the
// serializer/validator code at COMPILE time:
//   - System.Text.Json:  [JsonSerializable(typeof(Customer))] context
//   - Regex:             [GeneratedRegex("pattern")]
//   - DI:                compile-time resolved containers
// Benefits: no reflection cost, trimming/Native AOT safe, debuggable code.
// Rule of thumb: reflection for tools & one-offs, source-gen for hot paths.`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'For Animal a = new Dog(), what do typeof(Animal) and a.GetType() return?',
      options: [
        'Both return Animal',
        'Both return Dog',
        'typeof(Animal) returns Animal; a.GetType() returns Dog',
        'typeof(Animal) returns Dog; a.GetType() returns Animal',
      ],
      answer: 2,
      explanation: '<code>typeof</code> is a compile-time operator on a type <em>name</em>, so it always yields exactly that type. <code>GetType()</code> is a runtime call on the <em>instance</em>, returning its actual most-derived type — here <code>Dog</code>.',
    },
    {
      q: 'Why does GetProperties() not return private properties by default?',
      options: [
        'Private members are erased at compile time and have no metadata',
        'The default BindingFlags are Public | Instance | Static — you must pass NonPublic explicitly',
        'Reflection can never access private members for security reasons',
        'Private properties are only visible through GetFields()',
      ],
      answer: 1,
      explanation: 'Reflection <em>can</em> see private members, but the parameterless <code>GetProperties()</code> defaults to public members only. Pass <code>BindingFlags.NonPublic | BindingFlags.Instance</code> (plus <code>Public</code> if you want both) to widen the search.',
    },
    {
      q: 'What does an attribute do at runtime by itself?',
      options: [
        'It automatically validates the member it decorates',
        'It runs its constructor when the decorated member is first accessed',
        'Nothing — attributes are passive metadata until some code reads them via reflection',
        'It registers the member with the runtime event system',
      ],
      answer: 2,
      explanation: 'Attributes are inert metadata baked into the assembly. They only have an effect when some consumer — a serializer, validator, test runner, framework — explicitly reads them with <code>GetCustomAttribute&lt;T&gt;()</code> and acts on what it finds.',
    },
    {
      q: 'What is the single most effective optimization for reflection-heavy code?',
      options: [
        'Calling GC.Collect() after each reflection call',
        'Caching MemberInfo (PropertyInfo/MethodInfo) per type instead of re-looking them up',
        'Using GetType() instead of typeof()',
        'Marking the assembly with [SkipLocalsInit]',
      ],
      answer: 1,
      explanation: 'Member <em>lookup</em> (string-based metadata search) is the most expensive part. Caching <code>PropertyInfo[]</code> in a static <code>ConcurrentDictionary&lt;Type, …&gt;</code> pays once per type. Compiling delegates from the cached metadata via expression trees goes further still.',
    },
    {
      q: 'Why is the .NET ecosystem moving from runtime reflection toward source generators?',
      options: [
        'Reflection was deprecated in .NET 8',
        'Source generators produce code at compile time — faster, trimming/Native AOT safe, and debuggable',
        'Source generators can access private members, which reflection cannot',
        'Reflection only works on Windows',
      ],
      answer: 1,
      explanation: 'Source generators (System.Text.Json source-gen, <code>[GeneratedRegex]</code>, etc.) emit ordinary C# at compile time, eliminating runtime metadata walks. The code is fast, visible in the debugger, and — crucially — analyzable by the trimmer and Native AOT, which runtime reflection defeats. Reflection itself remains fully supported.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use typeof and when GetType()?',
      a: 'Use <code>typeof(SomeType)</code> when the type is known at compile time — it is faster (resolved by the compiler) and refactor-safe. Use <code>obj.GetType()</code> when you only have an instance and need its <em>actual</em> runtime type, e.g. in a serializer handling polymorphic objects. Comparing them — <code>obj.GetType() == typeof(Dog)</code> — is an exact-type check, unlike <code>is</code>, which also matches base classes and interfaces.',
    },
    {
      q: 'Can reflection read and write private members?',
      a: 'Yes. Pass <code>BindingFlags.NonPublic | BindingFlags.Instance</code> to <code>GetField</code>/<code>GetProperty</code>/<code>GetMethod</code> and you can read, write, and invoke private members. This is how some test and serialization libraries reach internals. Use it sparingly: it breaks encapsulation, silently shatters when the private member is renamed, and may be blocked in trimmed/AOT deployments where unused private members are removed.',
    },
    {
      q: 'Why does the [Required] attribute in my class do nothing on its own?',
      a: 'Because attributes are pure metadata. <code>[Required]</code> only has an effect when a consumer reads it: ASP.NET Core model binding runs DataAnnotations validation during request processing, <code>Validator.TryValidateObject</code> does it on demand, and EF Core reads it for schema generation. If you decorate a class and never pass it through any of those pipelines, nothing happens — exactly like the mini validator example, something must call <code>GetCustomAttribute</code> and enforce the rule.',
    },
    {
      q: 'How do DI containers use reflection?',
      a: 'At registration or first resolution, the container reflects over a service\'s constructors (<code>GetConstructors()</code>), picks one (usually the most parameters it can satisfy), and inspects each parameter type. It resolves those types recursively from its registrations, then instantiates the service — conceptually with <code>Activator.CreateInstance(type, resolvedArgs)</code>, though real containers compile a factory delegate per type so the reflection cost is paid only once.',
    },
    {
      q: 'How slow is reflection really, and when does it matter?',
      a: 'A reflected property read via <code>GetValue</code> can be 10–100× slower than direct access, mostly from metadata lookup, argument boxing, and the inability to inline. That is irrelevant for a one-time startup scan or a developer tool, and very relevant in a serializer handling thousands of requests per second. The mitigation ladder: (1) cache <code>MemberInfo</code> per type, (2) compile delegates with expression trees, (3) move the work to compile time with source generators.',
    },
    {
      q: 'What is the difference between GetCustomAttribute<T>() and GetCustomAttributes()?',
      a: '<code>GetCustomAttribute&lt;T&gt;()</code> returns a single attribute of type <code>T</code> or <code>null</code>, and throws if more than one is present — use it when <code>AllowMultiple</code> is false. <code>GetCustomAttributes&lt;T&gt;()</code> returns all instances, for attributes declared with <code>AllowMultiple = true</code> (e.g. several <code>[Header("…")]</code> entries). Both accept an <code>inherit</code> flag controlling whether attributes on base-class members are included.',
    },
    {
      q: 'Does Activator.CreateInstance work for types without a parameterless constructor?',
      a: 'Yes, via the overload that takes constructor arguments: <code>Activator.CreateInstance(type, arg1, arg2)</code> matches a constructor by the argument types and throws <code>MissingMethodException</code> if none fits. For deserializers that must bypass constructors entirely, <code>RuntimeHelpers.GetUninitializedObject(type)</code> allocates the object without running any constructor — fields start at their zero values, so use it with care.',
    },
    {
      q: 'Will my reflection code break with trimming or Native AOT?',
      a: 'Possibly. The trimmer removes code it cannot prove is used, and reflection accesses members by string name, which the trimmer cannot see. Attributes like <code>[DynamicallyAccessedMembers]</code> let you annotate what must be preserved, but the robust fix is the ecosystem\'s current direction: replace runtime reflection with source generators that emit equivalent code at compile time, which the trimmer and AOT compiler can analyze normally.',
    },
  ];

  challenge: Challenge = {
    title: 'Attribute-Driven CSV Exporter',
    description: `Build a tiny CSV exporter driven entirely by reflection and a custom attribute.
1. Define a <code>[CsvColumn]</code> attribute (valid on properties only) with a <code>Header</code> string and an optional <code>int Order</code> property.
2. Write <code>CsvExporter.Export&lt;T&gt;(IEnumerable&lt;T&gt; items)</code> that returns a CSV string: a header row built from the <code>Header</code> values (sorted by <code>Order</code>), then one row per item with values read via <code>PropertyInfo.GetValue</code>.
3. Properties without the attribute must be skipped.
4. Cache the discovered <code>(PropertyInfo, attribute)</code> pairs per type in a static dictionary so the reflection scan runs once per type.`,
    language: 'csharp',
    hints: [
      'AttributeUsage: [AttributeUsage(AttributeTargets.Property)]',
      'Discover columns with typeof(T).GetProperties() and p.GetCustomAttribute<CsvColumnAttribute>()',
      'Sort the pairs with .OrderBy(x => x.Attr.Order) before building rows',
      'Cache with a static ConcurrentDictionary<Type, List<(PropertyInfo, CsvColumnAttribute)>>',
    ],
    starterCode: `using System.Reflection;
using System.Text;

[AttributeUsage(AttributeTargets.Property)]
public class CsvColumnAttribute : Attribute
{
    public string Header { get; }
    public int Order { get; set; }
    public CsvColumnAttribute(string header) => Header = header;
}

public class Product
{
    [CsvColumn("ID", Order = 0)]
    public int Id { get; set; }

    [CsvColumn("Product Name", Order = 1)]
    public string Name { get; set; } = "";

    [CsvColumn("Price", Order = 2)]
    public decimal Price { get; set; }

    public string InternalSku { get; set; } = "";   // no attribute — skip
}

public static class CsvExporter
{
    // TODO: cache (PropertyInfo, CsvColumnAttribute) pairs per type

    public static string Export<T>(IEnumerable<T> items)
    {
        // TODO: header row from attribute Headers (sorted by Order),
        //       then one line per item using PropertyInfo.GetValue
        throw new NotImplementedException();
    }
}

var products = new[]
{
    new Product { Id = 1, Name = "Widget", Price = 9.99m,  InternalSku = "X1" },
    new Product { Id = 2, Name = "Gadget", Price = 24.50m, InternalSku = "X2" },
};

Console.WriteLine(CsvExporter.Export(products));
// ID,Product Name,Price
// 1,Widget,9.99
// 2,Gadget,24.50`,
    solution: `using System.Collections.Concurrent;
using System.Reflection;
using System.Text;

[AttributeUsage(AttributeTargets.Property)]
public class CsvColumnAttribute : Attribute
{
    public string Header { get; }
    public int Order { get; set; }
    public CsvColumnAttribute(string header) => Header = header;
}

public class Product
{
    [CsvColumn("ID", Order = 0)]
    public int Id { get; set; }

    [CsvColumn("Product Name", Order = 1)]
    public string Name { get; set; } = "";

    [CsvColumn("Price", Order = 2)]
    public decimal Price { get; set; }

    public string InternalSku { get; set; } = "";
}

public static class CsvExporter
{
    private static readonly ConcurrentDictionary<
        Type, List<(PropertyInfo Prop, CsvColumnAttribute Attr)>> _cache = new();

    private static List<(PropertyInfo Prop, CsvColumnAttribute Attr)> Columns(Type type) =>
        _cache.GetOrAdd(type, t => t
            .GetProperties()
            .Select(p => (Prop: p, Attr: p.GetCustomAttribute<CsvColumnAttribute>()))
            .Where(x => x.Attr is not null)
            .Select(x => (x.Prop, x.Attr!))
            .OrderBy(x => x.Item2.Order)
            .ToList());

    public static string Export<T>(IEnumerable<T> items)
    {
        var cols = Columns(typeof(T));
        var sb = new StringBuilder();

        sb.AppendLine(string.Join(",", cols.Select(c => c.Attr.Header)));

        foreach (var item in items)
            sb.AppendLine(string.Join(",",
                cols.Select(c => c.Prop.GetValue(item)?.ToString() ?? "")));

        return sb.ToString();
    }
}

var products = new[]
{
    new Product { Id = 1, Name = "Widget", Price = 9.99m,  InternalSku = "X1" },
    new Product { Id = 2, Name = "Gadget", Price = 24.50m, InternalSku = "X2" },
};

Console.WriteLine(CsvExporter.Export(products));
// ID,Product Name,Price
// 1,Widget,9.99
// 2,Gadget,24.50`,
  };
}
