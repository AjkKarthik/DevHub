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
  selector: 'app-csharp-dynamic',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './dynamic.html',
  styleUrl: './dynamic.scss',
})
export class CsharpDynamic {

  quickRef: QuickRefItem[] = [
    { name: 'dynamic',                  type: 'keyword',  desc: 'Defers ALL member binding to runtime — the compiler stops checking', since: 'C# 4' },
    { name: 'RuntimeBinderException',   type: 'class',    desc: 'Thrown at runtime when a dynamic member/overload does not exist', since: 'C# 4' },
    { name: 'ExpandoObject',            type: 'class',    desc: 'Dynamic property bag — add members by assignment, also an IDictionary', since: 'C# 4' },
    { name: 'DynamicObject',            type: 'class',    desc: 'Base class for custom dynamic behaviour via TryGetMember/TryInvokeMember', since: 'C# 4' },
    { name: 'TryGetMember()',           type: 'method',   desc: 'Override to intercept reads of unknown members on a DynamicObject', since: 'C# 4' },
    { name: 'var vs dynamic vs object', type: 'syntax',   desc: 'var = inferred static type; object = static base type; dynamic = no static type', since: 'C# 4' },
    { name: 'DLR',                      type: 'syntax',   desc: 'Dynamic Language Runtime — the call-site/binder machinery behind dynamic', since: 'C# 4' },
    { name: 'JsonNode',                 type: 'class',    desc: 'Modern typed-ish JSON DOM — usually a better answer than dynamic JSON', since: '.NET 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What dynamic really means — binding moved to runtime',
      points: [
        'With <code>dynamic d</code>, every operation on <code>d</code> — member access, method call, operator, conversion — compiles to a <strong>DLR call site</strong> that resolves at runtime against the object\'s actual type. The compiler checks nothing.',
        'Get it right and it behaves like normal code; get it wrong (typo, missing member, bad overload) and you get a <code>RuntimeBinderException</code> where a static-typed program would have had a red squiggle.',
        '<code>var</code> is the opposite of dynamic, not its cousin: <code>var</code> is full static typing with the name inferred; <code>dynamic</code> is the absence of static typing. <code>object</code> sits between — statically typed as the base class, so members need casts but mistakes are compile-time.',
        'Call sites cache their resolution per operand types, so repeated dynamic calls are much cheaper than naive reflection — but still several times slower than static dispatch, with no IntelliSense or refactoring safety.',
      ],
    },
    {
      heading: 'ExpandoObject — the dynamic property bag',
      points: [
        '<code>dynamic e = new ExpandoObject();</code> then <code>e.Name = "Ada";</code> — members spring into existence on assignment. Reading an unset member throws.',
        'Expando doubles as <code>IDictionary&lt;string, object?&gt;</code> — cast it to enumerate members, check existence, or remove them. That duality makes it handy for building shapes for templating engines or anonymous JSON payloads.',
        'It also implements <code>INotifyPropertyChanged</code>, which once made it popular for quick WPF view-models.',
        'But if the shape is known at compile time, a record beats an Expando on every axis: speed, safety, tooling, serialization.',
      ],
    },
    {
      heading: 'DynamicObject — scripting your own member resolution',
      points: [
        'Derive from <code>DynamicObject</code> and override <code>TryGetMember</code>, <code>TrySetMember</code>, <code>TryInvokeMember</code> to decide at runtime what a member access means — back it with a dictionary, an XML document, a database row, an HTTP call.',
        'This is how dynamic wrappers like "config.Database.ConnectionString reads nested JSON" are built — pleasant fluent access over stringly data.',
        'The trade is discoverability: consumers cannot see what members exist, tests are the only safety net, and every typo compiles. Wrap volatile data sources for convenience layers, not core domain models.',
        'Binding inside your overrides is up to you — return false and the binder throws RuntimeBinderException for you.',
      ],
    },
    {
      heading: 'Where dynamic earns its keep — and where it does not',
      points: [
        '<strong>Legit uses:</strong> COM/Office interop (the APIs are dynamic by nature and C# 4 added dynamic largely for this), interop with dynamic languages (IronPython), duck-typing third-party objects that share shape but no interface, and quick exploratory scripts.',
        '<strong>Avoid for JSON:</strong> deserializing to <code>dynamic</code> looks convenient but System.Text.Json gives you JsonElement boxes that fight the binder. <code>JsonNode</code> (<code>node["user"]?["name"]</code>) or typed DTOs are both better.',
        'Dynamic is contagious: an expression containing a dynamic operand is itself dynamic, so one dynamic variable quietly switches whole code paths to runtime binding.',
        'Rule of thumb: dynamic is an interop tool, not a modelling tool. If you control the type, define the type.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'dynamic vs var vs object',
      language: 'csharp',
      code: `// var — static typing, name inferred. Mistakes = compile errors.
var s = "hello";
// s.Lenght;                  // ❌ does not compile (typo caught)

// object — static base type. Members need casts.
object o = "hello";
// o.Length;                  // ❌ object has no Length
int len1 = ((string)o).Length; // cast first

// dynamic — NO static type. Everything resolves at runtime.
dynamic d = "hello";
int len2 = d.Length;           // ✅ binds at runtime → 5
// d.Lenght;                   // compiles fine…
//   → RuntimeBinderException at runtime: 'string' has no 'Lenght'

// dynamic is contagious — results of dynamic expressions are dynamic:
dynamic x = 10;
var y = x + 5;                 // y is dynamic, not int!

// Runtime overload resolution can surprise:
static string Describe(int n)    => "int";
static string Describe(string t) => "string";
dynamic value = GetUntypedValue();
Describe(value);   // overload picked at RUNTIME from value's real type`,
    },
    {
      label: 'ExpandoObject',
      language: 'csharp',
      code: `using System.Dynamic;

dynamic person = new ExpandoObject();
person.Name = "Ada Lovelace";       // members appear on assignment
person.Born = 1815;
person.Greet = (Func<string>)(() => $"Hi, I'm {person.Name}");

Console.WriteLine(person.Greet());  // Hi, I'm Ada Lovelace

// The same object IS a dictionary — two views of one bag:
var dict = (IDictionary<string, object?>)person;
dict["Country"] = "England";                    // add via dictionary
Console.WriteLine(person.Country);              // read via dynamic

if (dict.ContainsKey("Born"))                   // existence check —
    Console.WriteLine($"Born {person.Born}");   // dynamic can't do this

foreach (var (key, value) in dict)
    Console.WriteLine($"{key} = {value}");

// Serializes naturally (keys become JSON properties):
var json = System.Text.Json.JsonSerializer.Serialize(person);
// {"Name":"Ada Lovelace","Born":1815,…}

// ⚠ Known shape? A record is faster, safer, refactorable:
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
        // Member name decides the lookup — config.Timeout → data["Timeout"]
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

    // Let consumers discover members (helps debuggers/tools):
    public override IEnumerable<string> GetDynamicMemberNames()
        => data.Keys;
}

dynamic row = new DynamicRow(new()
{
    ["Host"] = "db01.internal",
    ["Port"] = 5432,
});

Console.WriteLine($"{row.Host}:{row.Port}");   // db01.internal:5432
row.Database = "orders";                        // TrySetMember
// row.Hots → RuntimeBinderException (typo surfaces at runtime only)`,
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
// doc.user.name  → doc is a JsonElement; the binder finds no "user"
//                  member → RuntimeBinderException

// ✅ JsonNode — made for unknown/loose shapes:
JsonNode? node = JsonNode.Parse(json);
string? name  = (string?)node?["user"]?["name"];        // "Ada"
string? role0 = (string?)node?["user"]?["roles"]?[0];   // "admin"

// ✅ Typed DTOs — best when the shape is known:
public record UserDoc(User User);
public record User(string Name, string[] Roles);

var doc = JsonSerializer.Deserialize<UserDoc>(json,
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
Console.WriteLine(doc!.User.Name);                      // Ada — and the
// compiler, IntelliSense and rename-refactor all work.

// Where dynamic DOES fit: COM interop —
// dynamic excel = Activator.CreateInstance(
//     Type.GetTypeFromProgID("Excel.Application"));
// excel.Visible = true;          // late-bound by design
// excel.Workbooks.Add();`,
    },
  ];

  challenge: Challenge = {
    title: 'Dynamic Settings Bag',
    language: 'csharp',
    description: 'Build a Settings class deriving from DynamicObject backed by a Dictionary<string, object?>. Requirements: reading a missing key must NOT throw — it returns null instead (override TryGetMember to always succeed); writes store the value; implement GetDynamicMemberNames; and add a typed escape hatch `T? Get<T>(string key)` that returns default(T) when absent or of the wrong type.',
    hints: [
      'TryGetMember: TryGetValue, else result = null — but RETURN TRUE so no exception',
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
// Console.WriteLine(s.Theme);     // dark
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
        // returning true tells the binder "handled".
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
      explanation: 'var x = "hi" gives x the full static type string — typos are compile errors. dynamic d = "hi" compiles every member access into a runtime DLR binding — typos become RuntimeBinderException at runtime.',
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
      explanation: 'The compiler emits a call site and trusts you. Only when the line runs does the DLR look for the member on the actual object — and throws RuntimeBinderException if it is absent.',
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
      explanation: 'Expando is a property bag: assignment creates members dynamically, and the dictionary view lets you enumerate, check and remove them — two views over the same data.',
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
      explanation: 'dynamic was added in C# 4 largely to make COM automation (Excel, Word) bearable — those object models are inherently late-bound. JSON has better tools (JsonNode, DTOs), domain models deserve static types, and dynamic is slower, not faster.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the DLR and how does dynamic dispatch actually work?',
      a: 'The Dynamic Language Runtime sits on top of the CLR and provides call sites, binders and caching. Each dynamic operation compiles into a call-site object; at runtime the C# binder resolves it against the operand\'s real type, and the resolution is cached per type combination — so a loop over the same types pays the lookup once, not per iteration.',
    },
    {
      q: 'Is dynamic the same as reflection?',
      a: 'They both inspect types at runtime, but dynamic is a language feature with binder caching and natural syntax (<code>d.Save()</code>), while reflection is a library API (<code>type.GetMethod("Save").Invoke(obj, null)</code>). dynamic is usually faster than naive reflection thanks to call-site caching, and far more readable — but reflection can do things dynamic cannot, like enumerating members or touching privates.',
    },
    {
      q: 'Why is dynamic called "contagious"?',
      a: 'Almost any expression with a dynamic operand has a dynamic result: <code>d + 5</code>, <code>d.Prop</code>, <code>Method(d)</code> all produce dynamic. Assign one dynamic into your flow and downstream variables silently lose static typing unless you cast back — one of the main reasons to quarantine dynamic at interop boundaries.',
    },
    {
      q: 'Should I deserialize JSON to dynamic?',
      a: 'No. With System.Text.Json you get a JsonElement disguised as dynamic, and member access fails with RuntimeBinderException. Use <code>JsonNode</code> for loose exploration (<code>node["a"]?["b"]</code>) or typed records for known shapes — both beat dynamic on errors, speed and tooling.',
    },
    {
      q: 'Does dynamic respect private members or extension methods?',
      a: 'No on both. Runtime binding follows normal accessibility rules — private members throw. And extension methods are a compile-time illusion (static method calls resolved by usings), so the runtime binder cannot find them: <code>dynamicList.Where(...)</code> fails even though it compiles on a typed list.',
    },
    {
      q: 'What is duck typing and how does dynamic enable it?',
      a: '"If it walks like a duck…" — treating objects by shape rather than declared type. With dynamic you can call <code>obj.Quack()</code> on any object that happens to have a Quack method, no shared interface required. Useful for bridging two libraries\' look-alike types you cannot modify; risky everywhere else because the contract exists only in your head.',
    },
  ];
}
