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

@Component({
  selector: 'app-csharp-dynamic',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './dynamic.html',
  styleUrl: './dynamic.scss',
})
export class CsharpDynamic {

  quickRef: QuickRefItem[] = [
    { name: 'dynamic',                  type: 'keyword',  desc: 'Defers ALL member binding to runtime — the compiler stops checking; mistakes become RuntimeBinderException', since: 'C# 4' },
    { name: 'RuntimeBinderException',   type: 'class',    desc: 'Thrown at runtime when a dynamic member/overload does not exist', since: 'C# 4' },
    { name: 'ExpandoObject',            type: 'class',    desc: 'Dynamic property bag — members added by assignment; also IDictionary<string, object?>', since: 'C# 4' },
    { name: 'DynamicObject',            type: 'class',    desc: 'Base class for custom dynamic behaviour via TryGetMember/TrySetMember/TryInvokeMember', since: 'C# 4' },
    { name: 'TryGetMember()',           type: 'method',   desc: 'Override to intercept reads of unknown members on a DynamicObject; return false to let the binder throw', since: 'C# 4' },
    { name: 'TryInvokeMember()',        type: 'method',   desc: 'Override to handle method calls on a DynamicObject (proxy dispatch, scripting)', since: 'C# 4' },
    { name: 'var vs dynamic vs object', type: 'syntax',   desc: 'var = inferred static type; object = static base type; dynamic = no static typing', since: 'C# 4' },
    { name: 'DLR',                      type: 'syntax',   desc: 'Dynamic Language Runtime — the call-site and binder machinery behind every dynamic operation', since: 'C# 4' },
    { name: 'CallSite<T>',              type: 'class',    desc: 'DLR call-site caches the binder result per operand types — repeated dynamic calls skip re-resolution', since: 'C# 4' },
    { name: 'JsonNode',                 type: 'class',    desc: 'Modern typed-ish JSON DOM — node["key"]?["sub"] is safer and faster than deserializing to dynamic', since: '.NET 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What dynamic really means — binding moved to runtime',
      points: [
        'With <code>dynamic d</code>, every operation on <code>d</code> — member access, method call, operator, conversion — compiles to a <strong>DLR call site</strong> that resolves at runtime against the object\'s actual type. The compiler emits no type checks and issues no errors for any member name.',
        'Get it right and it behaves identically to static code; get it wrong (typo, missing member, bad overload) and you get a <code>RuntimeBinderException</code> at the line that runs — not a red squiggle at the line you wrote.',
        '<code>var</code> is the opposite of dynamic, not its cousin. <code>var</code> gives you full static typing with the name inferred — renaming still works. <code>dynamic</code> removes static typing entirely. <code>object</code> sits between: statically typed as the base class, so member access requires explicit casts but mistakes are still compile-time.',
        'Overload resolution is also dynamic when an argument is dynamic. <code>Describe(d)</code> picks the overload at runtime based on <code>d</code>\'s real type — this can be useful for visitor patterns, but it is a hidden control-flow change that can surprise the reader.',
        'Call sites cache their resolution per operand types, so a loop that calls the same member on the same runtime type pays the resolution cost once, not per iteration — still slower than static dispatch but much cheaper than uncached reflection.',
      ],
    },
    {
      heading: 'ExpandoObject — the dynamic property bag',
      points: [
        '<code>dynamic e = new ExpandoObject();</code> then <code>e.Name = "Ada";</code> — members spring into existence on first assignment. Reading a member that was never set throws <code>RuntimeBinderException</code>.',
        'Expando simultaneously implements <code>IDictionary&lt;string, object?&gt;</code> — cast to it to enumerate members, check for existence with <code>ContainsKey</code>, or remove members. These are the operations you cannot do through the dynamic view alone.',
        'It also implements <code>INotifyPropertyChanged</code>, which made it popular for quick WPF view-models in the MVVM era — but for anything of substance, a typed class with <code>[NotifyPropertyChanged]</code> source generator is better.',
        'ExpandoObject serializes with <code>System.Text.Json</code> via its dictionary view — keys become JSON properties. Useful for building arbitrary JSON payloads without defining a class, though anonymous types serve the same purpose with compile-time naming.',
        'If the shape is known at compile time, a <code>record</code> beats an Expando on every axis: performance (struct layout vs dictionary), safety (compile-time checking), tooling (IntelliSense, rename), and serialization (source-generated converters).',
      ],
    },
    {
      heading: 'DynamicObject — scripting your own member resolution',
      points: [
        'Derive from <code>DynamicObject</code> and override <code>TryGetMember</code>, <code>TrySetMember</code>, <code>TryInvokeMember</code> to define at runtime what member access means — back it with a dictionary, an XML document, a database row, or an HTTP call.',
        'Return <code>true</code> from an override to signal "I handled it"; return <code>false</code> and the DLR binder throws <code>RuntimeBinderException</code> on the caller. This lets you fail selectively while letting other members fall through.',
        'Override <code>GetDynamicMemberNames()</code> to expose your member names to debuggers, serializers, and tooling — without it, the dynamic object appears opaque.',
        'This is how fluent dynamic wrappers are built: <code>config.Database.ConnectionString</code> navigating a nested JSON document via readable property names instead of magic strings. It is a convenience layer for consumption, not an appropriate foundation for core business logic.',
        'The trade is discoverability and safety: consumers cannot see what members exist from IntelliSense, every typo compiles, and tests are your only safety net. Quarantine DynamicObject wrappers at library edges and interop layers.',
      ],
    },
    {
      heading: 'Where dynamic earns its keep — and where it does not',
      points: [
        '<strong>Legitimate uses:</strong> COM/Office interop (Excel, Word object models are inherently late-bound — C# 4 added dynamic primarily for this); interop with IronPython or other DLR-hosted languages; bridging two third-party objects that share shape but no shared interface; quick scripting and exploratory prototypes.',
        '<strong>Avoid for JSON:</strong> deserializing to <code>dynamic</code> with System.Text.Json gives you a boxed <code>JsonElement</code> that the C# binder cannot navigate. <code>JsonNode</code> (<code>node["user"]?["name"]</code>) handles loose shapes; typed DTOs handle known shapes — both are faster, safer, and more tooling-friendly.',
        'Dynamic is contagious: an expression containing a dynamic operand is itself typed <code>dynamic</code>, so one dynamic variable can silently switch entire code paths to runtime binding without a visible warning. Assign the result to a typed variable as early as possible to escape.',
        'Extension methods are a compile-time illusion — the C# binder cannot resolve them at runtime. <code>dynamicList.Where(x => true)</code> compiles but throws at runtime. Pull the value into a typed local first.',
        'Rule of thumb: dynamic is an interop tool, not a modelling tool. When you control the type, define the type. When the cost of a missing static type is runtime crashes, the ergonomic savings are rarely worth it.',
      ],
    },
    {
      heading: 'The DLR — call sites, binders, and performance',
      points: [
        'The Dynamic Language Runtime (DLR) runs on top of the CLR and was designed to host dynamic languages (IronPython, IronRuby) and support C#\'s <code>dynamic</code>. It provides the machinery that makes runtime dispatch fast enough to be practical.',
        'Every <code>dynamic</code> operation compiles into a <code>CallSite&lt;T&gt;</code> object. The first time the call site executes with a specific combination of operand runtime types, the C# binder resolves the target (method, property, overload) and caches it. Subsequent calls with the same types use the cached target directly — no re-resolution.',
        'This per-type caching is why dynamic beats uncached reflection in loops: reflection calls <code>GetMethod()</code> and <code>Invoke()</code> every time; a dynamic call site resolves once per type combination. With a single type, the second call is essentially as fast as calling a delegate.',
        'When operand types vary widely across iterations, the call-site cache degrades — it stores multiple rules and falls back to a lookup on each miss. For polymorphic dispatch over many types, explicit interfaces or expression trees compile down to something faster.',
        'Under the hood the C# binder produces expression trees that the DLR caches and JIT-compiles. You can implement your own binder by deriving from <code>GetMemberBinder</code>, <code>InvokeMemberBinder</code>, etc. — this is the extension point DLR-hosted languages use.',
      ],
    },
    {
      heading: 'dynamic in modern .NET — AOT, trimming, and alternatives',
      points: [
        'NativeAOT and aggressive trimming remove the reflection-emit APIs that the DLR\'s call-site binder relies on. <code>dynamic</code> is <strong>not supported under NativeAOT</strong>: any dynamic operation throws <code>PlatformNotSupportedException</code> at runtime in an AOT-published app.',
        'This affects Blazor WebAssembly AOT, iOS/Android NativeAOT targets, and any app published with <code>PublishAot=true</code>. If you deploy to these targets, <code>dynamic</code> must be removed from the call path before publishing.',
        'The trimmer emits a warning when it detects dynamic usage, but only if the entry points are reachable — it is not a guarantee of a clean app. Test your AOT-published binary explicitly.',
        'For duck-typing across unrelated third-party types, define an adapter interface and wrap each type — static typing restored, no DLR. For plugin dispatch over types loaded at runtime, consider reflection with caching, source-generated proxies, or <code>DispatchProxy</code>.',
        'Source generators are the modern compile-time alternative to runtime code that dynamic enables: they inspect types at build time and generate strongly-typed code, producing zero runtime overhead and full AOT compatibility. Prefer them for any scenario that does not require genuine runtime dynamism.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'dynamic vs var vs object',
      language: 'csharp',
      code: `// var — static typing, name inferred. Mistakes = compile errors.
var s = "hello";
// s.Lenght;                     // ❌ does not compile (typo caught)

// object — static base type. Members require casts.
object o = "hello";
// o.Length;                     // ❌ object has no Length
int len1 = ((string)o).Length;   // cast first

// dynamic — NO static type. Everything resolves at runtime.
dynamic d = "hello";
int len2 = d.Length;             // ✅ binds at runtime → 5
// d.Lenght;                     // compiles fine…
//   → RuntimeBinderException at runtime: 'string' has no 'Lenght'

// dynamic is contagious — results of dynamic expressions are dynamic:
dynamic x = 10;
var y = x + 5;    // y is dynamic, not int! (may surprise downstream code)
int z = x + 5;    // explicit assignment escapes to static int

// Runtime overload resolution:
static string Describe(int n)    => "int";
static string Describe(string t) => "string";

dynamic val = GetUntypedValue();
string result = Describe(val);  // overload picked at RUNTIME from val's type
// If val is 42   → "int"
// If val is "hi" → "string"
// If val is 3.14 → RuntimeBinderException (no Describe(double))`,
    },
    {
      label: 'ExpandoObject',
      language: 'csharp',
      code: `using System.Dynamic;

dynamic person = new ExpandoObject();
person.Name = "Ada Lovelace";           // members appear on assignment
person.Born = 1815;
person.Greet = (Func<string>)(() => $"Hi, I'm {person.Name}");

Console.WriteLine(person.Greet());     // Hi, I'm Ada Lovelace

// The same object IS a dictionary — two views, one bag:
var dict = (IDictionary<string, object?>)person;
dict["Country"] = "England";           // add via dictionary
Console.WriteLine(person.Country);     // read via dynamic

// Existence check is only possible via the dictionary view:
if (dict.ContainsKey("Born"))
    Console.WriteLine($"Born {person.Born}");

foreach (var (key, value) in dict)
    Console.WriteLine($"{key} = {value}");
// Name=Ada Lovelace  Born=1815  Greet=<Func>  Country=England

// Serializes via its dictionary implementation:
var json = System.Text.Json.JsonSerializer.Serialize(dict);
// {"Name":"Ada Lovelace","Born":1815,"Country":"England"}

// ⚠ Known shape? A record is faster, safer, and refactorable:
public record Person(string Name, int Born, string Country);`,
    },
    {
      label: 'DynamicObject wrapper',
      language: 'csharp',
      code: `using System.Dynamic;

// Fluent read-access over a dictionary (think: config, CSV row, claims)
public class DynamicRow(Dictionary<string, object?> data) : DynamicObject
{
    public override bool TryGetMember(
        GetMemberBinder binder, out object? result)
    {
        if (data.TryGetValue(binder.Name, out result))
            return true;

        result = null;
        return false;   // → binder throws RuntimeBinderException
    }

    public override bool TrySetMember(SetMemberBinder binder, object? value)
    {
        data[binder.Name] = value;
        return true;
    }

    // Override TryInvokeMember to handle method calls:
    public override bool TryInvokeMember(
        InvokeMemberBinder binder, object?[]? args, out object? result)
    {
        // Dynamic proxy dispatch — forward to a service, script engine, etc.
        Console.WriteLine($"Called: {binder.Name}({string.Join(", ", args ?? [])})");
        result = null;
        return true;
    }

    // Expose member names to debuggers and serializers:
    public override IEnumerable<string> GetDynamicMemberNames() => data.Keys;
}

dynamic row = new DynamicRow(new()
{
    ["Host"] = "db01.internal",
    ["Port"] = 5432,
});

Console.WriteLine($"{row.Host}:{row.Port}");   // db01.internal:5432
row.Database = "orders";                        // TrySetMember
row.Connect("orders");                          // TryInvokeMember
// row.Hots → RuntimeBinderException (typo — surfaces at runtime only)`,
    },
    {
      label: 'JSON: dynamic vs JsonNode',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Nodes;

string json = """
{ "user": { "name": "Ada", "roles": ["admin", "dev"] } }
""";

// ❌ The dynamic temptation — fights System.Text.Json:
// dynamic doc = JsonSerializer.Deserialize<dynamic>(json);
// doc.user.name  → doc is a JsonElement; C# binder finds no "user"
//                  member on JsonElement → RuntimeBinderException

// ✅ JsonNode — made for unknown/loose JSON shapes:
JsonNode? node = JsonNode.Parse(json);
string? name  = (string?)node?["user"]?["name"];        // "Ada"
string? role0 = (string?)node?["user"]?["roles"]?[0];   // "admin"

// ✅ Typed DTOs — best when the shape is known:
public record UserDoc(User User);
public record User(string Name, string[] Roles);

var doc = JsonSerializer.Deserialize<UserDoc>(json,
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
Console.WriteLine(doc!.User.Name);   // Ada — IntelliSense, rename, all works

// ✅ Where dynamic DOES fit: COM interop
// dynamic excel = Activator.CreateInstance(
//     Type.GetTypeFromProgID("Excel.Application")!);
// excel.Visible = true;           // late-bound by design — no way around it
// excel.Workbooks.Add();

// ❌ Extension methods don't work on dynamic:
dynamic list = new List<int> { 1, 2, 3 };
// list.Where(x => x > 1)  → RuntimeBinderException (not found at runtime)
// Fix: cast to typed local first:
var typedList = (List<int>)list;
var filtered = typedList.Where(x => x > 1);`,
    },
    {
      label: 'DLR call-site caching',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;

// ── What the compiler emits for "d.Name" ─────────────────────────────
// (simplified — actual generated code is more complex)

// Your code:
// dynamic d = someObject;
// string name = d.Name;

// Compiled roughly as:
// var site = CallSite<Func<CallSite,object,string>>.Create(
//     Binder.GetMember(CSharpBinderFlags.None, "Name", typeof(YourClass),
//         [CSharpArgumentInfo.Create(0, null)]));
// string name = site.Target(site, d);

// ── Performance comparison ────────────────────────────────────────────
public class Perf
{
    record Person(string Name);
    static readonly Person p = new("Ada");

    // ~0.3 ns  — static dispatch, inlineable
    static string StaticCall()   => p.Name;

    // ~10-30 ns — DLR call site, resolves once, then cached
    static string DynamicCall()
    {
        dynamic d = p;
        return d.Name;   // first call: resolve + cache; subsequent: cached
    }

    // ~200-500 ns — uncached reflection, every call
    static string? ReflectionCall()
        => typeof(Person).GetProperty("Name")!.GetValue(p) as string;
}

// ── Binder cache warms up after first type hit ─────────────────────────
dynamic[] items = [new Person("Ada"), new Person("Grace")];
foreach (var item in items)
{
    string n = item.Name;   // first iteration: cache miss (resolve)
                             // second+: cache hit (fast path)
}

// Cache busts when types change:
dynamic[] mixed = [new Person("Ada"), 42, "hello"];
foreach (var item in mixed)
{
    // Each different type causes a cache miss on first encounter:
    try { Console.WriteLine(item.Name); }
    catch (RuntimeBinderException) { Console.WriteLine("(no Name)"); }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Deserializing JSON to dynamic with System.Text.Json',
      wrong: `// Looks convenient — throws at runtime:
dynamic data = JsonSerializer.Deserialize<dynamic>(json);
string name = data.user.name;
// RuntimeBinderException: 'JsonElement' does not contain a definition for 'user'`,
      right: `// Loose shape: use JsonNode
JsonNode? node = JsonNode.Parse(json);
string? name = (string?)node?["user"]?["name"];

// Known shape: use a typed record
var data = JsonSerializer.Deserialize<UserDto>(json);`,
      explanation: 'System.Text.Json deserializes to dynamic as a JsonElement, which is a value type struct — the C# DLR binder finds no members on it. JsonNode is the correct API for traversing unknown JSON shapes. Typed records are even better when the shape is known at compile time.',
    },
    {
      title: 'Calling extension methods on a dynamic variable',
      wrong: `dynamic list = GetList();
var result = list.Where(x => x > 0);     // compiles fine
// RuntimeBinderException at runtime: IEnumerable<int> has no Where
// Extension methods are compile-time static method calls — the binder
// cannot find them on the actual object.`,
      right: `// Cast to the typed interface first, then call LINQ:
var list = (IEnumerable<int>)GetList();
var result = list.Where(x => x > 0);     // static, works fine

// Or: hold the typed reference directly
IEnumerable<int> typedList = GetList();
var result2 = typedList.Where(x => x > 0);`,
      explanation: 'Extension methods are resolved by the C# compiler from using directives — they are just static method calls with syntactic sugar. The DLR binder operates at runtime and has no knowledge of extension methods. Any LINQ method called on a dynamic variable throws RuntimeBinderException.',
    },
    {
      title: 'Ignoring dynamic contagion and losing static types silently',
      wrong: `dynamic config = LoadConfig();
var timeout = config.TimeoutMs;   // timeout is dynamic, not int!
var url = config.BaseUrl;         // url is dynamic, not string!

// Downstream code is now all dynamic — errors pushed to runtime:
string result = url + "/api";     // compiles; may throw at runtime`,
      right: `dynamic config = LoadConfig();
// Cast out of dynamic as early as possible:
int timeout = config.TimeoutMs;
string url = config.BaseUrl;

// Now downstream code is statically typed again:
string result = url + "/api";     // string concatenation, safe`,
      explanation: 'Any expression that involves a dynamic operand has a dynamic result. Left unchecked, one dynamic import at the top can make dozens of downstream variables dynamic. Assign dynamic values to explicitly typed variables immediately after reading them to re-enter static typing.',
    },
    {
      title: 'Using dynamic for duck-typing when an interface solves it cleanly',
      wrong: `// Two library types with matching Save() — no shared interface
dynamic a = new LibA.Document();
dynamic b = new LibB.Document();

void SaveAll(IEnumerable<dynamic> items)
{
    foreach (dynamic item in items)
        item.Save();   // no compile-time check; any typo = runtime crash
}`,
      right: `// Adapter interface — type-safe, IntelliSense works, rename-safe:
public interface ISaveable { void Save(); }

public class LibAAdapter(LibA.Document doc) : ISaveable
    { public void Save() => doc.Save(); }

void SaveAll(IEnumerable<ISaveable> items)
{
    foreach (var item in items)
        item.Save();   // compile-time contract
}`,
      explanation: 'Duck typing via dynamic trades compile-time safety for runtime errors. When you control the adapters, defining a thin interface restores static typing with minimal boilerplate. Reserve dynamic for cases where you genuinely cannot add adapters — typically third-party COM objects or DLR-hosted scripting.',
    },
    {
      title: 'Using dynamic in NativeAOT or Blazor AOT builds',
      wrong: `// Works in JIT but throws at runtime in NativeAOT:
dynamic d = GetPluginResult();
string name = d.Name;   // PlatformNotSupportedException — DLR not available`,
      right: `// Option 1: interface contract
IPlugin plugin = GetPlugin();
string name = plugin.Name;

// Option 2: reflection with caching (if you must load unknown types)
private static readonly ConcurrentDictionary<Type, PropertyInfo> _cache = new();
string? GetName(object obj) {
    var prop = _cache.GetOrAdd(obj.GetType(), t => t.GetProperty("Name")!);
    return prop.GetValue(obj) as string;
}`,
      explanation: 'The DLR binder emits IL at runtime, which NativeAOT and trimming do not support. Any dynamic operation produces PlatformNotSupportedException in AOT-published apps (Blazor WASM AOT, iOS, Android, PublishAot=true). Use interfaces, reflection with caching, or source-generated proxies instead.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between var and dynamic?',
      options: [
        'They are interchangeable ways to skip writing the type',
        'var infers a static type at compile time; dynamic skips compile-time typing entirely and binds at runtime',
        'dynamic is faster because it avoids type checks',
        'var works only with primitives',
      ],
      answer: 1,
      explanation: '<code>var x = "hi"</code> gives x the full static type <code>string</code> — typos are compile errors. <code>dynamic d = "hi"</code> compiles every member access into a DLR call site — typos become <code>RuntimeBinderException</code> at runtime.',
    },
    {
      q: 'When does a mistyped member on a dynamic variable fail?',
      options: [
        'At compile time, like any other member access',
        'Never — missing members return null',
        'At runtime, with a RuntimeBinderException when that line executes',
        'At application startup during JIT',
      ],
      answer: 2,
      explanation: 'The compiler emits a call site and trusts you. Only when the line runs does the DLR look for the member on the actual object — and throws <code>RuntimeBinderException</code> if it is absent. This is the core risk of dynamic.',
    },
    {
      q: 'What is special about ExpandoObject compared to a plain class?',
      options: [
        'It is faster than a class',
        'Members can be added at runtime by assignment, and it is simultaneously an IDictionary<string, object?>',
        'It cannot be serialized',
        'It enforces compile-time member checks via analyzers',
      ],
      answer: 1,
      explanation: 'Expando is a property bag: assignment creates members dynamically, and the dictionary view lets you enumerate, check existence, and remove them. The two views (dynamic and IDictionary) expose the same underlying data.',
    },
    {
      q: 'Which scenario is the STRONGEST case for dynamic?',
      options: [
        'Modelling your core domain entities',
        'Parsing JSON payloads in a web API',
        'Office/COM interop, where the underlying API is late-bound by design',
        'Speeding up tight loops',
      ],
      answer: 2,
      explanation: '<code>dynamic</code> was added in C# 4 largely to make COM automation (Excel, Word) bearable — those object models are inherently late-bound. JSON has better tools (JsonNode, DTOs), domain models deserve static types, and dynamic is slower than static dispatch, not faster.',
    },
    {
      q: 'What happens when you call an extension method on a dynamic variable?',
      options: [
        'It works normally — the binder finds extension methods from the current usings',
        'It throws RuntimeBinderException at runtime — the binder cannot resolve extension methods',
        'It compiles but is resolved via reflection instead of the DLR',
        'It only works if the extension method is in the same namespace',
      ],
      answer: 1,
      explanation: 'Extension methods are compiler sugar — they are static method calls resolved from <code>using</code> directives at compile time. The DLR binder operates at runtime with no knowledge of which namespaces were imported, so it cannot find them. The fix is to cast to a typed local first.',
    },
    {
      q: 'How does DLR call-site caching improve dynamic performance?',
      options: [
        'It pre-compiles all possible overloads at startup',
        'Each call site caches the resolved target per operand runtime type — subsequent calls with the same types skip resolution',
        'It converts dynamic calls to static calls after the first JIT pass',
        'The cache is shared globally across all call sites in the application',
      ],
      answer: 1,
      explanation: 'A DLR call site resolves the member/overload on first use for a given combination of operand runtime types and caches the result. Subsequent invocations with the same types use the cached delegate directly — much faster than calling GetMethod()/Invoke() on every call, though still slower than a direct static call.',
    },
    {
      q: 'Why is dynamic not supported in NativeAOT builds?',
      options: [
        'dynamic was removed in .NET 8',
        'The DLR binder emits IL at runtime using reflection-emit APIs that NativeAOT removes',
        'NativeAOT does not support the DLR namespace',
        'dynamic requires a garbage-collected heap which AOT cannot provide',
      ],
      answer: 1,
      explanation: 'The DLR\'s C# binder generates and JIT-compiles code at runtime using the same reflection-emit infrastructure that NativeAOT trims away. Any dynamic operation in an AOT build throws <code>PlatformNotSupportedException</code>. Use interfaces, reflection with caching, or source-generated proxies instead.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the DLR and how does dynamic dispatch actually work?',
      a: 'The Dynamic Language Runtime sits on top of the CLR and provides call sites, binders, and caching. Each dynamic operation compiles into a <code>CallSite&lt;T&gt;</code> object. At runtime, the C# binder resolves the target (method, property, overload) against the operand\'s real type and caches the result per type combination — so a loop over the same type pays the lookup cost once, not per iteration.',
    },
    {
      q: 'Is dynamic the same as reflection?',
      a: 'They both inspect types at runtime, but dynamic is a language feature with binder caching and natural syntax (<code>d.Save()</code>), while reflection is a library API (<code>type.GetMethod("Save").Invoke(obj, null)</code>). Dynamic is usually faster than uncached reflection thanks to call-site caching. However, reflection can do things dynamic cannot: enumerate members, access privates, and emit new types — dynamic only calls what exists on the actual object.',
    },
    {
      q: 'Why is dynamic called "contagious"?',
      a: 'Almost any expression with a dynamic operand has a dynamic result: <code>d + 5</code>, <code>d.Prop</code>, <code>Method(d)</code> all produce <code>dynamic</code>. Assign one dynamic import into your flow and downstream variables silently lose static typing unless you cast back to a typed variable. This is one of the main reasons to quarantine dynamic at interop boundaries and cast out of it as early as possible.',
    },
    {
      q: 'Should I deserialize JSON to dynamic?',
      a: 'No. With System.Text.Json you get a <code>JsonElement</code> disguised as dynamic, and member navigation fails with <code>RuntimeBinderException</code> — JsonElement exposes its data through an API, not through properties named after the JSON keys. Use <code>JsonNode</code> for loose/unknown shapes (<code>node["a"]?["b"]</code>) or typed records for known shapes.',
    },
    {
      q: 'Does dynamic respect private members or extension methods?',
      a: 'No on both. Runtime binding follows normal accessibility rules — private members throw <code>RuntimeBinderException</code>. Extension methods are compile-time sugar (static calls resolved from <code>using</code> directives) and are invisible to the DLR binder at runtime. Always cast to a typed local before calling LINQ operators or any other extension method.',
    },
    {
      q: 'What is duck typing and how does dynamic enable it?',
      a: '"If it walks like a duck and quacks like a duck…" — treating objects by their shape rather than declared type. With dynamic you can call <code>obj.Quack()</code> on any object that has a Quack method, no shared interface required. Useful for bridging two unmodifiable library types that share shape; risky everywhere else because the contract exists only in your head. A thin adapter interface is the safer approach whenever you control the callers.',
    },
    {
      q: 'What are the modern alternatives to dynamic for the common use cases?',
      a: '<ul><li><strong>JSON exploration:</strong> <code>JsonNode</code> / <code>JsonElement</code></li><li><strong>Known shapes:</strong> typed records + source-generated serialization</li><li><strong>Duck typing:</strong> adapter interface wrapping each type</li><li><strong>Plugin dispatch (unknown types):</strong> reflection with <code>ConcurrentDictionary</code> cache, or <code>DispatchProxy</code></li><li><strong>Scripting/runtime code gen:</strong> source generators (compile time) or Roslyn scripting</li><li><strong>COM interop:</strong> dynamic is still the best option here</li></ul>',
    },
  ];

  challenge: Challenge = {
    title: 'Dynamic Settings Bag',
    language: 'csharp',
    description: 'Build a Settings class deriving from DynamicObject backed by a Dictionary<string, object?>. Requirements: reading a missing key must NOT throw — it returns null instead (override TryGetMember to always succeed); writes store the value; implement GetDynamicMemberNames; and add a typed escape hatch `T? Get<T>(string key)` that returns default(T) when absent or of the wrong type.',
    hints: [
      'TryGetMember: TryGetValue, else result = null — but RETURN TRUE so no exception is thrown',
      'TrySetMember stores into the dictionary and returns true',
      'Get<T>: TryGetValue + `value is T t ? t : default`',
      'GetDynamicMemberNames just returns the dictionary keys',
    ],
    starterCode: `using System.Dynamic;

public class Settings : DynamicObject
{
    private readonly Dictionary<string, object?> _data = new();

    // TODO: TryGetMember — missing keys yield null, never throw
    // TODO: TrySetMember
    // TODO: GetDynamicMemberNames
    // TODO: T? Get<T>(string key)
}

// dynamic s = new Settings();
// s.Theme = "dark";
// Console.WriteLine(s.Theme);            // dark
// Console.WriteLine(s.Missing ?? "(unset)");  // (unset) — no exception
// int retries = ((Settings)s).Get<int>("Retries");  // 0 when absent`,
    solution: `using System.Dynamic;

public class Settings : DynamicObject
{
    private readonly Dictionary<string, object?> _data = new();

    public override bool TryGetMember(
        GetMemberBinder binder, out object? result)
    {
        // Missing members resolve to null instead of throwing —
        // returning true tells the binder "I handled it".
        _data.TryGetValue(binder.Name, out result);
        return true;
    }

    public override bool TrySetMember(SetMemberBinder binder, object? value)
    {
        _data[binder.Name] = value;
        return true;
    }

    public override IEnumerable<string> GetDynamicMemberNames()
        => _data.Keys;

    // Typed escape hatch for the static world:
    public T? Get<T>(string key)
        => _data.TryGetValue(key, out var value) && value is T typed
            ? typed
            : default;
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'dynamic defers every member binding to runtime via the DLR — compile-time checks disappear; ExpandoObject is a runtime property bag; DynamicObject lets you define what member access means; dynamic is an interop tool, not a modelling tool, and is incompatible with NativeAOT.',
    mustKnow: [
      '<code>dynamic</code> compiles every member access into a DLR call site that resolves at runtime — typos become <code>RuntimeBinderException</code>, not compiler errors',
      '<code>var</code> is NOT dynamic — it is full static typing with the type name inferred; the difference is fundamental',
      'Dynamic is contagious: any expression involving a dynamic operand returns <code>dynamic</code> — cast to typed variables as early as possible',
      'Extension methods are compile-time static calls invisible to the DLR binder — calling them on a dynamic variable throws <code>RuntimeBinderException</code>',
      '<code>ExpandoObject</code> is simultaneously a dynamic property bag and an <code>IDictionary&lt;string, object?&gt;</code> — use the dictionary view for existence checks',
      '<code>DynamicObject</code> lets you intercept member access with <code>TryGetMember</code>/<code>TrySetMember</code>/<code>TryInvokeMember</code> — return false to let the binder throw',
      '<code>dynamic</code> is incompatible with NativeAOT and Blazor AOT — the DLR binder emits IL at runtime, which AOT removes',
    ],
    interviewFocus: [
      'What is the difference between var, object, and dynamic?',
      'Why is dynamic called "contagious" and how do you escape it?',
      'When is dynamic the right tool? Give a concrete example where alternatives are worse.',
      'Why do extension methods not work on dynamic at runtime?',
      'Can you use dynamic in a NativeAOT build? Why or why not?',
    ],
  };
}
