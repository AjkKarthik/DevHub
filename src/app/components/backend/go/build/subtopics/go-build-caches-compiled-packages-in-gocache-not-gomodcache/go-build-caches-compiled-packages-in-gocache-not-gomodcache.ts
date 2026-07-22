import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './go-build-caches-compiled-packages-in-gocache-not-gomodcache.html',
  styleUrl: './go-build-caches-compiled-packages-in-gocache-not-gomodcache.scss'
})
export class GoBuildCachesCompiledPackagesInGocacheNotGomodcacheSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory names the wrong directory for the wrong cache',
      points: [
        'The main page\'s own go build basics theory states directly: "go build caches compiled packages in $GOPATH/pkg/mod/cache — incremental builds are fast." This names a single directory for a single purpose — caching COMPILED packages.',
        'The official go command documentation for the module cache describes what $GOPATH/pkg/mod actually stores: "it still stores downloaded dependencies (in GOPATH/pkg/mod...)" — this is the MODULE CACHE, holding the downloaded SOURCE CODE of dependencies, not compiled build output.',
        'The build cache — the thing that actually makes incremental go build runs fast by reusing compiled package objects — lives in a completely separate location. The go command documentation states plainly: the build cache "stores compiled packages and build artifacts," located "at the path specified by the GOCACHE environment variable," inspectable via go env GOCACHE.',
      ]
    },
    {
      heading: 'Why conflating these two caches matters in practice',
      points: [
        'These are two genuinely independent caches with independent lifecycles: the module cache ($GOPATH/pkg/mod, aka GOMODCACHE) only changes when dependencies are added, removed, or upgraded — go mod download and go get populate it. The build cache (GOCACHE) changes on every single compilation, including recompiling the SAME dependencies\' source after a local code change elsewhere in the module, since Go compiles packages (including from already-downloaded dependency source) fresh whenever their inputs change.',
        'This distinction is exactly why the main page\'s own CI mistake entry about caching ("actions/setup-go@v5 with cache: true... caches $GOCACHE + go module cache") is itself correct and precise — it lists BOTH caches by their correct names, in contrast to the theory bullet earlier on the same page conflating them into one ($GOPATH/pkg/mod/cache) that does not even correctly describe either cache individually.',
        'Practically: clearing $GOPATH/pkg/mod (e.g. via go clean -modcache) removes downloaded dependency source and forces re-downloading on the next build, but does NOT by itself clear compiled build artifacts — those persist separately in GOCACHE until go clean -cache is run instead. A developer troubleshooting a stale-looking build by clearing the wrong cache (modcache, based on the main page\'s own imprecise theory bullet) would not actually clear the compiled objects that might be the real source of the staleness.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Locating and inspecting the two SEPARATE caches',
      language: 'typescript',
      code: `# The main page's own theory names ONE directory for compiled
# package caching: "$GOPATH/pkg/mod/cache" -- but this is actually
# the MODULE (source download) cache's location, not the build cache.

# Module cache -- downloaded dependency SOURCE CODE:
go env GOMODCACHE
# /home/user/go/pkg/mod   (or $GOPATH/pkg/mod if GOPATH is set)

# Build cache -- COMPILED package objects and build artifacts,
# per the go command's own documentation: "stores compiled packages
# and build artifacts":
go env GOCACHE
# /home/user/.cache/go-build   (a COMPLETELY DIFFERENT directory)

# Confirm they are independent -- inspect each one's actual contents:
du -sh $(go env GOMODCACHE)   # dependency source code, by module/version
du -sh $(go env GOCACHE)      # compiled .a objects, keyed by build inputs`,
    },
    {
      label: 'Clearing the wrong cache doesn\'t do what you\'d expect',
      language: 'typescript',
      code: `# A developer suspects a stale compiled artifact is causing a
# confusing build/test failure, and -- following the main page's
# own theory bullet naming "$GOPATH/pkg/mod/cache" as where
# compiled packages live -- clears the module cache:
go clean -modcache
# This removes ALL downloaded dependency source code.
# The NEXT build has to re-download every dependency from scratch --
# slow -- but the actual COMPILED package objects (if any were
# stale) were untouched, since they never lived here in the first
# place, per the go command's own documented distinction.

go build ./...
# Downloads all deps again (slow) -- but if the real problem was a
# stale compiled artifact, the SAME potentially-stale result can
# still come out of the build, because GOCACHE was never touched.

# The actually-correct command for "clear compiled build artifacts":
go clean -cache
# This clears GOCACHE specifically -- the compiled packages and
# build artifacts the main page's own theory bullet was describing,
# just pointing at the wrong directory to find them in.

go build ./...
# Now every package is genuinely recompiled from scratch -- this is
# the command that actually addresses "stale compiled package"
# concerns, not go clean -modcache.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline\'s build step behaves inconsistently: identical source code sometimes produces a binary with an old bug still present, even after the fix was merged. A team member, following the main page\'s own theory that "go build caches compiled packages in $GOPATH/pkg/mod/cache," adds a CI step that deletes $GOPATH/pkg/mod before every build to eliminate any stale cache as a suspect. The flaky behavior continues unchanged. Using this subtopic\'s theory, explain why deleting that specific directory would not have fixed a genuinely stale-compiled-package problem, and identify the correct command.',
    hint: 'Per this subtopic\'s theory, which of the two caches does $GOPATH/pkg/mod actually correspond to — the one storing downloaded dependency SOURCE, or the one storing COMPILED build artifacts? Which environment variable points at the cache that actually needs clearing for this specific symptom?',
    solution: 'Deleting $GOPATH/pkg/mod did not fix the problem because, per this subtopic\'s theory, that directory is the MODULE cache (GOMODCACHE) — it stores downloaded dependency source code, not compiled build output. The genuinely relevant cache for "a stale compiled binary keeps reappearing despite a source fix" is the BUILD cache, located at whatever go env GOCACHE reports (a completely separate directory, by default something like ~/.cache/go-build) — per the go command\'s own documentation, this is specifically where "compiled packages and build artifacts" are stored and reused across builds. The correct fix is go clean -cache (clearing GOCACHE), not go clean -modcache (which is what deleting $GOPATH/pkg/mod effectively does) — the team\'s CI step was clearing the wrong cache entirely, which is exactly consistent with why the flaky behavior persisted unchanged even after their fix.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '$GOPATH/pkg/mod (or $GOPATH/pkg/mod/cache) is where Go stores compiled package build artifacts, making incremental builds fast — exactly as the main page\'s own theory bullet states.',
      reality: 'This subtopic\'s theory quotes the go command documentation directly: $GOPATH/pkg/mod "stores downloaded dependencies" — this is the module (source download) cache, not compiled build output. The build cache lives at a separate location reported by go env GOCACHE, which the documentation confirms "stores compiled packages and build artifacts."'
    },
    {
      thought: 'go clean -modcache and go clean -cache do essentially the same thing — clearing either one removes stale build artifacts and forces a completely fresh build.',
      reality: 'This subtopic\'s second code example shows these are genuinely distinct operations: -modcache removes downloaded dependency SOURCE (forcing slow re-downloads on the next build, but not touching compiled objects), while -cache removes compiled build artifacts specifically (forcing genuine recompilation). A stale-compiled-package problem requires -cache, not -modcache.'
    },
    {
      thought: 'Since both caches live under some Go-managed directory structure, their exact locations and purposes are an implementation detail not worth distinguishing precisely — "the Go cache" is close enough for troubleshooting purposes.',
      reality: 'This subtopic\'s exercise shows the distinction is directly actionable, not merely academic: clearing the wrong cache (module cache, when the build cache is the actual suspect) produces zero improvement to a genuinely stale-compiled-artifact symptom, while adding real cost (slow dependency re-downloads) — precision about which cache is which determines whether a troubleshooting step actually addresses the problem.'
    }
  ];
}
