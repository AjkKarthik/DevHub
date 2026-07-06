import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-clean-trim-analysis-still-fails-full-aot-publish-different-checks-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './clean-trim-analysis-still-fails-full-aot-publish-different-checks.html',
  styleUrl: './clean-trim-analysis-still-fails-full-aot-publish-different-checks.scss',
})
export class CleanTrimAnalysisStillFailsFullAotPublishDifferentChecksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own advice — "check IsAotCompatible=true metadata on NuGet packages" — is necessary, but not sufficient, and this subtopic explains why',
      points: [
        'The main Native AOT page recommends checking a package\'s <code>IsAotCompatible=true</code> metadata before adding it, and its own Q&amp;A recommends running trim analysis in CI as a fast pre-check. Both are genuinely good advice — but a team that follows BOTH pieces of advice perfectly can still hit a full <code>dotnet publish -p:PublishAot=true</code> failure that neither one predicted. Understanding WHY requires separating two DIFFERENT compiler stages that are easy to conflate as "one AOT check."',
      ],
    },
    {
      heading: 'Trim analysis and ILC (the actual native compiler) are two SEPARATE stages checking DIFFERENT things',
      points: [
        'The TRIMMER\'s job is static reachability analysis: starting from entry points, follow every statically-provable code path and mark what survives. Its warnings (IL2026, IL2067, etc.) are specifically about reflection patterns it can recognize as risky — <code>Assembly.GetTypes()</code>, unannotated generic reflection, and similar KNOWN patterns.',
        'The ILC (IL Compiler) — the component that runs during a REAL <code>PublishAot=true</code> publish — takes whatever code survived trimming and generates ACTUAL NATIVE MACHINE CODE for every reachable method. This is a fundamentally different kind of analysis: it must resolve EVERY generic instantiation to concrete, compilable native code, handle every virtual/interface dispatch statically, and reject patterns that are perfectly fine from a "is this reachable" perspective but have no valid native-code translation at all (for example, certain patterns of runtime code generation like <code>Reflection.Emit</code> or dynamic proxy generation used by some mocking/DI libraries, which the trimmer\'s known-warning-pattern list may not specifically flag, but which ILC simply cannot compile to native code, full stop).',
      ],
    },
    {
      heading: 'A NuGet package can be genuinely trim-safe (no reflection at all reachable in normal usage) while still doing something ILC cannot compile',
      points: [
        'This is the crux of the gotcha: "trim-safe" and "AOT-compilable" are RELATED but DISTINCT properties. A library can be perfectly reachability-analyzable (nothing gets trimmed away that is needed, no IL2026-style warnings at all) while STILL containing a code path — even a rarely-exercised one — that does something ILC has no native equivalent for. The trim analyzer has no reason to flag it, because from a "what is reachable" perspective, everything is fine; the failure only appears when ILC actually tries to generate native code for that specific method.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A "trim-clean" library that still fails at the ILC stage',
      language: 'csharp',
      code: `// A caching library — NO reflection is used in its NORMAL code path,
// so IsAotCompatible=true reports ZERO warnings for typical usage:
public class MemoCache<TKey, TValue> where TKey : notnull
{
    private readonly Dictionary<TKey, TValue> _store = new();

    public TValue GetOrAdd(TKey key, Func<TKey, TValue> factory)
    {
        if (_store.TryGetValue(key, out var existing)) return existing;
        var created = factory(key);
        _store[key] = created;
        return created;
    }

    // This ONE rarely-used debugging method generates a dynamic proxy
    // at runtime to log every cache access — the trim analyzer sees
    // this call as "reachable" (it IS called, conditionally, from a
    // debug flag) but has no specific IL2026-style warning pattern for
    // THIS particular kind of runtime code generation, because it is
    // not a recognized "reflection" API in the trimmer's known list —
    // it is a lower-level dynamic-codegen API:
    public void EnableAccessLogging()
    {
        var proxyType = System.Reflection.Emit.AssemblyBuilder
            .DefineDynamicAssembly(new System.Reflection.AssemblyName("Proxies"),
                System.Reflection.Emit.AssemblyBuilderAccess.Run);
        // ... builds a dynamic proxy type at runtime via Reflection.Emit ...
    }
}

// A team's own code NEVER calls EnableAccessLogging() in production —
// but it IS reachable (called from a debug command), so the trimmer
// keeps it, sees no recognized risky reflection PATTERN in it (no
// GetTypes/GetType/CreateInstance calls it flags), and reports ZERO
// IsAotCompatible warnings for the ENTIRE library.`,
    },
    {
      label: 'Where the failure ACTUALLY surfaces — only during the real ILC compile',
      language: 'csharp',
      code: `// dotnet build   — with IsAotCompatible=true — SUCCEEDS, zero warnings
// dotnet publish -c Release -p:PublishAot=true -r linux-x64  — FAILS:

// error : Generating native code is not supported for the following
// AssemblyBuilder-based dynamic assembly generation pattern used in
// 'MemoCache<TKey,TValue>.EnableAccessLogging()' — Reflection.Emit
// requires a JIT compiler to generate code at runtime, which does not
// exist in a Native AOT-published application.
//
// This is NOT an IL2026/IL2067-style trim warning at all — it is a
// genuinely DIFFERENT category of ILC-specific compilation error,
// because Reflection.Emit's dynamic-assembly generation has NO native
// code equivalent whatsoever — it is fundamentally incompatible with
// AOT, in a way the trim analyzer's known-pattern warning list simply
// was never designed to detect, since trimming and "can this be
// compiled to native code at all" are different questions.`,
    },
    {
      label: 'The practical mitigation — a full AOT publish smoke test stays necessary, even with trim analysis passing',
      language: 'csharp',
      code: `# CI still needs BOTH stages, run at different cadences:

# FAST gate — every commit, catches the majority of common mistakes:
dotnet build -c Release   # with IsAotCompatible + TreatWarningsAsErrors

# SLOWER gate — before merging a NEW dependency, or before release —
# a REAL AOT publish, specifically because it is the ONLY stage that
# actually invokes ILC and can catch issues like Reflection.Emit usage
# buried in a third-party dependency that trim analysis cannot see:
dotnet publish -c Release -r linux-x64 -p:PublishAot=true

# When adding ANY new third-party package to an AOT-targeted project,
# treat this as a REQUIRED step, not optional — "the package has
# IsAotCompatible=true metadata" is a claim from the PACKAGE AUTHOR
# about their OWN trim analysis; it is not a substitute for verifying
# your OWN specific usage of that package survives a REAL AOT publish,
# since a package can genuinely be trim-clean for its typical usage
# while still containing edge-case code paths ILC cannot compile.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI passes <code>IsAotCompatible=true</code> cleanly for six months. They then add a new logging library with <code>IsAotCompatible=true</code> in its own NuGet metadata. The next release\'s AOT publish fails on a code path inside that library that only activates when a specific configuration flag is set. Whose "fault" is this, and what should the team\'s process have caught it earlier?',
    hint: 'Consider that the library author\'s own IsAotCompatible=true claim is based on THEIR trim analysis of THEIR typical/tested usage patterns — it says nothing about a rarely-exercised configuration path that your team specifically enables, which their own testing may never have exercised under a real AOT publish either.',
    solution: `// The library's own declared metadata:
// <PackageId>SomeLoggingLib</PackageId>
// <IsAotCompatible>true</IsAotCompatible>   <!-- the AUTHOR's claim -->

// The team's usage — enabling a specific, less-common feature:
services.AddSomeLogging(options =>
{
    options.EnableDynamicFormatterGeneration = true;  // rarely used flag
    // internally, this flag activates a Reflection.Emit-based dynamic
    // formatter generator for maximum logging throughput — a code path
    // the LIBRARY AUTHOR's own trim analysis likely never exercised in
    // THEIR test matrix, since it is an opt-in performance feature, not
    // the library's default/typical configuration
});

// THIS IS NOT SIMPLY "THE LIBRARY'S FAULT" — IsAotCompatible=true is a
// claim scoped to whatever configurations/code paths the library
// author's OWN CI actually exercises during their trim analysis. A
// rarely-used opt-in flag activating a DIFFERENT internal code path
// (with different reflection/codegen characteristics) may not have
// been covered by that claim at all, even though it is asserted at the
// PACKAGE level, not per-configuration.
//
// WHAT THE TEAM'S PROCESS SHOULD HAVE CAUGHT IT: a REAL, full AOT
// publish smoke test, run specifically with the team's OWN actual
// production configuration (including EnableDynamicFormatterGeneration
// = true), BEFORE that configuration reached a release build — not
// relying on the package's own IsAotCompatible metadata (which reflects
// the AUTHOR's test matrix, not the CONSUMER's specific configuration)
// nor on IsAotCompatible trim analysis alone (which, as covered above,
// checks a different, narrower property than "will ILC actually compile
// this"). The concrete process fix: any time a NEW configuration flag
// or feature toggle is enabled for the first time in an AOT-targeted
// app, run a full AOT publish specifically WITH that configuration
// active, rather than assuming the package's general AOT-compatible
// claim transfers to every possible configuration of it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a NuGet package with IsAotCompatible=true in its metadata is guaranteed to work correctly under every configuration in a real AOT-published app.',
      reality: 'that metadata reflects the package author\'s OWN trim analysis of their typical/tested usage — a rarely-used configuration flag activating a different internal code path (e.g. Reflection.Emit-based codegen) may never have been exercised under a real AOT publish by the author at all.',
    },
    {
      thought: 'trim analysis (IsAotCompatible=true, IL2026-style warnings) and the actual AOT native compiler (ILC) check the same thing, just at different speeds.',
      reality: 'they are genuinely different compiler stages — trim analysis is static reachability analysis with a known set of risky-reflection-pattern warnings, while ILC performs actual native code generation and can reject patterns (like Reflection.Emit dynamic assembly generation) that trim analysis has no specific warning for at all.',
    },
    {
      thought: 'once trim analysis passes cleanly in CI, running the actual full dotnet publish -p:PublishAot=true becomes an optional, redundant final check.',
      reality: 'a full AOT publish remains the only stage that actually invokes ILC — it can surface genuine incompatibilities (especially from third-party dependencies or rarely-exercised configuration paths) that trim analysis structurally cannot detect, so it stays a necessary, periodic gate rather than a redundant one.',
    },
  ];
}
