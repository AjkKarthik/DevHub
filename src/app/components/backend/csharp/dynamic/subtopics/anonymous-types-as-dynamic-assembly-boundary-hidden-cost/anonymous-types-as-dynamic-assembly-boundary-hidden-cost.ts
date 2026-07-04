import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-anonymous-types-as-dynamic-assembly-boundary-hidden-cost-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './anonymous-types-as-dynamic-assembly-boundary-hidden-cost.html',
  styleUrl: './anonymous-types-as-dynamic-assembly-boundary-hidden-cost.scss',
})
export class AnonymousTypesAsDynamicAssemblyBoundaryHiddenCostSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A common workaround for anonymous types\' assembly-boundary restriction — and why it is riskier than it looks',
      points: [
        'C#\'s anonymous types "cannot cross method boundaries except as <code>object</code>/<code>dynamic</code>" (the Tuples & Anonymous Types topic\'s own core restriction) — but returning an anonymous type typed as <code>dynamic</code> instead of <code>object</code> is a common pattern specifically BECAUSE <code>dynamic</code> still lets the CALLER access its properties by name (<code>result.Name</code>), which a plain <code>object</code>-typed return would not allow without a cast. This subtopic examines exactly what makes this workaround riskier than it first appears.',
      ],
    },
    {
      heading: 'Anonymous type members are compiler-generated as internal — dynamic access still respects that accessibility',
      points: [
        'The C# compiler generates anonymous types with their PROPERTIES effectively scoped to be accessible only within the SAME assembly that declared them (a consequence of how the compiler emits the generated class, even though the properties themselves are technically public — visibility to the DLR binder can still be affected by the type\'s own accessibility and InternalsVisibleTo settings). When the CALLING code lives in a DIFFERENT assembly than the method that returned the anonymous-typed <code>dynamic</code> value, the DLR binder can fail to resolve a member access that would work perfectly fine within the SAME assembly — producing a <code>RuntimeBinderException</code> specifically at the CROSS-ASSEMBLY call site, with the exact same source code working fine when both sides live in the SAME assembly.',
        'This is a genuinely confusing failure mode to debug: the method that RETURNS the dynamic anonymous type compiles and runs without any warning; the exception only appears at the CALLING code, and only when that caller happens to live in a different assembly — a refactor that moves either side of the call across an assembly boundary can silently introduce this failure where none existed before.',
      ],
    },
    {
      heading: 'The safer alternatives the main page\'s own guidance already points toward',
      points: [
        'A named type (a <code>record</code> or plain class) has NO such cross-assembly accessibility trap — its properties are declared with an EXPLICIT, INTENTIONAL access modifier, and a <code>public record</code> works identically for callers in any assembly. This is exactly the main page\'s own "when you control the type, define the type" rule of thumb, applied specifically to this cross-assembly scenario.',
        'If genuine cross-assembly dynamism is required (e.g. a plugin architecture where the shape truly is not known at compile time), an <code>ExpandoObject</code> — the main page\'s own dynamic property bag — sidesteps the anonymous-type accessibility trap entirely, since its properties are stored in a dictionary rather than as compiler-generated, potentially internal-scoped class members.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The workaround pattern — returning an anonymous type as dynamic to cross a method boundary',
      language: 'csharp',
      code: `// In Library.dll:
public static class ReportBuilder
{
    public static dynamic BuildSummary(int total, int count)
    {
        // Anonymous types cannot normally cross a method boundary as
        // themselves — typing the return as "dynamic" (instead of
        // the illegal "var" or the inconvenient "object") lets the
        // CALLER still access properties by name:
        return new { Total = total, Count = count, Average = (double)total / count };
    }
}

// Consuming it, same assembly:
dynamic summary = ReportBuilder.BuildSummary(500, 10);
Console.WriteLine(summary.Average); // 50 — works fine here`,
    },
    {
      label: 'The trap — the SAME code fails when the caller is in a DIFFERENT assembly',
      language: 'csharp',
      code: `// In ConsumerApp.exe (a DIFFERENT assembly than Library.dll):
dynamic summary = ReportBuilder.BuildSummary(500, 10);

// This can throw RuntimeBinderException HERE specifically — even
// though the EXACT same property access worked fine when the caller
// lived in the SAME assembly as ReportBuilder. The anonymous type's
// compiler-generated properties are affected by assembly-level
// accessibility in a way named public types are not:
Console.WriteLine(summary.Average);
// Microsoft.CSharp.RuntimeBinder.RuntimeBinderException:
// '<>f__AnonymousType0<int,int,double>' does not contain a definition
// for 'Average' — even though it visibly DOES, from the SAME assembly's
// perspective

// The failure is entirely dependent on WHICH ASSEMBLY the calling
// code lives in — a refactor that moves ReportBuilder or its caller
// into a different assembly can introduce this bug where none
// existed before, with no compile-time warning either way.`,
    },
    {
      label: 'The safer alternatives — a named type, or ExpandoObject for genuine cross-assembly dynamism',
      language: 'csharp',
      code: `// SAFEST — a named public type, exactly the main page's own
// "when you control the type, define the type" guidance:
public record ReportSummary(int Total, int Count, double Average);

public static class ReportBuilderFixed
{
    public static ReportSummary BuildSummary(int total, int count)
        => new ReportSummary(total, count, (double)total / count);
}

// Works identically for ANY caller, in ANY assembly — no dynamic
// binder, no cross-assembly accessibility trap, full IntelliSense:
ReportSummary summary = ReportBuilderFixed.BuildSummary(500, 10);
Console.WriteLine(summary.Average); // 50 — safe everywhere

// If GENUINE cross-assembly dynamism is required (shape truly
// unknown at compile time — e.g. a plugin system), ExpandoObject
// sidesteps the anonymous-type trap specifically, since its members
// live in a dictionary, not as compiler-generated class properties:
public static class PluginReportBuilder
{
    public static dynamic BuildSummary(int total, int count)
    {
        dynamic result = new System.Dynamic.ExpandoObject();
        result.Total = total;
        result.Count = count;
        result.Average = (double)total / count;
        return result; // safe across assembly boundaries
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A library method returns an anonymous type as <code>dynamic</code>, and works fine in all of today\'s unit tests (which live in the same assembly as the library). Explain the specific risk this poses for the library\'s FUTURE consumers, and what change would eliminate that risk entirely.',
    hint: 'Consider whether unit tests living in the SAME assembly as the code under test would ever actually exercise the cross-assembly failure mode — and what happens the day an external consumer (a different assembly) calls this method for the first time.',
    solution: `// The risk: unit tests that live in the SAME assembly as the
// library (a very common test project setup, or tests using
// [InternalsVisibleTo]-style same-assembly access) will NEVER
// exercise the cross-assembly RuntimeBinderException failure mode —
// every dynamic property access in those tests succeeds, because the
// tests happen to share the anonymous type's declaring assembly.
//
// The failure is entirely dormant until the FIRST TIME a genuinely
// external consumer — a different NuGet-consuming application, a
// separate assembly in the same solution, or a plugin loaded from a
// different DLL — calls this method and tries to access a property
// on the result. At that point, RuntimeBinderException fires in
// PRODUCTION, for a code path the test suite gave 100% green
// confidence in, because the test suite's own assembly boundary
// never matched the real-world consumer's assembly boundary.
//
// The fix that eliminates the risk ENTIRELY: replace the anonymous
// type + dynamic return with a genuinely PUBLIC named type (record
// or class). This removes the assembly-boundary dependency
// completely — a public record's properties are accessible from ANY
// assembly by design, with no dynamic binder involved at all, so
// there is no longer any DIFFERENCE between "tested from the same
// assembly" and "consumed from a different assembly" to silently
// diverge on:

public record ReportSummary(int Total, int Count, double Average);
// Now safe for every future consumer, regardless of which assembly
// they live in — the exact scenario the original anonymous-type +
// dynamic pattern left unverified.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'returning an anonymous type as dynamic is a safe, general-purpose way to work around the "anonymous types cannot cross method boundaries" restriction.',
      reality: 'the DLR binder\'s resolution of an anonymous type\'s properties can fail specifically when the calling code lives in a DIFFERENT assembly than the method that returned it — the exact same source code can work in one assembly layout and throw RuntimeBinderException in another.',
    },
    {
      thought: 'if a method returning a dynamic anonymous type passes all its unit tests, it is safe for any caller to consume.',
      reality: 'unit tests living in the SAME assembly as the library under test never exercise the cross-assembly failure mode at all — the bug can remain completely dormant through a green test suite until a genuinely external consumer calls the method for the first time.',
    },
    {
      thought: 'ExpandoObject and anonymous types returned as dynamic have the same cross-assembly accessibility behavior, since both are accessed the same way through the dynamic keyword.',
      reality: 'ExpandoObject stores its members in a dictionary rather than as compiler-generated class properties, sidestepping the anonymous-type-specific assembly accessibility trap entirely — it is a genuinely safer choice for cross-assembly dynamic scenarios.',
    },
  ];
}
