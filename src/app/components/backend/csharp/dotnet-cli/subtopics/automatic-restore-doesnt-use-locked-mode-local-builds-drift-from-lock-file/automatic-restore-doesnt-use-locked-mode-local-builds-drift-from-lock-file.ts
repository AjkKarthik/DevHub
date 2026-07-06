import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-automatic-restore-doesnt-use-locked-mode-local-builds-drift-from-lock-file-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './automatic-restore-doesnt-use-locked-mode-local-builds-drift-from-lock-file.html',
  styleUrl: './automatic-restore-doesnt-use-locked-mode-local-builds-drift-from-lock-file.scss',
})
export class AutomaticRestoreDoesntUseLockedModeLocalBuildsDriftFromLockFileSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states restore "runs automatically before build" — this automatic restore is a DIFFERENT operation than the explicit --locked-mode restore CI runs',
      points: [
        'The main .NET CLI &amp; Tooling page notes: "<code>dotnet restore</code> downloads all packages declared in the project. It runs automatically before build." This is true and convenient for local development — but that AUTOMATIC restore, triggered implicitly by <code>dotnet build</code> or <code>dotnet run</code>, does NOT pass <code>--locked-mode</code>. It is a completely ordinary, permissive restore that is perfectly willing to RESOLVE a NEWER, compatible package version than what <code>packages.lock.json</code> currently records — and, worse, it can silently UPDATE the lock file to reflect that newer resolution, without anyone explicitly asking it to.',
      ],
    },
    {
      heading: 'A developer\'s everyday workflow can silently drift the committed lock file forward, while CI\'s explicit --locked-mode restore only ever ENFORCES whatever is currently committed',
      points: [
        'If a developer adds a new <code>&lt;PackageReference&gt;</code> to a project, or a floating version range (<code>Version="8.*"</code>) happens to resolve to a newer patch than before, an ordinary <code>dotnet build</code> silently regenerates <code>packages.lock.json</code> to match — and if that regenerated file is (accidentally, or out of unfamiliarity with the lock-file workflow) committed alongside the actual code change, the NEXT time CI runs <code>--locked-mode</code>, it enforces the UPDATED lock file just fine — masking the fact that the update happened implicitly, via an ordinary build, rather than through any deliberate "yes, I intend to change our pinned versions" action.',
        'The main page\'s own commands only tell HALF the reproducibility story: <code>--use-lock-file</code> generates the initial lock file, and CI\'s <code>--locked-mode</code> enforces it — but NOTHING in the main page\'s guidance prevents an ordinary, everyday local <code>dotnet build</code> from silently regenerating and updating that same file as a SIDE EFFECT of routine development work.',
      ],
    },
    {
      heading: 'The fix: make local restores behave the same way CI\'s do, via RestoreLockedMode in the project itself, not just as an ad-hoc CLI flag developers remember to pass',
      points: [
        'Setting <code>&lt;RestoreLockedMode&gt;true&lt;/RestoreLockedMode&gt;</code> in <code>Directory.Build.props</code> (the exact same MSBuild-properties-shared-across-the-repo mechanism the main page already covers for <code>Nullable</code>/<code>LangVersion</code>) makes EVERY restore — including the automatic, implicit one triggered by a routine <code>dotnet build</code> — behave as if <code>--locked-mode</code> were always passed. This closes the gap: a developer\'s ordinary local build now FAILS, loudly, the moment their environment would resolve something different than the committed lock file, instead of silently drifting it forward.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent-drift scenario — an ordinary local build regenerates the lock file',
      language: 'csharp',
      code: `// MyApp.csproj — a floating version range:
// <PackageReference Include="Serilog" Version="3.*" />

// packages.lock.json, as committed (generated some weeks ago):
// { "Serilog": { "resolved": "3.1.1", ... } }

// A developer, on a completely ordinary day, just runs:
dotnet build
// This triggers an IMPLICIT restore (no --locked-mode passed anywhere)
// — NuGet is free to resolve "3.*" to whatever the NEWEST compatible
// 3.x version is RIGHT NOW, say 3.1.2 (released last week). Since no
// --locked-mode flag was involved, NuGet doesn't just resolve it and
// move on — it also silently REWRITES packages.lock.json to reflect
// this newer resolution:
// { "Serilog": { "resolved": "3.1.2", ... } }  <-- changed, unasked

// If this developer's next commit happens to include this
// silently-modified packages.lock.json (easy to miss in a diff full
// of actual feature-code changes), the team's "pinned" version has now
// quietly moved from 3.1.1 to 3.1.2 — with NO deliberate decision, NO
// changelog review of what changed in Serilog 3.1.2, and no visible
// signal that this happened AT ALL beyond a routine git diff.`,
    },
    {
      label: 'The fix — make EVERY restore behave like --locked-mode, project-wide',
      language: 'csharp',
      code: `<!-- Directory.Build.props — applies to every project under this
     directory tree, exactly like the main page's own Nullable/
     LangVersion recommendation: -->
<Project>
  <PropertyGroup>
    <RestoreLockedMode>true</RestoreLockedMode>
  </PropertyGroup>
</Project>

// Now, the SAME "dotnet build" from the previous tab behaves
// completely differently:
dotnet build
// error NU1004: The packages lock file is inconsistent with the
// project's dependencies. Run "dotnet restore" to generate a new lock
// file.
//
// The build now FAILS LOUDLY the instant an ordinary local restore
// would have resolved something different from the committed lock
// file — instead of silently rewriting it. The developer is FORCED to
// make an explicit, visible decision: either intentionally regenerate
// the lock file (and review/commit that change deliberately, as its
// OWN reviewed diff), or investigate why resolution suddenly changed
// at all (a floating version range resolving differently, a feed
// configuration change, etc.).`,
    },
    {
      label: 'The deliberate, explicit workflow for INTENTIONALLY updating the lock file',
      language: 'csharp',
      code: `// With RestoreLockedMode always on, updating a pinned dependency
// becomes an EXPLICIT, visible action rather than an accidental
// side effect of routine development:

// 1. Intentionally bump the version (or let a floating range resolve
//    to something newer) and REGENERATE the lock file on purpose:
dotnet restore --force-evaluate
// --force-evaluate explicitly re-resolves and rewrites the lock file,
// even with RestoreLockedMode set — this is the ONE deliberate escape
// hatch for genuinely wanting to update pinned versions.

// 2. Review the resulting packages.lock.json diff as ITS OWN commit,
//    separate from unrelated feature-code changes — making it trivial
//    to review IN CODE REVIEW exactly which dependency versions moved
//    and why, rather than it being buried inside an unrelated PR:
git diff packages.lock.json
git add packages.lock.json
git commit -m "chore(deps): bump Serilog to 3.1.2, reviewed changelog"

// 3. Ordinary "dotnet build" for everyone else immediately goes back
//    to succeeding cleanly against the NEW, deliberately-updated and
//    committed lock file — with the SAME loud-failure protection
//    against any FUTURE accidental drift.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables <code>RestoreLockedMode</code> in <code>Directory.Build.props</code>. A developer runs <code>dotnet build</code> and gets <code>NU1004</code> — but they made no dependency changes at all, and the lock file was fine yesterday. Explain a realistic, non-obvious cause for this that has nothing to do with the developer\'s own recent code changes.',
    hint: 'Consider that "the lock file is inconsistent with the project\'s dependencies" can be triggered by something changing OUTSIDE the developer\'s own commits entirely — something about the PACKAGE SOURCES or FEED configuration itself, not the dependency list in the .csproj.',
    solution: `// The developer's .csproj and packages.lock.json are UNCHANGED from
// yesterday — genuinely nothing in their own commits touched either.

// A REALISTIC, NON-OBVIOUS CAUSE: a floating version range combined
// with an UPSTREAM FEED CHANGE that has nothing to do with THIS
// developer's own actions at all:
// <PackageReference Include="SomeInternalLib" Version="2.*" />

// If "SomeInternalLib 2.4.0" was published to the team's PRIVATE NuGet
// feed OVERNIGHT (by a completely different team, working on a
// completely different repo that happens to own that package), then:
//
// - packages.lock.json, as committed YESTERDAY, still pins
//   "SomeInternalLib": "2.3.5" (the latest 2.x that existed AT THAT
//   TIME).
// - TODAY, with RestoreLockedMode active, "dotnet build" attempts to
//   verify the lock file is still consistent — as PART of that
//   consistency check, NuGet notices that "2.*" COULD now resolve to
//   "2.4.0" (which exists on the feed as of overnight), which does
//   NOT match what packages.lock.json currently pins ("2.3.5").
// - RestoreLockedMode's whole POINT is to catch EXACTLY this kind of
//   silent external drift — it fails LOUDLY rather than quietly
//   accepting whatever the feed happens to resolve to right now.
//
// This is NOT a bug in RestoreLockedMode or a false positive — it is
// the mechanism working EXACTLY as intended: an external, upstream
// change (a new package version becoming available on a feed) that
// would have SILENTLY changed what an ordinary, unprotected build
// resolved is instead caught and surfaced explicitly, even though
// NOTHING in this specific developer's own repository commits changed
// at all.
//
// THE RESOLUTION: this is exactly the "deliberate escape hatch"
// scenario from this subtopic's own workflow — the developer should
// investigate WHY resolution would now differ (in this case: a new
// upstream package version), decide whether to accept it, and if so,
// run "dotnet restore --force-evaluate" to deliberately update and
// commit the new lock file as its own reviewed change — rather than
// assuming something is broken with their own environment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once packages.lock.json is committed, an ordinary local "dotnet build" always respects it exactly as-is, the same way CI\'s --locked-mode restore does.',
      reality: 'the automatic restore triggered by a plain dotnet build does NOT use --locked-mode by default — it can silently resolve a newer compatible version and rewrite the lock file as a side effect of routine local development, unless RestoreLockedMode is explicitly enabled project-wide.',
    },
    {
      thought: 'an NU1004 "lock file is inconsistent" error always means the developer\'s own recent code changes altered a dependency.',
      reality: 'it can also be triggered by something entirely external — a floating version range resolving differently because a new compatible package version became available on a feed overnight, with no changes to the developer\'s own commits at all.',
    },
    {
      thought: 'RestoreLockedMode and --locked-mode are just two different ways of specifying the exact same CI-only enforcement behavior.',
      reality: 'RestoreLockedMode, set in Directory.Build.props, extends that same enforcement to EVERY restore including the implicit one triggered by an ordinary local dotnet build — closing the gap where local development could silently drift the committed lock file forward without anyone noticing.',
    },
  ];
}
