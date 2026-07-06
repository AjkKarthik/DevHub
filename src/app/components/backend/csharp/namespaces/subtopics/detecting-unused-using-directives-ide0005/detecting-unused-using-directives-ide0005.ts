import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-detecting-unused-using-directives-ide0005-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './detecting-unused-using-directives-ide0005.html',
  styleUrl: './detecting-unused-using-directives-ide0005.scss',
})
export class DetectingUnusedUsingDirectivesIde0005Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page fights repetition with global using — never addresses staleness',
      points: [
        'The main Namespaces page\'s Common Mistake covers repeating using directives across files and fixes it with <code>global using</code> — but it never addresses the OPPOSITE problem: using directives (local OR global) that are no longer actually needed because the code that used them was deleted or refactored away, silently accumulating as dead weight nobody notices.',
      ],
    },
    {
      heading: 'IDE0005 — the built-in analyzer for unused usings',
      points: [
        'The Roslyn analyzer rule <code>IDE0005</code> ("Remove unnecessary using directives") flags any <code>using</code> statement whose imported namespace is not actually referenced anywhere in that file — it runs automatically in most modern IDEs (greyed-out/dimmed text) and can be promoted to a build WARNING or ERROR via <code>.editorconfig</code>, turning "unused using" from a cosmetic IDE hint into an enforced CI gate.',
        'This is genuinely more useful for <code>global using</code> directives than local ones — an unused LOCAL using is immediately visible (dimmed in the one file it\'s declared in), but an unused GLOBAL using in <code>GlobalUsings.cs</code> is invisible unless you check every file in the project to confirm the namespace is used SOMEWHERE — exactly the auditing problem the main page\'s own Q&A raises about centralizing global usings ("only namespaces used in 3+ files belong there").',
      ],
    },
    {
      heading: 'dotnet format cleans up unused usings automatically, project-wide',
      points: [
        'The <code>dotnet format</code> CLI tool (built into the .NET SDK since .NET 6) can automatically REMOVE unused using directives project-wide via <code>dotnet format --diagnostics IDE0005</code> or as part of its default whitespace/style pass — turning a manual, tedious per-file cleanup into a single command that can run in CI to keep the codebase consistently clean over time.',
        'Running this as part of a CI pipeline (failing the build if <code>dotnet format --verify-no-changes</code> reports pending fixes) catches unused-using drift automatically on every pull request, rather than relying on individual developers to notice dimmed text in their IDE.',
      ],
    },
    {
      heading: 'Why this matters beyond just tidiness',
      points: [
        'Beyond pure cosmetics, an unused using directive can occasionally cause a SILENT AMBIGUITY risk later: if a new type with a common short name is added to the project (or a package update introduces one), an unused-but-still-present using for an unrelated namespace containing a SAME-NAMED type can suddenly turn a previously unambiguous reference into a genuine <code>CS0104</code> ambiguous-reference compile error — an unused using is not purely inert; it is a latent risk that becomes active the moment a name collision is introduced elsewhere.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An unused using directive — dimmed by the IDE, invisible without tooling',
      language: 'csharp',
      code: `namespace MyApp.Services;

using System.Collections.Generic;  // used — List<T> below
using System.Linq;                 // UNUSED — no LINQ methods called in this file
using Microsoft.Extensions.Logging; // used — ILogger below

public class ReportService(ILogger<ReportService> logger)
{
    public List<string> GetReportNames() => new() { "Sales", "Inventory" };
    // No .Where(), .Select(), or any LINQ extension method is ever called —
    // "using System.Linq;" is dead weight, silently sitting there.
}

// In most IDEs, "using System.Linq;" appears dimmed/greyed-out — a subtle
// visual hint that is easy to miss, especially in a large file with many
// usings, or when reviewing a diff that doesn't highlight IDE-only styling.`,
    },
    {
      label: 'Promoting IDE0005 to a build warning via .editorconfig',
      language: 'csharp',
      code: `# .editorconfig — promote unused-using detection to an actual build signal
[*.cs]
dotnet_diagnostic.IDE0005.severity = warning
# Or, for a stricter CI gate that actually fails the build:
# dotnet_diagnostic.IDE0005.severity = error

# With this in place, "dotnet build" itself now reports:
#   warning IDE0005: Using directive is unnecessary.
# for the System.Linq line above — turning a purely visual IDE hint into
# something that shows up in build output and CI logs, where it is much
# harder to overlook than dimmed editor text.`,
    },
    {
      label: 'dotnet format — automatic cleanup, project-wide, one command',
      language: 'csharp',
      code: `# Remove all unused using directives across the entire project/solution:
dotnet format --diagnostics IDE0005

# Verify-only mode — reports what WOULD change without modifying files,
# perfect for a CI gate that fails the build if unused usings exist:
dotnet format --diagnostics IDE0005 --verify-no-changes

# A typical CI pipeline step:
#   - name: Check for unused using directives
#     run: dotnet format --diagnostics IDE0005 --verify-no-changes
#     # Exits non-zero (failing the build) if any file has unused usings —
#     # catches drift automatically on every pull request, rather than
#     # relying on individual developers noticing dimmed IDE text.

# This is especially valuable for auditing GlobalUsings.cs specifically —
# an unused GLOBAL using is invisible in any single file (since the IDE
# only dims it in files where NO usage exists at all, and checking that
# across every file in a large project by eye is impractical):
dotnet format --diagnostics IDE0005 --include GlobalUsings.cs --verify-no-changes`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A project\'s GlobalUsings.cs contains <code>global using System.Data;</code>, but no file in the project actually uses any type from <code>System.Data</code> anymore (the feature that needed it was removed months ago). Explain why this specific case is more dangerous to leave unnoticed than an unused LOCAL using directive in a single file.',
    hint: 'Think about the VISIBILITY difference: a local unused using is dimmed in exactly the one file where it appears, immediately visible to anyone editing that file. A global using applies everywhere — think about how many files you would need to check, and whether any single file editor would even think to look at GlobalUsings.cs while working on an unrelated file.',
    solution: `// The danger is specifically about VISIBILITY and the "who would even
// think to check" problem:

// A LOCAL unused using is dimmed in the ONE file where it's declared —
// any developer editing THAT file sees the visual hint immediately, in
// the exact place they're already looking.

// A GLOBAL unused using in GlobalUsings.cs is different: it applies to
// EVERY file in the project, but the IDE can only show it as "unused" in
// GlobalUsings.cs itself — a file most developers RARELY open, since its
// entire purpose is to be invisible plumbing they don't think about day
// to day. Confirming "is System.Data used ANYWHERE in this 200-file
// project" by eye is impractical — nobody is going to manually check.

// This is exactly why the tooling approach matters more here than for
// local usings — "dotnet format --diagnostics IDE0005 --verify-no-changes"
// run in CI catches this automatically, without requiring anyone to
// remember to periodically audit GlobalUsings.cs by hand — a task that,
// realistically, nobody would ever get around to doing manually on a
// large, actively developed codebase.

// The fix, once caught:
// global using System.Data;  <- DELETE this line from GlobalUsings.cs
// A tool-driven check is the only realistic way this actually gets found
// and removed, rather than accumulating indefinitely as invisible cruft.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an unused using directive is purely a cosmetic issue with zero practical consequences beyond tidiness.',
      reality: 'an unused using directive is a latent risk — if a new type with the same short name as something in an unrelated, unused-but-still-present namespace is added later, that previously harmless using can suddenly cause a genuine CS0104 ambiguous-reference compile error.',
    },
    {
      thought: 'relying on the IDE dimming unused using directives is sufficient to keep a codebase clean, since developers will notice and remove them over time.',
      reality: 'this works reasonably well for LOCAL usings (visible in the file being edited) but fails for GLOBAL usings in a shared GlobalUsings.cs file, which most developers rarely open — a tool-driven CI check (dotnet format --verify-no-changes) is the only realistic way to catch drift there.',
    },
    {
      thought: 'dotnet format only handles whitespace and code style — it cannot actually remove unused using directives.',
      reality: 'dotnet format directly supports removing unused usings via "dotnet format --diagnostics IDE0005", and its --verify-no-changes flag makes it usable as a genuine CI gate that fails the build when unused usings are present.',
    },
  ];
}
