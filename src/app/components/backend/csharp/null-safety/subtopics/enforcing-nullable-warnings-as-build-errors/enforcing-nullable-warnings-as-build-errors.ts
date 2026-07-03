import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-enforcing-nullable-warnings-as-build-errors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './enforcing-nullable-warnings-as-build-errors.html',
  styleUrl: './enforcing-nullable-warnings-as-build-errors.scss',
})
export class EnforcingNullableWarningsAsBuildErrorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s own admission — a warning a developer can just ignore',
      points: [
        'The main Null Safety page\'s own Q&A states plainly: "Nullable reference type annotations are erased by the compiler — they produce no IL bytecode. Enabling #nullable enable only changes what warnings the compiler emits." A WARNING, by default, does not fail the build — a developer can see <code>CS8602: Dereference of a possibly null reference</code> in the build output and simply ship the code anyway, exactly as if nullable reference types were never enabled at all.',
      ],
    },
    {
      heading: 'Turning specific nullable warnings into build-breaking errors',
      points: [
        'The <code>&lt;WarningsAsErrors&gt;</code> MSBuild property accepts a comma-separated list of specific warning codes: <code>&lt;WarningsAsErrors&gt;CS8600;CS8602;CS8603;CS8604&lt;/WarningsAsErrors&gt;</code> in the <code>.csproj</code> turns the four most common nullable-related warnings (null literal assigned to non-nullable, possible null dereference, possible null return, possible null argument) into COMPILE ERRORS — the build genuinely fails, closing the exact gap the main topic\'s Q&A describes.',
        'A broader, simpler alternative: <code>&lt;TreatWarningsAsErrors&gt;true&lt;/TreatWarningsAsErrors&gt;</code> promotes ALL warnings to errors, not just nullable ones — this is a stronger guarantee but can be disruptive on an existing codebase with many pre-existing non-nullable warnings (unused variables, obsolete API usage) that would now also block every build until cleaned up.',
        'For an EXISTING codebase not ready for full warnings-as-errors, <code>&lt;WarningsNotAsErrors&gt;</code> combined with <code>TreatWarningsAsErrors=true</code> lets you opt OUT specific non-critical warning codes while still promoting everything else (including all nullable warnings) to errors — a practical middle ground for incremental adoption.',
      ],
    },
    {
      heading: 'Ratchet enforcement — new violations only, not the whole existing codebase',
      points: [
        'Turning on warnings-as-errors retroactively on a LARGE, long-lived codebase can surface hundreds of pre-existing nullable warnings that were silently ignored for years — a "big bang" enforcement can be an impractically large PR. A common compromise: enable <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code> project-wide but suppress warnings FILE BY FILE for legacy code (<code>#nullable disable</code> at the top of files not yet audited) while enforcing errors on any FILE that has been explicitly opted back in.',
        'Roslyn analyzers (and CI tooling built on top of them) can be configured to only fail the build on warnings introduced in the CURRENT changeset (a diff-based check) rather than the whole codebase — this "ratchet" pattern prevents new nullable violations from being introduced while giving the team time to clean up existing debt incrementally, without either blocking all work immediately or leaving the gap open indefinitely.',
      ],
    },
    {
      heading: 'What this buys you in practice',
      points: [
        'Once nullable warnings are build-breaking errors, a pull request that introduces <code>string upper = result!.ToUpper();</code> (the main topic\'s own "using ! liberally" Common Mistake, if it ALSO happens to be provably unsafe) — or any genuinely risky dereference — cannot be merged without either fixing the null-safety issue for real or an EXPLICIT <code>#pragma warning disable CS8602</code> with a comment justifying why, which is far more visible in code review than a warning buried in build output nobody reads.',
        'This closes the loop the main topic opens but does not finish: nullable reference types give you compile-time PROOF ability, but only warnings-as-errors makes that proof ability actually GATE what gets merged, rather than remaining purely advisory.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before — a warning that ships anyway',
      language: 'csharp',
      code: `// .csproj — nullable enabled, but warnings are just warnings
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <!-- No WarningsAsErrors — the build below SUCCEEDS despite the warning -->
  </PropertyGroup>
</Project>

// Program.cs
#nullable enable

string? result = GetFromDatabase();
string upper = result.ToUpper(); // CS8602: Dereference of a possibly null reference

// Running "dotnet build" here:
//   Build succeeded.
//     1 Warning(s)
//     0 Error(s)
//
// The warning is printed, but the build EXITS 0 — CI treats this as a
// pass, and the code (with its real null-dereference risk) ships anyway.

static string? GetFromDatabase() => null; // could genuinely return null`,
    },
    {
      label: 'After — the same code now fails the build',
      language: 'csharp',
      code: `// .csproj — specific nullable warnings promoted to errors
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <WarningsAsErrors>CS8600;CS8602;CS8603;CS8604</WarningsAsErrors>
  </PropertyGroup>
</Project>

// The EXACT same Program.cs from before:
#nullable enable

string? result = GetFromDatabase();
string upper = result.ToUpper(); // CS8602 — now a BUILD ERROR, not a warning

// Running "dotnet build" here:
//   error CS8602: Dereference of a possibly null reference.
//   Build FAILED.
//
// CI now genuinely blocks the merge until this is fixed for real:

string? result2 = GetFromDatabase();
string upper2 = result2 is not null
    ? result2.ToUpper()
    : throw new InvalidOperationException("Expected a value from the database");
// This compiles cleanly — the null case is now genuinely handled, not
// just warned about and ignored.

static string? GetFromDatabase() => null;`,
    },
    {
      label: 'A ratchet approach — legacy files opt out, new code is enforced',
      language: 'csharp',
      code: `// .csproj — errors enabled project-wide
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <WarningsAsErrors>CS8600;CS8602;CS8603;CS8604</WarningsAsErrors>
  </PropertyGroup>
</Project>

// LegacyReportGenerator.cs — an old file with many unaudited nullable
// warnings that would otherwise block EVERY build until fully cleaned up.
#nullable disable
// Everything in this file is exempt from nullable analysis (and therefore
// from the warnings-as-errors gate) until someone audits and re-enables it.

public class LegacyReportGenerator
{
    public string BuildReport(string title, string body)
    {
        // Old code, potentially null-unsafe, but not blocking new work —
        // deliberately scoped OUT of enforcement rather than ignored silently.
        return title + ": " + body;
    }
}
#nullable restore

// NewOrderService.cs — new code, fully enforced, no opt-out
#nullable enable

public class NewOrderService
{
    public string Describe(string? customerName)
        // This MUST be handled correctly to compile — the ratchet
        // guarantees new code can't introduce the same debt as the legacy file.
        => customerName ?? "Unknown customer";
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add <code>CS8625</code> (cannot convert null literal to non-nullable reference type) to the <code>WarningsAsErrors</code> list, and write a one-line code example showing exactly what pattern this specific warning code catches that <code>CS8602</code> (possible null dereference) does not.',
    hint: 'CS8625 fires on the ASSIGNMENT of a literal null to a non-nullable variable, e.g. string name = null; — this is a different moment than CS8602, which fires when you DEREFERENCE (call a member on) a value that might be null. Add CS8625 to the list and show the assignment-time example.',
    solution: `<WarningsAsErrors>CS8600;CS8602;CS8603;CS8604;CS8625</WarningsAsErrors>

// CS8625 fires at the point of ASSIGNMENT — catching the problem
// earlier than CS8602 would, which only fires later at DEREFERENCE time:
string name = null; // CS8625 — caught immediately, at the assignment itself

// Without CS8625 enforced, this line alone would compile with only a
// different warning (or none, depending on context) — the actual
// dereference-time failure (CS8602) might not surface until a LATER
// line that happens to call a member on "name", potentially far away
// from where the null was actually introduced.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'enabling <code>#nullable enable</code> (or <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code>) alone is enough to prevent null-related bugs from being merged into the codebase.',
      reality: 'by default, nullable warnings do NOT fail the build — a developer can see the warning in build output and merge the code anyway. Only explicitly promoting nullable warning codes to errors (via WarningsAsErrors) actually gates what can be merged.',
    },
    {
      thought: 'the only way to enforce nullable warnings as errors is <code>TreatWarningsAsErrors=true</code>, which promotes every warning in the project, nullable or not.',
      reality: 'the WarningsAsErrors property accepts a specific comma-separated list of warning codes (like CS8600, CS8602, CS8603, CS8604) — letting you enforce only the nullable-related warnings without also blocking the build on unrelated warnings like unused variables.',
    },
    {
      thought: 'enabling warnings-as-errors on an existing large codebase is an all-or-nothing decision that requires fixing every pre-existing nullable warning before it can be turned on at all.',
      reality: 'a per-file #nullable disable / #nullable restore ratchet lets legacy files remain exempt from enforcement while new or actively-edited files are fully gated — preventing new nullable debt from being introduced without requiring an immediate, impractically large cleanup of the entire codebase.',
    },
  ];
}
