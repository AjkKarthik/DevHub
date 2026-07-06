import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-verifying-build-reproducible-simulating-clean-machine-restore-lock-file-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './verifying-build-reproducible-simulating-clean-machine-restore-lock-file.html',
  styleUrl: './verifying-build-reproducible-simulating-clean-machine-restore-lock-file.scss',
})
export class VerifyingBuildReproducibleSimulatingCleanMachineRestoreLockFileSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends packages.lock.json + --locked-mode — but a lock file only PROVES reproducibility if you actually test restoring on a genuinely clean machine',
      points: [
        'The main .NET CLI &amp; Tooling page states: "Use --locked-mode with a committed packages.lock.json to enforce exact version reproducibility in CI." This is correct advice, but a subtle trap exists: every developer machine (and often the CI runner itself, across re-runs) has a POPULATED NuGet global packages cache (<code>~/.nuget/packages</code>) — a restore that "succeeds cleanly" there might actually be succeeding because packages are ALREADY present locally, not because the lock file genuinely pins everything needed to resolve them from scratch.',
      ],
    },
    {
      heading: 'A genuinely reproducible build must restore correctly with an EMPTY package cache — this is the actual thing worth verifying, not just "the CI job went green"',
      points: [
        '<code>dotnet nuget locals all --clear</code> wipes the local NuGet caches (global-packages, http-cache, plugins-cache) entirely, simulating exactly the state a brand-new CI runner or a fresh developer machine would start from. Running <code>dotnet restore --locked-mode</code> IMMEDIATELY AFTER this clear is the actual test of whether <code>packages.lock.json</code> genuinely contains everything needed — a restore that only ever ran against a warm cache could be silently masking a missing or misconfigured package source that would fail on a truly clean machine.',
      ],
    },
    {
      heading: 'This becomes a concrete, automatable verification step — not just "it worked on my machine, ship it"',
      points: [
        'Wrapping this cache-clear-then-restore sequence in a dedicated CI job (separate from, and run LESS frequently than, the everyday build — since clearing the cache and re-downloading everything is genuinely slow) turns "is our build reproducible" from an assumption into an explicitly tested, periodically-verified property of the repository, exactly the same spirit as the periodic full-AOT-publish check from the Native AOT hub topic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — a restore that "passes" only because of a warm cache',
      language: 'csharp',
      code: `# A developer's machine, or a CI runner reusing a persistent cache
# between runs, already has most packages downloaded:
dotnet restore --locked-mode
# Succeeds — but this tells you almost nothing about whether
# packages.lock.json ACTUALLY contains a correct, complete pin set,
# since NuGet may be resolving straight from the LOCAL cache without
# ever needing to hit the network or verify against the real feed at all.

# If someone accidentally committed a packages.lock.json that is
# missing a transitive dependency's specific version (perhaps because
# it was generated against a cache that ALREADY had an older,
# compatible version present), this restore can still "succeed" locally
# purely because the required bits already happen to sit in the cache —
# while a GENUINELY clean machine (a brand-new CI runner image, a new
# hire's laptop) would fail to resolve the same lock file at all.`,
    },
    {
      label: 'The real test — clear the cache first, THEN restore',
      language: 'csharp',
      code: `# Simulates exactly what a brand-new machine / fresh CI runner would
# experience — no pre-existing NuGet cache to quietly paper over a
# genuinely incomplete or incorrect lock file:
dotnet nuget locals all --clear
# Clears: global-packages, http-cache, plugins-cache, temp

dotnet restore --locked-mode
# NOW this restore is a genuine test — every package listed in
# packages.lock.json must ACTUALLY be resolvable from the configured
# NuGet feeds, from a cold start, with nothing already cached locally.
# If the lock file is missing something, or references a version that
# no longer exists on the feed, THIS is where it visibly fails —
# instead of silently "working" forever on machines that happen to
# already have the right bits cached from before.

# Verify the cache really is empty first, for confidence in the test:
dotnet nuget locals global-packages --list
# Should report an empty or freshly-recreated directory`,
    },
    {
      label: 'Wiring this as a periodic, explicit CI verification (not every commit)',
      language: 'csharp',
      code: `# .github/workflows/reproducibility-check.yml
name: Reproducibility Check
on:
  schedule:
    - cron: '0 6 * * 1'  # weekly — this is deliberately slower than
                         # the everyday build, so it does not belong
                         # on every single commit
  workflow_dispatch: {}  # allow manual trigger too

jobs:
  clean-restore-check:
    runs-on: ubuntu-latest  # a genuinely fresh runner — no persistent
                             # cache carried over between runs, unlike
                             # some self-hosted-runner configurations
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '9.0.x' }

      # Even on a fresh GitHub-hosted runner, explicitly clearing first
      # documents INTENT and guards against any caching action added
      # elsewhere in the workflow later:
      - run: dotnet nuget locals all --clear
      - run: dotnet restore --locked-mode
      - run: dotnet build -c Release --no-restore

# The EVERYDAY CI job (on every push/PR) can keep using a warm,
# persistent NuGet cache for SPEED — that is a legitimate, separate
# concern from this periodic reproducibility verification, which
# exists specifically to catch lock-file drift that a warm-cache build
# would never surface.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s everyday CI (using a warm, persistent NuGet cache) has been green for months. A new hire clones the repo on a brand-new laptop, runs <code>dotnet restore --locked-mode</code>, and it fails immediately with a version-resolution error. Explain how this could happen despite CI passing consistently, and what verification step would have caught it earlier.',
    hint: 'Consider what "CI has been green" actually proves when CI itself reuses a persistent package cache between runs — and what specifically differs about a genuinely fresh machine that has never resolved any package in this repo before.',
    solution: `// packages.lock.json, as committed, references a specific transitive
// dependency version that ONCE existed on the configured feed but has
// since been UNLISTED (a real, if uncommon, NuGet occurrence — package
// authors can unlist specific versions):
{
  "dependencies": {
    "net9.0": {
      "SomeTransitiveLib": {
        "type": "Transitive",
        "resolved": "2.3.1",   // <-- unlisted from the feed after this
                                //     lock file was originally generated
        "contentHash": "..."
      }
    }
  }
}

// WHY CI STAYED GREEN DESPITE THIS: the team's everyday CI job reuses
// a PERSISTENT NuGet cache across runs (a common, legitimate speed
// optimization). Because SomeTransitiveLib 2.3.1 was ALREADY present
// in that persistent cache from before it got unlisted, EVERY
// subsequent "dotnet restore --locked-mode" run in CI kept succeeding
// by resolving straight from the LOCAL cache — never actually needing
// to re-fetch that specific version from the feed, and therefore never
// discovering it had been unlisted.

// THE NEW HIRE'S LAPTOP has a genuinely EMPTY NuGet cache — nothing
// pre-populated from before. Its restore MUST actually fetch every
// package fresh from the feed, including SomeTransitiveLib 2.3.1 —
// and since that version is unlisted, the fetch fails:
// error NU1102: Unable to find package SomeTransitiveLib with version 2.3.1

// WHAT WOULD HAVE CAUGHT THIS EARLIER: the periodic "clear cache, then
// restore --locked-mode" verification job from this subtopic's own
// CI example — by deliberately wiping the persistent cache BEFORE
// restoring, on some regular cadence (weekly, or before any release),
// the team would have discovered the unlisted-version problem the
// FIRST time that scheduled job ran after the unlisting happened,
// rather than discovering it only when an actual new machine (a new
// hire's laptop, a freshly-provisioned CI runner, a disaster-recovery
// rebuild) happened to need a truly cold restore for the first time —
// potentially months later, at the worst possible moment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if dotnet restore --locked-mode succeeds consistently in CI, the committed packages.lock.json is proven to genuinely and completely pin every dependency needed for a build.',
      reality: 'CI runs often reuse a persistent, warm NuGet package cache between runs — a restore succeeding there can be silently masking a lock file that would actually fail to resolve on a genuinely fresh machine with an empty cache.',
    },
    {
      thought: 'clearing the NuGet cache (dotnet nuget locals all --clear) is only useful for troubleshooting a broken local environment, not as a deliberate verification step.',
      reality: 'clearing the cache before a --locked-mode restore is the only way to genuinely simulate a fresh machine\'s experience — turning "is this build reproducible" into an explicitly tested property rather than an untested assumption.',
    },
    {
      thought: 'this kind of clean-cache verification belongs in the everyday, every-commit CI job alongside the normal build and test steps.',
      reality: 'clearing the cache and re-downloading every package from scratch is genuinely slow — it belongs in a separate, less-frequent (e.g. weekly, or pre-release) verification job, while the everyday CI job keeps using a warm cache for speed.',
    },
  ];
}
