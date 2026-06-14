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
  selector: 'app-csharp-source-generators',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './source-generators.html',
  styleUrl: './source-generators.scss',
})
export class CsharpSourceGenerators {

  prerequisites: Prerequisite[] = [
    { label: 'Reflection & Attributes', route: '/csharp/reflection' },
    { label: 'Generics',                route: '/csharp/generics' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'IIncrementalGenerator',        type: 'interface', desc: 'The current generator API — pipeline-based, cached between keystrokes; replaces V1 ISourceGenerator', since: '.NET 6' },
    { name: 'Initialize(ctx)',              type: 'method',    desc: 'Single entry point: declare what you watch and what you generate', since: '.NET 6' },
    { name: 'ForAttributeWithMetadataName', type: 'method',    desc: 'Efficient trigger that finds nodes decorated with a specific attribute by full metadata name', since: '.NET 7' },
    { name: 'SyntaxValueProvider',          type: 'class',     desc: 'Filters syntax tree nodes into your pipeline by predicate + transform', since: '.NET 6' },
    { name: '.Select(transform)',           type: 'method',    desc: 'Pipeline step: maps each value to a smaller model; must produce an equatable value for caching', since: '.NET 6' },
    { name: 'RegisterSourceOutput()',       type: 'method',    desc: 'The "emit" step: produce hint-named .g.cs files from pipeline values', since: '.NET 6' },
    { name: 'RegisterPostInitializationOutput()', type: 'method', desc: 'Emit code that does not depend on user code (e.g., the attribute definition itself)', since: '.NET 6' },
    { name: 'partial class / method',       type: 'keyword',   desc: 'The seam: you declare the partial, the generator supplies the other half', since: 'C# 9' },
    { name: 'spc.ReportDiagnostic()',       type: 'method',    desc: 'Emit a compiler error/warning from within the generator', since: '.NET 6' },
    { name: '[GeneratedRegex]',             type: 'decorator', desc: 'Built-in generator: regex matcher emitted at compile time', since: '.NET 7' },
    { name: 'JsonSerializerContext',        type: 'class',     desc: 'JSON source generation — serializers without runtime reflection', since: '.NET 6' },
    { name: '[LoggerMessage]',              type: 'decorator', desc: 'High-performance logging methods generated from a partial signature', since: '.NET 6' },
    { name: 'EmitCompilerGeneratedFiles',   type: 'syntax',    desc: 'csproj flag that writes generated .g.cs files to disk for inspection', since: '.NET 5' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What a source generator is',
      points: [
        'A source generator is a Roslyn analyzer assembly that runs <em>during compilation</em>, inspects your code via the compiler\'s semantic model, and adds new C# files to the compilation. Your IDE sees the generated members immediately — IntelliSense, go-to-definition, rename, all work.',
        'Generators are <strong>additive only</strong>: they create new files but never modify or delete your existing source. The integration seam is <code>partial</code> — you declare a partial class or method, and the generator supplies the complementary half.',
        'Think of it as moving work from runtime to compile time: instead of reflecting over types while users wait, the equivalent code is written into the binary before the program ever starts. No runtime cost, no warm-up, no "first-call" penalty.',
        'Generators ship as NuGet analyzer packages — consumers just install the package; the generation happens transparently on every build. The generated files do not need to be committed to source control.',
        'There are two generator APIs: the V1 <code>ISourceGenerator</code> (deprecated) and the modern <code>IIncrementalGenerator</code>. Always use incremental — V1 regenerates everything on every keystroke; incremental caches each stage.',
      ],
    },
    {
      heading: 'Why .NET is moving from reflection to generation',
      points: [
        '<strong>Performance:</strong> reflection pays lookup-and-invoke costs at runtime on every use path. Generated code is plain C# — JIT-optimised, inlineable, and allocation-free where written that way. No warm-up, no dictionary lookups per property.',
        '<strong>AOT & trimming:</strong> NativeAOT cannot run code that does not exist at build time, and the trimmer deletes "unused" members that only reflection would reach. Generated code is statically visible to both — this is why JSON serialization, logging, regex, and DI containers in modern .NET all grew source-generation modes.',
        '<strong>Startup time:</strong> no scanning or emitting on first use — the old <code>Regex.Compiled</code> and serializer warm-up problems disappear because the work is done at build time.',
        '<strong>Compile-time validation:</strong> a generator can analyse your attribute arguments and emit diagnostics immediately. A malformed pattern in <code>[GeneratedRegex]</code> is a build error, not a production exception that surfaces only at 2 AM.',
        '<strong>Tooling:</strong> generated code participates in the language server — go-to-definition, find-all-references, and rename all work across the generated/user boundary, giving a better authoring experience than string-based reflection APIs.',
      ],
    },
    {
      heading: 'The built-ins you already use',
      points: [
        '<code>[GeneratedRegex("…")]</code> on a partial method returning <code>Regex</code> — the pattern is compiled into a specialised matcher at build time. Invalid patterns become build errors, and the generated code is AOT-safe. Covered in detail on the Regular Expressions page.',
        '<code>System.Text.Json</code>: declare <code>partial class AppJsonContext : JsonSerializerContext</code> with one <code>[JsonSerializable(typeof(T))]</code> per type — the generator emits hand-tuned serializers. Pass the context to Serialize/Deserialize to avoid all runtime reflection.',
        '<code>[LoggerMessage(Level = …, Message = "…")]</code> on a partial logging method generates the fastest possible structured-logging call: pre-parsed template, cached delegate, level-check guard, and no boxing of parameters.',
        'ASP.NET Core minimal API request delegates, P/Invoke (<code>[LibraryImport]</code>), gRPC stub generation — the pattern is now the standard approach for framework plumbing across the .NET ecosystem.',
        'Community generators are mature too: Mapperly (mapping), AutoCtor (constructors), Mediator (IRequest/IHandler), StronglyTypedId (value objects), and many more. Check the ecosystem before writing your own.',
      ],
    },
    {
      heading: 'Authoring one — the incremental pipeline',
      points: [
        'A generator project is a <code>netstandard2.0</code> class library referencing <code>Microsoft.CodeAnalysis.CSharp</code>, consumed via <code>&lt;ProjectReference OutputItemType="Analyzer" ReferenceOutputAssembly="false"&gt;</code>.',
        'Implement <code>IIncrementalGenerator.Initialize</code>: build a pipeline — typically <code>context.SyntaxProvider.ForAttributeWithMetadataName("Your.Attribute", …)</code> to find decorated types, <code>.Select(…)</code> to extract a small model, then <code>RegisterSourceOutput</code> to emit.',
        'The pipeline is <em>incremental</em> — outputs are cached and recomputed only when relevant inputs change. Stages are memoised by value equality. This is why generators can run on every keystroke in the IDE without making it sluggish.',
        '<code>RegisterPostInitializationOutput</code> emits source that does not depend on user code — for example, the attribute definition itself. Without it, the attribute isn\'t available to trigger the main pipeline, creating a chicken-and-egg problem.',
        'Use <code>spc.ReportDiagnostic(Diagnostic.Create(…))</code> to emit compiler errors and warnings. A generator that silently produces incorrect code when given bad input is far harder to debug than one that fails the build with a clear message.',
      ],
    },
    {
      heading: 'The small-model discipline — correctness and caching',
      points: [
        'The most important generator authoring rule: <strong>extract a small, equatable data model early in the pipeline</strong>, before the first <code>.Select()</code> that produces cached output. Extract only the strings and flags you need — symbol names, namespace, property names.',
        'Symbols (<code>INamedTypeSymbol</code>, <code>IPropertySymbol</code>) and syntax nodes (<code>ClassDeclarationSyntax</code>) hold references to the entire compilation — dragging them past a pipeline stage leaks the compilation object, defeats caching, and causes memory pressure that slows the IDE.',
        'Make your model a <code>record</code> (or implement <code>IEquatable&lt;T&gt;</code> explicitly). The incremental infrastructure uses value equality to decide whether a stage can be skipped. Without it every keystroke reruns the emit step.',
        'Keep predicates (the <code>predicate:</code> argument to <code>ForAttributeWithMetadataName</code>) simple and fast — they run on every syntax node, not just the ones with your attribute. A slow predicate makes every keypress slow.',
        'The generated code text itself is not cached by the pipeline — only the inputs to <code>RegisterSourceOutput</code> are. If your emit function takes a model, changing any field of that model causes the corresponding .g.cs to be regenerated.',
      ],
    },
    {
      heading: 'Testing and debugging generators',
      points: [
        'Set <code>&lt;EmitCompilerGeneratedFiles&gt;true&lt;/EmitCompilerGeneratedFiles&gt;</code> in the csproj and the .g.cs files materialise under <code>obj/Debug/net8.0/generated/</code>. In most IDEs, go-to-definition on a generated member opens the file directly.',
        'Unit-test generators using <code>CSharpGeneratorDriver.RunGenerators(compilation, generator)</code>. Prepare a <code>CSharpCompilation</code> from source text strings, run the driver, and assert on the generated sources and diagnostics. The <code>Microsoft.CodeAnalysis.CSharp</code> package provides everything needed.',
        'The <code>Verify.Roslyn</code> (or <code>Verify.SourceGenerators</code>) NuGet package integrates with the Verify snapshot testing library — the generated output is saved as a verified file on first run and diffed on subsequent runs. It is the fastest way to catch regressions.',
        'Run the generator project in the debugger by launching a second VS instance with the generator assembly loaded: set a breakpoint, attach to the build, trigger a build. Alternatively, add <code>Debugger.Launch()</code> temporarily inside <code>Initialize</code>.',
        'The most common generator bug is a wrong or missing namespace in the attribute metadata name passed to <code>ForAttributeWithMetadataName</code> — the trigger never fires and no code is generated, silently. Verify the exact full name with <code>INamedTypeSymbol.ToDisplayString()</code>.',
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
    order, AppJsonContext.Default.Order);       // no reflection
Order? back = JsonSerializer.Deserialize(       // AOT/trim safe
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
// Generated: cached template, level guard, zero boxing.

// 3) Generated Regex — covered on the Regex page
[GeneratedRegex(@"^\\d{4}-\\d{2}-\\d{2}$")]
private static partial Regex IsoDate();

Console.WriteLine(IsoDate().IsMatch("2026-06-14"));  // true
// Pattern errors = compile errors; works under NativeAOT

public record Order(int Id, decimal Total);`,
    },
    {
      label: 'Generator skeleton',
      language: 'csharp',
      code: `// Project: MyGenerators.csproj  (netstandard2.0)
//   <PackageReference Include="Microsoft.CodeAnalysis.CSharp" ... />
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using System.Text;

[Generator]
public class AutoToStringGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext ctx)
    {
        // Step 0 — emit the attribute itself (no user code needed)
        ctx.RegisterPostInitializationOutput(static ctx => ctx.AddSource(
            "AutoToStringAttribute.g.cs",
            """
            [System.AttributeUsage(System.AttributeTargets.Class)]
            public sealed class AutoToStringAttribute : System.Attribute { }
            """));

        // Step 1 — find classes tagged with [AutoToString]
        var classes = ctx.SyntaxProvider
            .ForAttributeWithMetadataName(
                "AutoToStringAttribute",          // must match exactly
                predicate: static (node, _) => true,
                transform: static (ctx, _) =>
                {
                    var sym = (INamedTypeSymbol)ctx.TargetSymbol;
                    // Step 2 — extract a SMALL EQUATABLE model:
                    return new Model(
                        sym.ContainingNamespace.ToDisplayString(),
                        sym.Name,
                        [..sym.GetMembers()
                            .OfType<IPropertySymbol>()
                            .Select(p => p.Name)]);
                });

        // Step 3 — emit one .g.cs per class
        ctx.RegisterSourceOutput(classes, static (spc, model) =>
            spc.AddSource($"{model.Name}.AutoToString.g.cs", Emit(model)));
    }

    // Record ensures value-equality for incremental caching:
    record Model(string Ns, string Name, string[] Props)
        : IEquatable<Model>
    {
        public bool Equals(Model? other) =>
            other is not null && Ns == other.Ns && Name == other.Name
            && Props.SequenceEqual(other.Props);
        public override int GetHashCode() =>
            HashCode.Combine(Ns, Name, Props.Length);
    }

    static string Emit(Model m) => $$"""
        namespace {{m.Ns}};
        partial class {{m.Name}}
        {
            public override string ToString()
                => $"{{m.Name}}({{string.Join(", ",
                     m.Props.Select(p => $"{p}={{{p}}}"))}})" ;
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

// The attribute is emitted by RegisterPostInitializationOutput —
// no need to define it yourself.

[AutoToString]
public partial class Invoice    // ← must be partial
{
    public int Number { get; set; }
    public decimal Total { get; set; }
    public string Customer { get; set; } = "";
}

// Generator writes Invoice.AutoToString.g.cs:
// partial class Invoice
// {
//     public override string ToString()
//         => $"Invoice(Number={Number}, Total={Total}, Customer={Customer})";
// }

var inv = new Invoice { Number = 7, Total = 120m, Customer = "Ada" };
Console.WriteLine(inv);
// Invoice(Number=7, Total=120, Customer=Ada)

// ── Inspect generated files on disk ──────────────────────────────────
// Add to csproj <PropertyGroup>:
//   <EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>
//
// Files appear at:
//   obj/Debug/net8.0/generated/MyGenerators/
//       AutoToStringGenerator/Invoice.AutoToString.g.cs`,
    },
    {
      label: 'Reflection vs generation',
      language: 'csharp',
      code: `// THE SAME FEATURE, two ways — property auditing:

// ❌ Runtime reflection: pays on every call, breaks under AOT/trimming
public static string AuditReflect(object o)
{
    var props = o.GetType().GetProperties();      // runtime lookup
    var parts = props.Select(p => $"{p.Name}={p.GetValue(o)}");
    return string.Join(", ", parts);              // boxing, slow
}

// ✅ Source-generated (the AutoToString generator):
//    Generated at build time — JIT-optimised property reads, no reflection.
//    AOT compiles it, trimming keeps it, typos fail the BUILD.

// ── Decision guide ────────────────────────────────────────────────────
// Need to handle types unknown until runtime (plugins)?  → reflection
// Types known at compile time (your own code)?           → generator
// One-off tool, perf irrelevant?                         → reflection fine
// Library used by AOT/Blazor/mobile consumers?           → generator

// ── Middle option: expression-tree compilation ────────────────────────
// Expression.Lambda(...).Compile() speeds hot reflection paths
// without a compiler plug-in — useful when you can't write a generator.
// Generators still win on startup time and AOT compatibility.

// ── Diagnostics from your generator ──────────────────────────────────
// Report errors when the target class is NOT partial:
var diag = Diagnostic.Create(
    new DiagnosticDescriptor(
        "AUTOTS001",
        "Class must be partial",
        "AutoToString requires '{0}' to be declared as partial",
        "AutoToString", DiagnosticSeverity.Error, true),
    symbol.Locations[0],
    symbol.Name);
spc.ReportDiagnostic(diag);   // build fails with a clear message`,
    },
    {
      label: 'Testing a generator',
      language: 'csharp',
      code: `// Test project: xUnit + Microsoft.CodeAnalysis.CSharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

public class AutoToStringGeneratorTests
{
    [Fact]
    public void Generates_ToString_For_Tagged_Class()
    {
        // ARRANGE: build an in-memory compilation with source code
        const string source = """
            [AutoToString]
            public partial class Invoice
            {
                public int Number { get; set; }
                public string Customer { get; set; } = "";
            }
            """;

        var compilation = CSharpCompilation.Create(
            "TestAssembly",
            [CSharpSyntaxTree.ParseText(source)],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        // ACT: run the generator
        var generator = new AutoToStringGenerator();
        var driver = CSharpGeneratorDriver.Create(generator)
            .RunGenerators(compilation);

        var result = driver.GetRunResult();

        // ASSERT: one file was generated, no diagnostics
        Assert.Empty(result.Diagnostics);
        Assert.Single(result.GeneratedTrees);

        var generated = result.GeneratedTrees[0].ToString();
        Assert.Contains("public override string ToString()", generated);
        Assert.Contains("Number={Number}", generated);
        Assert.Contains("Customer={Customer}", generated);
    }

    [Fact]
    public void Reports_Error_When_Class_Not_Partial()
    {
        const string source = "[AutoToString] public class Order { }";
        // … same setup …
        // Assert: result.Diagnostics contains AUTOTS001
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Dragging symbols or syntax nodes through the pipeline (defeats caching)',
      wrong: `// INamedTypeSymbol holds the entire compilation — never let it cross a stage:
var classes = ctx.SyntaxProvider
    .ForAttributeWithMetadataName("MyAttr", …,
        transform: (ctx, _) => (INamedTypeSymbol)ctx.TargetSymbol);
//              ↑ symbol passed through — every keystroke re-emits everything`,
      right: `// Extract a small record in the transform — only the data you need:
transform: (ctx, _) => {
    var sym = (INamedTypeSymbol)ctx.TargetSymbol;
    return new Model(
        sym.ContainingNamespace.ToDisplayString(),
        sym.Name,
        [..sym.GetMembers().OfType<IPropertySymbol>().Select(p => p.Name)]);
}`,
      explanation: 'Symbols and syntax nodes hold references to the entire compilation object. Letting them cross a pipeline stage leaks the compilation, defeats incremental caching, and causes IDE sluggishness as the cache never skips stale outputs. Always extract a small plain-data record (strings, arrays) before the cached stage.',
    },
    {
      title: 'Using ISourceGenerator (V1) instead of IIncrementalGenerator',
      wrong: `[Generator]
public class OldGenerator : ISourceGenerator   // V1 — obsolete
{
    public void Initialize(GeneratorInitializationContext ctx) { }
    public void Execute(GeneratorExecutionContext ctx)
    {
        // Runs in full on every compilation — no caching
        ctx.AddSource("MyFile.g.cs", "...");
    }
}`,
      right: `[Generator]
public class NewGenerator : IIncrementalGenerator  // V2 — current
{
    public void Initialize(IncrementalGeneratorInitializationContext ctx)
    {
        // Pipeline with per-stage caching — runs only what changed
        var source = ctx.SyntaxProvider.ForAttributeWithMetadataName(…);
        ctx.RegisterSourceOutput(source, (spc, model) => spc.AddSource(…));
    }
}`,
      explanation: 'ISourceGenerator (V1) re-runs its Execute method on every compilation including every IDE keystroke, causing noticeable slowdowns in large projects. IIncrementalGenerator caches each stage by value equality and only reruns steps whose inputs changed. Microsoft deprecated V1; all new generators should use the incremental API.',
    },
    {
      title: 'Forgetting RegisterPostInitializationOutput for the attribute definition',
      wrong: `// Generator expects [AutoToString] but never defines it.
// Consumer must manually add the attribute class to their project.
// ForAttributeWithMetadataName never fires — no code generated, no error.`,
      right: `ctx.RegisterPostInitializationOutput(ctx => ctx.AddSource(
    "AutoToStringAttribute.g.cs",
    """
    [System.AttributeUsage(System.AttributeTargets.Class)]
    public sealed class AutoToStringAttribute : System.Attribute { }
    """));
// Now the attribute exists before user code is compiled —
// no manual setup required in the consuming project.`,
      explanation: 'RegisterPostInitializationOutput runs before user code is compiled, making it the right place to emit the attribute class your generator depends on. Without it, the attribute does not exist when the compiler encounters [AutoToString] in user code, causing a compile error — or users must manually copy the attribute into their project.',
    },
    {
      title: 'Not emitting diagnostics for invalid generator inputs',
      wrong: `// Class is not partial — generator silently emits nothing or broken code
transform: (ctx, _) => {
    var sym = (INamedTypeSymbol)ctx.TargetSymbol;
    // No check for partial — user sees a mysterious compile error
    // from the generated file that references the non-partial class
    return new Model(sym.Name, …);
}`,
      right: `transform: (ctx, _) => {
    var sym = (INamedTypeSymbol)ctx.TargetSymbol;

    if (!sym.DeclaringSyntaxReferences.Any(r =>
        r.GetSyntax() is ClassDeclarationSyntax c
        && c.Modifiers.Any(m => m.IsKind(SyntaxKind.PartialKeyword))))
    {
        ctx.ReportDiagnostic(Diagnostic.Create(
            MustBePartialDescriptor, sym.Locations[0], sym.Name));
        return null;   // signal: skip generation for this type
    }
    return new Model(sym.Name, …);
}`,
      explanation: 'Generators that silently produce no output or malformed code when given bad input leave users with confusing compiler errors far from the root cause. Use spc.ReportDiagnostic() / ctx.ReportDiagnostic() to emit a clear, actionable error pointing at the user\'s code — this is one of the most important quality differences between a good generator and a frustrating one.',
    },
    {
      title: 'Wrong attribute metadata name in ForAttributeWithMetadataName',
      wrong: `// Generator registers "AutoToString" but the attribute is in namespace Generated:
ctx.SyntaxProvider.ForAttributeWithMetadataName(
    "AutoToString",          // ← missing namespace!
    …)
// The trigger never fires — no code generated, no diagnostic`,
      right: `// Full metadata name including namespace:
ctx.SyntaxProvider.ForAttributeWithMetadataName(
    "Generated.AutoToStringAttribute",   // namespace + class name
    …)
// Or emit the attribute without a namespace to keep the name simple.`,
      explanation: 'ForAttributeWithMetadataName requires the fully qualified metadata name of the attribute class, including namespace and the "Attribute" suffix if present in the declaration. A mismatch causes the generator to silently never fire — no output, no error. Verify the exact name with sym.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat) in a test.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What can a source generator do to your existing code?',
      options: [
        'Modify method bodies in place',
        'Delete dead code automatically',
        'Nothing — generators are additive; they can only add new source files to the compilation',
        'Rename members for consistency',
      ],
      answer: 2,
      explanation: 'Generators never rewrite your files — they only add new ones. The <code>partial</code> keyword is the seam that lets generated half extend the user half into a single compiled type.',
    },
    {
      q: 'Why are source generators essential for NativeAOT?',
      options: [
        'AOT binaries cannot include attributes',
        'Reflection-emit and runtime codegen are unavailable under AOT — code must exist at build time, which is exactly what generators produce',
        'AOT requires netstandard2.0 assemblies',
        'They compress the binary',
      ],
      answer: 1,
      explanation: 'AOT compiles everything ahead of time; there is no JIT to create code on the fly. The trimmer also removes members only reachable via reflection. Generated code is ordinary compile-time C#, so it survives both — this is why JSON/logging/regex all grew source-generation modes.',
    },
    {
      q: 'In an IIncrementalGenerator, why extract a small equatable model early in the pipeline?',
      options: [
        'Syntax nodes cannot cross method boundaries',
        'Caching: the pipeline runs on every keystroke, and equality on small models lets unchanged stages be skipped',
        'It is required by the [Generator] attribute',
        'Models serialize into the .g.cs output',
      ],
      answer: 1,
      explanation: 'Incremental generators memoise each pipeline stage by value equality. Symbols and syntax nodes hold the entire compilation in memory — dragging them through defeats the cache. Shrinking to a small record with value-equal members keeps IDE typing fast and avoids memory pressure.',
    },
    {
      q: 'What is the purpose of RegisterPostInitializationOutput?',
      options: [
        'It runs after all other generators have finished',
        'It emits source code that does not depend on user code — for example, the attribute class the generator consumes',
        'It registers a fallback if the main pipeline produces no output',
        'It controls where .g.cs files are written on disk',
      ],
      answer: 1,
      explanation: 'RegisterPostInitializationOutput runs before user code is compiled, allowing you to inject the attribute definition your generator depends on. Without it, the attribute does not exist when the compiler encounters it in user code — creating a chicken-and-egg build error.',
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
      explanation: '[GeneratedRegex], JsonSerializerContext, and [LoggerMessage] all ship in the BCL. [AutoSql] is invented — database schema generation is an EF Core migrations concern, not a BCL source generator.',
    },
    {
      q: 'Why should you use IIncrementalGenerator instead of the V1 ISourceGenerator?',
      options: [
        'ISourceGenerator has been removed from .NET 6+',
        'IIncrementalGenerator uses a cached pipeline so only changed stages rerun — V1 regenerates everything on every keystroke',
        'IIncrementalGenerator supports C# 9 partial methods; V1 does not',
        'V1 cannot produce multiple output files',
      ],
      answer: 1,
      explanation: 'V1 ISourceGenerator runs its Execute method in full on every compilation, including every IDE keystroke, making large projects sluggish. The incremental API caches each pipeline stage by value equality and only re-executes stages whose inputs changed. Microsoft deprecated V1 — always use incremental.',
    },
    {
      q: 'How do you unit-test a source generator without running a full build?',
      options: [
        'Source generators cannot be unit-tested',
        'Use CSharpGeneratorDriver.RunGenerators() against an in-memory CSharpCompilation built from source strings',
        'Run the generator DLL directly from the command line',
        'Only integration tests via MSBuild are possible',
      ],
      answer: 1,
      explanation: '<code>CSharpCompilation.Create()</code> builds an in-memory compilation from source text strings. <code>CSharpGeneratorDriver.Create(generator).RunGenerators(compilation)</code> runs the generator and returns generated source text and diagnostics — all without touching the file system or running a build.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is a source generator different from reflection?',
      a: 'Reflection asks questions about types <em>while the app runs</em> and pays the cost on every call. A generator answers the same questions <em>during compilation</em> and writes the answers into ordinary C#. Result: no runtime cost, AOT/trimming compatibility, compile-time validation — at the price of a more involved authoring setup.',
    },
    {
      q: 'Why must my class be partial for a generator to extend it?',
      a: 'Because generators cannot modify your source files — they are additive only. <code>partial</code> lets one class span multiple files, so your half (the properties, the attribute) and the generated half (the boilerplate) merge into a single type at compile time. Good generators emit a diagnostic error telling you to add <code>partial</code> when you forget.',
    },
    {
      q: 'What happened to ISourceGenerator — why "incremental"?',
      a: 'The V1 API regenerated everything on each compilation, which made large IDEs crawl. <code>IIncrementalGenerator</code> models generation as a dataflow pipeline with per-stage value-equality caching: only steps whose inputs changed re-execute. Microsoft deprecated V1; all new generators should use the incremental API.',
    },
    {
      q: 'How do I see and debug the code a generator produced?',
      a: 'Set <code>&lt;EmitCompilerGeneratedFiles&gt;true&lt;/EmitCompilerGeneratedFiles&gt;</code> in the csproj and .g.cs files appear under <code>obj/…/generated/</code>. In the IDE, go-to-definition on a generated member opens the file directly. For generator debugging, unit-test with an in-memory CSharpCompilation, or launch a second Visual Studio instance and attach to the build host process.',
    },
    {
      q: 'When should I write my own generator versus using reflection or a library?',
      a: 'Write one when: the same boilerplate repeats across many types (mappers, equality, builders, validators), runtime cost matters, or AOT support is required — and all inputs are visible at compile time. Use reflection for genuinely runtime-only shapes (plugins loaded from disk). Check the ecosystem first: Mapperly, AutoCtor, Mediator-gen, and StronglyTypedId may already solve your need.',
    },
    {
      q: 'Do generators slow down my build?',
      a: 'Marginally if well-written — incremental caching keeps IDE typing fast and full builds add only the file-emission time. Badly written generators (heavy work in the predicate, symbols leaked through the pipeline) are the usual cause of "VS feels slow". The fix is strict small-model discipline: extract only strings and primitive values before the cached pipeline stage.',
    },
    {
      q: 'How does a generator report errors to the user?',
      a: 'Call <code>spc.ReportDiagnostic(Diagnostic.Create(descriptor, location, args))</code> from inside <code>RegisterSourceOutput</code>, or <code>ctx.ReportDiagnostic(…)</code> from inside a transform. The descriptor specifies an ID, category, severity (<code>Error</code> blocks the build, <code>Warning</code> does not), and message format. The location points to the user\'s source so the IDE underlines the right token. Good diagnostics are essential — they are the primary UX of your generator.',
    },
  ];

  challenge: Challenge = {
    title: 'Design the Generated Half',
    language: 'csharp',
    description: 'You are writing an [AutoEquals] generator concept. Given the consumer class below, write BY HAND the code your generator would emit: a partial class implementing IEquatable<Product> where Equals compares Id, Name and Price, GetHashCode combines the same members with HashCode.Combine, and == / != operators delegate to Equals. (Writing the emitted code by hand first is exactly how real generator authors start.)',
    hints: [
      'partial class Product : IEquatable<Product>',
      'Equals(Product?) checks ReferenceEquals(other, null) first, then compares members',
      'override Equals(object?) forwards via "obj as Product"',
      'GetHashCode: HashCode.Combine(Id, Name, Price)',
      'operators: static bool operator ==(Product? a, Product? b) => a?.Equals(b) ?? b is null',
    ],
    starterCode: `// Consumer side (already written — do not change):
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

        return Id    == other.Id
            && Name  == other.Name
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

// Generator authoring notes:
// - Members list: INamedTypeSymbol.GetMembers().OfType<IPropertySymbol>()
// - Hint name: $"{typeName}.AutoEquals.g.cs"
// - The consumer class MUST be partial — emit DiagnosticSeverity.Error
//   when it is not so the user gets a clear build message.`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Source generators are Roslyn plug-ins that run during compilation to add C# files — they move runtime reflection costs to build time, making code AOT-safe and startup-free; the IIncrementalGenerator pipeline caches each stage by value equality so generators stay fast in the IDE.',
    mustKnow: [
      'Generators are additive-only: they add files, never modify yours; <code>partial</code> is the seam between user code and generated code',
      'Always use <code>IIncrementalGenerator</code> — V1 <code>ISourceGenerator</code> is deprecated and reruns fully on every keystroke',
      'Extract a small, equatable record model before any cached pipeline stage — never let symbols or syntax nodes pass through',
      '<code>RegisterPostInitializationOutput</code> emits code (e.g., the attribute class) before user code is compiled',
      'Use <code>spc.ReportDiagnostic()</code> to emit build errors when the generator detects invalid input — clear diagnostics are essential UX',
      'Built-in generators: <code>[GeneratedRegex]</code>, <code>JsonSerializerContext</code>, <code>[LoggerMessage]</code>, <code>[LibraryImport]</code> — all solve the same AOT + performance problem',
      'Test generators with <code>CSharpGeneratorDriver.RunGenerators()</code> against an in-memory compilation; use <code>EmitCompilerGeneratedFiles=true</code> to inspect output on disk',
    ],
    interviewFocus: [
      'What problem do source generators solve that reflection cannot? (AOT, startup, compile-time validation)',
      'What is the difference between ISourceGenerator and IIncrementalGenerator?',
      'Why must you extract a small equatable model before the cached pipeline stage?',
      'What does RegisterPostInitializationOutput do and when do you need it?',
      'How do you unit-test a source generator without a full MSBuild run?',
    ],
  };
}
