import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-source-generators-in-memory-pipeline-snapshotting-output-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-source-generators-in-memory-pipeline-snapshotting-output.html',
  styleUrl: './testing-source-generators-in-memory-pipeline-snapshotting-output.scss',
})
export class TestingSourceGeneratorsInMemoryPipelineSnapshottingOutputSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions EmitCompilerGeneratedFiles for manual inspection — this is how to verify generated output automatically, in a real test',
      points: [
        'The main Source Generators page\'s Quick Reference lists <code>EmitCompilerGeneratedFiles</code> as "a csproj flag that writes generated .g.cs files to disk for inspection" — a manual, one-off way to LOOK at what a generator produced. A genuinely more valuable technique for a generator you plan to maintain: run the generator PROGRAMMATICALLY inside a unit test, capture the exact generated source text, and assert on it directly — catching regressions automatically on every test run, not just when a developer remembers to inspect the .g.cs files by hand.',
      ],
    },
    {
      heading: 'Roslyn\'s own testing APIs let you run an IIncrementalGenerator against a hand-written compilation, entirely in-memory',
      points: [
        '<code>CSharpGeneratorDriver.Create(generator).RunGeneratorsAndUpdateCompilation(compilation, ...)</code> runs your generator against a <code>CSharpCompilation</code> you build in the test itself (from a small snippet of source text), returning a <code>GeneratorDriverRunResult</code> containing every generated source file\'s FULL TEXT, hint name, and any diagnostics reported via <code>ReportDiagnostic</code> — precisely the same output the main page\'s own <code>RegisterSourceOutput</code> step would have produced during a real build.',
        'This is DRAMATICALLY faster and more reliable than a "build the whole project and inspect .g.cs files" workflow — it runs in milliseconds as a normal unit test, requires no separate compilation step, and can assert on the EXACT generated text (or a normalized/snapshot form of it) as part of a standard CI pipeline.',
      ],
    },
    {
      heading: 'Snapshot testing (the Verify library) is the natural fit for generated source text specifically',
      points: [
        'Because generated code can be dozens or hundreds of lines, asserting on it with individual <code>Assert.Contains</code> calls is tedious and brittle. The Verify library\'s snapshot approach (mentioned in the Unit Testing topic for "complex object graphs, serialized output, or generated code") is an especially natural fit HERE — the first test run saves the generator\'s output as a <code>.verified.cs</code> file, and every SUBSEQUENT run diffs the newly-generated text against it, immediately flagging any unintended change to the generator\'s emitted code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Running an IIncrementalGenerator entirely in-memory, no real project build needed',
      language: 'csharp',
      code: `using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Xunit;

public class MyGeneratorTests
{
    [Fact]
    public void Generator_ProducesExpectedPartialMethod()
    {
        // A tiny, self-contained source snippet — exactly the kind of
        // input the real generator would see attached to a user's
        // decorated partial class:
        const string userSource = """
            [MyToString]
            public partial class Product
            {
                public string Name { get; set; }
                public decimal Price { get; set; }
            }
            """;

        Compilation inputCompilation = CSharpCompilation.Create(
            "TestAssembly",
            new[] { CSharpSyntaxTree.ParseText(userSource) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        var generator = new MyToStringGenerator();
        GeneratorDriver driver = CSharpGeneratorDriver.Create(generator);

        driver = driver.RunGeneratorsAndUpdateCompilation(
            inputCompilation, out var outputCompilation, out var diagnostics);

        GeneratorDriverRunResult result = driver.GetRunResult();

        // Directly assert on the ACTUAL generated source text — no
        // real build, no .g.cs files written to disk, milliseconds
        // to run as a normal unit test:
        Assert.Single(result.GeneratedTrees);
        string generatedText = result.GeneratedTrees[0].ToString();
        Assert.Contains("public override string ToString()", generatedText);
        Assert.Contains("Name", generatedText);
    }
}`,
    },
    {
      label: 'Asserting on reported diagnostics — proving compile-time validation actually fires',
      language: 'csharp',
      code: `[Fact]
public void Generator_ReportsDiagnostic_ForInvalidAttributeUsage()
{
    // Deliberately malformed input — the main page's own principle
    // "a generator that silently produces incorrect code... is far
    // harder to debug than one that fails the build" is exactly what
    // this test verifies:
    const string badSource = """
        [MyToString] // applied to a NON-partial class — should fail
        public class Product
        {
            public string Name { get; set; }
        }
        """;

    Compilation inputCompilation = CSharpCompilation.Create(
        "TestAssembly",
        new[] { CSharpSyntaxTree.ParseText(badSource) },
        new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
        new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

    var generator = new MyToStringGenerator();
    GeneratorDriver driver = CSharpGeneratorDriver.Create(generator);
    driver = driver.RunGeneratorsAndUpdateCompilation(
        inputCompilation, out _, out var diagnostics);

    // Directly proves the generator's own ReportDiagnostic call fires
    // for this specific bad input — a real, testable compile-time
    // validation contract, not just "hope it works":
    Assert.Contains(diagnostics, d => d.Id == "MYGEN001");
}`,
    },
    {
      label: 'Snapshot testing generated output with Verify — catching unintended changes automatically',
      language: 'csharp',
      code: `using VerifyXunit;

[UsesVerify]
public class MyGeneratorSnapshotTests
{
    [Fact]
    public Task Generator_Output_MatchesSnapshot()
    {
        const string userSource = """
            [MyToString]
            public partial class Product
            {
                public string Name { get; set; }
                public decimal Price { get; set; }
            }
            """;

        var compilation = CSharpCompilation.Create(
            "TestAssembly",
            new[] { CSharpSyntaxTree.ParseText(userSource) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        var driver = CSharpGeneratorDriver.Create(new MyToStringGenerator())
            .RunGenerators(compilation);

        // First run: saves the generated output as a .verified.cs
        // file. Every SUBSEQUENT run diffs against it — any
        // unintended change to the generator's emitted code (a typo
        // fix that accidentally changes formatting elsewhere, a
        // refactor that alters output shape) is caught immediately
        // as a failing snapshot diff, without hand-writing dozens of
        // individual string assertions:
        return Verifier.Verify(driver);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving the main topic page\'s own principle — "the pipeline is incremental, outputs are cached and recomputed only when relevant inputs change" — by running the generator twice against two compilations that differ ONLY in an unrelated method body, and asserting the SAME generated output results both times.',
    hint: 'Build two CSharpCompilation instances with the same [MyToString]-decorated class but a trivial unrelated change elsewhere (e.g. a different method body in a SEPARATE class), run the generator against each, and assert the generated text for the decorated class is identical.',
    solution: `[Fact]
public void Generator_ProducesIdenticalOutput_WhenUnrelatedCodeChanges()
{
    const string sourceV1 = """
        [MyToString]
        public partial class Product
        {
            public string Name { get; set; }
        }

        public class Unrelated { public void Method() => System.Console.WriteLine("v1"); }
        """;

    const string sourceV2 = """
        [MyToString]
        public partial class Product
        {
            public string Name { get; set; }
        }

        public class Unrelated { public void Method() => System.Console.WriteLine("v2 - CHANGED"); }
        """;

    string RunAndGetOutput(string source)
    {
        var compilation = CSharpCompilation.Create("TestAssembly",
            new[] { CSharpSyntaxTree.ParseText(source) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        var driver = CSharpGeneratorDriver.Create(new MyToStringGenerator())
            .RunGenerators(compilation);
        return driver.GetRunResult().GeneratedTrees[0].ToString();
    }

    string outputV1 = RunAndGetOutput(sourceV1);
    string outputV2 = RunAndGetOutput(sourceV2);

    // Proves the generator's output for Product is UNAFFECTED by a
    // change to a completely unrelated class — exactly the
    // "small, equatable model" caching discipline the main page's
    // own authoring section describes:
    Assert.Equal(outputV1, outputV2);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the only way to verify what a source generator actually produces is to build the real project and inspect the .g.cs files written to disk via EmitCompilerGeneratedFiles.',
      reality: 'Roslyn\'s own CSharpGeneratorDriver API lets you run the generator programmatically against an in-memory compilation, capturing the exact generated text as part of a normal, fast unit test — no real project build needed at all.',
    },
    {
      thought: 'testing a source generator only means checking the generated code compiles and behaves correctly at runtime.',
      reality: 'a genuinely thorough test suite also verifies the generator\'s OWN diagnostic-reporting behavior — that malformed input produces the expected compiler error via ReportDiagnostic, which is a distinct, separately-testable contract.',
    },
    {
      thought: 'asserting individual substrings (Assert.Contains) inside generated code text is the most practical way to test generator output.',
      reality: 'for anything beyond a few lines, snapshot testing (the Verify library) is a better fit — it compares the FULL generated text against a saved baseline, catching any unintended change without hand-writing dozens of brittle substring assertions.',
    },
  ];
}
