import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-for-extension-method-shadowing-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-for-extension-method-shadowing.html',
  styleUrl: './testing-for-extension-method-shadowing.scss',
})
export class TestingForExtensionMethodShadowingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s #1 Common Mistake is directly testable — never regression-tested',
      points: [
        'The main Extension Methods page\'s first Common Mistake describes a genuinely silent failure mode: an instance method added to a type LATER silently shadows an existing extension method with the same signature, with NO compiler warning. It demonstrates this once via prose — never as a test that would catch the EXACT MOMENT this shadowing occurs, e.g. after upgrading a NuGet package that adds a new instance method to a type you extend.',
      ],
    },
    {
      heading: 'A test can pin down WHICH implementation is actually reached',
      points: [
        'A test asserting on the OBSERVABLE BEHAVIOR of calling <code>obj.MethodName()</code> — rather than just "it compiles" or "it returns SOME value" — can distinguish whether the extension\'s logic or an instance method\'s logic actually ran, by having each produce a DELIBERATELY DIFFERENT, distinguishable result (e.g. a different log message, a different computed value) during the test-writing phase, then asserting on that distinguishing signal.',
        'This is most valuable as a REGRESSION test guarding a specific extension method you know is fragile to this exact shadowing risk (e.g. one extending a type from a third-party library you do not control and cannot prevent from adding new members) — the test fails LOUDLY the moment a library upgrade introduces a shadowing instance method, rather than silently and invisibly changing behavior in production.',
      ],
    },
    {
      heading: 'Reflection can directly verify whether a call site resolves to an extension vs an instance method',
      points: [
        'For a more explicit, direct verification (rather than relying on distinguishable observable behavior), you can inspect whether a type ALREADY DEFINES an instance member with the extension\'s exact name and parameter signature via reflection (<code>type.GetMethod(name, parameterTypes)</code>) — a test asserting this returns <code>null</code> serves as an explicit tripwire: "this type must NOT define its own instance member matching my extension\'s signature," catching a NEW instance method the moment it appears, even before anyone actually exercises the shadowed behavior at runtime.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A behavioral regression test — proves which implementation runs',
      language: 'csharp',
      code: `using Xunit;

// A third-party type you do NOT control — you've extended it with your
// own utility method, exactly the main topic's own risky scenario:
public class ThirdPartyLogger
{
    // Imagine this type currently has NO instance method named "Log"
    // matching this signature — your extension is the only "Log(string)"
}

public static class LoggerExtensions
{
    // Your extension — deliberately produces a DISTINGUISHABLE result:
    public static string Log(this ThirdPartyLogger logger, string message)
        => $"[EXTENSION] {message}";
}

public class ExtensionShadowingTests
{
    [Fact]
    public void Log_StillCallsOurExtension_NotAnInstanceMethod()
    {
        var logger = new ThirdPartyLogger();

        var result = logger.Log("test message");

        // Asserting on the DISTINGUISHABLE marker our extension produces —
        // if a future ThirdPartyLogger update adds its OWN "Log(string)"
        // instance method, this test FAILS immediately, because the
        // instance method's (unknown, different) output would not match
        // "[EXTENSION] test message":
        Assert.Equal("[EXTENSION] test message", result);

        // This is exactly the regression-guard the main topic's Common
        // Mistake calls for — a library upgrade that silently shadows the
        // extension would be caught HERE, not discovered later in
        // production behavior.
    }
}`,
    },
    {
      label: 'A reflection-based tripwire — catches shadowing before it is even exercised',
      language: 'csharp',
      code: `using System.Reflection;

public class ExtensionShadowingReflectionTests
{
    [Fact]
    public void ThirdPartyLogger_DoesNotYetDefineItsOwnLogInstanceMethod()
    {
        // Explicitly check whether ThirdPartyLogger ALREADY has an
        // instance method matching our extension's exact signature —
        // this is a more direct tripwire than the behavioral test above,
        // catching the shadowing risk even if nobody happens to
        // exercise the shadowed call path in this specific test run:
        var instanceMethod = typeof(ThirdPartyLogger).GetMethod(
            "Log",
            BindingFlags.Public | BindingFlags.Instance,
            binder: null,
            types: new[] { typeof(string) },
            modifiers: null);

        // This assertion FAILS the moment ThirdPartyLogger gains its own
        // "Log(string)" instance method — flagging the exact risk the
        // main topic describes, as a build-time-adjacent signal rather
        // than something discovered only through behavioral divergence:
        Assert.Null(instanceMethod);
    }
}

// If a library update later adds:
//   public class ThirdPartyLogger { public string Log(string msg) => ...; }
// this test immediately fails with a clear message pointing at exactly
// which method now shadows the extension — far more actionable than
// silently changed behavior discovered later in production logs.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would the reflection-based tripwire test catch a shadowing instance method that has the SAME NAME but a DIFFERENT PARAMETER TYPE than the extension (e.g. an instance method <code>Log(int errorCode)</code> added alongside your existing <code>Log(this ThirdPartyLogger, string message)</code> extension)?',
    hint: 'Recall that the reflection lookup in the tripwire test specifies EXACT parameter types (types: new[] { typeof(string) }) — think about whether a DIFFERENT parameter list would even be found by that specific GetMethod overload, and separately, whether C#\'s actual method resolution rules would consider a different-signature instance method a "shadow" of the extension at all.',
    solution: `// No — the reflection tripwire specifically searches for a method
// named "Log" taking exactly one string parameter. An instance method
// "Log(int errorCode)" has a DIFFERENT parameter signature and would
// simply not be found by that specific GetMethod(name, types) overload
// — the test would continue to pass (correctly, in this case).

// This is actually the CORRECT behavior, not a gap: C#'s method
// resolution only considers an instance method a "shadow" of an
// extension when their SIGNATURES genuinely overlap (same name, same
// parameter types) — a "Log(int)" instance method and a
// "Log(this T, string)" extension method are NOT in conflict at all;
// both can coexist and be called based on argument type, exactly like
// ordinary method overloading:

var logger = new ThirdPartyLoggerWithIntOverload();
logger.Log("text");  // still calls YOUR extension — string argument
logger.Log(404);     // calls the NEW instance method — int argument,
                       // no overlap, no shadowing, both coexist fine

// The tripwire test is correctly scoped to the SPECIFIC signature that
// would actually conflict — if you wanted to guard against ANY new
// method named "Log" regardless of parameters (a much broader, arguably
// overly cautious check), you would need a different reflection query
// that enumerates ALL methods named "Log" and inspects each one's
// parameter list separately, rather than searching for one exact
// signature match.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that merely confirms calling obj.ExtensionMethod() compiles and returns SOME value is sufficient to guard against future instance-method shadowing.',
      reality: 'such a test proves nothing about WHICH implementation actually ran — a meaningful regression test must assert on a DISTINGUISHABLE observable result the extension specifically produces, so a future shadowing instance method (with different logic) causes an immediate, visible test failure.',
    },
    {
      thought: 'reflection-based tripwire tests checking for a specific method signature will catch ANY future instance method added with the same name, regardless of its parameters.',
      reality: 'a reflection lookup for an exact signature (name + parameter types) only catches a GENUINE shadowing conflict — a new instance method with the same name but different parameters does not shadow the extension at all and coexists via ordinary overload resolution, so the specific-signature tripwire correctly does not flag it.',
    },
    {
      thought: 'extension method shadowing can only be discovered by actually running the affected code path in production and observing unexpected behavior.',
      reality: 'a reflection-based tripwire test can catch the shadowing risk proactively, as soon as a dependency is updated, even before anyone exercises the specific call path — turning a silent runtime behavior change into an immediate, actionable test failure.',
    },
  ];
}
