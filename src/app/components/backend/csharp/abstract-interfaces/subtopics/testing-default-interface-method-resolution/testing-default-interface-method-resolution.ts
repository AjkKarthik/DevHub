import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-default-interface-method-resolution-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-default-interface-method-resolution.html',
  styleUrl: './testing-default-interface-method-resolution.scss',
})
export class TestingDefaultInterfaceMethodResolutionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake is directly testable — never tested',
      points: [
        'The main Abstract Classes & Interfaces page\'s Common Mistake shows that <code>logger.LogInfo(...)</code> fails to compile when <code>logger</code> is CLASS-typed, but works when it is INTERFACE-typed — a compile-time distinction, not a runtime one. This is testable in a genuinely different way than ordinary unit tests: the "test" is really about which reference TYPE a call site uses, something worth pinning down deliberately rather than leaving to chance in calling code.',
      ],
    },
    {
      heading: 'This is fundamentally a compile-time concern, not a runtime behavior test',
      points: [
        'Unlike the inheritance hiding trap (a RUNTIME dispatch difference you can assert on with <code>Assert.Equal</code>), whether a default interface method is reachable through a given variable is decided entirely by the variable\'s STATIC (compile-time) type — there is no runtime "test" that can observe a compile error; either the code compiles (and calls the default correctly) or it does not compile at all.',
        'The practical "test" for this is therefore an intentional, deliberate CODE EXAMPLE demonstrating both reference shapes side by side — proving to a reader (and to future maintainers) exactly which shape is required, functioning as executable documentation rather than a runtime assertion.',
      ],
    },
    {
      heading: 'What CAN be runtime-tested — that the default implementation itself behaves correctly',
      points: [
        'While "is this member reachable from this reference type" is a compile-time fact, the LOGIC inside a default interface method (e.g. <code>LogInfo</code> delegating to <code>Log("INFO", message)</code>) is ordinary runtime behavior and fully testable — call it through an INTERFACE-typed variable (the only way it CAN be called) and assert the expected downstream effect (e.g. that <code>Log</code> was invoked with the right arguments).',
        'This means a genuinely useful test suite for a default interface method combines BOTH: a compile-time-enforced usage example (showing the reference-type requirement) and an ordinary runtime test (verifying the default\'s actual logic), rather than treating either alone as sufficient.',
      ],
    },
    {
      heading: 'Testing that an OVERRIDDEN default (a class providing its own implementation) actually wins',
      points: [
        'When a class chooses to implement a member that ALSO has a default on the interface (the main page\'s own <code>ConsoleLogger</code> fix, adding its own <code>LogInfo</code>), a test should confirm the CLASS\'s own version runs — not the interface default — when called through EITHER reference type. This directly proves the override genuinely takes precedence, rather than assuming it based on reading the code once.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The compile-time distinction — executable documentation, not a runtime test',
      language: 'csharp',
      code: `public interface ILogger
{
    void Log(string level, string message);
    void LogInfo(string message) => Log("INFO", message); // default impl
}

public class ConsoleLogger : ILogger
{
    public void Log(string level, string message)
        => Console.WriteLine($"[{level}] {message}");
    // No LogInfo override — relies entirely on the interface's default
}

// This is a COMPILE-TIME fact, demonstrated as a deliberate usage example
// rather than a runtime-assertable test — there is no way to "test" a
// compile error at runtime; either this compiles or it doesn't:

ConsoleLogger classTyped = new ConsoleLogger();
// classTyped.LogInfo("test");  // COMPILE ERROR — CS1061, exactly as the
                                  // main topic's Common Mistake describes

ILogger interfaceTyped = new ConsoleLogger();
interfaceTyped.LogInfo("test");  // COMPILES — reaches the interface default

// The VALUE of writing this side-by-side is exactly as documentation:
// any future reader immediately sees WHICH reference shape is required,
// rather than discovering it the hard way via a confusing CS1061.`,
    },
    {
      label: 'What IS runtime-testable — the default implementation\'s actual logic',
      language: 'csharp',
      code: `using Xunit;

public class TestableLogger : ILogger
{
    public List<(string Level, string Message)> Calls { get; } = new();
    public void Log(string level, string message) => Calls.Add((level, message));
}

public class DefaultInterfaceMethodLogicTests
{
    [Fact]
    public void LogInfo_DelegatesToLog_WithInfoLevel()
    {
        // Must be called through an interface-typed reference — the
        // ONLY way LogInfo is reachable at all, per the compile-time
        // constraint demonstrated above:
        ILogger logger = new TestableLogger();

        logger.LogInfo("Server started");

        var recorded = Assert.Single(((TestableLogger)logger).Calls);
        Assert.Equal("INFO", recorded.Level);
        Assert.Equal("Server started", recorded.Message);
        // This DOES genuinely test runtime behavior — proving the
        // default implementation's actual LOGIC (delegating to Log with
        // the correct level string) is correct, distinct from the
        // separate, compile-time-only reachability concern above.
    }
}`,
    },
    {
      label: 'Testing that a class\'s own override wins over the interface default',
      language: 'csharp',
      code: `public class VerboseConsoleLogger : ILogger
{
    public List<string> Output { get; } = new();

    public void Log(string level, string message)
        => Output.Add($"[{level}] {message}");

    // Explicitly overrides the interface default with its own logic —
    // exactly the main topic's own suggested fix:
    public void LogInfo(string message)
        => Output.Add($"### INFO ### {message}"); // deliberately DIFFERENT
                                                     // format than the
                                                     // interface default
}

public class OverriddenDefaultTests
{
    [Fact]
    public void ClassOwnLogInfo_WinsOverInterfaceDefault_ViaClassReference()
    {
        var logger = new VerboseConsoleLogger();
        logger.LogInfo("started"); // reachable directly — class provides its own

        Assert.Single(logger.Output);
        Assert.Equal("### INFO ### started", logger.Output[0]);
        // Proves the CLASS's own format wins, not the interface
        // default's "[INFO] started" format.
    }

    [Fact]
    public void ClassOwnLogInfo_AlsoWinsViaInterfaceReference()
    {
        ILogger logger = new VerboseConsoleLogger();
        logger.LogInfo("started"); // now via interface reference

        var typed = (VerboseConsoleLogger)logger;
        Assert.Equal("### INFO ### started", typed.Output[0]);
        // Confirms the override wins through BOTH reference shapes —
        // unlike a default-only implementation, a class's own member
        // is reachable and correct regardless of reference type.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why <code>Assert.Equal</code>-style tests are the wrong tool for verifying "LogInfo is not accessible through a class-typed reference," and propose what actually belongs in a test suite (or documentation) to capture this fact reliably.',
    hint: 'Think about WHEN the CS1061 error occurs — at compile time, before any test runner or assertion framework even exists to run. Consider what kind of artifact CAN capture a compile-time fact: a code comment demonstrating the failure (commented out so the build still succeeds), or a dedicated "this should not compile" test using a source generator / Roslyn testing library that intentionally tries to compile a snippet and asserts on the DIAGNOSTIC (compiler error), not a runtime exception.',
    solution: `// Assert.Equal (and every ordinary xUnit assertion) runs AFTER
// compilation succeeds — it operates on runtime values. But
// "classTyped.LogInfo(...)" doesn't produce a runtime exception to
// assert against — it produces a COMPILE ERROR, meaning the test
// project itself would fail to BUILD if this line were left uncommented
// in ordinary test code. There is no runtime moment for Assert.Equal to
// hook into.

// Two genuinely appropriate approaches:

// 1. Documentation-as-code (what the earlier examples do): a commented-
//    out line showing the failing call, immediately followed by the
//    correct interface-typed usage that DOES compile and run. This
//    captures the fact for human readers without breaking the build.

// 2. For teams wanting an ENFORCED, automated check: Roslyn's
//    "Microsoft.CodeAnalysis.CSharp.Scripting" or a dedicated compiler
//    testing library (e.g. Microsoft.CodeAnalysis.CSharp for source
//    generator testing) can compile a SEPARATE, isolated code snippet
//    programmatically and assert on the resulting Diagnostics collection
//    containing CS1061 — genuinely testing "this specific pattern MUST
//    NOT compile" as an automated check, distinct from ordinary runtime
//    unit tests. This is a more advanced technique, typically reserved
//    for library authors verifying their OWN API's compile-time
//    constraints (e.g. testing that a source-generated diagnostic fires
//    correctly), not something needed for ordinary application code.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'whether a default interface method is reachable through a given variable is a runtime behavior that can be verified with an ordinary Assert.Throws or Assert.Equal test.',
      reality: 'reachability of a default interface method is determined entirely by the variable\'s STATIC (compile-time) type — it either compiles (interface-typed reference) or fails to compile entirely (class-typed reference), which is not something an ordinary runtime test can observe or assert on.',
    },
    {
      thought: 'if a default interface method\'s logic cannot be tested the normal way (since a compile-time distinction is involved), it cannot be tested at all.',
      reality: 'the LOGIC inside a default interface method is ordinary runtime behavior, fully testable by calling it through the (required) interface-typed reference and asserting on the resulting downstream effect — the compile-time reachability concern and the runtime logic concern are two separate things, and only one of them is unit-testable in the traditional sense.',
    },
    {
      thought: 'once a class provides its own implementation of a member that also has an interface default, that override only takes effect when called through the CLASS-typed reference — the interface-typed reference would still see the interface default.',
      reality: 'a class\'s own implementation of a member takes precedence over the interface default through BOTH reference shapes — class-typed and interface-typed — unlike a default-only implementation, which is only reachable via an interface-typed reference at all.',
    },
  ];
}
