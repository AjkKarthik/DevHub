import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-aot-compatibility-before-slow-publish-treat-trim-warnings-as-errors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-aot-compatibility-before-slow-publish-treat-trim-warnings-as-errors.html',
  styleUrl: './testing-aot-compatibility-before-slow-publish-treat-trim-warnings-as-errors.scss',
})
export class TestingAotCompatibilityBeforeSlowPublishTreatTrimWarningsAsErrorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions "longer build times" for Native AOT — this is exactly why you should never use a full AOT publish as your feedback loop',
      points: [
        'The main Native AOT page notes that Native AOT compilation is "significantly slower than JIT builds (minutes vs seconds)" and recommends keeping "AOT publishing as a CI step rather than a local dev flow." This raises an obvious question the main page only answers in passing, in its Q&amp;A: HOW do you catch trim-incompatible code (the reflection patterns the main page\'s own Common Mistakes section warns about) WITHOUT paying the multi-minute full AOT compile cost on every check?',
      ],
    },
    {
      heading: '&lt;IsAotCompatible&gt;true&lt;/IsAotCompatible&gt; runs the SAME trim analysis the AOT compiler depends on, without the actual native compilation step',
      points: [
        'Setting <code>&lt;IsAotCompatible&gt;true&lt;/IsAotCompatible&gt;</code> in the .csproj (instead of, or alongside, <code>PublishAot</code>) turns on the trimmer\'s static reachability analysis during a NORMAL <code>dotnet build</code> — the same analysis that decides which types/members survive trimming — WITHOUT invoking the ILC (IL Compiler) to actually produce native machine code. This is dramatically faster (seconds, like any other build) because it skips the expensive part entirely, while still surfacing every IL2026/IL2067/IL2072 warning a real AOT publish would eventually hit.',
        'Combined with <code>&lt;TreatWarningsAsErrors&gt;true&lt;/TreatWarningsAsErrors&gt;</code> and an explicit <code>&lt;WarningsAsErrors&gt;</code> list of the trim-specific warning codes (as the main page\'s own "Enable &amp; publish Native AOT" code tab already shows), this turns trim-incompatible code into a NORMAL BUILD FAILURE — catchable on every single commit in CI, at normal build speed, rather than being discovered only when someone runs a slow, occasional full AOT publish.',
      ],
    },
    {
      heading: 'This is a genuine "test" in the CI sense, even though no xUnit is involved — it is a build-time assertion about a codebase-wide property',
      points: [
        'This is conceptually identical to a linter or type-checker gate: it is not testing BEHAVIOR (what a function returns for given inputs) — it is testing a STRUCTURAL property of the entire codebase (every code path is provably trim-safe) on every commit, at the speed of a normal build, which is exactly the same value proposition as a fast unit test versus a slow, manually-run end-to-end test.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The slow feedback loop — only finding out via a full AOT publish',
      language: 'csharp',
      code: `<!-- The SLOW way: only test AOT compatibility by actually publishing -->
<!-- dotnet publish -c Release -r linux-x64 -o ./publish -->
<!-- This takes MINUTES for a large project, and only reports issues -->
<!-- AFTER the entire native compilation has already been attempted -->

<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <PublishAot>true</PublishAot>
  </PropertyGroup>
</Project>

<!-- A developer adds a reflection-based convenience method deep in a
     service layer. Nobody notices anything wrong for WEEKS, because
     "dotnet build" and "dotnet run" (both JIT-based) work perfectly
     fine — the problem ONLY surfaces the next time someone runs the
     full, multi-minute "dotnet publish -p:PublishAot=true" step,
     usually right before a release. -->`,
    },
    {
      label: 'The fast feedback loop — IsAotCompatible catches the same issue in a normal build',
      language: 'csharp',
      code: `<!-- The FAST way: run trim analysis on EVERY normal build -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <PublishAot>true</PublishAot>

    <!-- Runs the SAME static reachability analysis the AOT compiler
         depends on, but WITHOUT the slow native compilation step —
         this activates during a normal "dotnet build", not just publish: -->
    <IsAotCompatible>true</IsAotCompatible>

    <!-- Promote trim warnings to build ERRORS — every developer sees
         the failure immediately, on every commit, at normal build speed: -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsAsErrors>IL2026;IL2067;IL2072;IL2075;IL2080</WarningsAsErrors>
  </PropertyGroup>
</Project>

<!-- Now the SAME reflection-based mistake from the previous tab fails
     the very NEXT "dotnet build" — seconds after it is introduced,
     with the exact line number and reason, rather than weeks later
     during a slow full publish right before a release: -->
<!--
error IL2026: Using member 'System.Reflection.Assembly.GetTypes()' which
has 'RequiresUnreferencedCodeAttribute' can break functionality when
trimming application code.
   at MyApp.Services.HandlerRegistry.DiscoverHandlers() in HandlerRegistry.cs:line 14
-->`,
    },
    {
      label: 'Wiring this as an explicit CI gate, separate from the actual (still occasional) AOT publish',
      language: 'csharp',
      code: `# .github/workflows/ci.yml — runs on EVERY push, fast
name: CI
on: [push, pull_request]

jobs:
  build-and-trim-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '9.0.x' }

      # Normal build — with IsAotCompatible + TreatWarningsAsErrors set
      # in the .csproj, THIS single step is the trim-compatibility test.
      # It runs in the same time as any other build, on every commit:
      - run: dotnet build -c Release

  # A SEPARATE, slower job — the real AOT publish, run less frequently
  # (e.g. only on release tags, or nightly) since it takes minutes and
  # is not needed on every single commit once trim-analysis is already
  # gating every commit above:
  aot-publish-check:
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '9.0.x' }
      - run: dotnet publish -c Release -r linux-x64 --self-contained`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables <code>IsAotCompatible=true</code> with <code>TreatWarningsAsErrors=true</code> in CI and the build passes cleanly for months. They then run a full <code>dotnet publish -p:PublishAot=true</code> for the first time before a release, and it fails with an error the trim analysis never reported. Is this expected, and what does it tell you about what IsAotCompatible actually verifies versus what a full AOT publish verifies?',
    hint: 'Consider that IsAotCompatible runs the TRIMMER\'s reachability analysis — a specific, well-defined static analysis pass — while the actual ILC (IL Compiler) that runs during a full AOT publish performs ADDITIONAL whole-program native-code-generation steps that are not simply "is this member reachable."',
    solution: `// This IS expected, and is an important limitation to understand —
// IsAotCompatible and a full AOT publish check OVERLAPPING but NOT
// IDENTICAL things:
//
// IsAotCompatible=true activates the TRIMMER's static reachability
// analysis (the same engine that decides what to keep/remove) —  it
// specifically flags known-risky reflection patterns tagged with
// [RequiresUnreferencedCode] / [RequiresDynamicCode], and structural
// issues the trimmer can detect through IL analysis alone.
//
// A FULL "dotnet publish -p:PublishAot=true" additionally runs the
// actual ILC (IL Compiler), which performs genuine native code
// generation for EVERY reachable method — this can surface issues the
// trim analyzer has no visibility into at all, for example:
//   - Certain combinations of generic virtual methods and interface
//     dispatch that the trimmer's static analysis considers "reachable
//     and fine" but that ILC cannot generate valid native code for
//     without a fully closed, statically-known generic type graph.
//   - A third-party native dependency or NuGet package invoking actual
//     runtime IL generation (e.g. via Reflection.Emit or dynamic method
//     construction) in a way the trim analyzer's warning set does not
//     specifically recognize as AOT-incompatible, but which ILC simply
//     has no native-code equivalent to compile at all.
//   - Genuine ILC-specific bugs or unsupported patterns that are
//     orthogonal to trimming altogether — trimming and native
//     compilation are two DIFFERENT compiler stages, and passing one
//     analysis is not a formal proof of passing the other.
//
// THE PRACTICAL TAKEAWAY: IsAotCompatible + TreatWarningsAsErrors is a
// genuinely valuable FAST, cheap FIRST filter that catches the vast
// majority of common mistakes (the main page's own "Common Mistakes"
// list — Assembly.GetTypes(), DllImport, etc.) on every commit. It is
// NOT a full substitute for periodically running the real, slower AOT
// publish — which is exactly why the CI setup above keeps BOTH: a fast
// gate on every commit, and a slower, less-frequent full publish check
// before releases, rather than relying on either one alone.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a clean build with IsAotCompatible=true and no trim warnings guarantees a real dotnet publish -p:PublishAot=true will also succeed.',
      reality: 'IsAotCompatible runs the trimmer\'s static reachability analysis, which overlaps with but is not identical to what the actual ILC (IL Compiler) checks during native code generation — a passing trim analysis is a strong first filter, not a formal guarantee of a successful full AOT publish.',
    },
    {
      thought: 'the only way to test AOT compatibility is to actually run the full, slow dotnet publish -p:PublishAot=true.',
      reality: 'IsAotCompatible=true activates the same trim analysis engine during a normal, fast dotnet build — catching the vast majority of common trim-incompatible patterns without paying the multi-minute native compilation cost.',
    },
    {
      thought: 'trim warnings (IL2026, IL2067, etc.) are just informational and safe to leave as warnings rather than build errors.',
      reality: 'each trim warning identifies a code path that either breaks at runtime in a real AOT-published app or silently does nothing because the reflected type was trimmed away — treating them as build errors during development is the only way to guarantee they get addressed before release.',
    },
  ];
}
