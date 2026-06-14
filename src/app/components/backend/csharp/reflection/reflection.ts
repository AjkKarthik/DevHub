import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-reflection',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './reflection.html',
  styleUrl: './reflection.scss',
})
export class CsharpReflection {

  prerequisites: Prerequisite[] = [
    { label: 'Generics',   route: '/csharp/generics' },
    { label: 'Delegates',  route: '/csharp/delegates' },
  ];

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
        'Reflection lets code inspect and manipulate <em>metadata</em> at runtime: types, properties, methods, constructors, and attributes. Everything starts from a <code>System.Type</code> object obtained via <code>typeof</code> or <code>GetType()</code>.',
        '<code>typeof(Customer)</code> is resolved at <strong>compile time</strong> — you must know the type name. <code>obj.GetType()</code> is resolved at <strong>runtime</strong> and returns the actual most-derived type of the instance, even if the variable is typed as a base class or interface.',
        'For a variable <code>Animal a = new Dog();</code>, <code>typeof(Animal)</code> yields <code>Animal</code> but <code>a.GetType()</code> yields <code>Dog</code>. This distinction matters for polymorphic scenarios like serializers that must know the concrete type to write the right JSON.',
        'You can also load a type by assembly-qualified name: <code>Type.GetType("MyApp.Customer, MyApp")</code> — useful for plugin systems where the type name comes from configuration or a database.',
        '<code>Assembly.GetExecutingAssembly().GetTypes()</code> returns all types in the current assembly — the starting point for plugin scanners, DI auto-registration, and test discovery.',
      ],
    },
    {
      heading: 'Exploring type members',
      points: [
        '<code>Type</code> exposes the full shape of a type: <code>GetProperties()</code>, <code>GetMethods()</code>, <code>GetFields()</code>, <code>GetConstructors()</code>, <code>GetInterfaces()</code> — each returning <code>*Info</code> metadata objects.',
        'By default only <strong>public instance and static</strong> members are returned. Pass <code>BindingFlags</code> to widen or narrow: <code>BindingFlags.NonPublic | BindingFlags.Instance</code> reveals private members.',
        '<code>PropertyInfo</code> tells you the property name, type (<code>PropertyType</code>), and whether it can read/write (<code>CanRead</code>/<code>CanWrite</code>). <code>MethodInfo</code> exposes parameters and return type and can be invoked with <code>Invoke(obj, args)</code>.',
        'Reading a value is two steps: get the <code>PropertyInfo</code> from the <code>Type</code>, then call <code>prop.GetValue(instance)</code>. Writing uses <code>prop.SetValue(instance, value)</code>. Both box arguments and return values, which has a cost.',
        '<code>MemberInfo</code> is the common base of <code>PropertyInfo</code>, <code>MethodInfo</code>, <code>FieldInfo</code>, and <code>EventInfo</code>. Use it when writing code that handles multiple member kinds generically (e.g. an attribute scanner).',
      ],
    },
    {
      heading: 'Creating instances at runtime',
      points: [
        '<code>Activator.CreateInstance(type)</code> calls the parameterless constructor of a type known only at runtime. Overloads accept constructor arguments: <code>Activator.CreateInstance(type, arg1, arg2)</code> finds the best-matching constructor by argument types.',
        'The generic form <code>Activator.CreateInstance&lt;T&gt;()</code> is what the <code>new()</code> generic constraint uses under the hood — it\'s slightly faster because the type is compile-time-known.',
        'For repeated creation, <code>Activator.CreateInstance</code> is slow — DI containers and serializers compile a factory delegate once (via expression trees or <code>IL.Emit</code>) and reuse it for near-direct-call performance.',
        '<code>RuntimeHelpers.GetUninitializedObject(type)</code> allocates memory for a type without calling any constructor — all fields are zero/null. Used by deserializers that set fields individually and cannot rely on a parameterless constructor.',
        'A classic use case: a plugin loader reads a class name from config, calls <code>Type.GetType(...)</code>, verifies the type implements <code>IPlugin</code> with <code>typeof(IPlugin).IsAssignableFrom(type)</code>, then instantiates with <code>Activator.CreateInstance</code>.',
      ],
    },
    {
      heading: 'Custom attributes — declaring and reading',
      points: [
        'An attribute is a class deriving from <code>System.Attribute</code>, by convention named with an <code>Attribute</code> suffix (which the compiler lets you omit at the use site: <code>[Required]</code> for <code>RequiredAttribute</code>).',
        '<code>[AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]</code> restricts where the attribute may appear and whether it can be applied more than once to the same member.',
        'Attributes are <strong>passive metadata</strong> — they do nothing by themselves. Some other code must read them via reflection: <code>prop.GetCustomAttribute&lt;RequiredAttribute&gt;()</code> or <code>GetCustomAttributes()</code> for multiples.',
        'Attribute constructor arguments and named properties must be compile-time constants (numbers, strings, enums, <code>Type</code> objects) — you cannot pass arbitrary objects, lambdas, or runtime values.',
        'The <code>inherit</code> flag on <code>GetCustomAttribute(inherit: true)</code> controls whether attributes on base-class members or overridden methods are included. For most validation use-cases, <code>inherit: true</code> is correct.',
      ],
    },
    {
      heading: 'Real-world uses: serializers, validators, DI containers',
      points: [
        'JSON serializers walk <code>GetProperties()</code> to discover what to write, and honor attributes like <code>[JsonPropertyName]</code> and <code>[JsonIgnore]</code> to customize output. System.Text.Json\'s source generator replaces this reflection walk at compile time.',
        'Validation frameworks (DataAnnotations, FluentValidation\'s attribute mode) read attributes like <code>[Required]</code> and <code>[Range]</code> from properties and apply the rules to values fetched with <code>GetValue</code>.',
        'DI containers reflect over constructors (<code>GetConstructors()</code>) to find a service\'s dependencies, resolve each parameter type recursively, then instantiate the object — this is "constructor injection" reduced to its mechanics.',
        'Test frameworks (xUnit, NUnit) find test methods by scanning assemblies for methods decorated with <code>[Fact]</code> / <code>[Test]</code> attributes and invoke them via <code>MethodInfo.Invoke</code>. The assembly scan runs once; the test runner\'s caching avoids repeated reflection.',
        'ORMs (EF Core, Dapper) use reflection to map between C# types and database columns — <code>[Column("customer_id")]</code> attributes tell the ORM how to alias properties, and <code>GetProperties()</code> drives the SQL generation.',
      ],
    },
    {
      heading: 'Performance, caching, and the move to source generators',
      points: [
        'Reflection is 10–100× slower than direct calls: member lookup performs string-based metadata searches, and <code>Invoke</code>/<code>GetValue</code> box value-type arguments and bypass JIT inlining and devirtualisation.',
        'The biggest single win is <strong>caching MemberInfo</strong>: look up <code>PropertyInfo[]</code>/<code>MethodInfo</code> once per type and store in a <code>static ConcurrentDictionary&lt;Type, …&gt;</code>. The lookup is the expensive part; reusing the cached object is much cheaper.',
        'High-performance libraries go further: compile the cached metadata into typed delegates with expression trees (<code>Expression.Lambda(...).Compile()</code>) so subsequent calls run at near-direct-call speed with no boxing or virtual dispatch.',
        'The modern trend is to avoid runtime reflection with <strong>source generators</strong>, which emit the serializer/validator code at compile time (e.g. <code>System.Text.Json</code> source-gen, <code>[GeneratedRegex]</code>, EF Core compiled models). The generated code is visible in the debugger, immune to trimming, and AOT-safe.',
        'Reflection is incompatible with <strong>Native AOT</strong> unless you annotate every accessed member with <code>[DynamicallyAccessedMembers]</code>. Moving reflection-heavy logic to source generators is the correct long-term strategy for trimming-safe libraries.',
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
    {
      q: 'You call <code>Type.GetType("MyApp.Customer")</code> and get <code>null</code>. What is the most likely cause?',
      options: [
        'GetType only works with built-in types, not user-defined classes',
        'The type name must be assembly-qualified: "MyApp.Customer, MyApp" — unqualified names only work for the calling assembly or mscorlib',
        'Reflection cannot load types that are in a different namespace',
        'The Customer class must be marked with [Serializable] first',
      ],
      answer: 1,
      explanation: '<code>Type.GetType(name)</code> requires an assembly-qualified name ("Namespace.TypeName, AssemblyName") to find types in other assemblies. Unqualified names only search the calling assembly and mscorlib. Forgetting to include the assembly name is the most common cause of a <code>null</code> return.',
    },
    {
      q: 'What does <code>typeof(IPlugin).IsAssignableFrom(type)</code> check?',
      options: [
        'Whether IPlugin can be assigned from type — i.e., whether type is IPlugin or implements/extends IPlugin',
        'Whether type can be assigned to an IPlugin variable — the same as type is IPlugin',
        'Whether IPlugin has a base type of type',
        'It always returns false unless type == typeof(IPlugin)',
      ],
      answer: 0,
      explanation: '<code>IsAssignableFrom(type)</code> asks: "can a variable of this (the receiver) type hold a value of <code>type</code>?" So <code>typeof(IPlugin).IsAssignableFrom(concreteType)</code> returns <code>true</code> if <code>concreteType</code> implements <code>IPlugin</code>. Note the direction: receiver is the base/interface, argument is the concrete type — it\'s easy to get backwards.',
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

  mistakes: CommonMistake[] = [
    {
      title: 'Re-calling GetProperties() on every use instead of caching',
      wrong: `void Serialize(object obj)
{
    foreach (var p in obj.GetType().GetProperties()) // fresh scan every call!
        writer.Write(p.GetValue(obj));
}`,
      right: `static readonly ConcurrentDictionary<Type, PropertyInfo[]> _cache = new();

void Serialize(object obj)
{
    var props = _cache.GetOrAdd(obj.GetType(), t => t.GetProperties());
    foreach (var p in props)
        writer.Write(p.GetValue(obj));
}`,
      explanation: 'GetProperties() does a string-based metadata walk every time. In a serializer handling thousands of requests per second, re-scanning the same type repeatedly is a measurable bottleneck. Cache the PropertyInfo[] per type — the scan happens once, subsequent calls just read the dictionary.',
    },
    {
      title: 'Missing BindingFlags and wondering why private members are invisible',
      wrong: `var fields = typeof(MyClass).GetFields();
// returns 0 fields — all fields are private backing fields`,
      right: `var fields = typeof(MyClass).GetFields(
    BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);`,
      explanation: 'The parameterless GetFields()/GetProperties()/GetMethods() only returns public members. Private members are fully available via reflection but require BindingFlags.NonPublic. Forgetting this is the #1 cause of "reflection returned nothing" bugs.',
    },
    {
      title: 'Expecting attributes to do something without a consumer',
      wrong: `public class Order
{
    [Required]  // you defined this yourself
    public string Name { get; set; } = "";
}
// No validation happens — who is reading the attribute?`,
      right: `// Either use the framework's consumer (ASP.NET model binding, Validator.TryValidateObject)
// or write your own reader:
var errors = MiniValidator.Validate(order); // reads [Required] via GetCustomAttribute`,
      explanation: 'Attributes are inert metadata. Applying [Required] to a property does nothing unless some code calls GetCustomAttribute<RequiredAttribute>() and acts on it. This is a common beginner trap — check which framework or validator is actually reading the attribute you placed.',
    },
    {
      title: 'Using reflection in a hot path without caching compiled delegates',
      wrong: `// GetValue boxes, skips JIT inlining — 50-100x slower than direct access
var value = prop.GetValue(instance);`,
      right: `// Compile once per property — subsequent calls are native speed
Func<Customer, string> getter = Expression.Lambda<Func<Customer, string>>(
    Expression.Property(Expression.Parameter(typeof(Customer), "c"), prop),
    Expression.Parameter(typeof(Customer), "c")).Compile();
// then reuse:
var value = getter(instance);`,
      explanation: 'PropertyInfo.GetValue boxes value-type results and prevents JIT optimisations. For properties read millions of times (high-throughput serializers, ORM mapping), compile a typed delegate from the PropertyInfo using expression trees. Cache the delegate statically per property — this brings performance to within a few percent of direct field access.',
    },
    {
      title: 'Using reflection in code that must be trimmed or run as Native AOT',
      wrong: `// Trimmer removes Customer.Name if it sees no direct references
var prop = typeof(Customer).GetProperty("Name");
var val = prop?.GetValue(customer); // null at runtime — trimmed!`,
      right: `// Annotate what must survive trimming:
[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicProperties)]
static void Inspect(Type t) { ... }

// Or move to source generators — the compile-time alternative`,
      explanation: 'Native AOT and IL trimming remove code they cannot prove is reachable. String-based reflection (GetProperty("Name")) is invisible to the analyzer. Add [DynamicallyAccessedMembers] annotations to tell the trimmer what to preserve, or — better — replace the reflection with a source generator that emits equivalent code at compile time.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Reflection lets C# code inspect and invoke type metadata at runtime — the foundation of serializers, DI containers, validators, and test runners — but requires caching MemberInfo per type and is incompatible with Native AOT without annotations.',
    mustKnow: [
      '<code>typeof(T)</code> is compile-time; <code>obj.GetType()</code> is runtime and returns the actual most-derived type',
      '<code>GetProperties()</code> returns public members only by default — add <code>BindingFlags.NonPublic</code> to see private members',
      'Attributes are passive metadata — they do nothing unless some code reads them with <code>GetCustomAttribute&lt;T&gt;()</code>',
      'Cache <code>PropertyInfo[]</code>/<code>MethodInfo</code> per type in a <code>ConcurrentDictionary</code> — the lookup is the expensive part',
      'For hot paths, compile cached <code>PropertyInfo</code> into typed delegates with expression trees to reach near-native performance',
      'String-based reflection is opaque to the trimmer and Native AOT — annotate with <code>[DynamicallyAccessedMembers]</code> or replace with source generators',
      '<code>Activator.CreateInstance(type)</code> for one-off plugin creation; compile a factory delegate for repeated instantiation',
    ],
    interviewFocus: [
      'What is the difference between <code>typeof(T)</code> and <code>obj.GetType()</code>? When would each return different results?',
      'Why is caching <code>PropertyInfo</code> important? What is the performance mitigation ladder?',
      'Why do attributes do nothing on their own? Give an example of something that reads them.',
      'How does reflection interact with Native AOT and IL trimming? What is the recommended solution?',
      'When would you use <code>Activator.CreateInstance</code> vs a compiled expression-tree factory?',
    ],
  };
}
