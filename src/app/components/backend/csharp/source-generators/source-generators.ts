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
  selector: 'app-csharp-source-generators',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './source-generators.html',
  styleUrl: './source-generators.scss',
})
export class CsharpSourceGenerators {

  quickRef: QuickRefItem[] = [
    { name: 'IIncrementalGenerator',   type: 'interface', desc: 'The current generator API — pipeline-based, cached between keystrokes', since: '.NET 6' },
    { name: 'Initialize(ctx)',         type: 'method',    desc: 'Single entry point: declare what you watch and what you generate', since: '.NET 6' },
    { name: 'SyntaxValueProvider',     type: 'class',     desc: 'Filters syntax (e.g. classes with attribute X) into your pipeline', since: '.NET 6' },
    { name: 'RegisterSourceOutput()',  type: 'method',    desc: 'The "emit" step: produce hint-named .g.cs files from pipeline values', since: '.NET 6' },
    { name: 'partial class / method',  type: 'keyword',   desc: 'The seam: you declare the partial, the generator supplies the body', since: 'C# 9' },
    { name: '[GeneratedRegex]',        type: 'decorator', desc: 'Built-in generator: regex matcher emitted at compile time', since: '.NET 7' },
    { name: 'JsonSerializerContext',   type: 'class',     desc: 'JSON source generation — serializers without runtime reflection', since: '.NET 6' },
    { name: '[LoggerMessage]',         type: 'decorator', desc: 'High-performance logging methods generated from a partial signature', since: '.NET 6' },
    { name: 'EmitCompilerGeneratedFiles', type: 'syntax', desc: 'csproj flag that writes generated .g.cs files to disk for inspection', since: '.NET 5' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What a source generator is',
      points: [
        'A source generator is a compiler plug-in (a Roslyn analyzer assembly) that runs <em>during compilation</em>, inspects your code, and adds new C# files to the compilation. Your IDE sees the generated members immediately — IntelliSense, go-to-definition, the works.',
        'Generators are <strong>additive only</strong>: they can create new files but never modify or delete your code. The integration seam is <code>partial</code> — you declare a partial class/method, the generator supplies the other part.',
        'Think of it as moving work from runtime to compile time: instead of reflecting over types while users wait, the equivalent code is written before the program ever runs.',
        'They ship as NuGet analyzer packages — consumers just install the package; the magic happens transparently on build.',
      ],
    },
    {
      heading: 'Why .NET is moving from reflection to generation',
      points: [
        '<strong>Performance:</strong> reflection pays lookup-and-invoke costs at runtime on every use; generated code is plain C# — JIT-optimised, allocation-free where written so.',
        '<strong>AOT & trimming:</strong> Native AOT cannot run code that does not exist at build time, and trimming deletes "unused" members that only reflection would touch. Generated code is statically visible, so both just work — this is why JSON, logging, regex and DI in modern .NET all grew source-gen modes.',
        '<strong>Startup:</strong> no runtime scanning/emitting on first use (the old Regex.Compiled and serializer warm-up problem).',
        '<strong>Diagnostics:</strong> a generator can validate input at compile time — a malformed regex pattern in [GeneratedRegex] is a build error, not a production exception.',
      ],
    },
    {
      heading: 'The built-ins you already use',
      points: [
        '<code>[GeneratedRegex("…")]</code> on a partial method returning Regex — the matcher is specialised at build time (covered on the Regular Expressions page).',
        'System.Text.Json: declare <code>partial class AppJsonContext : JsonSerializerContext</code> with <code>[JsonSerializable(typeof(Order))]</code> — serializers for those types are generated; pass the context to (de)serialize without reflection.',
        '<code>[LoggerMessage(Level = …, Message = "…")]</code> on a partial logging method generates the fastest possible structured-logging call: pre-parsed template, cached delegates, level-check guard.',
        'Others everywhere: <code>System.Text.RegularExpressions</code>, ASP.NET Core minimal-API request delegates, P/Invoke (<code>[LibraryImport]</code>), gRPC, Mediator/Mapper community libraries — the technique is the new normal for framework plumbing.',
      ],
    },
    {
      heading: 'Authoring one — the incremental pipeline',
      points: [
        'A generator project is a <code>netstandard2.0</code> class library referencing Microsoft.CodeAnalysis.CSharp, marked as an analyzer in the consuming project (<code>OutputItemType="Analyzer"</code>).',
        'Implement <code>IIncrementalGenerator.Initialize</code>: build a pipeline — typically <code>context.SyntaxProvider.ForAttributeWithMetadataName(...)</code> to find decorated types, <code>.Select(...)</code> to extract a small equatable model, then <code>RegisterSourceOutput</code> to emit code from that model.',
        'The pipeline is <em>incremental</em>: outputs are cached and recomputed only when relevant inputs change — critical because generators run on every keystroke in the IDE. Extract minimal data records early; never drag whole syntax trees through the pipeline.',
        'Debugging: set <code>&lt;EmitCompilerGeneratedFiles&gt;true&lt;/EmitCompilerGeneratedFiles&gt;</code> to write .g.cs files under obj/, and unit-test generators by running them against an in-memory CSharpCompilation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Using the built-ins',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

// 1) JSON without reflection — declare a context, list your types:
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(List<Order>))]
public partial class AppJsonContext : JsonSerializerContext { }
// The generator fills in the other "partial" half with
// hand-tuned serializers for exactly these types.

var order = new Order(42, 99.95m);
string json = JsonSerializer.Serialize(
    order, AppJsonContext.Default.Order);          // no reflection,
Order? back = JsonSerializer.Deserialize(          // AOT/trim safe
    json, AppJsonContext.Default.Order);

// 2) High-performance logging — partial method, generated body:
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Warning,
        Message = "Payment {orderId} declined: {reason}")]
    public static partial void PaymentDeclined(
        ILogger logger, int orderId, string reason);
}
Log.PaymentDeclined(logger, 42, "insufficient funds");
// Generated code: cached template, level guard, zero boxing.

public record Order(int Id, decimal Total);`,
    },
    {
      label: 'Generator skeleton',
      language: 'csharp',
      code: `// Project: MyGenerators.csproj  (netstandard2.0)
//   <PackageReference Include="Microsoft.CodeAnalysis.CSharp" ... />
using Microsoft.CodeAnalysis;

[Generator]
public class AutoToStringGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext ctx)
    {
        // STEP 1 — watch: classes decorated with [AutoToString]
        var classes = ctx.SyntaxProvider
            .ForAttributeWithMetadataName(
                "Generated.AutoToStringAttribute",
                predicate: static (node, _) => true,
                transform: static (gac, _) =>
                {
                    var symbol = (INamedTypeSymbol)gac.TargetSymbol;
                    // STEP 2 — shrink to a cheap, equatable model
                    return new Model(
                        symbol.ContainingNamespace.ToDisplayString(),
                        symbol.Name,
                        symbol.GetMembers()
                              .OfType<IPropertySymbol>()
                              .Select(p => p.Name)
                              .ToArray());
                });

        // STEP 3 — emit one file per match
        ctx.RegisterSourceOutput(classes, static (spc, model) =>
            spc.AddSource($"{model.Name}.AutoToString.g.cs",
                Emit(model)));
    }

    record Model(string Ns, string Name, string[] Props);

    static string Emit(Model m) => $$"""
        namespace {{m.Ns}};
        partial class {{m.Name}}
        {
            public override string ToString()
                => $"{{m.Name}}({{string.Join(", ",
                     m.Props.Select(p => p + "={" + p + "}"))}})";
        }
        """;
}`,
    },
    {
      label: 'Consuming it',
      language: 'csharp',
      code: `// Consumer project references the generator as an ANALYZER:
//   <ProjectReference Include="..\\MyGenerators\\MyGenerators.csproj"
//       OutputItemType="Analyzer"
//       ReferenceOutputAssembly="false" />

namespace Generated
{
    [AttributeUsage(AttributeTargets.Class)]
    public sealed class AutoToStringAttribute : Attribute { }
}

// Your half of the partial:
[Generated.AutoToString]
public partial class Invoice
{
    public int Number { get; set; }
    public decimal Total { get; set; }
    public string Customer { get; set; } = "";
}

// The generator's half (Invoice.AutoToString.g.cs, written on build):
// partial class Invoice
// {
//     public override string ToString()
//         => $"Invoice(Number={Number}, Total={Total}, …)";
// }

var inv = new Invoice { Number = 7, Total = 120m, Customer = "Ada" };
Console.WriteLine(inv);
// Invoice(Number=7, Total=120, Customer=Ada)

// See the generated files on disk for debugging:
//   <PropertyGroup>
//     <EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>
//   </PropertyGroup>
//   → obj/Debug/net8.0/generated/**/*.g.cs`,
    },
    {
      label: 'Reflection vs generation',
      language: 'csharp',
      code: `// The SAME feature both ways — property auditing:

// ❌ Runtime reflection: pays on every call, breaks under AOT/trimming
public static string AuditReflect(object o)
{
    var props = o.GetType().GetProperties();      // runtime lookup
    var parts = props.Select(p => $"{p.Name}={p.GetValue(o)}");
    return string.Join(", ", parts);              // boxing, slow paths
}

// ✅ Source-generated (the AutoToString generator): plain C# emitted
//    at build time — JIT-inlined property reads, zero reflection.
//    AOT compiles it; trimming keeps it; typos fail the BUILD.

// Decision guide:
// Need to handle types unknown until runtime (plugins)?  → reflection
// Types known at compile time (your own code)?           → generator
// One-off internal tool, perf irrelevant?                → reflection is fine
// Library used by AOT/Blazor/mobile apps?                → generator

// Middle option to know: a generator is NOT the only escape from
// reflection — caching delegates built from expression trees
// (Expression.Lambda(...).Compile()) speeds up hot reflection paths
// without a compiler plug-in. Generators beat it on AOT + startup.`,
    },
  ];

  challenge: Challenge = {
    title: 'Design the Generated Half',
    language: 'csharp',
    description: 'You are writing an [AutoEquals] generator concept. Given the consumer class below, write BY HAND the code your generator would emit: a partial class implementing IEquatable<Product> where Equals compares Id, Name and Price, GetHashCode combines the same members with HashCode.Combine, and == / != operators delegate to Equals. (Writing the emitted code by hand first is exactly how real generator authors start.)',
    hints: [
      'partial class Product : IEquatable<Product>',
      'Equals(Product?) checks ReferenceEquals(other, null) first, then members',
      'override Equals(object?) forwards via "obj as Product"',
      'GetHashCode: HashCode.Combine(Id, Name, Price)',
      'operators: static bool operator ==(Product? a, Product? b) => a?.Equals(b) ?? b is null',
    ],
    starterCode: `// Consumer side (already written):
[AutoEquals]
public partial class Product
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public decimal Price { get; init; }
}

// TODO: write Product.AutoEquals.g.cs — the half your generator emits
public partial class Product // : IEquatable<Product>
{
    // Equals(Product?), Equals(object?), GetHashCode, ==, !=
}`,
    solution: `// Product.AutoEquals.g.cs — what the generator emits
#nullable enable
public partial class Product : IEquatable<Product>
{
    public bool Equals(Product? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;

        return Id == other.Id
            && Name == other.Name
            && Price == other.Price;
    }

    public override bool Equals(object? obj)
        => Equals(obj as Product);

    public override int GetHashCode()
        => HashCode.Combine(Id, Name, Price);

    public static bool operator ==(Product? left, Product? right)
        => left?.Equals(right) ?? right is null;

    public static bool operator !=(Product? left, Product? right)
        => !(left == right);
}

// Generator notes:
// - Members list comes from the INamedTypeSymbol's properties
// - Emit with a hint name like $"{typeName}.AutoEquals.g.cs"
// - The consumer class MUST be declared partial — emit a
//   diagnostic (error) from the generator when it is not.`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What can a source generator do to your existing code?',
      options: [
        'Modify method bodies in place',
        'Delete dead code automatically',
        'Nothing — generators are additive; they can only add new source files',
        'Rename members for consistency',
      ],
      answer: 2,
      explanation: 'Generators never rewrite your files. They add new ones to the compilation, and the partial keyword is the seam that lets the generated half extend your half.',
    },
    {
      q: 'Why are source generators essential for Native AOT?',
      options: [
        'AOT binaries cannot include attributes',
        'Reflection-emit and runtime codegen do not exist under AOT — code must exist at build time, which is exactly what generators produce',
        'AOT requires netstandard2.0 assemblies',
        'They compress the binary',
      ],
      answer: 1,
      explanation: 'AOT compiles everything ahead of time; there is no JIT to create code on the fly, and trimming removes members only reflection would reach. Generated code is ordinary compile-time C#, so it survives both — the reason JSON/logging/regex all grew source-gen modes.',
    },
    {
      q: 'In an IIncrementalGenerator, why extract a small equatable model early in the pipeline?',
      options: [
        'Syntax nodes cannot cross method boundaries',
        'Caching: the pipeline reruns on every keystroke, and equality on small models lets unchanged steps be skipped',
        'It is required by the [Generator] attribute',
        'Models serialize into the .g.cs output',
      ],
      answer: 1,
      explanation: 'Incremental generators memoise each pipeline stage by value equality. Dragging syntax trees or symbols through defeats the cache (and leaks compilations); shrinking to a record of just the needed strings keeps IDE typing fast.',
    },
    {
      q: 'Which is NOT a real built-in use of source generation in modern .NET?',
      options: [
        '[GeneratedRegex] compiling patterns at build time',
        'JsonSerializerContext emitting reflection-free serializers',
        '[LoggerMessage] generating high-performance log methods',
        '[AutoSql] generating database schemas from records',
      ],
      answer: 3,
      explanation: 'Regex, System.Text.Json and LoggerMessage source generation all ship in the BCL. [AutoSql] is made up — schema generation is EF Core migrations territory, not a BCL generator.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is a source generator different from reflection?',
      a: 'Reflection asks questions about types <em>while the app runs</em> and pays for it on every call; a generator answers the same questions <em>during compilation</em> and writes ordinary C# with the answers baked in. Result: no runtime cost, AOT/trimming compatibility, compile-time validation — at the price of a more involved authoring experience.',
    },
    {
      q: 'Why must my class be partial for a generator to extend it?',
      a: 'Because generators cannot edit your files — additive only. <code>partial</code> lets one class span multiple files, so your half (the properties, the attribute) and the generated half (the plumbing) merge into a single type at compile time. Good generators emit a diagnostic telling you to add <code>partial</code> when you forget.',
    },
    {
      q: 'What happened to ISourceGenerator — why "incremental"?',
      a: 'The original V1 API regenerated everything on each compilation, which made large IDEs crawl. <code>IIncrementalGenerator</code> models generation as a dataflow pipeline with per-stage value-equality caching: only steps whose inputs changed re-execute. New generators should always use the incremental API.',
    },
    {
      q: 'How do I see and debug the code a generator produced?',
      a: 'Set <code>&lt;EmitCompilerGeneratedFiles&gt;true&lt;/EmitCompilerGeneratedFiles&gt;</code> in the csproj and the .g.cs files appear under obj/…/generated. In the IDE, go-to-definition on a generated member opens it directly. For authoring, write unit tests that run the generator over an in-memory CSharpCompilation and assert on the emitted text/diagnostics.',
    },
    {
      q: 'When should I write my own generator versus using reflection or a library?',
      a: 'Write one when the same boilerplate appears across many types (mappers, equality, builders), runtime cost matters, or AOT support is required — and the inputs are visible at compile time. Stick with reflection for genuinely runtime-only shapes (plugins), and check the ecosystem first: Mapperly, Mediator-gen, AutoCtor and friends may already do what you need.',
    },
    {
      q: 'Do generators slow down my build?',
      a: 'Marginally if well-written — incremental caching keeps IDE typing fast and full builds add only the emission time. Badly written ones (heavy work in the predicate, symbols dragged through the pipeline) are the usual cause of "VS feels slow"; the fix is the small-model discipline described above.',
    },
  ];
}
